from django.core.files.base import File
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework.views import APIView
from rest_framework.parsers import JSONParser
from django.utils.timezone import make_aware
from django.core import serializers
import chromadb
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from pytube import YouTube, Playlist
import datetime
import os
import shutil
import json
import re
from django.contrib.auth.models import User
from ..models import Papers, Videos, Dataset, chunks, Question, Answer, Source, Conversation, Model, EmbeddingModel, FrontEndSettings, DisclaimerAgreement
from .utils import get_zotero_chunks, add_dataset_from_upload, add_to_chroma, nearestDataChroma, get_relevance_score, add_embeddings_to_qna, highlight_pdf, seconds_to_hhmmss, add_pca_to_qna_and_dataset, add_demo_dataset, get_youtube_transcript, add_video_to_chroma, add_embeddings_to_chunks, add_pca_to_chunks, get_answer_distance, validate_post_request

####################
# APIs             #
####################

@api_view(['POST'])
def get_datasets(request):
    if request.method == 'POST':
        json_request = JSONParser().parse(request)
        user_email = json_request['user_email']
        user_group = json_request['user_group']
        if user_email == '':
            datasets = Dataset.objects.filter(user_email='-')
        elif user_group != '' and user_group != 'user' and user_email != '':
            group_datasets = Dataset.objects.filter(user_group=user_group)
            email_datasets = Dataset.objects.filter(user_email=user_email)
            # combine datasets
            datasets = group_datasets | email_datasets
        else:
            datasets = Dataset.objects.filter(user_email=user_email)
        datasets_ = serializers.serialize('json', datasets)
        datasets_json = json.loads(datasets_)
        datasets = []
        for dataset in datasets_json:
            datasets.append(dataset['fields'])
        return Response(datasets)

@api_view(['GET'])
def get_documents(request):
    if request.method == 'GET':
        if request.GET.get('dataset'):
            dataset_type = ''
            dataset_name = request.GET.get('dataset')
            dataset = Dataset.objects.get(dataset_name=dataset_name)
            papers = Papers.objects.filter(paper_dataset=dataset).order_by('paper_date_time')
            if papers.count() > 0:
                dataset_type = 'papers'
                docs_ = serializers.serialize('json', papers)
            else:
                videos = Videos.objects.filter(video_dataset=dataset).order_by('video_date_time')
                if videos.count() > 0:
                    dataset_type = 'videos'
                    docs_ = serializers.serialize('json', videos)
        docs_json = json.loads(docs_)
        documents = []
        for doc in docs_json:
            documents.append(doc['fields'])
        return Response({'documents': documents, 'dataset_type': dataset_type})

