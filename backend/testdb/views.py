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
import unicodedata
from tqdm import tqdm
import chromadb
import datetime
import re
import http.client
import os
import ssl
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

    if(request.method == 'POST'):
        form = PapersForm(request.POST, request.FILES)
        dataset_name = request.POST.get('dataset_name')
        if form.is_valid():
            dataset_name = add_dataset_from_upload(request)
            add_to_chroma(dataset_name)
            datasets = Dataset.objects.all()
            return render(request, 'home.html', {'success': 'Successfully uploaded dataset', 'datasets': datasets, 'form': form, 'file_count': range(1,file_count+1)})
        else:
            return render(request, 'home.html', {'error': 'Failed to upload dataset'})

    elif(request.GET.get('reload_library')):
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

    get_ollama_models()
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
    if not os.path.exists('backend/data/pdfs/'+ dataset_name):
        os.makedirs('backend/data/pdfs/'+ dataset_name)
    
    # Loop through PDF attachments, extract content, and store it in 'data' list
    go_to_next = False
    for idx, title, attachment, abstract in zip( range(1, len(titles)+1), titles, pdf_attachments, abstracts):
        with open('backend/data/pdfs/'+ dataset_name +'/paper' + str(idx) + '.pdf', 'wb') as f:
            f.write(zot.file(attachment['data']['key']))
        content = getPDFContent('backend/data/pdfs/'+ dataset_name +'/paper' + str(idx) + '.pdf')
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
            with open('backend/data/pdfs/'+ dataset_name +'/paper' + str(idx) + '.pdf', 'rb') as f:
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

    with open('backend/data/data_chunks/'+ dataset_name +'.txt', 'w') as f:
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
    if not os.path.exists('backend/data/pdfs/'+ dataset_name):
        os.makedirs('backend/data/pdfs/'+ dataset_name)
    
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
        pdf_name = 'backend/data/pdfs/'+ dataset_name +'/paper' + str(idx+1) + '.pdf'
        with open(pdf_name, 'wb') as f:
            f.write(paper_attachments[idx].read())
        with open(pdf_name, 'rb') as f:
            paper.paper_attachment.save('papers/' + dataset_name + '/paper' + str(idx+1) + '.pdf', File(f), save=True)

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

    with open('backend/data/data_chunks/'+ dataset_name +'.txt', 'w') as f:
        for chunk in data:
            # convert chunk to string and write to file
            f.write(str(chunk) + '\n')
    print('zotero chunks saved to file')
    return dataset_name


def add_to_chroma(dataset_name):
    documents_directory = '/code/backend/data/data_chunks'
    # collection_name = 'pub_collection'
    # Read all files in the data directory
    documents = []
    metadatas = []
    files = [dataset_name + '.txt']

    # Instantiate a persistent chroma client in the persist_directory.
    # Learn more at docs.trychroma.com
    client = chromadb.PersistentClient(path='/code/backend/chroma_storage/.')

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
    documents_directory = '/code/backend/data'
    # collection_name = 'pub_collection'
    # Read all files in the data directory
    documents = []
    metadatas = []
    files = os.listdir(documents_directory)
    files = ['GPCR.txt']
    dataset_name = 'GPCR'
    titles = []
    client = chromadb.PersistentClient(path='/code/backend/chroma_storage/.')

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
        for i in tqdm(
            range(0, len(documents), 100), desc='Adding documents', unit_scale=100
        ):
            collection.add(
                ids=ids[i : i + 100],
                documents=documents[i : i + 100],
                metadatas=metadatas[i : i + 100],  # type: ignore
            )

        new_count = collection.count()
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
    client = chromadb.PersistentClient(path='/code/backend/chroma_storage/.')
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

def llama_prompt_new_question(user_question, dataset_name):
    context, titles, pages, chunks, distances = nearestDataChroma(user_question, dataset_name)
    query = re.sub(r'\"',r'"', user_question)
    prompt_template = "<s>[INST] <<SYS>> You are a helpful, respectful, and honest assistant. You will answer the given query denoted by '[Query]' using context, denoted by '[Context]'. The context will come from various sources. Certain pieces of context will be irrelevant, while others will be relevant. Use relevant pieces of context to respond to the query. If you don't know the answer, just say that you don't know, don't try to make up an answer. Answer in less than 200 words. <</SYS>> [Context] "+ context + " [Query] " + query + "[/INST] [Reply] "
    return (prompt_template, titles, pages, chunks, distances)

