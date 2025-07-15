from django.core.files.base import File
from django.apps import apps
from django.utils.timezone import make_aware
from pypdf import PdfReader
from pyzotero import zotero
from typing import cast
import fitz
import pymupdf
from tqdm import tqdm
import chromadb
from chromadb.utils import embedding_functions
from youtube_transcript_api import YouTubeTranscriptApi
import numpy as np
import pandas as pd
import duckdb
import datetime
import re
import os
import subprocess
import json
import pdfkit
import base64
from langchain_community.llms import Ollama
from langchain.text_splitter import RecursiveCharacterTextSplitter
from typing import Union, cast
from ..models import Papers, Videos, Dataset, chunks, Question, Answer, Source, Conversation, EmbeddingModel, PaperSections
import requests
import xml.etree.ElementTree as ET

# imports for embedding functions
from typing import cast
import httpx
from chromadb.api.types import Documents, EmbeddingFunction, Embeddings

#libraries to import for keyword search
import bm25s
import Stemmer
from pathlib import Path

app_config = apps.get_app_config('testdb')
con = duckdb.connect()

####################
# Helper functions #
####################

# Extracts content from a given PDF file and returns it along with the number of pages.
def getPDFContent(path):
    reader = PdfReader(path)
    return reader.pages

def convert_to_pdf(input_file, output_dir):
    
    # Construct the command to convert PPTX to PDF
    command = [
        "soffice",
        "--headless",
        "--convert-to", "pdf",
        "--outdir", output_dir,
        input_file
    ]
    
    # Run the command
    subprocess.run(command, check=True)

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
    types = ['journalArticle', 'preprint', 'blogPost', 'webpage']
    # library_type =  'group'
    api_key = users_api_key
    if not api_key:
        api_key = os.environ.get('ZOTERO_API_KEY')

    # Initialize the Zotero API client
    zot = zotero.Zotero(library_id, library_id_type, api_key)
    # Get the 'Llama' collection id
    dataset_name = zot.all_collections(collection_id)[0]['data']['name'].replace(' ', '_')
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
    items = zot.everything(zot.collection_items(collection_id))
    articles_temp = [x for x in items if x['data']['itemType'] in types]
    # filter articles with attachments
    articles = []
    for article in articles_temp:
        if 'links' in article:
            if 'attachment' in article['links']:
                if article['links']['attachment']['attachmentType'] == 'application/pdf' and article['links']['attachment']['attachmentSize'] > 0:
                    articles.append(article)

    all_titles = [x['data']['title'] for x in articles]
    titles = []
    # abstracts = [x['data']['abstractNote'] for x in pdfs]
    attachments = [zot.children(x['data']['key']) for x in articles]
    pdf_attachments = []
    for attachment_list, title in zip(attachments, all_titles):
        for attachment in attachment_list:
            if attachment['data']['itemType'] == 'attachment' and attachment['data']['contentType'] == 'application/pdf':
                pdf_attachments.append(attachment)
                titles.append(title)

    print('zotero files loaded')

    data = []
    # make directory for pdfs
    if not os.path.exists('data/pdfs/'+ dataset_name):
        os.makedirs('data/pdfs/'+ dataset_name)
    
    # Loop through PDF attachments, extract content, and store it in 'data' list
    for idx, title, attachment in zip( range(1, len(titles)+1), titles, pdf_attachments):
        dataset_name = sanitize_filename(dataset_name)
        with open('data/pdfs/'+ dataset_name +'/paper' + str(idx) + '.pdf', 'wb') as f:
            write_success = False
            try:
                f.write(zot.file(attachment['data']['key']))
                write_success = True
            except:
                print('error writing pdf')
            # f.write(zot.file(attachment['data']['key']))
            if write_success:
                pages = getPDFContent('data/pdfs/'+ dataset_name +'/paper' + str(idx) + '.pdf')
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

                for page_num, page in enumerate(pages):
                    text = page.extract_text()
                    text = text.replace('-\n', '-').replace('\n', ' ')
                    text = ' '.join(text.split())
                    n = 1000
                    splits = []
                    remainder = ''
                    for i in range(0, len(text), n):
                        item = remainder + text[i : i + n]
                        if '. ' in item:
                            remainder = item[item.rindex('. ') + 2: ]
                            item = item.removesuffix(remainder)
                        if '(' in item and ')' not in item:
                            remainder = item[item.rindex('(') + 1: ]
                            item = item.removesuffix(remainder)
                        elif '(' in item and ')' in item and item.rindex('(') > item.rindex(')'):
                            remainder = item[item.rindex('(') + 1: ]
                            item = item.removesuffix(remainder)

                        if len(item) > 10:
                            splits.append(item)
                    for split in splits:
                        chunk = {'title': title, 'page': page_num+1, 'content': split, 'type': 'pagechunk'}
                        data.append(chunk)
    print('zotero chunks loaded')        

    dataset_name = sanitize_filename(dataset_name)
    with open('data/data_chunks/'+ dataset_name +'.txt', 'w') as f:
        for chunk in data:
            # convert chunk to string and write to file
            f.write(str(chunk) + '\n')
    print('zotero chunks saved to file')
    return dataset_name

