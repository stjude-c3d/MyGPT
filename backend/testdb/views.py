from django.shortcuts import render
from django.core.files.base import File
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework.parsers import JSONParser
from rest_framework import viewsets
from django.apps import apps
from django.utils.timezone import make_aware
from django.core import serializers
import PyPDF2
from pyzotero import zotero
import fitz
from tqdm import tqdm
import chromadb
import datetime
import re
import os
import json
import re
from .models import Papers, Dataset, Question, Answer, Source, Conversation, Model
from .serializers import ModelSerializer, PapersSerializer, QuestionSerializer, AnswerSerializer, DatasetSerializer
from .forms import PapersForm

app_config = apps.get_app_config('testdb')

def home(request):
    datasets = Dataset.objects.all()
    form = PapersForm()
    file_count = 15

    if(datasets.count() == 0):
        add_demo_dataset()

    elif(request.GET.get('reload_library')):
        if datasets.filter(dataset_name='GPCR').count() > 0:
            datasets.get(dataset_name='GPCR').delete()
        add_demo_dataset()
        datasets = Dataset.objects.all()
        return render(request, 'home.html', {'success': 'Successfully reloaded demo dataset', 'datasets': datasets, 'form': form, 'file_count': range(1,file_count+1)})

    elif(request.GET.get('upload_btn')):
        if(request.GET.get('group_id') and request.GET.get('group_id') != ''):
            group_id = request.GET.get('group_id')
            collection_id = request.GET.get('collection_id')
            dataset_name = get_zotero_chunks(group_id, collection_id)
            add_to_chroma(dataset_name)
            datasets = Dataset.objects.all()
            return render(request, 'home.html', {'success': 'Successfully uploaded dataset', 'datasets': datasets, 'form': form, 'file_count': range(1,file_count+1)})

    return render(request, 'home.html', {'datasets': datasets, 'form': form, 'file_count': range(1,file_count+1)})

####################
# Helper functions #
####################

# Extracts content from a given PDF file and returns it along with the number of pages.
def getPDFContent(path):
    file = open(path, 'rb')
    pdfReader = PyPDF2.PdfReader(file)
    context = pdfReader.pages
    return (context, len(pdfReader.pages))