# example json: {"text": "how many inactive conformational states ABL1 has?", "dataset": "ABL1"}
@api_view(['POST'])
def get_context(request):
    if request.method == 'POST':
        json_request = JSONParser().parse(request)
        question_text = json_request['text']
        model = json_request['model_type']
        if 'skip_highlight' in json_request:
            skip_highlight = json_request['skip_highlight']
        else:
            skip_highlight = False
        model_type = Model.objects.get(model_name=model)
        dataset_name = json_request['dataset']
        dataset = Dataset.objects.get(dataset_name=dataset_name)
        embedding_model = dataset.embedding_model
        new_conversation = json_request['new_conversation']
        previous_question = json_request['previous_query']
        no_context = json_request['no_context']
        keywords = json_request['keywords'] if 'keywords' in json_request else ''
        if no_context:    
            context, titles, pages, starts, stops, chunks_txt, distances = '', [], [], [], [], [], []
            sources = []
            relevance_score = 0
        else:
            context, titles, pages, starts, stops, chunks_txt, distances = nearestDataChroma(question_text, dataset_name, keywords, embedding_model)
            sources = []
            distances = [round(dist, 3) for dist in distances]
            relevance_score = get_relevance_score(distances, embedding_model)
        library_type = 'papers' if len(pages) else 'videos'

        # if no_context is true, create or get dataset
        if no_context:
            dataset_name = model + '_direct_chat'
            dataset_exist = Dataset.objects.filter(dataset_name=dataset_name).exists()
            if not dataset_exist:
                dataset = Dataset.objects.create(
                    dataset_name=dataset_name,
                    dataset_size=0,
                    dataset_date_time=make_aware(datetime.datetime.now()),
                    direct_chat_without_docs = True,
                    user_email='-'
                )

        # save question to database
        current_date_time = make_aware(datetime.datetime.now())
        dataset = Dataset.objects.get(dataset_name=dataset_name)
        quesiton_exist = Question.objects.filter(question_dataset=dataset).filter(question_text=question_text).filter(model_type=model_type).exists()
        if quesiton_exist:
            question = Question.objects.get(question_text=question_text, model_type=model_type)
            question.keywords = keywords
            question.relevance_score = relevance_score
            question.save()
            conversation_id = question.conversation.id
            conversation = Conversation.objects.get(id=conversation_id)
        else:
            if (new_conversation):
                conversation = Conversation.objects.create(
                    question_answer_count=1,
                    conversation_dataset=dataset,
                    start_date_time=current_date_time
                )
            else:
                conversation_id = Question.objects.get(question_text=previous_question, model_type=model_type).conversation.id
                conversation = Conversation.objects.get(id=conversation_id)
                conversation.question_answer_count += 1
                conversation.save()
            question = Question.objects.create(
                question_text=question_text,
                relevance_score=relevance_score,
                model_type=model_type,
                keywords=keywords,
                question_dataset=dataset,
                conversation=conversation,
                saved_date_time=current_date_time
            )
        
        # add embeddings to question
        if not no_context:
            add_embeddings_to_qna(question_text, 'question', embedding_model)

        question_sources = Source.objects.filter(question=question)
        for idx, title in enumerate(titles):
            sources.append({
                'document': title,
                'page': pages[idx] if library_type == 'papers' else '',
                'start': seconds_to_hhmmss(starts[idx]) if library_type == 'videos' else '',
                'stop': seconds_to_hhmmss(stops[idx]) if library_type == 'videos' else '',
                'context': chunks_txt[idx],
                'distance': round(distances[idx],3) #round to 3 decimals
            })
            if len(question_sources) == 0:
                chunk = chunks.objects.filter(chunk_text=chunks_txt[idx], chunk_dataset=dataset)
                Source.objects.create(
                    source_doc=title,
                    source_pointer=pages[idx] if library_type == 'papers' else starts[idx],
                    context=chunks_txt[idx].replace("\x00", "\uFFFD"),
                    distance=round(distances[idx],3),
                    question=question,
                    chunk=chunk[0] if chunk.count() else None
                )

        sources_grouped = []
        for source in sources:
            if len(sources_grouped) == 0:
                sources_grouped.append([source])
            else:
                found = False
                for source_group in sources_grouped:
                    if source['document'] == source_group[0]['document']:
                        source_group.append(source)
                        found = True
                        break
                if not found:
                    sources_grouped.append([source])

        # hightlight pdf with source paper and page
        if library_type == 'papers' and not skip_highlight:
            for source_grp in sources_grouped:
                paper_obj = Papers.objects.filter(paper_title=source_grp[0]['document'])[0].paper_attachment
                if (len(paper_obj.path.split('/')[-1].split('_')) > 1): 
                    paper_name =   paper_obj.path.split('/')[-1].split('_')[0] + '.pdf'
                else:
                    paper_name =   paper_obj.path.split('/')[-1]
                print("paper_name: " + paper_name)
                original_pdf_path = 'data/pdfs/'+ dataset_name + '/' + paper_name
                highlighted_pdf_path = 'data/pdfs/' + dataset_name + '/' + paper_name.split('.')[0] + '_highlighted.pdf'

                # get all files with output_file name in thier name
                files = [f for f in os.listdir('data/pdfs') if (paper_name.split('.')[0] + '_highlighted.pdf') in f]
                # remove all files with output_file name in thier name
                for f in files:
                    os.remove('data/pdfs/' + f)
                if original_pdf_path.endswith('.pdf'):
                    highlight_pdf(
                        original_pdf_path, 
                        highlighted_pdf_path, 
                        source_grp
                    )

                    # create highlighted paper object
                    paper = Papers.objects.filter(paper_title=source_grp[0]['document'])[0]
                    with open(highlighted_pdf_path, 'rb') as f:
                        paper.highlighted_attachment.save(dataset_name + '/' + paper_name.split('.')[0] + '_highlighted.pdf', File(f), save=True)
            
        context_json = {
            'context': context,
            'relevance_score': relevance_score,
            'sources': sources
        }
        
        return Response(context_json, content_type="application/json")
    