def llama_prompt_conversation(user_question, conversation_json, dataset_name):
    similarity_text = ''
    for qna in conversation_json:
        similarity_text += qna['question']
    similarity_text += user_question
    context, titles, pages, chunks, distances = nearestDataChroma(similarity_text, dataset_name)
    query = re.sub(r'\"',r'"', user_question)
    prompt_template = "<s>[INST] <<SYS>> You are a helpful, respectful, and honest assistant. You will answer the given query denoted by '[Query]' using context, denoted by '[Context]'. The context will come from various sources. Certain pieces of context will be irrelevant, while others will be relevant. Use relevant pieces of context to respond to the query. If you don't know the answer, just say that you don't know, don't try to make up an answer. Answer in less than 200 words. <</SYS>>"
    for qna in conversation_json:
        prompt_template += qna['question'] + ' [/INST] ' + qna['answers'] + ' </s><s>[INST] '
    prompt_template += "[Context] " + context + "[Query] " + query + "[/INST] [Reply] "

    return (prompt_template, titles, pages, chunks, distances)

def biogpt_context(text):
    context, titles, pages, chunks, distances = nearestDataChroma(text)
    prompt_template = f'''question: {text} context: {context} answer:'''
    return (prompt_template, titles, pages, chunks, distances)

def biogpt_prompt_new_question(user_question, dataset_name):
    context, titles, pages, chunks, distances = nearestDataChroma(user_question, dataset_name)
    query = re.sub(r'\"',r'"', user_question)
    prompt_template = context + " Based on above information, answer this: " + query
    return (prompt_template, titles, pages, chunks, distances)

def biogpt_prompt_conversation(user_question, conversation_json, dataset_name):
    similarity_text = ''
    for qna in conversation_json:
        similarity_text += qna['question']
    similarity_text += user_question
    context, titles, pages, chunks, distances = nearestDataChroma(similarity_text, dataset_name)
    query = re.sub(r'\"',r'"', user_question)
    for qna in conversation_json:
        prompt_template = qna['question'] + qna['answers']
    prompt_template += context + " Based on above information, answer this: " + query

    return (prompt_template, titles, pages, chunks, distances)

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
        confidence_score = 1 - (mean_distance - best_distance) / (worst_distance - best_distance)
        # trim confidence score to 2 decimal places
        confidence_score = round(confidence_score, 2)
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

def get_answer_from_cnvrg(prompt):

    response = os.system("ping -c 1 llama-clean-5-1.cnvrg.stjude.org")
    if response != 0:
        return json.dumps({'error': 'not connected to cnvrg'})
    
    conn = http.client.HTTPSConnection('llama-clean-5-1.cnvrg.stjude.org', 443, context=ssl._create_unverified_context() )
    payload = '{"input_params": "' + prompt + '"}'

    headers = {
        'Cnvrg-Api-Key': 'qtSXpf9MPXkLfD57pVQ4wMPB',
        'Content-Type': 'text/html; charset=utf-8'
    }

    conn.request('POST', '/api/v1/endpoints/ya3fm5t89qr6nxhmstpk', payload.encode('utf-8'), headers)

    res = conn.getresponse()
    data = res.read()
    answer = data.decode("utf-8")
    
    return answer

def get_answer_from_google_colab(prompt):
    # print(os.system("ping -c 1 rnpmr-35-187-238-229.a.free.pinggy.online"))
    payload = '{"text": "' + prompt + '"}'
    conn = http.client.HTTPSConnection('rntun-34-142-140-56.a.free.pinggy.online', 443 )
    headers = {
        'Content-Type': 'text/html; charset=utf-8'
    }
    conn.request('POST', '/api/llamology/', payload.encode('utf-8'), headers)

    res = conn.getresponse()
    data = res.read()
    answer = data

    return answer

def get_answer_from_local_llama2(prompt):
    payload = '{"text": "' + prompt + '"}'
    local_ip = os.environ.get('LOCAL_IP_ADDRESS')
    conn = http.client.HTTPConnection(local_ip, 80)
    headers = {
        'Content-Type': 'text/html; charset=utf-8'
    }

    conn.request('POST', '/api/llama2/', payload.encode('utf-8'), headers)

    res = conn.getresponse()
    data = res.read()
    answer = data

    return answer

