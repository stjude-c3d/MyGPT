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
from chromadb.utils import embedding_functions
from youtube_transcript_api import YouTubeTranscriptApi
from pytube import YouTube
import numpy as np
import pandas as pd
import duckdb
import datetime
import re
import os
import json
import pdfkit
import base64
import mammoth
from langchain_community.llms import Ollama
from .models import Papers, Videos, Dataset, chunks, Question, Answer, Source, Conversation, Model, FrontEndSettings
from .serializers import ModelSerializer, PapersSerializer, QuestionSerializer, AnswerSerializer, DatasetSerializer
from .forms import PapersForm

app_config = apps.get_app_config('testdb')
con = duckdb.connect()

def home(request):
    datasets = Dataset.objects.all()
    form = PapersForm()
    file_count = 15

    # if(datasets.count() == 0):
    #     add_demo_dataset()

    if(request.GET.get('reload_library')):
        if datasets.filter(dataset_name='GPCR').count() > 0:
            datasets.get(dataset_name='GPCR').delete()
        add_demo_dataset('all-MiniLM-L6-v2')
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

    # get_collections_data('all')
    # add_pca_to_chunks()
    # save_chunks_pca_to_file()

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

def extractPDFImages(path, title, data_list):
    pdf_file = fitz.open(path)
    for page_index in range(len(pdf_file)):
        page = pdf_file[page_index]
        image_list = page.get_images()
        for image_index, img in enumerate(image_list, start=1):
            xref = img[0]
            base_image = pdf_file.extract_image(xref)
            image_bytes = base_image["image"]
            image_b64 = base64.b64encode(image_bytes).decode("utf-8")
            # image_ext = base_image["ext"]
            prompt = 'Describe this image and make sure to include anything notable about it (include text you see in the image): '
            ollama = Ollama(base_url="http://localhost:11434", model="llava")
            response = ollama.invoke(prompt, images=[image_b64])
            print(response, end='', flush=True)
            data_list.append({'title': title, 'page': page_index, 'content': response, 'type': 'image'})

# Collects chunks of text from PDFs stored in a Zotero collection.
def get_zotero_chunks(library_id, library_id_type, collection_id, users_api_key, user='', user_email='', user_group=''):
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
            user = user if len(user) else '-',
            user_email = user_email if len(user_email) else '-',
            user_group = user_group if len(user_group) else '-',
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
    user = request.POST.get('user')
    user_email = request.POST.get('user_email')
    user_group = request.POST.get('user_group')

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
        attachment = paper_attachments[idx]
        
        if attachment.name.endswith('.xlsx'):

            print('working on excel')
            base_name = 'data/pdfs/'+ dataset_name + '/paper' + str(idx+1)

            with open(base_name + '.xlsx', 'wb') as f:
                f.write(attachment.read())
            print('Excel written to data file.')

            
            df = pd.read_excel(base_name + '.xlsx')
            fulltext = df.to_json(orient='records')
            fulltext = str(fulltext)
            df.to_html(base_name + '.html')
            options = {
                'page-size': 'A0',
                'margin-top': '0.75in',
                'margin-right': '0.75in',
                'margin-bottom': '0.75in',
                'margin-left': '0.75in'
            }
            pdfkit.from_file(base_name + '.html', base_name + '.pdf', options = options)
            content = ''
            fulltext_chunk = {'title': paper_titles[idx], 'page': 1, 'content': fulltext, 'type': 'spreadsheet_full'}
            data.append(fulltext_chunk)
            for i, row in df.iterrows():
                print(row)
                doc_info = row.to_string(header=True)
                doc_info = ','.join(doc_info.split('\n'))
                doc_info = ': '.join(re.split('\s+', doc_info))
                doc_info = ', '.join(doc_info.split(','))
                chunk = {'title': paper_titles[idx], 'page': i, 'content': doc_info, 'type': 'spreadsheet_chunk'}
                data.append(chunk)

            with open(base_name + '.pdf', 'rb') as f:
                paper.paper_attachment.save(dataset_name + '/paper' + str(idx+1) + '.pdf', File(f), save=True)
        else:

            base_name = 'data/pdfs/'+ dataset_name +'/paper' + str(idx+1)
            pdf_name = base_name + '.pdf'
            if attachment.name.endswith('.pdf'):
                with open(pdf_name, 'wb') as f:
                    f.write(attachment.read())
                with open(pdf_name, 'rb') as f:
                    paper.paper_attachment.save(dataset_name + '/paper' + str(idx+1) + '.pdf', File(f), save=True)
            elif attachment.name.endswith('.docx'):
                with open(base_name + '.docx', 'wb') as f:
                    f.write(attachment.read())
                with open(base_name + '.docx', 'rb') as f:
                    html_result = mammoth.convert_to_html(f)
                with open(base_name + '.html', 'w') as f:
                    f.write(html_result.value)
                pdfkit.from_file(base_name + '.html', base_name + '.pdf')
                with open(pdf_name, 'rb') as f:
                    paper.paper_attachment.save(dataset_name + '/paper' + str(idx+1) + '.pdf', File(f), save=True)
            elif attachment.name.endswith('.html'):
                with open(base_name + '.html', 'wb') as f:
                    f.write(attachment.read())
                pdfkit.from_file(base_name + '.html', base_name + '.pdf')
                with open(pdf_name, 'rb') as f:
                    paper.paper_attachment.save(dataset_name + '/paper' + str(idx+1) + '.pdf', File(f), save=True)
                    



            # extract text from pdfs
            content = getPDFContent(pdf_name)

            # extractPDFImages(pdf_name, paper_titles[idx], data)

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

            
    print('Documents chunked')
    with open('data/data_chunks/'+ dataset_name +'.txt', 'w') as f:
        for chunk in data:
            # convert chunk to string and write to file
            f.write(str(chunk) + '\n')
    print('Chunks saved')
    return dataset_name