@api_view(['GET'])
def get_conversations_by_dataset(request):
    if request.method == 'GET':
        dataset_name = request.GET.get('dataset')
        dataset = Dataset.objects.get(dataset_name=dataset_name)
        conversations = Conversation.objects.filter(conversation_dataset=dataset)
        conversations_obj = []
        for conversation in conversations:
            conversation_id = conversation.id
            questions = Question.objects.filter(conversation=conversation).order_by('saved_date_time')
            conversation_json = {}
            conversation_json['conversation_id'] = conversation_id
            conversation_json['questions_answers'] = []
            for question in questions:
                # answers = Answer.objects.filter(question=question)
                qna_json = {
                    'question_id': question.id,
                    'question': question.question_text,
                    # 'answers': answers[0].answer_text,
                    'relevance_score': question.relevance_score
                }
                conversation_json['questions_answers'].append(qna_json)
            conversations_obj.append(conversation_json)
        return Response({'conversations':conversations_obj})

@api_view(['GET'])
def get_question_details(request):
    if request.method == 'GET':
        question_id = request.GET.get('question_id')
        question = Question.objects.get(id=question_id)
        answers = Answer.objects.filter(question=question)
        sources = Source.objects.filter(question=question)
        sources_json = []
        for source in sources:
            sources_json.append({
                'paper': source.source_doc,
                'page': source.source_pointer,
                'context': source.context,
                'distance': source.distance
            })
        answers_json = []
        for answer in answers:
            answers_json.append({
                'answer': answer.answer_text,
                'relevance_score': answer.relevance_score
            })
        question_json = {
            'question': question.question_text,
            'relevance_score': question.relevance_score,
            'ground_truth': question.ground_truth,
            'question_type': question.question_type,
            'keywords': question.keywords,
            'llm': question.model_type.model_name,
            'answers': answers_json,
            'sources': sources_json
        }
        return Response(question_json)
    
@api_view(['POST'])
def save_answer(request):
    if request.method == 'POST':
        json_request = JSONParser().parse(request)
        question_text = json_request['question_text']
        answer_text = json_request['answer_text']
        answer_no_context_text = json_request['answer_no_context_text']
        model = json_request['model_type']
        model_type = Model.objects.get(model_name=model)
        dataset_name = json_request['dataset']
        dataset = Dataset.objects.get(dataset_name=dataset_name)
        question = Question.objects.get(question_text=question_text, model_type=model_type, question_dataset=dataset)
        embedding_model = dataset.embedding_model
        no_context = json_request['no_context']
        if not no_context:
            _, _, _, _, _, _, distances = nearestDataChroma(answer_no_context_text, dataset_name, '',embedding_model)
            distances = [round(dist, 3) for dist in distances]
            mean_distance = sum(distances) / len(distances)
            relevance_score = get_relevance_score(distances, embedding_model)
        else:
            relevance_score = 0
        Answer.objects.create(
            answer_text=answer_text,
            answer_no_context_text=answer_no_context_text,
            relevance_score=relevance_score, 
            model_type=model_type, 
            question=question
        )
        # add embeddings to answer
        if not no_context:
            add_embeddings_to_qna(answer_text, 'answer', embedding_model)
        return Response({'saved':True, 'mean_distance': mean_distance, 'relevance_score': relevance_score}, content_type="application/json")