def get_answer_from_local_biogpt(prompt):
    payload = '{"text": "' + prompt + '"}'
    local_ip = os.environ.get('LOCAL_IP_ADDRESS')
    conn = http.client.HTTPConnection(local_ip, 80)
    headers = {
        'Content-Type': 'text/html; charset=utf-8'
    }

    conn.request('POST', '/api/biogpt/', payload.encode('utf-8'), headers)

    res = conn.getresponse()
    data = res.read()
    answer = data

    return answer

def get_answer_from_server(prompt):
    payload = '{"text": "' + prompt + '"}'
    conn = http.client.HTTPSConnection('mygpt-llm.bioinfo-apps.com', 443)
    headers = {
        'Content-Type': 'text/html; charset=utf-8'
        # 'charset': 'utf-8'
    }
    # print(payload)
    conn.request('POST', '/api/llama2/', payload, headers)

    res = conn.getresponse()
    data = res.read()
    answer = data

    return answer

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

def get_ollama_models():
    command = 'docker exec -i ollama ollama list > backend/data/ollama_models.txt'
    os.system(command)
    with open('backend/data/ollama_models.txt', 'r') as f:
        lines = f.readlines()
        models = []
        for line in lines:
            if 'ID' in line:
                continue
            model = {}
            model['name'] = line.split('\t')[0].split(' ')[0]
            model['size'] = line.split('\t')[2]
            models.append(model)
    # delete file
    os.remove('backend/data/ollama_models.txt')
    for model in models:
        if Model.objects.filter(model_name=model.get("name")).count() == 0:
            Model.objects.create(model_name=model.get("name"), model_size=model.get("size"))
    return

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

@api_view(['POST'])
def ask_biogpt_org(request):
    answer = ''
    current_date_time = make_aware(datetime.datetime.now())
    if request.method == 'POST':
        json_request = JSONParser().parse(request)
        question_text = json_request['text']
        dataset_name = json_request['dataset']
        dataset = Dataset.objects.get(dataset_name=dataset_name)
        if Question.objects.filter(question_text=question_text).exists():
            question = Question.objects.get(question_text=question_text)
        else:
            question = Question.objects.create(
                question_text=question_text,
                question_dataset=dataset,
                saved_date_time=current_date_time
            )
        answers = Answer.objects.filter(question=question, model_type='BioGPT-org')
        print(answers)
        if len(answers) > 0:
            sources = Source.objects.filter(answer=answers[0])
            source_json = []
            for source in sources:
                source_json.append({
                    'paper': source.source_paper,
                    'page': source.source_page,
                    'context': source.context,
                    'distance': source.distance
                })
            answer = { 
                'source':'BioGPT-original', 
                'response': answers[0].answer_text, 
                'sources': source_json
            }
        else:
            similary_data = biogpt_context(json_request['text'])
            for x in app_config.org_generator(
                similary_data[0],
                max_length=3000,
                num_return_sequences=1,
                do_sample=True
            ):
                answer_response = x['generated_text'].replace(similary_data[0], '')
                print('BioGPT-ft: ',answer_response, '\n')
                answer = { 
                    'source':'BioGPT-original', 
                    'response': answer_response, 
                    'paper': similary_data[1][0], 
                    'page': similary_data[2][0]
                }
            Answer.objects.create(
                answer_text=answer['response'], 
                model_type='BioGPT', 
                rating=0,
                source_paper=answer['paper'],
                source_page=answer['page'], 
                question=question,
                saved_date_time=current_date_time
            )
    
        print('BioGPT-org: ',answer, '\n')    
    return Response(answer, content_type="application/json")