def add_to_chroma(dataset_name, sentence_transformer = 'all-MiniLM-L6-v2'):
    documents_directory = '/code/data/data_chunks'
    # collection_name = 'pub_collection'
    # Read all files in the data directory
    documents = []
    metadatas = []
    files = [dataset_name + '.txt']

    # Instantiate a persistent chroma client in the persist_directory.
    # Learn more at docs.trychroma.com
    client = chromadb.PersistentClient(path='/code/chroma_storage/.')

    # use multi-qa-MiniLM-L6-cos-v1 embedding function
    if sentence_transformer != 'all-MiniLM-L6-v2':
        sentence_transformer_ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name=sentence_transformer)
    else:
        sentence_transformer_ef = embedding_functions.DefaultEmbeddingFunction()

    # If the collection already exists, we will delete it and create a new one.
    client.get_or_create_collection(name=dataset_name)
    client.delete_collection(name=dataset_name)
    collection = client.get_or_create_collection(name=dataset_name, embedding_function=sentence_transformer_ef)

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
                    metadatas.append({'filename': line_json['title'], 'page': line_json['page'], 'type': line_json['type']})
        ids = [str(i) for i in range(count, count + len(documents))]
        
        # add to vector database
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

        # add embeddings to database
        # add_embeddings_to_chunks(documents, metadatas, dataset)

        print(f'Added {new_count - count} documents')