@api_view(['POST'])
def feedback_for_answers(request):
    if request.method == 'POST':
        json_request = JSONParser().parse(request)
        answer_text = json_request['answer_text']
        rating = json_request['rating']
        user_comment = json_request['user_comment']
        answer = Answer.objects.get(answer_text=answer_text)
        answer.rating = rating
        answer.user_comment = user_comment
        answer.save()
        return Response({'saved':True}, content_type="application/json")
    
@api_view(['GET'])
def delete_dataset(request):
    if request.method == 'GET':
        dataset_name = request.GET.get('dataset')
        dataset = Dataset.objects.get(dataset_name=dataset_name)
        papers = Papers.objects.filter(paper_dataset=dataset)
        for paper in papers:
            paper.delete()
        dataset.delete()

        # delete from chroma
        client = chromadb.PersistentClient(path='/code/chroma_storage/.')
        client.delete_collection(name=dataset_name)

        # delete the pdf folder
        pdf_folder = 'data/pdfs/' + dataset_name
        if os.path.exists(pdf_folder):
            # remove all files with output_file name in thier name
            # files = [f for f in os.listdir(pdf_folder) if dataset_name in f]
            # remove all files with output_file name in thier name
            try:
                shutil.rmtree(pdf_folder)
            except:
                return Response({'error':True, 'error_message': 'Could not delete pdf folder'}, content_type="application/json")
        return Response({'deleted':True}, content_type="application/json")
    
@api_view(['POST'])
def add_zotero_dataset(request):
    if request.method == 'POST':
        json_request = JSONParser().parse(request)
        api_key = json_request['api_key']
        library_id = json_request['library_id']
        library_id_type = json_request['library_id_type']
        collection_id = json_request['collection_id']
        embedding_model = request.POST.get('embedding_model')
        user = request.POST.get('user')
        user_email = request.POST.get('user_email')
        user_group = request.POST.get('user_group')

        dataset_name = get_zotero_chunks(library_id, library_id_type, collection_id, api_key, user, user_email, user_group)
        # if dataset_name.error:
        #     return Response({'error':True, 'error_message': dataset_name.error}, content_type="application/json")
        message = add_to_chroma(dataset_name, embedding_model)

        if message == False:
            return Response({'error':True}, content_type="application/json")
        datasets = Dataset.objects.all()
        dataset_names = []
        for dataset in datasets:
            dataset_names.append(dataset.dataset_name)
        return Response({'added':True, 'datasets': dataset_names}, content_type="application/json")
    
@api_view(['POST'])
def upload_documents(request):
    if request.method == 'POST':
        validation = validate_post_request(request)
        if not validation:
            return Response({'error': True, 'error_message': validation}, content_type="application/json")
        else:
            dataset_name = add_dataset_from_upload(request)
            
            # Validate embedding_model input
            embedding_model_request = request.POST.get('embedding_model')
            if not embedding_model_request or not re.match(r'^[a-zA-Z0-9_\-]+$', embedding_model_request):
                return Response({'error': True, 'error_message': 'Invalid embedding model name'}, content_type="application/json")
            
            embedding_model = str(embedding_model_request)
            message = add_to_chroma(dataset_name, embedding_model)

            if message == False:
                return Response({'error': True}, content_type="application/json")
            return Response({'uploaded': True}, content_type="application/json")

@api_view(['POST'])
def add_ollama_models(request):
    if request.method == 'POST':
        json_request = JSONParser().parse(request)
        ollama_models = json_request['llms']
        for ollama_model in ollama_models:
            if Model.objects.filter(model_name=ollama_model['name']).count() == 0:
                Model.objects.create(
                    model_name=ollama_model['name'],
                    model_size=ollama_model['size']
                )
        return Response({'added':True}, content_type="application/json")
    