# Collects chunks of text from PDFs stored in a Zotero collection.
def get_zotero_chunks(library_id, library_id_type, collection_id, users_api_key):
    # example gorup id and collection id
    # group_id = 4982570
    # collection_id = 'YTPMLXYY'
    types = ['journalArticle', 'preprint']
    # library_type =  'group'
    api_key = users_api_key
    if not api_key:
        api_key = os.environ.get('ZOTERO_API_KEY')

    # Initialize the Zotero API client
    zot = zotero.Zotero(library_id, library_id_type, api_key)
    # Get the 'Llama' collection id
    dataset_name = zot.all_collections(collection_id)[0]['data']['name']
    datasets = Dataset.objects.filter(dataset_name=dataset_name)
    if datasets.count() > 0:
        dataset = datasets[0]
    else:
        dataset = Dataset.objects.create(
            dataset_name=dataset_name,
            dataset_size=0,
            zotero_id=collection_id,
            dataset_date_time=make_aware(datetime.datetime.now())
        )

    # Get items from the publication collection
    items = zot.collection_items(collection_id)
    pdfs = [x for x in items if x['data']['itemType'] in types]

    titles = [x['data']['title'] for x in pdfs]
    abstracts = [x['data']['abstractNote'] for x in pdfs]
    attachments = [zot.children(x['data']['key']) for x in pdfs]
    pdf_attachments = []
    for attachment_list in attachments:
        for attachment in attachment_list:
            if attachment['data']['itemType'] == 'attachment' and attachment['data']['contentType'] == 'application/pdf':
                pdf_attachments.append(attachment)

    print('zotero files loaded')

    data = []
    # make directory for pdfs
    if not os.path.exists('data/pdfs/'+ dataset_name):
        os.makedirs('data/pdfs/'+ dataset_name)
    
    # Loop through PDF attachments, extract content, and store it in 'data' list
    go_to_next = False
    for idx, title, attachment, abstract in zip( range(1, len(titles)+1), titles, pdf_attachments, abstracts):
        with open('data/pdfs/'+ dataset_name +'/paper' + str(idx) + '.pdf', 'wb') as f:
            f.write(zot.file(attachment['data']['key']))
        content = getPDFContent('data/pdfs/'+ dataset_name +'/paper' + str(idx) + '.pdf')
        papers = Papers.objects.filter(paper_title=title, paper_dataset=dataset)
        if papers.count() > 0:
            paper = papers[0]
        else:
            paper = None
        if not paper:
            paper = Papers.objects.create(
                paper_title=title,
                paper_dataset=dataset,
                paper_date_time=make_aware(datetime.datetime.now())
            )
            with open('data/pdfs/'+ dataset_name +'/paper' + str(idx) + '.pdf', 'rb') as f:
                paper.paper_attachment.save(dataset_name + '/paper' + str(idx) + '.pdf', File(f), save=True)
        if go_to_next:
            go_to_next = False
        for page in range(content[1]):
            if go_to_next:
                break
            text = content[0][page].extract_text()
            n = 1000
            splits = []
            remainder = ''
            for i in range(0, len(text), n):
                item = remainder + text[i : i + n]
                # if len(re.findall(r'\sReferences.*\n+\d+',item, re.I)):
                #     go_to_next = True
                #     break
                item = item.replace('\n', ' ')
                if '. ' in item:
                    remainder = item[item.rindex('. ') + 2: ]
                    item = item.removesuffix(remainder)
                if len(item) > 10:
                    splits.append(item)
            for split in splits:
                # if len(re.findall(r'^References .*\s+', split)):
                #     go_to_next = True
                #     break
                chunk = {'title': title, 'page': page+1, 'content': split, 'type': 'pagechunk'}
                data.append(chunk)
    print('zotero chunks loaded')        

    with open('data/data_chunks/'+ dataset_name +'.txt', 'w') as f:
        for chunk in data:
            # convert chunk to string and write to file
            f.write(str(chunk) + '\n')
    print('zotero chunks saved to file')
    return dataset_name

def add_dataset_from_upload(request):
    dataset_name = request.POST.get('dataset_name').replace(' ', '_')
    paper_titles = request.POST.getlist('paper_title')
    paper_attachments = request.FILES.getlist('paper_attachment')

    # create dataset
    dataset = Dataset.objects.filter(dataset_name=dataset_name)
    if dataset.count() > 0:
        dataset = dataset[0]
    else:
        dataset = Dataset.objects.create(
            dataset_name=dataset_name,
            dataset_size=0,
            dataset_date_time=make_aware(datetime.datetime.now())
        )

    # make directory for pdfs
    if not os.path.exists('data/pdfs/'+ dataset_name):
        os.makedirs('data/pdfs/'+ dataset_name)
    
    # save pdfs
    data = []
    go_to_next = False
    for idx in range(len(paper_titles)):
        if paper_titles[idx] == '' or paper_titles[idx] == '-':
            continue
        paper = Papers.objects.create(
            paper_title=paper_titles[idx],
            paper_dataset=dataset,
            paper_date_time=make_aware(datetime.datetime.now())
        )
        pdf_name = 'data/pdfs/'+ dataset_name +'/paper' + str(idx+1) + '.pdf'
        with open(pdf_name, 'wb') as f:
            f.write(paper_attachments[idx].read())
        with open(pdf_name, 'rb') as f:
            paper.paper_attachment.save(dataset_name + '/paper' + str(idx+1) + '.pdf', File(f), save=True)

        # extract text from pdfs
        content = getPDFContent(pdf_name)

        if go_to_next:
            go_to_next = False
        for page in range(content[1]):
            if go_to_next:
                break
            text = content[0][page].extract_text()
            n = 1000
            splits = []
            remainder = ''
            for i in range(0, len(text), n):
                item = remainder + text[i : i + n]
                # if len(re.findall(r'\sReferences.*\n+\d+',item, re.I)):
                #     go_to_next = True
                #     break
                item = item.replace('\n', ' ')
                if '. ' in item:
                    remainder = item[item.rindex('. ') + 2: ]
                    item = item.removesuffix(remainder)
                if len(item) > 10:
                    splits.append(item)
            for split in splits:
                # if len(re.findall(r'^References .*\s+', split)):
                #     go_to_next = True
                #     break
                chunk = {'title': paper_titles[idx], 'page': page+1, 'content': split, 'type': 'pagechunk'}
                data.append(chunk)
    print('zotero chunks loaded')        

    with open('data/data_chunks/'+ dataset_name +'.txt', 'w') as f:
        for chunk in data:
            # convert chunk to string and write to file
            f.write(str(chunk) + '\n')
    print('zotero chunks saved to file')
    return dataset_name