def add_demo_dataset(sentence_transformer = 'all-MiniLM-L6-v2'):
    documents_directory = '/code/data'
    # collection_name = 'pub_collection'
    # Read all files in the data directory
    documents = []
    metadatas = []
    dataset_name = 'GPCR'
    titles = []
    client = chromadb.PersistentClient(path='/code/chroma_storage/.')

    # use multi-qa-MiniLM-L6-cos-v1 embedding function
    if sentence_transformer != 'all-MiniLM-L6-v2':
        sentence_transformer_ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name=sentence_transformer)
    else:
        sentence_transformer_ef = embedding_functions.DefaultEmbeddingFunction()

    # If the collection already exists, we will delete it and create a new one.
    if len(client.list_collections()):
        for collection in client.list_collections():
            if collection.name == dataset_name:
                client.delete_collection(name=dataset_name)
    collection = client.get_or_create_collection(name=dataset_name, embedding_function=sentence_transformer_ef)

    # Create ids from the current count
    count = collection.count()
    print(f'Collection already contains {count} documents')

    # Load the documents in batches of 100
    if count == 0:
        # collection_name = filename
        with open(f'{documents_directory}/data_chunks/GPCR.txt', 'r') as file:
            for line_number, line in enumerate(
                tqdm((file.readlines()), desc=f'Reading GPCR.txt'), 1
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
            try:
                collection.add(
                    ids=ids[i : i + 100],
                    documents=documents[i : i + 100],
                    metadatas=metadatas[i : i + 100],  # type: ignore
                )
            except:
                print('error adding documents')

        new_count = 0
        try:
            new_count = collection.count()
        except:
            print('error counting documents')
        
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

        # add embeddings to database
        # add_embeddings_to_chunks(documents, metadatas, dataset)

        # add pca to chunks
        add_pca_to_chunks()
           
        print(f'Added {new_count - count} documents')

# def add_embeddings_to_chunks(documents, metadatas, dataset):
#     for i in tqdm(
#         range(0, len(documents), 100), desc='Adding embeddings', unit_scale=100
#     ):
#         default_ef = embedding_functions.DefaultEmbeddingFunction()
#         for document in documents[i : i + 100]:
#             embedding = default_ef([document])
#             chunks.objects.create(
#                 chunk_text=document,
#                 embedding=embedding,
#                 chunk_dataset=dataset,
#                 chunk_paper=Papers.objects.filter(paper_title=metadatas[i]['filename'])[0],
#                 chunk_date_time=make_aware(datetime.datetime.now())
#             )

def add_embeddings_to_chunks(dataset):
    # get chunks by reading text file
    chunks_txt = []
    with open('data/data_chunks/'+ dataset +'.txt', 'r') as file:
        for line in file:
            chunk = eval(line)
            chunks_txt.append(chunk)

    # find papers or videos
    dataset_obj = Dataset.objects.get(dataset_name=dataset)
    library_type = ''
    papers = Papers.objects.filter(paper_dataset=dataset_obj)
    videos = Videos.objects.filter(video_dataset=dataset_obj)
    if papers.count() > 0:
        library_type = 'papers'
    elif videos.count() > 0:
        library_type = 'videos'
    
    for i in tqdm(
        range(0, len(chunks_txt), 100), desc='Adding embeddings', unit_scale=100
    ):
        default_ef = embedding_functions.DefaultEmbeddingFunction()
        for chunk in chunks_txt[i : i + 100]:
            embedding = default_ef([chunk['content']])
            chunk = chunks.objects.create(
                chunk_text=chunk['content'],
                embedding=embedding,
                chunk_dataset=dataset_obj,
                chunk_paper= Papers.objects.filter(paper_title=chunk['title'])[0] if library_type == 'papers' else None,
                chunk_video= Videos.objects.filter(video_title=chunk['title'])[0] if library_type == 'videos' else None,
                chunk_date_time=make_aware(datetime.datetime.now())
            )
    
    #  update dataset
    dataset = Dataset.objects.get(dataset_name=dataset)
    dataset.embedding_added = True
    dataset.save()

    return

def add_embeddings_to_qna(text, text_type = 'question', sentence_transformer = 'all-MiniLM-L6-v2'):
    # use multi-qa-MiniLM-L6-cos-v1 embedding function
    if sentence_transformer != 'all-MiniLM-L6-v2':
        sentence_transformer_ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name=sentence_transformer)
    else:
        sentence_transformer_ef = embedding_functions.DefaultEmbeddingFunction()

    # get embeddings
    embedding = sentence_transformer_ef([text])

    if text_type == 'question':
        question_obj = Question.objects.filter(question_text=text)
        if question_obj.count() > 0:
            question = question_obj[0]
            question.embedding = embedding
            question.save()
        else:
            question = Question.objects.create(
                question_text=text,
                embedding=embedding,
                saved_date_time=make_aware(datetime.datetime.now())
            )
    elif text_type == 'answer':
        answer_obj = Answer.objects.filter(answer_text=text)
        if answer_obj.count() > 0:
            answer = answer_obj[0]
            answer.embedding = embedding
            answer.save()
        else:
            answer = Answer.objects.create(
                answer_text=text,
                embedding=embedding,
                saved_date_time=make_aware(datetime.datetime.now())
            )

    return