@api_view(['POST'])
def add_embedding_models(request):
    if request.method == 'POST':
        json_request = JSONParser().parse(request)
        embedding_models = json_request['embedding_models']
        for embedding_model in embedding_models:
            if EmbeddingModel.objects.filter(model_name=embedding_model['name']).count() == 0:
                EmbeddingModel.objects.create(
                    model_name=embedding_model['name'],
                    model_size=embedding_model['size'],
                    model_source=embedding_model['source'],
                )
        return Response({'added':True}, content_type="application/json")
    
@api_view(['GET'])
def get_frontend_settings(request):
    if request.method == 'GET':
        # check if settings exist
        if FrontEndSettings.objects.count() == 0:
            # create default settings
            FrontEndSettings.objects.create(
                show_no_context_switch=False,
                azure_login=False,
                django_login=False,
                restriction_without_login=False,
                disable_chat_without_login=False,
                saved_date_time=make_aware(datetime.datetime.now())
            )
        
        # get the latest settings
        frontend_settings = FrontEndSettings.objects.latest('saved_date_time')
        frontend_settings_obj = {
            'show_no_context_switch': frontend_settings.show_no_context_switch,
            'restriction_without_login': frontend_settings.restriction_without_login,
            'azure_login': frontend_settings.azure_login,
            'django_login': frontend_settings.django_login,
            'disable_chat_without_login': frontend_settings.disable_chat_without_login
        }
        return Response({'settings':frontend_settings_obj})
    
@api_view(['GET'])
def add_demo_dataset_api(request):
    if request.method == 'GET':
        datasets = Dataset.objects.all()
        embedding_model = request.GET.get('embedding_model')
        if datasets.count() > 0 and datasets.filter(dataset_name='GPCR').count() > 0:
            datasets.get(dataset_name='GPCR').delete()
        add_demo_dataset(embedding_model)
        return Response({'added':True}, content_type="application/json")
    
@api_view(['POST'])
def add_video_library(request):
    if request.method == 'POST':
        dataset_name = request.POST.get('dataset_name').replace(' ', '_')
        embedding_model = request.POST.get('embedding_model')
        video_urls = request.POST.get('video_urls').split(',')
        playlist_url = request.POST.get('playlist_url')
        user = request.POST.get('user')
        user_email = request.POST.get('user_email')
        user_group = request.POST.get('user_group')
        video_titles = []
        if len(playlist_url):
            videos = Playlist(playlist_url)
            video_urls = videos.video_urls
        for video_url in video_urls:
            yt = YouTube(video_url)
            video_titles.append(yt.title)
    
        # create dataset
        dataset = Dataset.objects.filter(dataset_name=dataset_name)
        if dataset.count() > 0:
            dataset = dataset[0]
        else:
            dataset = Dataset.objects.create(
                dataset_name=dataset_name,
                dataset_size=0,
                user = user if len(user) else '-',
                user_email = user_email if len(user_email) else '-',
                user_group = user_group if len(user_group) else '-',
                dataset_date_time=make_aware(datetime.datetime.now())
            )

        # extract transcript from youtube video and save to chroma
        video_ids = []
        for idx, video_url in enumerate(video_urls):
            video_title = video_titles[idx]
            youtube_video_id = video_url.split('=')[-1]
            video_ids.append(youtube_video_id)

            Videos.objects.create(
                video_title=video_title,
                video_link=video_url,
                video_dataset=dataset,
                video_date_time=make_aware(datetime.datetime.now())
            )
        
        get_youtube_transcript(dataset_name, video_ids, video_titles)    
        add_video_to_chroma(dataset_name, embedding_model)

        return Response({'added':True}, content_type="application/json")
    