def add_to_chroma(dataset_name):
    documents_directory = '/code/data/data_chunks'
    # collection_name = 'pub_collection'
    # Read all files in the data directory
    documents = []
    metadatas = []
    files = [dataset_name + '.txt']

    # Instantiate a persistent chroma client in the persist_directory.
    # Learn more at docs.trychroma.com
    client = chromadb.PersistentClient(path='/code/chroma_storage/.')

    # If the collection already exists, we will delete it and create a new one.
    client.get_or_create_collection(name=dataset_name)
    client.delete_collection(name=dataset_name)
    collection = client.get_or_create_collection(name=dataset_name)

    # Create ids from the current count
    count = collection.count()
    print(f'Collection already contains {count} documents')

    # Load the documents in batches of 100
    if count == 0:
        for filename in files:
            # collection_name = filename
            with open(f'{documents_directory}/{filename}', 'r') as file:
                for line_number, line in enumerate(
                    tqdm((file.readlines()), desc=f'Reading {filename}'), 1
                ):
                    # Strip whitespace and append the line to the documents list
                    line = line.strip()
                    #convert line to json
                    line_json = eval(line)
                    documents.append(line_json['content'])
                    metadatas.append({'filename': line_json['title'], 'page': line_json['page']})
        ids = [str(i) for i in range(count, count + len(documents))]
        for i in tqdm(
            range(0, len(documents), 100), desc='Adding documents', unit_scale=100
        ):
            collection.add(
                ids=ids[i : i + 100],
                documents=documents[i : i + 100],
                metadatas=metadatas[i : i + 100],  # type: ignore
            )

        new_count = collection.count()
        dataset = Dataset.objects.get(dataset_name=dataset_name)
        dataset.dataset_size = new_count
        dataset.save()
        print(f'Added {new_count - count} documents')

def add_demo_dataset():
    documents_directory = '/code/data'
    # collection_name = 'pub_collection'
    # Read all files in the data directory
    documents = []
    metadatas = []
    files = os.listdir(documents_directory)
    files = ['GPCR.txt']
    dataset_name = 'GPCR'
    titles = []
    client = chromadb.PersistentClient(path='/code/chroma_storage/.')

    # If the collection already exists, we will delete it and create a new one.
    client.get_or_create_collection(name=dataset_name)
    client.delete_collection(name=dataset_name)
    collection = client.get_or_create_collection(name=dataset_name)

    # Create ids from the current count
    count = collection.count()
    print(f'Collection already contains {count} documents')

    # Load the documents in batches of 100
    if count == 0:
        for filename in files:
            # collection_name = filename
            with open(f'{documents_directory}/data_chunks/{filename}', 'r') as file:
                for line_number, line in enumerate(
                    tqdm((file.readlines()), desc=f'Reading {filename}'), 1
                ):
                    # Strip whitespace and append the line to the documents list
                    line = line.strip()
                    #convert line to json
                    line_json = eval(line)
                    documents.append(line_json['content'])
                    metadatas.append({'filename': line_json['title'], 'page': line_json['page']})
                    if line_json['title'] not in titles:
                        titles.append(line_json['title'])
        ids = [str(i) for i in range(count, count + len(documents))]
       
        temp_collection = client.get_or_create_collection(name=dataset_name)
        for i in tqdm(
            range(0, len(documents), 100), desc='Adding documents', unit_scale=100
        ):
            temp_collection.add(
                ids=ids[i : i + 100],
                documents=documents[i : i + 100],
                metadatas=metadatas[i : i + 100],  # type: ignore
            )

        new_count = collection.count()
        print(f'new_count: {new_count}')
        dataset = Dataset.objects.create(
            dataset_name=dataset_name,
            dataset_size=new_count,
            dataset_date_time=make_aware(datetime.datetime.now())
        )
        for (idx, title) in enumerate(titles):
            paper = Papers.objects.create(
                paper_title=title,
                paper_dataset=dataset,
                paper_date_time=make_aware(datetime.datetime.now())
            )
            with open(f'{documents_directory}/pdfs/{dataset_name}/paper{idx+1}.pdf', 'rb') as f:
                paper.paper_attachment.save(dataset_name + '/paper' + str(idx+1) + '.pdf', File(f), save=True)
           
        print(f'Added {new_count - count} documents')