def add_dataset_from_upload(request):
    dataset_name_r = request.POST.get('dataset_name').replace(' ', '_')
    paper_titles_r = request.POST.getlist('paper_title')
    paper_attachments = request.FILES.getlist('paper_attachment')
    user_r = request.POST.get('user')
    user_email_r = request.POST.get('user_email')
    user_group_r = request.POST.get('user_group')
    use_overlap = request.POST.get('use_overlap')
    chunking_method = request.POST.get('chunking_method')
    chunk_size = request.POST.get('chunk_size')
    distance_function_r = request.POST.get('distance_function')

    # Validate all inputs for code injection
    if not dataset_name_r or not re.match(r'^[a-zA-Z0-9_\-\s\w]+$', dataset_name_r):
        return False
    else:
        dataset_name = dataset_name_r

    # if not paper_titles_r or not all([re.match(r'^[a-zA-Z0-9_\-\w\s]+$', title) for title in paper_titles_r]):
    #     return False
    # else:
    paper_titles = paper_titles_r

    # Validate user input
    if not user_r or not re.match(r'^[a-zA-Z0-9_\-]+$', user_r):
        return False
    else:
        user = user_r

    # Validate user_email input
    if not user_email_r or not re.match(r'^[a-zA-Z0-9_\-@.]+$', user_email_r):
        return False
    else:
        user_email = user_email_r

    # Validate user_group input
    if not user_group_r or not re.match(r'^[a-zA-Z0-9_\-]+$', user_group_r):
        return False
    else:
        user_group = user_group_r 

    # Validate distance_function input
    if not distance_function_r or not re.match(r'^[a-zA-Z0-9_\-]+$', distance_function_r):
        return False
    else:
        distance_function = distance_function_r

    use_overlap = True if use_overlap == 'Yes' else False
    chunk_size = int(chunk_size)

    print(f'Sentence Transformer: {request.POST.get("embedding_model")}')
    print(f'Chunk Size: {chunk_size}')
    print(f'Use Overlap: {use_overlap}')
    overlap_size = int(0.2 * chunk_size) if use_overlap else 0
    print(f'Overlap Size: {overlap_size}')

    # create dataset
    dataset = Dataset.objects.filter(dataset_name=dataset_name)
    if dataset.count() > 0:
        dataset = dataset[0]
    else:
        dataset = Dataset.objects.create(
            dataset_name=dataset_name,
            dataset_size=0,
            chunksize=chunk_size,
            chunking_method=chunking_method,
            overlap=use_overlap,
            distance_function=distance_function,
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
    for idx in range(len(paper_titles)):
        if paper_titles[idx] == '' or paper_titles[idx] == '-':
            continue
        paper = Papers.objects.create(
            paper_title=paper_titles[idx],
            paper_dataset=dataset,
            paper_date_time=make_aware(datetime.datetime.now())
        )
        attachment = paper_attachments[idx]
        # check for path traversal
        if '/' in attachment.name:
            return False

        if not os.path.exists('data/pdfs/'+ dataset_name):
            return False
        doctype = '.' + attachment.name.split('.')[-1]
        base_name = 'data/pdfs/'+ dataset_name + '/paper' + str(idx+1)

        # Ensure the file extension is valid
        allowed_extensions = ['.pdf', '.doc', '.docx', '.txt', '.xlsx', '.xls', '.csv']  # Add other allowed extensions as needed
        if doctype not in allowed_extensions:
            raise ValueError("Invalid file extension")

        if doctype in ['.xlsx', '.xls', '.csv']:
            # sanitize base_name and doctype
            base_name = sanitize_filename(base_name)
            doctype = sanitize_filename(doctype)

            with open(base_name + doctype, 'wb') as f:
                f.write(attachment.read())

            if doctype in ['.xlsx', '.xls']:
                df = pd.read_excel(base_name + doctype)
            elif doctype == '.csv':
                df = pd.read_csv(base_name + doctype)
            df.dropna(axis = 0, how = 'all', inplace = True)

            df.to_html(base_name + '.html')
            options = {
                'page-size': 'A0',
                'margin-top': '0.75in',
                'margin-right': '0.75in',
                'margin-bottom': '0.75in',
                'margin-left': '0.75in'
            }
            pdfkit.from_file(base_name + '.html', base_name + '.pdf', options = options)

            with open(base_name + '.pdf', 'rb') as f:
                paper.paper_attachment.save(dataset_name + '/paper' + str(idx+1) + '.pdf', File(f), save=True)

            fulltext = str(df.to_json(orient='records'))
            fulltext_chunk = {'title': paper_titles[idx], 'page': 1, 'content': fulltext, 'type': 'spreadsheet_full'}
            data.append(fulltext_chunk)

            for i, row in df.iterrows():

                doc_info = row.to_string(header=True)

                doc_info = ','.join(doc_info.split('\n'))
                doc_info = ': '.join(re.split('\s+', doc_info))
                doc_info = ', '.join(doc_info.split(','))

                chunk = {'title': paper_titles[idx], 'page': i, 'content': doc_info, 'type': 'spreadsheet_chunk'}
                data.append(chunk)
            
        else:
            # sanitize base_name and doctype
            base_name = sanitize_filename(base_name)
            doctype = sanitize_filename(doctype)

            pdf_name = base_name + '.pdf'
            with open(base_name + doctype, 'wb') as f:
                f.write(attachment.read())
            
            if doctype != '.pdf':
                convert_to_pdf(base_name + doctype, base_name.removesuffix(f'/paper{str(idx+1)}'))
            
            with open(pdf_name, 'rb') as f:
                paper.paper_attachment.save(dataset_name + '/paper' + str(idx+1) + '.pdf', File(f), save=True)

            if chunking_method == 'fixed_chunk_size':        
                pages = getPDFContent(pdf_name)

                for page_num, page in enumerate(pages):
                    text = page.extract_text()
                    n = chunk_size
                    splits = []
                    remainder = ''
                    for i in range(0, len(text), n - overlap_size):
                        item = remainder + text[i : i + n]
                        item = ' '.join(item.split())
                        if '. ' in item and not use_overlap:
                            remainder = item.split('. ')[-1]
                            item = item.removesuffix(remainder)
                        if len(item) > 10:
                            splits.append(item)
                    for split in splits:
                        chunk = {'title': paper_titles[idx], 'page': page_num+1, 'content': split, 'type': 'pagechunk'}
                        data.append(chunk)
            elif chunking_method == 'structure_preserving':
                doc = pymupdf.Document(pdf_name)
                # get table of contents
                toc = doc.get_toc(simple=True)
                # if toc is empty, use grobid to get the table of contents
                if len(toc) == 0:
                    toc = get_toc_from_grobid(pdf_name)
                final_section_titles = []
                section_title = ''
                previous_section_title = ''

                #  filter toc till levels 2 only
                toc_filter = [item for item in toc if item[0] <= 2]

                for page in doc:
                    splitter = RecursiveCharacterTextSplitter(
                        chunk_size=chunk_size,
                        chunk_overlap=int(0.2 * chunk_size) if use_overlap else 0,
                        separators=["\n\n", "\n", ".", " "],
                        length_function=len
                    )
                    # get text from page
                    page_text = page.get_text("text")
                    raw_chunks = splitter.create_documents([page_text])

                    chunks = []
                    for i, chunk in enumerate(raw_chunks):
                        chunks.append({
                            "chunk_id": i,
                            "text": chunk.page_content.strip(),
                            "metadata": {
                                "source_pdf": pdf_name
                            }
                        })

                    page_sections = []
                    for toc_item in toc_filter:
                        if toc_item[2] == page.number + 1:
                            section_title = toc_item[1].strip().replace('\r', '')
                            page_sections.append(section_title)
                    
                    if len(page_sections) == 0 and previous_section_title == '':
                        previous_section_title = 'Abstract/Introduction'
                    elif len(page_sections) != 0:
                        previous_section_title = page_sections[len(page_sections) - 1]
                    
                    for chunk in chunks:
                        chunk_text = chunk['text'].strip()
                        for section in page_sections:
                            if section in chunk_text:
                                section_title = section
                                break
                        if section_title == '' and previous_section_title != '':
                            section_title = previous_section_title
                        elif section_title == '' and len(page_sections) != 0:
                            section_title = 'Abstract/Introduction'
                    
                        if len(chunk_text) > 10:
                            if section in chunk_text:
                                chunks = chunk_text.split(section)
                                # find previous entry before section in page_sections otherwise use previous_section_title
                                section_index = page_sections.index(section) if section in page_sections else -1 
                                if section_index > 0:
                                    previous_section_title = page_sections[section_index - 1]
                                elif section_index == 0 and previous_section_title != '':
                                    previous_section_title = previous_section_title
                                else:
                                    previous_section_title = 'Abstract/Introduction'
                                if len(chunks[0]) > 10:
                                    chunk_1 = {'title': paper_titles[idx], 'page': page.number + 1, 'content': chunks[0].strip(), 'section': previous_section_title, 'type': 'pagechunk'}
                                    data.append(chunk_1)
                                if len(chunks[1]) > 10:
                                    chunks_2 = {'title': paper_titles[idx], 'page': page.number + 1, 'content': chunks[1].strip(), 'section': section_title, 'type': 'pagechunk'}
                                    data.append(chunks_2)
                            else:
                                chunk = {'title': paper_titles[idx], 'page': page.number + 1, 'content': chunk_text, 'section': section_title, 'type': 'pagechunk'}
                                data.append(chunk)
                            if section_title not in final_section_titles:
                                final_section_titles.append(section_title)     

                # save sections to database
                for section_title in set(final_section_titles):
                    count = 1
                    section_obj = PaperSections.objects.filter(section_title=section_title, section_dataset=dataset)
                    if section_obj.count() > 0:
                        count = section_obj[0].section_count
                        section_obj = section_obj[0]
                        section_obj.section_count += count
                        section_obj.save()
                    else:
                        PaperSections.objects.create(
                            section_title=section_title,
                            section_count=count,
                            section_dataset=dataset
                        )                         

    with open('data/data_chunks/'+ dataset_name +'.txt', 'w') as f:
        for chunk in data:
            f.write(str(chunk) + '\n')

    return dataset_name


def add_to_chroma(dataset_name, embedding_model_request = 'all-MiniLM-L6-v2', distance_function = 'l2', chunking_method = 'fixed_chunk_size'):
    documents_directory = '/code/data/data_chunks'
    # collection_name = 'pub_collection'
    # Read all files in the data directory
    documents = []
    metadatas = []
    files = [dataset_name + '.txt']

    # Instantiate a persistent chroma client in the persist_directory.
    # Learn more at docs.trychroma.com
    client = chromadb.PersistentClient(path='/code/chroma_storage/.')

    embedding_model_ef = get_embedding_model_ef(embedding_model_request)
    embedding_model = EmbeddingModel.objects.filter(model_name=embedding_model_request)[0].model_name
        
    # If the collection already exists, we will delete it and create a new one.
    client.get_or_create_collection(name=dataset_name)
    client.delete_collection(name=dataset_name)
    if (distance_function == 'cosine'):
        collection = client.get_or_create_collection(name=dataset_name, embedding_function=embedding_model_ef, metadata={"hnsw:space": "cosine"})
    elif (distance_function == 'ip'):
        collection = client.get_or_create_collection(name=dataset_name, embedding_function=embedding_model_ef, metadata={"hnsw:space": "ip"})
    else:
        collection = client.get_or_create_collection(name=dataset_name, embedding_function=embedding_model_ef)

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
                    if chunking_method == 'structure_preserving':
                        metadatas.append({'filename': line_json['title'], 'page': line_json['page'], 'section': line_json['section'], 'type': line_json['type']})
                    else:
                        metadatas.append({'filename': line_json['title'], 'page': line_json['page'], 'type': line_json['type']})
        ids = [str(i) for i in range(count, count + len(documents))]
        
        # add to vector database
        for i in tqdm(
            range(0, len(documents), 100), desc='Adding documents', unit_scale=100
        ):
            # try:
            collection.add(
                ids=ids[i : i + 100],
                documents=documents[i : i + 100],
                metadatas=metadatas[i : i + 100],  # type: ignore
            )
            # except:
            #     Dataset.objects.get(dataset_name=dataset_name).delete()
            #     print('error adding documents')
            #     return False

        new_count = collection.count()
        dataset = Dataset.objects.get(dataset_name=dataset_name)
        dataset.dataset_size = new_count
        dataset.embedding_model = embedding_model
        dataset.save()

        print(f'Added {new_count - count} documents')
        # return True
            

        # add embeddings to database
        # add_embeddings_to_chunks(dataset_name)

        # add pca to chunks
        # add_pca_to_chunks()

        return True

def add_demo_dataset(embedding_model_request = 'multi-qa-MiniLM-L6-cos-v1'):
    documents_directory = '/code/data'
    # collection_name = 'pub_collection'
    # Read all files in the data directory
    documents = []
    metadatas = []
    dataset_name = 'GPCR'
    titles = []
    client = chromadb.PersistentClient(path='/code/chroma_storage/.')

    embedding_model_ef = get_embedding_model_ef(embedding_model_request)

    # If the collection already exists, we will delete it and create a new one.
    if len(client.list_collections()):
        for collection in client.list_collections():
            if collection.name == dataset_name:
                client.delete_collection(name=dataset_name)
    collection = client.get_or_create_collection(name=dataset_name, embedding_function=embedding_model_ef)
    # collection = client.get_or_create_collection(name=dataset_name, embedding_function=embedding_model_ef, metadata={"hnsw:space": "ip"})

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
    with open('data/data_chunks/'+ str(dataset) +'.txt', 'r') as file:
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
        # default_ef = embedding_functions.DefaultEmbeddingFunction()
        default_ef = OllamaEmbeddingFunction(url=os.environ.get('OLLAMA_SERVER') + "/api/embeddings", model_name='nomic-embed-text')
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

def add_embeddings_to_qna(text, text_type = 'question', embedding_model_request = 'multi-qa-MiniLM-L6-cos-v1'):
    embedding_model_ef = get_embedding_model_ef(embedding_model_request)

    # get embeddings
    embedding = embedding_model_ef([text])

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

def nearestDataChroma(text, dataset_name, document_title_str = '', focused_section_str = '', keywords_str = '', embedding_model_request='multi-qa-MiniLM-L6-cos-v1', maximum_chunks_count=15, no_cutoff=False):
    # collection_name = 'pub_collection'
    # client = chromadb.Client()
        # query embedding model from database
    embedding_model_ef = get_embedding_model_ef(embedding_model_request)

    # If the collection already exists, we just return it. This allows us to add more
    # data to an existing collection.
    client = chromadb.PersistentClient(path='/code/chroma_storage/.')
    collection = client.get_collection(name=dataset_name, embedding_function=embedding_model_ef)
    # collection = app_config.collection

    # Create ids from the current count
    count = collection.count()
    print(f'Collection contains {count} documents')

    keywords = keywords_str.split(';') if keywords_str != '' else []
    document_title = document_title_str if document_title_str != '' else 'all'
    focused_section = focused_section_str if focused_section_str != '' else 'all'
    # remove keywords if it's '-'
    if '-' in keywords:
        keywords.remove('-')

    #  collect the results based on the keywords
    keyword_results = []
    if len(keywords) > 0:
        if ';' in keywords:
            keywords_filter = {'$and': [{'$contains': keyword} for keyword in keywords]}
            keyword_results = collection.query(
                query_texts=[text],
                n_results=2,
                where={'type': {"$ne": "spreadsheet_full"}},
                # where={'metadata_field': 'is_equal_to_this'}, # optional filter
                where_document={keywords_filter}
            )
        else:
            keyword_results = collection.query(
                query_texts=[text],
                n_results=2,
                where={'type': {"$ne": "spreadsheet_full"}},
                # where={'metadata_field': 'is_equal_to_this'}, # optional filter
                where_document={'$contains': keywords[0]}
            )

    if document_title == 'all' and focused_section == 'all':
        results = collection.query(
            query_texts=[text],
            n_results=maximum_chunks_count,
            where={'type': {"$ne": "spreadsheet_full"}}
            # where={'metadata_field': 'is_equal_to_this'}, # optional filter
            # where_document={'$contains':'search_string'}  # optional filter
        )
    elif document_title != 'all' and focused_section == 'all':
        results = collection.query(
            query_texts=[text],
            n_results=maximum_chunks_count,
            where={'$and':[
                {'type': {"$ne": "spreadsheet_full"}},
                {'filename': {'$eq': document_title}}
            ]}
        )
    elif document_title == 'all' and focused_section != 'all':
        results = collection.query(
            query_texts=[text],
            n_results=maximum_chunks_count,
            where={'$and':[
                {'type': {"$ne": "spreadsheet_full"}},
                {'section': {'$eq': focused_section}}
            ]}
        )
    elif document_title != 'all' and focused_section != 'all':
        results = collection.query(
            query_texts=[text],
            n_results=maximum_chunks_count,
            where={'$and':[
                {'type': {"$ne": "spreadsheet_full"}},
                {'filename': {'$eq': document_title}},
                {'section': {'$eq': focused_section}}
            ]}
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
    if no_cutoff:
        cutoff_distance = results['distances'][0][len(results['distances'][0])-1]
    else:
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
    if len(keywords) > 0:
        for i in range(len(keyword_results['ids'][0])):
            if (keyword_results['distances'][0][i] <= 1.5):
                # check if chunk arrauy already contains the chunk
                if keyword_results['documents'][0][i] not in chunks:
                    titles.append(keyword_results['metadatas'][0][i]['filename'])
                    if (library_type == 'papers'): 
                        pages.append(keyword_results['metadatas'][0][i]['page'])
                    elif (library_type == 'videos'):
                        starts.append(keyword_results['metadatas'][0][i]['start'])
                        stops.append(keyword_results['metadatas'][0][i]['end'])
                    chunks.append(keyword_results['documents'][0][i])
                    distances.append(keyword_results['distances'][0][i])
                    context += re.sub(r'\s+', ' ', keyword_results['documents'][0][i])
    if results['metadatas'][0][0]['type'] == 'spreadsheet_chunk':
        fulltext_results = collection.query(
            query_texts=[text],
            n_results=3,
            where={"type": "spreadsheet_full"}
        )
        fulltext = fulltext_results['documents'][0][0]
        text_json = json.loads(fulltext)
        sql_df = pd.DataFrame.from_records(text_json)
        sql_df.columns = [re.sub("[^\w\s]", "", col_name).replace(" ", "_").lower().replace("unnamed_", "position_") for col_name in sql_df.columns.tolist()]
        final_cols = [x for x in sql_df.columns.tolist() if not x.removeprefix("position_").isnumeric()]
        numbered_cols = [x for x in sql_df.columns.tolist() if x.removeprefix("position_").isnumeric()]
        numbered_col_mention = ""
        if len(numbered_cols) > 0:
            numbered_col_mention = f", and numbered columns ranging from {numbered_cols[0]} to {numbered_cols[-1]}"
        instructions = f'Given a table with the following information, write a sql query that condenses the table to only include information useful to answering the provided query. The name of the table is sql_df. The names of the columns are as follows: {str(final_cols)}{numbered_col_mention}. Do not include any explanation, please only include the SQL code in your answer. The SQL code should result in another smaller table of only useful entries.'
        prompt = f'SYSTEM: {instructions}; QUERY: {text}; ANSWER FORMAT: {{"code": sql_code}}; ANSWER: '
        with open("sql_prompt.txt", "w") as file:
            file.write(prompt)
        ollama = Ollama(base_url="http://host.docker.internal:11434", model="llama3")
        response = ollama.invoke(prompt + '{')
        with open("generated_sql_query.txt", "w") as file:
            file.write(response)
        parsed_response = json.loads(response.replace('\n', ' '))
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

def get_answer_distance_by_context(text, dataset_name, contexts = [''], embedding_model_request='multi-qa-MiniLM-L6-cos-v1'):
    embedding_model_ef = get_embedding_model_ef(embedding_model_request)
    client = chromadb.PersistentClient(path='/code/chroma_storage/.')
    collection = client.get_collection(name=dataset_name, embedding_function=embedding_model_ef)

    context_count = len(contexts)
    documents_filter_wrapper = { "$or": [] }
    for i in range(context_count):
        documents_filter_wrapper["$or"].append({ "$contains": contexts[i] })

    results = collection.query(
        query_texts=[text],
        n_results=context_count,
        where={'type': {"$ne": "spreadsheet_full"}},
        where_document=documents_filter_wrapper
    )

    distances = results['distances'][0]
    return distances

def get_answer_distance_by_context_bm25(text, contexts = ['']):

    tokenizer_directory = Path('/code/data/bm25_tokenizer') / 'answers'
    tokenizer_directory.mkdir(parents=True, exist_ok=True)

    # default tokenizer
    stemmer = Stemmer.Stemmer("english")
    tokenizer = bm25s.tokenization.Tokenizer(stemmer=stemmer)
    corpus_tokenized = tokenizer.tokenize(contexts, return_as='tuple')

    retriever = bm25s.BM25(corpus=contexts)
    retriever.index(corpus_tokenized)
    retriever.save(tokenizer_directory)
    tokenizer.save_vocab(tokenizer_directory)
    tokenizer.save_stopwords(tokenizer_directory)

     # Tokenize the queries
    queriesTokenized = bm25s.tokenize([text], stemmer=stemmer)

    retriever_loaded = bm25s.BM25.load(f"/code/data/bm25_tokenizer/answers", mmap=True, load_corpus=True)

    # Get the top 10 results
    results, scores = retriever_loaded.retrieve(queriesTokenized, k=len(contexts), return_as="tuple")

    # returns ids of the chunks as a list
    return results[0], scores[0]

# def get_chunks_by_keyword(question_text, dataset_name, embedding_model='multi-qa-MiniLM-L6-cos-v1'):
#     if embedding_model != 'all-MiniLM-L6-v2':
#         embedding_model_ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name=embedding_model)
#     else:
#         embedding_model_ef = embedding_functions.DefaultEmbeddingFunction()
#     prompt = f'''
#     INSTRUCTIONS: Please extract keywords from the provided query and put them into a list.

#     QUERY: {question_text}

#     ANSWER FORMAT: ['keyword_1', 'keyword_2', 'keyword_3']

#     ANSWER:
#     '''
#     response = ollama.generate(model='llama3:7b', prompt=prompt)
#     keyword_list = ast.literal_eval(response['response'])

#     client = chromadb.PersistentClient(path='/code/chroma_storage/.')
#     collection = client.get_collection(name=dataset_name, embedding_function=embedding_model_ef)
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

def get_relevance_score(distances, embedding_model, question=True, use_default=True, qrs_lower=0, qrs_upper=1):
    # if embedding_model == 'nomic-embed-text':
    #     best_distance = 50
    #     worst_distance = 500
    # elif embedding_model == 'bge-m3:latest' or embedding_model == 'NeuML/pubmedbert-base-embeddings' or embedding_model == 'nomic-embed-text:latest':
    #     best_distance = 100
    #     worst_distance = 800
    # else:
    #     best_distance = 0.5
    #     worst_distance = 1.5
    
    if use_default:
        embedding_model_obj = EmbeddingModel.objects.filter(model_name=embedding_model)[0]
        if question:
            best_distance = embedding_model_obj.best_distance_q
            worst_distance = embedding_model_obj.worst_distance_q
        else:
            best_distance = embedding_model_obj.best_distance_ac
            worst_distance = embedding_model_obj.worst_distance_ac

        buffer_distance = (worst_distance - best_distance) * 0.1
        best_distance = best_distance - buffer_distance
        worst_distance = worst_distance + (buffer_distance*3)
    else:
        best_distance = qrs_lower
        worst_distance = qrs_upper

    # calculate confidence score
    # if maximum distance is more than 1.5 then confidence score is 0
    if min(distances) > worst_distance:
        relevance_score = 0
    else:
        mean_distance = sum(distances) / len(distances)
        relevance_score = (1 - (mean_distance - best_distance) / (worst_distance - best_distance)) * 100
        # trim confidence score to 2 decimal places
        relevance_score = round(relevance_score, 0)
    normalized_distances = min_max_normalization(distances, best_distance, worst_distance, True)
    # for distance in distances:
    #     normalized_distance = (distance - best_distance) / (worst_distance - best_distance)
    #     normalized_distances.append(normalized_distance)
    return relevance_score, normalized_distances

#  embedd 2 answers into vector database and get distance between them
def get_answer_distance(answer1, answer2, embedding_model_request = 'multi-qa-MiniLM-L6-cos-v1'):
    dataset_name = 'answers'
    client = chromadb.PersistentClient(path='/code/chroma_storage/.')
        
    embedding_model_ef = get_embedding_model_ef(embedding_model_request)

    # If the collection already exists, we will delete it and create a new one.
    client.get_or_create_collection(name=dataset_name)
    client.delete_collection(name=dataset_name)
    collection = client.get_or_create_collection(name=dataset_name, embedding_function=embedding_model_ef)

    # add answers to collection
    answers = [answer1, answer2]
    ids = [str(i) for i in range(2)]
    collection.add(
        ids=ids,
        documents=answers
    )

    # get distance between the two answers
    results = collection.query(
        query_texts=[answer1],
        n_results=2
    )

    distance = results['distances'][0][1]
    
    # delete collection
    collection.delete(ids=ids)

    return distance

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
                    
                    if source['normalized_distance'] > 0.6:
                        # highlight with green color rgb(120, 198, 121)
                        highlight.set_colors(stroke=[0.486, 0.988, 0])
                        highlight.update()
                    elif source['normalized_distance'] >= 0.4 and source['normalized_distance'] < 0.6:
                        # highlight with yellow color
                        highlight.set_colors(stroke=[1, 1, 0])
                        highlight.update()
                    elif source['normalized_distance'] >= 0.2 and source['normalized_distance'] < 0.4:
                        # highlight with light yellow color (247, 252, 185)
                        highlight.set_colors(stroke=[0.97, 0.98, 0.72])
                        highlight.update()
                        # # highlight with red color (250,128,114)
                        # highlight.set_colors(stroke=[0.98, 0.5, 0.45])
                        # highlight.update()
                    else:
                        # highlight gray (220,220,220)
                        highlight.set_colors(stroke=[0.863, 0.863, 0.863])
                        highlight.update()

    input_pdf.save(output_file, garbage=4, deflate=True, clean=True)

def add_video_to_chroma(dataset_name, embedding_model_request = 'multi-qa-MiniLM-L6-cos-v1'):
    documents_directory = '/code/data/data_chunks'
    # collection_name = 'pub_collection'
    # Read all files in the data directory
    documents = []
    metadatas = []
    files = [dataset_name + '.txt']

    # Instantiate a persistent chroma client in the persist_directory.
    # Learn more at docs.trychroma.com
    client = chromadb.PersistentClient(path='/code/chroma_storage/.')

    embedding_model = EmbeddingModel.objects.filter(model_name=embedding_model_request)[0].model_name
    embedding_model_ef = get_embedding_model_ef(embedding_model_request)

    # If the collection already exists, we will delete it and create a new one.
    client.get_or_create_collection(name=dataset_name)
    client.delete_collection(name=dataset_name)
    collection = client.get_or_create_collection(name=dataset_name, embedding_function=embedding_model_ef)

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
        dataset.embedding_model = embedding_model
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
        transcript =  YouTubeTranscriptApi.get_transcript(video_id, languages=['en', 'en-US'])
        
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
            transcipt_json_10.append({"title": video_title, "content": text, "start": start, "end": end, "type": "video_chunk"})
    
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

def sanitize_filename(filename):
    # Allow only alphanumeric characters, underscores, hyphens, and dots
    return re.sub(r'[^a-zA-Z0-9_\-\.\\\/]', '_', filename)

def get_embedding_model_ef(embedding_model_request, add_distances = False):
    # query embedding model from database
    embedding_model_count = EmbeddingModel.objects.filter(model_name=embedding_model_request).count()
    add_embedding_model_distances = False
    if embedding_model_count == 0:
        EmbeddingModel.objects.create(
            model_name=embedding_model_request,
            model_source='sentence-transformer'
        )
        embedding_model = embedding_model_request
        embedding_model_source = 'sentence-transformer'
        add_embedding_model_distances = True
    else:
        embedding_model = EmbeddingModel.objects.filter(model_name=embedding_model_request)[0].model_name
        embedding_model_source = EmbeddingModel.objects.filter(model_name=embedding_model_request)[0].model_source
        
    # use multi-qa-MiniLM-L6-cos-v1 embedding function
    if embedding_model == 'all-MiniLM-L6-v2':
        embedding_model_ef = embedding_functions.DefaultEmbeddingFunction()
    elif embedding_model_source == 'ollama':
        embedding_model_ef = OllamaEmbeddingFunction(url=os.environ.get('OLLAMA_SERVER') + "/api/embeddings", model_name=embedding_model.split(':')[0]) 
        # embedding_model_ef = OllamaEmbeddingFunction(url=os.environ.get('OLLAMA_SERVER') + "/api/embeddings", model_name=embedding_model.split(':')[0] if embedding_model.split(':')[1] == 'latest' else embedding_model) 
    elif '/' in embedding_model:
        embedding_model_ef = HuggingFaceEmbeddingFunction(api_key=os.environ.get('HUGGINGFACE_API_KEY'), model_name=embedding_model)
    elif embedding_model_source == 'sentence-transformer':    
        embedding_model_ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name=embedding_model)

    if add_embedding_model_distances or add_distances:
        # read csv file from ./data/cutoff_examples/cutoff_data.csv
        df = pd.read_csv('/code/data/cutoff_examples/cutoff_data.csv')
        embedding_model = EmbeddingModel.objects.filter(model_name=embedding_model_request)[0]
        for i in range(len(df)):
            if df['distance_tag'][i] == 'best_q':
                question = df['question'][i]
                answer = df['answer'][i]
                answer_no_context = df['answer_without_context'][i]
                chunks = df['context_chunks'][i].split(';')
                distances_q, distances_a, distance_na  = get_embedding_cutoff_distance(embedding_model_ef, chunks, question, answer, answer_no_context)
                embedding_model.best_distance_q = np.round(distances_q, 3)
                # best_distances_ans = best_distances_na - best_distances_a
                embedding_model.best_distance_ac = np.round(distances_a, 3)
                embedding_model.worst_distance_nac = np.round(distance_na, 3)
            elif df['distance_tag'][i] == 'worst_q':
                question = df['question'][i]
                answer = df['answer'][i]
                answer_no_context = df['answer_without_context'][i]
                chunks = df['context_chunks'][i].split(';')
                distances_q, distances_a, _ = get_embedding_cutoff_distance(embedding_model_ef, chunks, question, answer, answer_no_context)
                embedding_model.worst_distance_q = np.round(distances_a, 3)
                # worst_distances_ans = worst_distances_na - worst_distances_a
                # embedding_model.worst_distance_a = np.round(worst_distances_na, 3)
            elif df['distance_tag'][i] == 'worst_a':
                question = df['question'][i]
                answer = df['answer'][i]
                answer_no_context = df['answer_without_context'][i]
                chunks = df['context_chunks'][i].split(';')
                _, distances_a, distance_na = get_embedding_cutoff_distance(embedding_model_ef, chunks, question, answer, answer_no_context)
                # worst_distances_ans = distance_na - distances_a
                embedding_model.worst_distance_ac = np.round(distances_a, 3)
                embedding_model.best_distance_nac = np.round(distance_na, 3)
        embedding_model.save()
                        
    return embedding_model_ef

def get_embedding_cutoff_distance(embedding_model_ef, chunks, question, answer, answer_no_context):
    # create a collection
    client = chromadb.PersistentClient(path='/code/chroma_storage/.')
    dataset_name = 'mygpt_distance_dataset'
    if len(client.list_collections()):
        for collection in client.list_collections():
            if collection.name == dataset_name:
                client.delete_collection(name=dataset_name)

    collection = client.create_collection(name=dataset_name, embedding_function=embedding_model_ef)

    # add chunks to collection
    ids = [str(i) for i in range(len(chunks))]
    collection.add(
        ids=ids,
        documents=chunks
    )

    # get distances between question and chunks
    results = collection.query(
        query_texts=[question],
        n_results=len(chunks)
    )

    #  get mean distance
    distances_q = results['distances'][0]
    # distances_q = sum(distances) / len(distances)
    distance_q = distances_q[0]

    # get distances between answer and chunks
    results = collection.query(
        query_texts=[answer],
        n_results=len(chunks)
    )

     #  get mean distance
    distances_a = results['distances'][0]
    # distances_a = sum(distances) / len(distances)
    distance_a = distances_a[0]

    # get distances between answer_no_context and chunks
    results = collection.query(
        query_texts=[answer_no_context],
        n_results=len(chunks)
    )

    #  get mean distance
    distances_na = results['distances'][0]
    distance_na = sum(distances_na) / len(distances_na)
    # distance_na = distances_na[len(chunks)-1]

    # emtpy collection
    collection.delete(ids=ids)

    client.delete_collection(name=dataset_name)

    return distance_q, distance_a, distance_na

class HuggingFaceEmbeddingFunction(EmbeddingFunction[Documents]):
    """
    This class is used to get embeddings for a list of texts using the HuggingFace API.
    It requires an API key and a model name. The default model name is "sentence-transformers/all-MiniLM-L6-v2".
    """

    def __init__(
        self, api_key: str, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"
    ):
        """
        Initialize the HuggingFaceEmbeddingFunction.

        Args:
            api_key (str): Your API key for the HuggingFace API.
            model_name (str, optional): The name of the model to use for text embeddings. Defaults to "sentence-transformers/all-MiniLM-L6-v2".
        """
        self._api_url = f"https://api-inference.huggingface.co/pipeline/feature-extraction/{model_name}"
        self._session = httpx.Client(timeout=None)
        self._session.headers.update({"Authorization": f"Bearer {api_key}"})

    def __call__(self, input: Documents) -> Embeddings:
        """
        Get the embeddings for a list of texts.

        Args:
            texts (Documents): A list of texts to get embeddings for.

        Returns:
            Embeddings: The embeddings for the texts.

        Example:
            >>> hugging_face = HuggingFaceEmbeddingFunction(api_key="your_api_key")
            >>> texts = ["Hello, world!", "How are you?"]
            >>> embeddings = hugging_face(texts)
        """
        # Call HuggingFace Embedding API for each document
        return cast(
            Embeddings,
            self._session.post(
                self._api_url,
                json={"inputs": input, "options": {"wait_for_model": True}},
            ).json(),
        )
    
class OllamaEmbeddingFunction(EmbeddingFunction[Documents]):
    """
    This class is used to generate embeddings for a list of texts using the Ollama Embedding API (https://github.com/ollama/ollama/blob/main/docs/api.md#generate-embeddings).
    """

    def __init__(self, url: str, model_name: str) -> None:
        """
        Initialize the Ollama Embedding Function.

        Args:
            url (str): The URL of the Ollama Server.
            model_name (str): The name of the model to use for text embeddings. E.g. "nomic-embed-text" (see https://ollama.com/library for available models).
        """
        self._api_url = f"{url}"
        self._model_name = model_name
        self._session = httpx.Client(timeout=None)

    def __call__(self, input: Union[Documents, str]) -> Embeddings:
        """
        Get the embeddings for a list of texts.

        Args:
            input (Documents): A list of texts to get embeddings for.

        Returns:
            Embeddings: The embeddings for the texts.

        Example:
            >>> ollama_ef = OllamaEmbeddingFunction(url="http://localhost:11434/api/embeddings", model_name="nomic-embed-text")
            >>> texts = ["Hello, world!", "How are you?"]
            >>> embeddings = ollama_ef(texts)
        """
        # Call Ollama Server API for each document
        texts = input if isinstance(input, list) else [input]
        embeddings = [
            self._session.post(
                self._api_url, json={"model": self._model_name, "prompt": text}
            ).json()
            for text in texts
        ]
        return cast(
            Embeddings,
            [
                embedding["embedding"]
                for embedding in embeddings
                if "embedding" in embedding
            ],
        )
    
#this method should be called as part of the upload document process just after adding chunks into the chromadb
def index_document_by_bm25(dataset_name):
    documents_directory = '/code/data/data_chunks' # some other directory can be initalized for storing indices for each document
    # tokenizer_directory = '/code/data/bm25_tokenizer/' + dataset_name
    tokenizer_directory = Path('/code/data/bm25_tokenizer') / dataset_name
    tokenizer_directory.mkdir(parents=True, exist_ok=True)

    documents = []

    with open(f'{documents_directory}/{dataset_name}.txt', 'r') as file:
        for line_number, line in enumerate(
                tqdm((file.readlines()), desc=f'Reading {dataset_name}'), 100
        ):
            # Strip whitespace and append the line to the documents list
            line = line.strip()
            # convert line to json
            line_json = eval(line)
            documents.append('document ' + str(line_json['title']) +  '; page ' + str(line_json['page'])+ '; ' + line_json['content'].strip())

    # default tokenizer
    stemmer = Stemmer.Stemmer("english")
    tokenizer = bm25s.tokenization.Tokenizer(stemmer=stemmer)
    corpus_tokenized = tokenizer.tokenize(documents, return_as='tuple')

    retriever = bm25s.BM25(corpus=documents)
    retriever.index(corpus_tokenized)
    retriever.save(tokenizer_directory)
    tokenizer.save_vocab(tokenizer_directory)
    tokenizer.save_stopwords(tokenizer_directory)

def retrieve_chunks_by_bm25(queryText, dataset_name, chunk_count=10):

    stemmer = Stemmer.Stemmer("english")

     # Tokenize the queries
    queriesTokenized = bm25s.tokenize([queryText], stemmer=stemmer)

    retriever_loaded = bm25s.BM25.load(f"/code/data/bm25_tokenizer/{dataset_name}", mmap=True, load_corpus=True)
    results, scores = retriever_loaded.retrieve(queriesTokenized, k=chunk_count, return_as="tuple")

    # returns ids of the chunks as a list
    return results[0], scores[0]

def min_max_normalization(data, best_val, worst_val, reverse=False):
    """
    Normalize the data using min-max normalization.
    this function assumes the bigger the value the better
    if reverse is true, then the smaller the value the better
    """
    normalized_data = []
    for value in data:
        if reverse:
            normalized_value = (worst_val - value) / (worst_val - best_val)
        else:
            normalized_value = (value - worst_val) / (best_val - worst_val)
        normalized_data.append(normalized_value)
    return normalized_data

def get_toc_from_grobid(pdf_path):
    """
    Extract the table of contents from a PDF file using GROBID.
    Grobid is available at http://localhost:8070 by default.
    """
    # Use GROBID to extract the table of contents
    url = 'http://host.docker.internal:8070/api/processFulltextDocument'
    files = {'input': open(pdf_path, 'rb')}
    data = {'consolidateHeader': '1', 'teiCoordinates': 'head'}
    response = requests.post(url, files=files, data=data)
    
    # Parse the response to get the table of contents
    toc = []
    if response.status_code == 200:
        xml_content = response.content
        # Parse the XML content and get <head> elements across entire XML
        root = ET.fromstring(xml_content)

        for head in root.findall('.//{http://www.tei-c.org/ns/1.0}head'):
            # Extract the text from the <head> element
            head_text = head.text.strip() if head.text else ''
            # get page number from coords attribute from head <head coords="1,72.02,292.61,212.67,11.99"> 
            coords = head.get('coords')
            page = coords.split(',')[0] if coords else '1'
            # add to toc if not empty as pymupdf format
            if head_text:
                toc.append([1, head_text, int(page) ])  # Assuming level 1 for all headings
            
    else:
        print(f"Error: {response.status_code} - {response.text}")

    # remove header and footer from toc by removing repetitive elements
    if len(toc) > 0:
        # find most common element in toc
        for i in range(len(toc)-1, 0, -1):
            if toc[i][1] == toc[i-1][1]:
                toc.pop(i)
    
    return toc