@api_view(['POST'])
def ask_biogpt_ft(request):
    answer = ''
    if request.method == 'POST':
        json_request = JSONParser().parse(request)
        question_text = json_request['text']
        request_dataset_name = json_request['dataset']
        new_conversation = json_request['new_conversation']
        previous_question = json_request['previous_query']
        current_date_time = make_aware(datetime.datetime.now())
        dataset = Dataset.objects.get(dataset_name=request_dataset_name)
        dataset_name = dataset.dataset_name
        related_question = json_request['related_query']
        conversation_json = {}
        quesiton_exist = Question.objects.filter(question_text=question_text).exists()
        if quesiton_exist:
            question = Question.objects.get(question_text=question_text)
            conversation_id = question.conversation.id
            conversation = Conversation.objects.get(id=conversation_id)
            if(len(previous_question)):
                conversation_json = get_previous_qna_json(previous_question)
        else:
            if (new_conversation):
                conversation = Conversation.objects.create(
                    conversation_dataset=dataset,
                    start_date_time=current_date_time
                )
            else:
                conversation_id = Question.objects.get(question_text=previous_question).conversation.id
                conversation = Conversation.objects.get(id=conversation_id)
                # conversation_json = get_conversation_json(previous_question)
                conversation_json = get_previous_qna_json(previous_question)
            question = Question.objects.create(
                question_text=question_text,
                question_dataset=dataset,
                conversation=conversation,
                saved_date_time=current_date_time
            )
        answers = Answer.objects.filter(question=question, model_type='BioGPT-ft')
        if len(answers) > 0:
            sources = Source.objects.filter(answer=answers[0])
            source_json = []
            for source in sources:
                source_json.append({
                    'paper': source.source_paper,
                    'page': source.source_page,
                    'context': source.context,
                    'distance': source.distance
                })
            answer = { 
                    'source':'Biogpt-ft', 
                    'response': answers[0].answer_text, 
                    'sources': source_json,
                    'rating': answers[0].rating,
                    'user_comment': answers[0].user_comment
                }
            #group sources from same paper
            sources_grouped = []
            for source in source_json:
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

                original_pdf_path = 'backend/data/pdfs/'+ dataset_name +'/' + paper_name
                highlighted_pdf_path = 'backend/data/pdfs/' + dataset_name + '/' + paper_name.split('.')[0] + '_highlighted.pdf'

                highlight_pdf(
                    original_pdf_path, 
                    highlighted_pdf_path, 
                    source_grp
                )

                # create highlighted paper object
                paper = Papers.objects.filter(paper_title=source_grp[0]['paper'])[0]
                with open(highlighted_pdf_path, 'rb') as f:
                    paper.highlited_attachment.save(dataset_name + '/' + paper_name.split('.')[0] + '_highlighted.pdf', File(f), save=True)
        else:
            user_question = json_request['text']
            user_question_clean = unicodedata.normalize('NFKD', user_question).encode('ascii', 'ignore').decode('utf-8', 'ignore')
            # prompt, titles, pages, chunks, distances  = llama_prompt_new_question(user_question_clean, dataset_name)
            # if (new_conversation):
            #     prompt, titles, pages, chunks, distances  = llama_prompt_new_question(user_question_clean, dataset_name)
            # else:
            if (related_question):
                prompt, titles, pages, chunks, distances  = biogpt_prompt_conversation(user_question_clean, conversation_json, dataset_name)
            else:
                prompt, titles, pages, chunks, distances  = biogpt_prompt_new_question(user_question_clean, dataset_name) 
            sources = []
            for idx, title in enumerate(titles):
                sources.append({
                    'paper': title,
                    'page': pages[idx],
                    'context': chunks[idx],
                    'distance': round(distances[idx],3) #round to 3 decimals
                })

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

                original_pdf_path = 'backend/data/pdfs/'+ dataset_name + '/' + paper_name
                highlighted_pdf_path = 'backend/data/pdfs/' + dataset_name + '/' + paper_name.split('.')[0] + '_highlighted.pdf'

                highlight_pdf(
                    original_pdf_path, 
                    highlighted_pdf_path, 
                    source_grp
                )

                # create highlighted paper object
                paper = Papers.objects.filter(paper_title=source_grp[0]['paper'])[0]
                with open(highlighted_pdf_path, 'rb') as f:
                    paper.highlited_attachment.save(dataset_name + '/' + paper_name.split('.')[0] + '_highlighted.pdf', File(f), save=True)

            # following for running the code from local
            answer_response = get_answer_from_local_biogpt(prompt)
            print('BioGPT-ft: ',answer_response, '\n')
            if answer_response != '':
                answer_json = json.loads(answer_response)
                if 'response' not in answer_json:
                    answer = { 
                        'source':'BioGPT-ft', 
                        'response': 'error getting the answer',
                        'sources': sources
                    }
                else:
                    answer = { 
                        'source':'BioGPT-ft', 
                        'response': answer_json['response'],
                        'sources': sources
                    }
                    answerObj = Answer.objects.create(
                        answer_text=answer['response'], 
                        model_type='BioGPT-ft', 
                        rating=0,
                        question=question,
                        saved_date_time=current_date_time
                    )
                    conversation.question_answer_count += 1
                    conversation.save()

                    for idx, title in enumerate(titles):
                        Source.objects.create(
                            source_paper=title,
                            source_page=pages[idx],
                            context=chunks[idx].replace("\x00", "\uFFFD"),
                            distance=round(distances[idx],3),
                            answer=answerObj
                        )
    print('BioGPT-ft: ',answer, '\n')    
    return Response(answer, content_type="application/json")