def find_cutoff_distance(distances):
    # find the distane from where the distances start to increase
    cutoff_distance = distances[1]
    distances_diff = []
    for i in range(len(distances)-1):
        distances_diff.append(distances[i+1] - distances[i])
    print('distances_diff: ', distances_diff)
    for i in range(1, len(distances_diff)-1):
        if distances_diff[i+1] > distances_diff[i]:
            cutoff_distance = distances[i+2]
        else:
            cutoff_distance = distances[i+1]
            break
    return cutoff_distance

def nearestDataChroma(text, dataset_name):
    # collection_name = 'pub_collection'
    # client = chromadb.Client()

    # If the collection already exists, we just return it. This allows us to add more
    # data to an existing collection.
    client = chromadb.PersistentClient(path='/code/chroma_storage/.')
    collection = client.get_collection(name=dataset_name)
    # collection = app_config.collection

    # Create ids from the current count
    count = collection.count()
    print(f'Collection contains {count} documents')

    results = collection.query(
        query_texts=[text],
        n_results=10,
        # where={'metadata_field': 'is_equal_to_this'}, # optional filter
        # where_document={'$contains':'search_string'}  # optional filter
    )

    # print('results: ', results)
    print('distances: ', results['distances'][0])
    #find highest score
    # lowest_distance = 10
    # cutoff_distance = statistics.median(results['distances'][0])
    cutoff_distance = find_cutoff_distance(results['distances'][0])
    print('cutoff_distance: ', cutoff_distance)
    titles, pages, chunks, distances = [], [], [], []
    context = ''

    # for i in range(len(results['ids'][0])):
    #     if results['distances'][0][i] < lowest_distance:
    #         lowest_distance = results['distances'][0][i]
    #         lowest_distance_index = i

    # if lowest distance is less than 0.6 use the chunk with lowest distance
    for i in range(len(results['ids'][0])):
        if (results['distances'][0][i] <= cutoff_distance):
            titles.append(results['metadatas'][0][i]['filename'])
            pages.append(results['metadatas'][0][i]['page'])
            chunks.append(results['documents'][0][i])
            distances.append(results['distances'][0][i])
            context += re.sub(r'\s+', ' ', results['documents'][0][i])
    
    # Return the collected information along with the full text of the best-matching document
    ret = None
    ret = (context, titles, pages, chunks, distances)
    return ret

def get_conversation_json(question_text):
    conversation_id = Question.objects.filter(question_text=question_text)[0].conversation.id
    conversation = Conversation.objects.get(id=conversation_id)
    questions = Question.objects.filter(conversation=conversation).order_by('saved_date_time')
    conversation_json = []
    for question in questions:
        answers = Answer.objects.filter(question=question)
        qna_json = {
            'question': question.question_text,
            'answers': answers[0].answer_text,
        }
        conversation_json.append(qna_json)
    return conversation_json