def add_pca_to_chunks():
    chunks_objects = chunks.objects.all()
    embddings = []
    for chunk in chunks_objects:
        embddings.append(eval(chunk.embedding)[0])

    # perform pca on embeddings with numpy
    data = pd.DataFrame(embddings)
    data = data - data.mean()

     # calculate covariance matrix
    cov_matrix = data.cov()

    # calculate eigen values and eigen vectors
    eigen_values, eigen_vectors = np.linalg.eig(cov_matrix)

    # sort eigen values and eigen vectors
    idx = eigen_values.argsort()[::-1]
    eigen_values = eigen_values[idx]
    eigen_vectors = eigen_vectors[:,idx]

    # select top 3 eigen vectors
    pca = eigen_vectors[:, :3]

    # project data to 2D
    embeddings_pca = data.dot(pca)

    # write pca embeddings to file
    # remove imaginary part
    embeddings_pca_short = np.real(embeddings_pca)
    # convert to 2 decimal places
    embeddings_pca_short = np.round(embeddings_pca_short, 4)

    for idx, embedding in enumerate(embeddings_pca_short):
        chunk = chunks_objects[idx]
        chunk.pca_x = embedding[0]
        chunk.pca_y = embedding[1]
        chunk.pca_z = embedding[2]
        chunk.save()

def add_pca_to_qna_and_dataset(question_id):
    question = Question.objects.get(id=question_id)
    question_embedding = eval(question.embedding)[0]
    answer = Answer.objects.filter(question=question)[0]
    answer_embedding = eval(answer.embedding)[0]
    sources = Source.objects.filter(question=question)
    source_embeddings = []
    for source in sources:
        chunk = chunks.objects.get(id=source.chunk.id)
        source_embedding = eval(chunk.embedding)[0]
        source_embeddings.append(source_embedding)
    chunks_objects = chunks.objects.all()
    dataset_embddings = []
    for chunk in chunks_objects:
       dataset_embddings.append(eval(chunk.embedding)[0])
    
    embeddings = []
    embeddings.append(question_embedding)
    embeddings.append(answer_embedding)
    embeddings.extend(source_embeddings)
    embeddings.extend(dataset_embddings)

    # perform pca on embeddings with numpy
    data = pd.DataFrame(embeddings)
    data = data - data.mean()

    # calculate covariance matrix
    cov_matrix = data.cov()

    # calculate eigen values and eigen vectors
    eigen_values, eigen_vectors = np.linalg.eig(cov_matrix)

    # sort eigen values and eigen vectors
    idx = eigen_values.argsort()[::-1]
    eigen_values = eigen_values[idx]
    eigen_vectors = eigen_vectors[:,idx]

    # select top 3 eigen vectors
    pca = eigen_vectors[:, :3]

    # project data to 2D
    embeddings_pca = data.dot(pca)

    # write pca embeddings to file
    # remove imaginary part
    embeddings_pca_short = np.real(embeddings_pca)
    # convert to 2 decimal places
    embeddings_pca_short = np.round(embeddings_pca_short, 4)

    question.pca_x = embeddings_pca_short[0][0]
    question.pca_y = embeddings_pca_short[0][1]
    question.pca_z = embeddings_pca_short[0][2]
    question.save()

    answer.pca_x = embeddings_pca_short[1][0]
    answer.pca_y = embeddings_pca_short[1][1]
    answer.pca_z = embeddings_pca_short[1][2]
    answer.save()

    for idx, source in enumerate(sources):
        chunk = chunks.objects.get(id=source.chunk.id)
        chunk.pca_x = embeddings_pca_short[idx+2][0]
        chunk.pca_y = embeddings_pca_short[idx+2][1]
        chunk.pca_z = embeddings_pca_short[idx+2][2]
        chunk.save()

    for idx, chunk in enumerate(chunks_objects):
        chunk.pca_x = embeddings_pca_short[idx+2+len(sources)][0]
        chunk.pca_y = embeddings_pca_short[idx+2+len(sources)][1]
        chunk.pca_z = embeddings_pca_short[idx+2+len(sources)][2]
        chunk.save()

    return