@api_view(['GET'])
def get_vector_embeddings(request):
    if request.method == 'GET':
        datasets_param = request.GET.get('datasets')
        question_id_param = request.GET.get('question_id')

        # Validate datasets input
        if not datasets_param or not re.match(r'^[a-zA-Z0-9_,\-]+$', datasets_param):
            return Response({'error': True, 'error_message': 'Invalid datasets parameter'}, status=400)

        datasets = datasets_param.split(',')

        # Validate question_id input
        if question_id_param:
            if not question_id_param.isdigit():
                return Response({'error': True, 'error_message': 'Invalid question_id parameter'}, status=400)

            question_id = int(question_id_param)
            try:
                question = Question.objects.get(id=question_id)
            except Question.DoesNotExist:
                return Response({'error': True, 'error_message': 'Question not found'}, status=404)

            if question.pca_x == 0 and question.pca_y == 0 and question.pca_z == 0:
                add_pca_to_qna_and_dataset(question_id)

            return Response({'success': True}, status=200)

        pca_embeddings = []
        for dataset_name in datasets:
            dataset = Dataset.objects.get(dataset_name=dataset_name)
            chunks_objects = chunks.objects.filter(chunk_dataset=dataset)
            for chunk in chunks_objects:
                pca_embeddings.append({
                    'pca_x': chunk.pca_x,
                    'pca_y': chunk.pca_y,
                    'pca_z': chunk.pca_z,
                    'dataset': chunk.chunk_dataset.dataset_name
                })

        if question_id:
            question = Question.objects.get(id=question_id)
            pca_embeddings.append({
                'pca_x': question.pca_x,
                'pca_y': question.pca_y,
                'pca_z': question.pca_z,
                'dataset': 'question'
            })
            answer = Answer.objects.filter(question=question)[0]
            pca_embeddings.append({
                'pca_x': answer.pca_x,
                'pca_y': answer.pca_y,
                'pca_z': answer.pca_z,
                'dataset': 'answer'
            })
            sources = Source.objects.filter(question=question)
            for source in sources:
                chunk = chunks.objects.get(id=source.chunk.id)
                pca_embeddings.append({
                    'pca_x': chunk.pca_x,
                    'pca_y': chunk.pca_y,
                    'pca_z': chunk.pca_z,
                    'dataset': 'source'
                })
        return Response({'pca_embeddings': pca_embeddings})
    
@api_view(['GET'])
def add_dataset_embeddings(request):
    if request.method == 'GET':
        dataset_name = request.GET.get('dataset')
        add_embeddings_to_chunks(dataset_name)
        add_pca_to_chunks()
        return Response({'added':True}, content_type="application/json")
    
@api_view(['POST'])
def get_distance_between_answers(request):
    if request.method == 'POST':
        json_request = JSONParser().parse(request)
        sentence1 = json_request['sentence1']
        sentence2 = json_request['sentence2']
        embedding_model = json_request['embedding_model']
        distances = get_answer_distance(sentence1, sentence2, embedding_model)
        return Response({'distances': distances}, content_type="application/json")
    
# get username if access token is valid
@api_view(['POST'])
def get_username(request):
    if request.method == 'POST':
        access_token = request.data['access_token']

        try:
            token = AccessToken(access_token)
            user_id = token.payload['user_id']
            user = User.objects.get(id=user_id).username
            user_email = User.objects.get(id=user_id).email
            user_group = User.objects.get(id=user_id).groups.all()[0].name if User.objects.get(id=user_id).groups.count() else ''
            return Response({'username': user, 'user_email': user_email, 'user_group': user_group}, content_type="application/json")
        except:
            return Response({'username': ''}, content_type="application/json")
        
@api_view(['POST'])
def disclaimer_agreement(request):
    if request.method == 'POST':
        user = User.objects.get(username=request.data['username'])
        DisclaimerAgreement.objects.create(
            user=user,
            agreement_date_time=make_aware(datetime.datetime.now())
        )
        return Response({'agreed':True}, content_type="application/json")

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        try:
            refresh_token = request.data['refresh_token']
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response(status=status.HTTP_400_BAD_REQUEST)