def get_confidence_score(distances):
    best_distance = 0.4
    worst_distance = 1.5

    # calculate confidence score
    # if maximum distance is more than 1.5 then confidence score is 0
    if max(distances) > worst_distance:
        confidence_score = 0
    else:
        mean_distance = sum(distances) / len(distances)
        confidence_score = (1 - (mean_distance - best_distance) / (worst_distance - best_distance)) * 100
        # trim confidence score to 2 decimal places
        confidence_score = round(confidence_score, 0)
    return confidence_score

def get_previous_qna_json(question_text):
    question = Question.objects.filter(question_text=question_text)[0]
    answers = Answer.objects.filter(question=question)
    conversation_json = []
    qna_json = {
        'question': question.question_text,
        'answers': answers[0].answer_text,
    }
    conversation_json.append(qna_json)
    return conversation_json

def highlight_pdf(input_file, output_file, source_grp):
    input_pdf = fitz.open(input_file)
    # iterate through source_grp
    for source in source_grp:
        page_idx = source['page'] - 1
        highlight_text = source['context']
        for idx in range(len(input_pdf)):
            if idx != page_idx:
                continue
            page = input_pdf[idx]
            hightlight_sentences = highlight_text.split('.')
            hightlight_sentences = [sentence for sentence in hightlight_sentences if len(sentence) > 10]
            for sentence in hightlight_sentences:
                if(len(sentence) == 0):
                    continue
                text_instances = page.search_for(sentence)

                for inst in text_instances:
                    highlight = page.add_highlight_annot(inst)
                    highlight.set_colors()
                    highlight.update()

    input_pdf.save(output_file, garbage=4, deflate=True, clean=True)

####################
# API viewSets     #
####################

class ModelViewSet(viewsets.ModelViewSet):
    """
    API endpoint that shows protein families.
    """
    queryset = Model.objects.all()
    serializer_class = ModelSerializer

class QuestionsViewSet(viewsets.ModelViewSet):
    """
    API endpoint that shows protein families.
    """
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer

class AnswersViewSet(viewsets.ModelViewSet):
    """
    API endpoint that shows protein families.
    """
    queryset = Answer.objects.all()
    serializer_class = AnswerSerializer

class PapersViewSet(viewsets.ModelViewSet):
    """
    API endpoint that shows protein families.
    """
    queryset = Papers.objects.all()
    serializer_class = PapersSerializer

class DataSetsViewSet(viewsets.ModelViewSet):
    """
    API endpoint that shows protein families.
    """
    queryset = Dataset.objects.all()
    serializer_class = DatasetSerializer

####################
# APIs             #
####################

@api_view(['GET'])
def get_papers(request):
    if request.method == 'GET':
        if request.GET.get('dataset'):
            dataset_name = request.GET.get('dataset')
            dataset = Dataset.objects.get(dataset_name=dataset_name)
            papers = Papers.objects.filter(paper_dataset=dataset)
            papers_ = serializers.serialize('json', papers)
        else:
            papers = Papers.objects.all()
            papers_ = serializers.serialize('json', papers)
        papers_json = json.loads(papers_)
        papers = []
        for paper in papers_json:
            papers.append(paper['fields'])
        return Response(papers)