def save_chunks_pca_to_file():
    chunks_objects = chunks.objects.all()
    with open('data/data_chunks/all_pca_2.txt', 'w') as file:
        for chunk in chunks_objects:
            # convert embedding into comma separated string
            embedding_str = ','.join([str(chunk.pca_x), str(chunk.pca_y), str(chunk.pca_z), chunk.chunk_dataset.dataset_name])
            file.write(embedding_str +  '\n')

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

def nearestDataChroma(text, dataset_name, sentence_transformer='all-MiniLM-L6-v2'):
    # collection_name = 'pub_collection'
    # client = chromadb.Client()
    # use multi-qa-MiniLM-L6-cos-v1 embedding function
    if sentence_transformer != 'all-MiniLM-L6-v2':
        sentence_transformer_ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name=sentence_transformer)
    else:
        sentence_transformer_ef = embedding_functions.DefaultEmbeddingFunction()

    # If the collection already exists, we just return it. This allows us to add more
    # data to an existing collection.
    client = chromadb.PersistentClient(path='/code/chroma_storage/.')
    collection = client.get_collection(name=dataset_name, embedding_function=sentence_transformer_ef)
    # collection = app_config.collection

    # Create ids from the current count
    count = collection.count()
    print(f'Collection contains {count} documents')

    results = collection.query(
        query_texts=[text],
        n_results=15,
        where={'type': {"$ne": "spreadsheet_full"}}
        # where={'metadata_field': 'is_equal_to_this'}, # optional filter
        # where_document={'$contains':'search_string'}  # optional filter
    )

        

    # print('results: ', results)
    print('distances: ', results['distances'][0])
    library_type = ''
    if "page" in results['metadatas'][0][0]:
        library_type = 'papers'
    elif "start" in results['metadatas'][0][0]:
        library_type = 'videos'
    #find highest score
    # lowest_distance = 10
    # cutoff_distance = statistics.median(results['distances'][0])
    cutoff_distance = find_cutoff_distance(results['distances'][0])
    #     cutoff_distance = 5
    print('cutoff_distance: ', cutoff_distance)
    titles, pages, starts, stops, chunks, distances = [], [], [], [], [], []
    context = ''

    # for i in range(len(results['ids'][0])):
    #     if results['distances'][0][i] < lowest_distance:
    #         lowest_distance = results['distances'][0][i]
    #         lowest_distance_index = i

    # if lowest distance is less than 0.6 use the chunk with lowest distance
    for i in range(len(results['ids'][0])):
        if (results['distances'][0][i] <= cutoff_distance):
            titles.append(results['metadatas'][0][i]['filename'])
            if (library_type == 'papers'): 
                pages.append(results['metadatas'][0][i]['page'])
            elif (library_type == 'videos'):
                starts.append(results['metadatas'][0][i]['start'])
                stops.append(results['metadatas'][0][i]['end'])
            chunks.append(results['documents'][0][i])
            distances.append(results['distances'][0][i])
            context += re.sub(r'\s+', ' ', results['documents'][0][i])
    if results['metadatas'][0][0]['type'] == 'spreadsheet_chunk':
        fulltext_results = collection.query(
            query_texts=[text],
            n_results=3,
            where={"type": "spreadsheet_full"}
        )
        fulltext = fulltext_results['documents'][0][0]
        text_json = json.loads(fulltext)
        sql_df = pd.DataFrame.from_records(text_json)
        sql_df.columns = [re.sub("[^\w\s]", "", col_name).replace(" ", "_").lower() for col_name in sql_df.columns.tolist()]
        instructions = f'Given a table with the following information, write a sql query that condenses the table to only include information useful to answering the provided query. The name of the table is sql_df. The names of the columns are as follows: {str(sql_df.columns.tolist())}. Do not include any explanation, please only include the SQL code in your answer. The SQL code should result in another smaller table of only useful entries.'
        prompt = f'SYSTEM: {instructions}; QUERY: {text}; ANSWER FORMAT: {{"code": sql_code}}; ANSWER: '
        ollama = Ollama(base_url="http://host.docker.internal:11434", model="llama3")
        response = ollama.invoke(prompt + '{')
        with open("generated_sql_query.txt", "w") as file:
            file.write(response)
        parsed_response = json.loads(response.replace('\n', ''))
        new_df = con.sql(parsed_response['code']).df()
        
        final_table = str(new_df.to_json(orient='records'))
        with open("final_table.txt", "w") as file:
            file.write(final_table)
        context = f"SQL query: {response}; SQL parsing results: {final_table}"
    with open("chroma_context.txt", "w") as file:
        file.write(context)

    
    # Return the collected information along with the full text of the best-matching document
    ret = None
    ret = (context, titles, pages, starts, stops, chunks, distances)
    return ret