@api_view(['POST'])
# example JSON: {"text":"What is function of IDR protein family?"}
# example json: {"text": "how many inactive conformational states ABL1 has?"}
def ask_llamology(request):
    answer = ''
    if request.method == 'POST':
        json_request = JSONParser().parse(request)
        question_text = json_request['text']
        request_dataset_name = json_request['dataset']
        new_conversation = json_request['new_conversation']
        previous_question = json_request['previous_query']
        current_date_time = make_aware(datetime.datetime.now())
        dataset = Dataset.objects.get(dataset_name=request_dataset_name)
        dataset_name = dataset.dataset_name
        related_question = json_request['related_query']
        conversation_json = {}
        quesiton_exist = Question.objects.filter(question_text=question_text).exists()
        if quesiton_exist:
            question = Question.objects.get(question_text=question_text)
            conversation_id = question.conversation.id
            conversation = Conversation.objects.get(id=conversation_id)
            if(len(previous_question)):
                conversation_json = get_previous_qna_json(previous_question)
        else:
            if (new_conversation):
                conversation = Conversation.objects.create(
                    conversation_dataset=dataset,
                    start_date_time=current_date_time
                )
            else:
                conversation_id = Question.objects.get(question_text=previous_question).conversation.id
                conversation = Conversation.objects.get(id=conversation_id)
                # conversation_json = get_conversation_json(previous_question)
                conversation_json = get_previous_qna_json(previous_question)
            question = Question.objects.create(
                question_text=question_text,
                question_dataset=dataset,
                conversation=conversation,
                saved_date_time=current_date_time
            )
        answers = Answer.objects.filter(question=question, model_type='Llama2')
        if len(answers) > 0:
            sources = Source.objects.filter(answer=answers[0])
            source_json = []
            for source in sources:
                source_json.append({
                    'paper': source.source_paper,
                    'page': source.source_page,
                    'context': source.context,
                    'distance': source.distance
                })
            answer = { 
                    'source':'Llama2', 
                    'response': answers[0].answer_text, 
                    'sources': source_json,
                    'rating': answers[0].rating,
                    'user_comment': answers[0].user_comment
                }
            #group sources from same paper
            sources_grouped = []
            for source in source_json:
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

                original_pdf_path = 'backend/data/pdfs/'+ dataset_name +'/' + paper_name
                highlighted_pdf_path = 'backend/data/pdfs/' + dataset_name + '/' + paper_name.split('.')[0] + '_highlighted.pdf'

                highlight_pdf(
                    original_pdf_path, 
                    highlighted_pdf_path, 
                    source_grp
                )

                # create highlighted paper object
                paper = Papers.objects.filter(paper_title=source_grp[0]['paper'])[0]
                with open(highlighted_pdf_path, 'rb') as f:
                    paper.highlited_attachment.save(dataset_name + '/' + paper_name.split('.')[0] + '_highlighted.pdf', File(f), save=True)
        else:
            user_question = json_request['text']
            user_question_clean = unicodedata.normalize('NFKD', user_question).encode('ascii', 'ignore').decode('utf-8', 'ignore')
            # prompt, titles, pages, chunks, distances  = llama_prompt_new_question(user_question_clean, dataset_name)
            # if (new_conversation):
            #     prompt, titles, pages, chunks, distances  = llama_prompt_new_question(user_question_clean, dataset_name)
            # else:
            if (related_question):
                prompt, titles, pages, chunks, distances  = llama_prompt_conversation(user_question_clean, conversation_json, dataset_name)
            else:
                prompt, titles, pages, chunks, distances  = llama_prompt_new_question(user_question_clean, dataset_name) 
            sources = []
            for idx, title in enumerate(titles):
                sources.append({
                    'paper': title,
                    'page': pages[idx],
                    'context': chunks[idx],
                    'distance': round(distances[idx],3) #round to 3 decimals
                })

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

                original_pdf_path = 'backend/data/pdfs/'+ dataset_name + '/' + paper_name
                highlighted_pdf_path = 'backend/data/pdfs/' + dataset_name + '/' + paper_name.split('.')[0] + '_highlighted.pdf'

                highlight_pdf(
                    original_pdf_path, 
                    highlighted_pdf_path, 
                    source_grp
                )

                # create highlighted paper object
                paper = Papers.objects.filter(paper_title=source_grp[0]['paper'])[0]
                with open(highlighted_pdf_path, 'rb') as f:
                    paper.highlited_attachment.save(dataset_name + '/' + paper_name.split('.')[0] + '_highlighted.pdf', File(f), save=True)

            # following 3 lines for running llama locally 
            # output = app_config.llamology(prompt, max_tokens=6024, echo=True)
            # print('Prompt: ', prompt)
            # answer_response = output['choices'][0]['text'].removeprefix(prompt)

            # following line for running llama on cnvrg
            """ answer_response = get_answer_from_cnvrg(prompt)
            print('Llama2: ',answer_response, '\n')
            if answer_response != '' and answer_response != 'not connected to cnvrg':
                answer_json = json.loads(answer_response)

            if answer_response != '' and 'prediction' in answer_json:
                answer = { 
                    'source':'Llama2', 
                    'response': answer_json['prediction'],
                    # 'response': answer_response,
                    'sources': sources
                }
                answerObj = Answer.objects.create(
                    answer_text=answer['response'], 
                    model_type='Llama2', 
                    rating=0,
                    question=question,
                    saved_date_time=current_date_time
                )
                for idx, title in enumerate(titles):
                    Source.objects.create(
                        source_paper=title,
                        source_page=pages[idx],
                        context=chunks[idx],
                        distance=round(distances[idx],3),
                        answer=answerObj
                    )
            elif answer_response != '' and 'error' in answer_json:
                answer = { 
                    'source':'MyGPT', 
                    'response': 'MyGPT is not connected to cnvrg at this time, please contact Jaimin to connect it.\nAlthough, your answer can be found in the following sources:',
                    'sources': sources
                }
            else:
                answer = { 
                    'source':'MyGPT', 
                    'response': 'Llama2 is sleeping at this time, please contact Jaimin to wake it up.\nAlthough, your answer can be found in the following sources:',
                    'sources': sources
                } """

            # follwing for running the code from google colab
            # answer_response = get_answer_from_google_colab(prompt)

            # following for running the code from local
            answer_response = get_answer_from_local_llama2(prompt)
            print('Llama2: ',answer_response, '\n')
            if answer_response != '':
                answer_json = json.loads(answer_response)
                if 'response' not in answer_json:
                    answer = { 
                        'source':'Llama2', 
                        'response': 'error getting the answer',
                        'sources': sources
                    }
                else:
                    answer = { 
                        'source':'Llama2', 
                        'response': answer_json['response'],
                        'sources': sources
                    }
                    answerObj = Answer.objects.create(
                        answer_text=answer['response'], 
                        model_type='Llama2', 
                        rating=0,
                        question=question,
                        saved_date_time=current_date_time
                    )
                    conversation.question_answer_count += 1
                    conversation.save()

                    for idx, title in enumerate(titles):
                        Source.objects.create(
                            source_paper=title,
                            source_page=pages[idx],
                            context=chunks[idx].replace("\x00", "\uFFFD"),
                            distance=round(distances[idx],3),
                            answer=answerObj
                        )
        print('Llama2: ',answer, '\n')
        
    return Response(answer, content_type="application/json")

# example json: {"text": "how many inactive conformational states ABL1 has?", "dataset": "ABL1"}
@api_view(['POST'])
def get_context(request):
    if request.method == 'POST':
        json_request = JSONParser().parse(request)
        question_text = json_request['text']
        model = json_request['model_type'] + ':latest'
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

            original_pdf_path = 'backend/data/pdfs/'+ dataset_name + '/' + paper_name
            highlighted_pdf_path = 'backend/data/pdfs/' + dataset_name + '/' + paper_name.split('.')[0] + '_highlighted.pdf'

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
        model = json_request['model_type'] + ':latest'
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
def add_ollama_model(request):
    if request.method == 'POST':
        ollama_model = JSONParser().parse(request)
        if Model.objects.filter(model_name=ollama_model['name']).count() == 0:
            Model.objects.create(
                model_name=ollama_model['name'],
                model_size=ollama_model['size']
            )
        return Response({'added':True}, content_type="application/json")