# example json: {"text": "how many inactive conformational states ABL1 has?", "dataset": "ABL1"}
@api_view(['POST'])
def get_context(request):
    if request.method == 'POST':
        json_request = JSONParser().parse(request)
        question_text = json_request['text']
        model = json_request['model_type']
        model_type = Model.objects.get(model_name=model)
        dataset_name = json_request['dataset']
        new_conversation = json_request['new_conversation']
        previous_question = json_request['previous_query']
        context, titles, pages, chunks, distances = nearestDataChroma(question_text, dataset_name)
        sources = []
        distances = [round(dist, 3) for dist in distances]
        confidence_score = get_confidence_score(distances)

        # save question to database
        current_date_time = make_aware(datetime.datetime.now())
        dataset = Dataset.objects.get(dataset_name=dataset_name)
        quesiton_exist = Question.objects.filter(question_text=question_text).filter(model_type=model_type).exists()
        if quesiton_exist:
            question = Question.objects.get(question_text=question_text, model_type=model_type)
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
                confidence_score=confidence_score,
                model_type=model_type,
                question_dataset=dataset,
                conversation=conversation,
                saved_date_time=current_date_time
            )
        question_sources = Source.objects.filter(question=question)
        for idx, title in enumerate(titles):
            sources.append({
                'paper': title,
                'page': pages[idx],
                'context': chunks[idx],
                'distance': round(distances[idx],3) #round to 3 decimals
            })
            if len(question_sources) == 0:
                Source.objects.create(
                    source_paper=title,
                    source_page=pages[idx],
                    context=chunks[idx].replace("\x00", "\uFFFD"),
                    distance=round(distances[idx],3),
                    question=question
                )

        sources_grouped = []
        for source in sources:
            if len(sources_grouped) == 0:
                sources_grouped.append([source])
            else:
                found = False
                for source_group in sources_grouped:
                    if source['paper'] == source_group[0]['paper']:
                        source_group.append(source)
                        found = True
                        break
                if not found:
                    sources_grouped.append([source])

        # hightlight pdf with source paper and page
        for source_grp in sources_grouped:
            paper_obj = Papers.objects.filter(paper_title=source_grp[0]['paper'])[0].paper_attachment
            if (len(paper_obj.path.split('/')[-1].split('_')) > 1): 
                paper_name =   paper_obj.path.split('/')[-1].split('_')[0] + '.pdf'
            else:
                paper_name =   paper_obj.path.split('/')[-1]

            original_pdf_path = 'data/pdfs/'+ dataset_name + '/' + paper_name
            highlighted_pdf_path = 'data/pdfs/' + dataset_name + '/' + paper_name.split('.')[0] + '_highlighted.pdf'

            highlight_pdf(
                original_pdf_path, 
                highlighted_pdf_path, 
                source_grp
            )

            # create highlighted paper object
            paper = Papers.objects.filter(paper_title=source_grp[0]['paper'])[0]
            with open(highlighted_pdf_path, 'rb') as f:
                paper.highlited_attachment.save(dataset_name + '/' + paper_name.split('.')[0] + '_highlighted.pdf', File(f), save=True)
        
        context_json = {
            'context': context,
            'confidence_score': confidence_score,
            'sources': sources
        }
        
        return Response(context_json, content_type="application/json")
    
@api_view(['POST'])
def save_answer(request):
    if request.method == 'POST':
        json_request = JSONParser().parse(request)
        question_text = json_request['question_text']
        answer_text = json_request['answer_text']
        model = json_request['model_type']
        model_type = Model.objects.get(model_name=model)
        question = Question.objects.get(question_text=question_text, model_type=model_type)
        Answer.objects.create(
            answer_text=answer_text, 
            model_type=model_type, 
            question=question
        )
        return Response({'saved':True}, content_type="application/json")

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
        return Response({'deleted':True}, content_type="application/json")
    
@api_view(['POST'])
def add_zotero_dataset(request):
    if request.method == 'POST':
        json_request = JSONParser().parse(request)
        api_key = json_request['api_key']
        library_id = json_request['library_id']
        library_id_type = json_request['library_id_type']
        collection_id = json_request['collection_id']
        dataset_name = get_zotero_chunks(library_id, library_id_type, collection_id, api_key)
        # if dataset_name.error:
        #     return Response({'error':True, 'error_message': dataset_name.error}, content_type="application/json")
        add_to_chroma(dataset_name)
        datasets = Dataset.objects.all()
        dataset_names = []
        for dataset in datasets:
            dataset_names.append(dataset.dataset_name)
        return Response({'added':True, 'datasets': dataset_names}, content_type="application/json")
    
@api_view(['POST'])
def upload_documents(request):
    if request.method == 'POST':
        dataset_name = add_dataset_from_upload(request)
        add_to_chroma(dataset_name)
        return Response({'uploaded':True}, content_type="application/json")

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