# def get_chunks_by_keyword(question_text, dataset_name, sentence_transformer='all-MiniLM-L6-v2'):
#     if sentence_transformer != 'all-MiniLM-L6-v2':
#         sentence_transformer_ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name=sentence_transformer)
#     else:
#         sentence_transformer_ef = embedding_functions.DefaultEmbeddingFunction()
#     prompt = f'''
#     INSTRUCTIONS: Please extract keywords from the provided query and put them into a list.

#     QUERY: {question_text}

#     ANSWER FORMAT: ['keyword_1', 'keyword_2', 'keyword_3']

#     ANSWER:
#     '''
#     response = ollama.generate(model='llama3:7b', prompt=prompt)
#     keyword_list = ast.literal_eval(response['response'])

#     client = chromadb.PersistentClient(path='/code/chroma_storage/.')
#     collection = client.get_collection(name=dataset_name, embedding_function=sentence_transformer_ef)
#     docs = collection.get()

#     titles, pages, starts, stops, chunks = [], [], [], [], []
#     context = ''

#     library_type = ''
#     if "page" in docs['metadatas'][0][0]:
#         library_type = 'papers'
#     elif "start" in docs['metadatas'][0][0]:
#         library_type = 'videos'
    
#     for i in range(len(docs['ids'])):
#         for j in range(len(docs['ids'][i])):
#             if any(keyword in docs['documents'][i][j] for keyword in keyword_list):
#                 titles.append(docs['metadatas'][i][j]['filename'])
#                 if (library_type == 'papers'): 
#                     pages.append(docs['metadatas'][i][j]['page'])
#                 elif (library_type == 'videos'):
#                     starts.append(docs['metadatas'][i][j]['start'])
#                     stops.append(docs['metadatas'][i][j]['end'])
#                 chunks.append(docs['documents'][i][j])
#                 context += re.sub(r'\s+', ' ', docs['documents'][i][j])
    
#     # Return the collected information along with the full text of the best-matching document
#     ret = None
#     ret = (context, titles, pages, starts, stops, chunks)
#     return ret

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

def get_relevance_score(distances):
    best_distance = 0.4
    worst_distance = 1.5

    # calculate confidence score
    # if maximum distance is more than 1.5 then confidence score is 0
    if max(distances) > worst_distance:
        relevance_score = 0
    else:
        mean_distance = sum(distances) / len(distances)
        relevance_score = (1 - (mean_distance - best_distance) / (worst_distance - best_distance)) * 100
        # trim confidence score to 2 decimal places
        relevance_score = round(relevance_score, 0)
    return relevance_score

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

def add_video_to_chroma(dataset_name, sentence_transformer = 'all-MiniLM-L6-v2'):
    documents_directory = '/code/data/data_chunks'
    # collection_name = 'pub_collection'
    # Read all files in the data directory
    documents = []
    metadatas = []
    files = [dataset_name + '.txt']

    # Instantiate a persistent chroma client in the persist_directory.
    # Learn more at docs.trychroma.com
    client = chromadb.PersistentClient(path='/code/chroma_storage/.')

    # use multi-qa-MiniLM-L6-cos-v1 embedding function
    if sentence_transformer != 'all-MiniLM-L6-v2':
        sentence_transformer_ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name=sentence_transformer)
    else:
        sentence_transformer_ef = embedding_functions.DefaultEmbeddingFunction()

    # If the collection already exists, we will delete it and create a new one.
    client.get_or_create_collection(name=dataset_name)
    client.delete_collection(name=dataset_name)
    collection = client.get_or_create_collection(name=dataset_name, embedding_function=sentence_transformer_ef)

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
                    metadatas.append({'filename': line_json['title'], 'start': line_json['start'], 'end' : line_json['end'], 'type' : line_json['type']})
        ids = [str(i) for i in range(count, count + len(documents))]
        
        # add to vector database
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

        # add embeddings to database
        # add_embeddings_to_chunks(documents, metadatas, dataset)

        print(f'Added {new_count - count} documents')

        return

def get_youtube_transcript(dataset_name, video_ids, video_titles):
    transcipt_json_10 = []
    for i in range(len(video_ids)):
        video_id = video_ids[i]
        video_title = video_titles[i]
        transcript =  YouTubeTranscriptApi.get_transcript(video_id)
        
        #  convert trascript to json
        transcipt_json = []
        for i in transcript:
            text, start, duration = i.values()
            transcipt_json.append({"text": text, "duration": duration, "start": start})

        # join 10 transcipt into one 
        for i in range(0, len(transcipt_json), 10):
            text = ""
            start = transcipt_json[i]["start"]
            for j in range(i, i+10):
                if j < len(transcipt_json):
                    text += transcipt_json[j]["text"] + " "
                    end = transcipt_json[j]["start"] + transcipt_json[j]["duration"]
            transcipt_json_10.append({"title": video_title, "content": text, "start": start, "end": end})
    
    #  save transcript to csv file
    with open('data/data_chunks/'+ dataset_name +'.txt', 'w', newline='') as file:
        for chunk in transcipt_json_10:
            # convert chunk to string and write to file
            file.write(str(chunk) + '\n')
    print('video chunks saved to file')

    return

def seconds_to_hhmmss(seconds):
    m, s = divmod(seconds, 60)
    h, m = divmod(m, 60)
    return "%d:%02d:%02d" % (h, m, s)
        

####################
# API viewSets     #
####################

class ModelViewSet(viewsets.ModelViewSet):
    """
    API endpoint that shows list of models.
    """
    queryset = Model.objects.all()
    serializer_class = ModelSerializer

class QuestionsViewSet(viewsets.ModelViewSet):
    """
    API endpoint that shows all questions.
    """
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer

class AnswersViewSet(viewsets.ModelViewSet):
    """
    API endpoint that shows all answers.
    """
    queryset = Answer.objects.all()
    serializer_class = AnswerSerializer

class PapersViewSet(viewsets.ModelViewSet):
    """
    API endpoint that shows all papers.
    """
    queryset = Papers.objects.all()
    serializer_class = PapersSerializer

####################
# APIs             #
####################

@api_view(['POST'])
def get_datasets(request):
    if request.method == 'POST':
        json_request = JSONParser().parse(request)
        user_email = json_request['user_email']
        if user_email == '':
            datasets = Dataset.objects.filter(user_email='-')
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
        model_type = Model.objects.get(model_name=model)
        dataset_name = json_request['dataset']
        new_conversation = json_request['new_conversation']
        previous_question = json_request['previous_query']
        no_context = json_request['no_context']
        sentence_transformer = json_request['sentence_transformer']
        if no_context:    
            context, titles, pages, starts, stops, chunks_txt, distances = '', [], [], [], [], [], []
            sources = []
            relevance_score = 0
        else:
            context, titles, pages, starts, stops, chunks_txt, distances = nearestDataChroma(question_text, dataset_name, sentence_transformer)
            sources = []
            distances = [round(dist, 3) for dist in distances]
            relevance_score = get_relevance_score(distances)
        library_type = 'papers' if len(pages) else 'videos'
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
                relevance_score=relevance_score,
                model_type=model_type,
                question_dataset=dataset,
                conversation=conversation,
                saved_date_time=current_date_time
            )
        
        # add embeddings to question
        add_embeddings_to_qna(question_text, 'question', sentence_transformer)

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
        if library_type == 'papers':
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
        model = json_request['model_type']
        model_type = Model.objects.get(model_name=model)
        question = Question.objects.get(question_text=question_text, model_type=model_type)
        dataset_name = json_request['dataset']
        sentence_transformer = json_request['sentence_transformer']
        _, _, _, _, _, _, distances = nearestDataChroma(answer_text, dataset_name, sentence_transformer)
        distances = [round(dist, 3) for dist in distances]
        relevance_score = get_relevance_score(distances)
        Answer.objects.create(
            answer_text=answer_text,
            relevance_score=relevance_score, 
            model_type=model_type, 
            question=question
        )
        # add embeddings to answer
        add_embeddings_to_qna(answer_text, 'answer', sentence_transformer)
        return Response({'saved':True, 'relevance_score': relevance_score}, content_type="application/json")

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
        return Response({'deleted':True}, content_type="application/json")
    
@api_view(['POST'])
def add_zotero_dataset(request):
    if request.method == 'POST':
        json_request = JSONParser().parse(request)
        api_key = json_request['api_key']
        library_id = json_request['library_id']
        library_id_type = json_request['library_id_type']
        collection_id = json_request['collection_id']
        sentence_transformer = request.POST.get('sentence_transformer')
        user = request.POST.get('user')
        user_email = request.POST.get('user_email')
        user_group = request.POST.get('user_group')

        dataset_name = get_zotero_chunks(library_id, library_id_type, collection_id, api_key, user, user_email, user_group)
        # if dataset_name.error:
        #     return Response({'error':True, 'error_message': dataset_name.error}, content_type="application/json")
        add_to_chroma(dataset_name, sentence_transformer)
        datasets = Dataset.objects.all()
        dataset_names = []
        for dataset in datasets:
            dataset_names.append(dataset.dataset_name)
        return Response({'added':True, 'datasets': dataset_names}, content_type="application/json")
    
@api_view(['POST'])
def upload_documents(request):
    if request.method == 'POST':
        dataset_name = add_dataset_from_upload(request)
        sentence_transformer = request.POST.get('sentence_transformer')
        add_to_chroma(dataset_name, sentence_transformer)
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
    
@api_view(['GET'])
def get_frontend_settings(request):
    if request.method == 'GET':
        # check if settings exist
        if FrontEndSettings.objects.count() == 0:
            # create default settings
            FrontEndSettings.objects.create(
                show_no_context_switch=False,
                azure_login=False,
                saved_date_time=make_aware(datetime.datetime.now())
            )
        
        # get the latest settings
        frontend_settings = FrontEndSettings.objects.latest('saved_date_time')
        frontend_settings_obj = {
            'show_no_context_switch': frontend_settings.show_no_context_switch,
            'azure_login': frontend_settings.azure_login
        }
        return Response({'settings':frontend_settings_obj})
    
@api_view(['GET'])
def add_demo_dataset_api(request):
    if request.method == 'GET':
        datasets = Dataset.objects.all()
        sentence_transformer = request.GET.get('sentence_transformer')
        if datasets.count() > 0 and datasets.filter(dataset_name='GPCR').count() > 0:
            datasets.get(dataset_name='GPCR').delete()
        add_demo_dataset(sentence_transformer)
        return Response({'added':True}, content_type="application/json")
    
@api_view(['POST'])
def add_video_library(request):
    if request.method == 'POST':
        dataset_name = request.POST.get('dataset_name').replace(' ', '_')
        sentence_transformer = request.POST.get('sentence_transformer')
        video_urls = request.POST.get('video_urls').split(',')
        user = request.POST.get('user')
        user_email = request.POST.get('user_email')
        user_group = request.POST.get('user_group')
        video_titles = []
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
        add_video_to_chroma(dataset_name, sentence_transformer)

        return Response({'added':True}, content_type="application/json")
    
@api_view(['GET'])
def get_vector_embeddings(request):
    if request.method == 'GET':
        datasets = request.GET.get('datasets').split(',')
        question_id = request.GET.get('question_id')
        if question_id:
            question = Question.objects.get(id=question_id)
            if question.pca_x == 0 and question.pca_y == 0 and question.pca_z == 0:
                add_pca_to_qna_and_dataset(question_id)

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