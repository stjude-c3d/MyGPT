from django.core.files.base import File
from django.apps import apps
from django.utils.timezone import make_aware
from pypdf import PdfReader
from pyzotero import zotero
import fitz
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
from ..models import Papers, Videos, Dataset, chunks, Question, Answer, Source, Conversation, EmbeddingModel

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
    for idx, title, attachment, abstract in zip( range(1, len(titles)+1), titles, pdf_attachments, abstracts):
        with open('data/pdfs/'+ dataset_name +'/paper' + str(idx) + '.pdf', 'wb') as f:
            f.write(zot.file(attachment['data']['key']))
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
    use_overlap_r = request.POST.get('use_overlap')
    chunk_size_r = request.POST.get('chunk_size')

    # validate all fields for code injection
    dataset_name = re.sub(r'[^\w\s]', '', dataset_name_r)
    paper_titles = [re.sub(r'[^\w\s]', '', x) for x in paper_titles_r]
    user = re.sub(r'[^\w\s]', '', user_r)
    user_email = re.sub(r'[^\w\s]', '', user_email_r)
    user_group = re.sub(r'[^\w\s]', '', user_group_r)
    use_overlap = re.sub(r'[^\w\s]', '', use_overlap_r)
    chunk_size = re.sub(r'[^\w\s]', '', chunk_size_r)    

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
            overlap=use_overlap,
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

    with open('data/data_chunks/'+ dataset_name +'.txt', 'w') as f:
        for chunk in data:
            f.write(str(chunk) + '\n')

    return dataset_name


def add_to_chroma(dataset_name, embedding_model_request = 'all-MiniLM-L6-v2'):
    documents_directory = '/code/data/data_chunks'
    # collection_name = 'pub_collection'
    # Read all files in the data directory
    documents = []
    metadatas = []
    files = [dataset_name + '.txt']

    # Instantiate a persistent chroma client in the persist_directory.
    # Learn more at docs.trychroma.com
    client = chromadb.PersistentClient(path='/code/chroma_storage/.')

    # query embedding model from database
    embedding_model_count = EmbeddingModel.objects.filter(model_name=embedding_model_request).count()
    if embedding_model_count == 0:
        EmbeddingModel.objects.create(
            model_name=embedding_model_request,
            model_source='sentence-transformer',
            best_distance=0.5,
            worst_distance=1.5
        )
        embedding_model = embedding_model_request
        embedding_model_source = 'sentence-transformer'
    else:
        embedding_model = EmbeddingModel.objects.filter(model_name=embedding_model_request)[0].model_name
        embedding_model_source = EmbeddingModel.objects.filter(model_name=embedding_model_request)[0].model_source
        
    # use multi-qa-MiniLM-L6-cos-v1 embedding function
    if embedding_model == 'all-MiniLM-L6-v2':
        embedding_model_ef = embedding_functions.DefaultEmbeddingFunction()
    elif embedding_model_source == 'ollama':
        embedding_model_ef = embedding_functions.OllamaEmbeddingFunction(url=os.environ.get('OLLAMA_SERVER') + "api/embeddings", model_name=embedding_model)
    # elif '/' in embedding_model:
    #     embedding_model_ef = embedding_functions.HuggingFaceEmbeddingFunction(api_key=os.environ.get('HUGGINGFACE_API_KEY'), model_name=embedding_model)
    elif embedding_model_source == 'sentence-transformer':    
        embedding_model_ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name=embedding_model)
        
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
                    metadatas.append({'filename': line_json['title'], 'page': line_json['page'], 'type': line_json['type']})
        ids = [str(i) for i in range(count, count + len(documents))]
        
        # add to vector database
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
                Dataset.objects.get(dataset_name=dataset_name).delete()
                print('error adding documents')
                return False

        new_count = collection.count()
        dataset = Dataset.objects.get(dataset_name=dataset_name)
        dataset.dataset_size = new_count
        dataset.embedding_model = embedding_model
        dataset.save()

        print(f'Added {new_count - count} documents')
        return True
            

        # add embeddings to database
        # add_embeddings_to_chunks(documents, metadatas, dataset)

def add_demo_dataset(embedding_model_request = 'multi-qa-MiniLM-L6-cos-v1'):
    documents_directory = '/code/data'
    # collection_name = 'pub_collection'
    # Read all files in the data directory
    documents = []
    metadatas = []
    dataset_name = 'GPCR'
    titles = []
    client = chromadb.PersistentClient(path='/code/chroma_storage/.')

    # query embedding model from database
    embedding_model_count = EmbeddingModel.objects.filter(model_name=embedding_model_request).count()
    if embedding_model_count == 0:
        EmbeddingModel.objects.create(
            model_name=embedding_model_request,
            model_source='sentence-transformer',
            best_distance=0.5,
            worst_distance=1.5
        )
        embedding_model = embedding_model_request
        embedding_model_source = 'sentence-transformer'
    else:
        embedding_model = EmbeddingModel.objects.filter(model_name=embedding_model_request)[0].model_name
        embedding_model_source = EmbeddingModel.objects.filter(model_name=embedding_model_request)[0].model_source
        
    # use multi-qa-MiniLM-L6-cos-v1 embedding function
    if embedding_model == 'all-MiniLM-L6-v2':
        embedding_model_ef = embedding_functions.DefaultEmbeddingFunction()
    elif embedding_model_source == 'ollama':
        embedding_model_ef = embedding_functions.OllamaEmbeddingFunction(url=os.environ.get('OLLAMA_SERVER') + "api/embeddings", model_name=embedding_model)
    # elif '/' in embedding_model:
    #     embedding_model_ef = embedding_functions.HuggingFaceEmbeddingFunction(api_key=os.environ.get('HUGGINGFACE_API_KEY'), model_name=embedding_model)
    elif embedding_model_source == 'sentence-transformer':    
        embedding_model_ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name=embedding_model)

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

def add_embeddings_to_qna(text, text_type = 'question', embedding_model_request = 'multi-qa-MiniLM-L6-cos-v1'):
    # query embedding model from database
    embedding_model_count = EmbeddingModel.objects.filter(model_name=embedding_model_request).count()
    if embedding_model_count == 0:
        EmbeddingModel.objects.create(
            model_name=embedding_model_request,
            model_source='sentence-transformer',
            best_distance=0.5,
            worst_distance=1.5
        )
        embedding_model = embedding_model_request
        embedding_model_source = 'sentence-transformer'
    else:
        embedding_model = EmbeddingModel.objects.filter(model_name=embedding_model_request)[0].model_name
        embedding_model_source = EmbeddingModel.objects.filter(model_name=embedding_model_request)[0].model_source
        
    # use multi-qa-MiniLM-L6-cos-v1 embedding function
    if embedding_model == 'all-MiniLM-L6-v2':
        embedding_model_ef = embedding_functions.DefaultEmbeddingFunction()
    elif embedding_model_source == 'ollama':
        embedding_model_ef = embedding_functions.OllamaEmbeddingFunction(url=os.environ.get('OLLAMA_SERVER') + "api/embeddings", model_name=embedding_model)
    # elif '/' in embedding_model:
    #     embedding_model_ef = embedding_functions.HuggingFaceEmbeddingFunction(api_key=os.environ.get('HUGGINGFACE_API_KEY'), model_name=embedding_model)
    elif embedding_model_source == 'sentence-transformer':    
        embedding_model_ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name=embedding_model)

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

def nearestDataChroma(text, dataset_name, keywords_str = '', embedding_model_request='multi-qa-MiniLM-L6-cos-v1'):
    # collection_name = 'pub_collection'
    # client = chromadb.Client()
        # query embedding model from database
    embedding_model_count = EmbeddingModel.objects.filter(model_name=embedding_model_request).count()
    if embedding_model_count == 0:
        EmbeddingModel.objects.create(
            model_name=embedding_model_request,
            model_source='sentence-transformer',
            best_distance=0.5,
            worst_distance=1.5
        )
        embedding_model = embedding_model_request
        embedding_model_source = 'sentence-transformer'
    else:
        embedding_model = EmbeddingModel.objects.filter(model_name=embedding_model_request)[0].model_name
        embedding_model_source = EmbeddingModel.objects.filter(model_name=embedding_model_request)[0].model_source
        
    # use multi-qa-MiniLM-L6-cos-v1 embedding function
    if embedding_model == 'all-MiniLM-L6-v2':
        embedding_model_ef = embedding_functions.DefaultEmbeddingFunction()
    elif embedding_model_source == 'ollama':
        embedding_model_ef = embedding_functions.OllamaEmbeddingFunction(url=os.environ.get('OLLAMA_SERVER') + "api/embeddings", model_name=embedding_model)
    # elif '/' in embedding_model:
    #     embedding_model_ef = embedding_functions.HuggingFaceEmbeddingFunction(api_key=os.environ.get('HUGGINGFACE_API_KEY'), model_name=embedding_model)
    elif embedding_model_source == 'sentence-transformer':    
        embedding_model_ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name=embedding_model)

    # If the collection already exists, we just return it. This allows us to add more
    # data to an existing collection.
    client = chromadb.PersistentClient(path='/code/chroma_storage/.')
    collection = client.get_collection(name=dataset_name, embedding_function=embedding_model_ef)
    # collection = app_config.collection

    # Create ids from the current count
    count = collection.count()
    print(f'Collection contains {count} documents')

    keywords = keywords_str.split(';') if keywords_str != '' else []
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

def get_relevance_score(distances, embedding_model):
    if embedding_model == 'nomic-embed-text':
        best_distance = 50
        worst_distance = 500
    elif embedding_model == 'bge-m3':
        best_distance = 100
        worst_distance = 800
    else:
        best_distance = 0.5
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

#  embedd 2 answers into vector database and get distance between them
def get_answer_distance(answer1, answer2, embedding_model_request = 'multi-qa-MiniLM-L6-cos-v1'):
    dataset_name = 'answers'
    client = chromadb.PersistentClient(path='/code/chroma_storage/.')
        
    # query embedding model from database
    embedding_model_count = EmbeddingModel.objects.filter(model_name=embedding_model_request).count()
    if embedding_model_count == 0:
        EmbeddingModel.objects.create(
            model_name=embedding_model_request,
            model_source='sentence-transformer',
            best_distance=0.5,
            worst_distance=1.5
        )
        embedding_model = embedding_model_request
        embedding_model_source = 'sentence-transformer'
    else:
        embedding_model = EmbeddingModel.objects.filter(model_name=embedding_model_request)[0].model_name
        embedding_model_source = EmbeddingModel.objects.filter(model_name=embedding_model_request)[0].model_source
        
    # use multi-qa-MiniLM-L6-cos-v1 embedding function
    if embedding_model == 'all-MiniLM-L6-v2':
        embedding_model_ef = embedding_functions.DefaultEmbeddingFunction()
    elif embedding_model_source == 'ollama':
        embedding_model_ef = embedding_functions.OllamaEmbeddingFunction(url=os.environ.get('OLLAMA_SERVER') + "api/embeddings", model_name=embedding_model)
    # elif '/' in embedding_model:
    #     embedding_model_ef = embedding_functions.HuggingFaceEmbeddingFunction(api_key=os.environ.get('HUGGINGFACE_API_KEY'), model_name=embedding_model)
    elif embedding_model_source == 'sentence-transformer':    
        embedding_model_ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name=embedding_model)

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

    # query embedding model from database
    embedding_model_count = EmbeddingModel.objects.filter(model_name=embedding_model_request).count()
    if embedding_model_count == 0:
        EmbeddingModel.objects.create(
            model_name=embedding_model_request,
            model_source='sentence-transformer',
            best_distance=0.5,
            worst_distance=1.5
        )
        embedding_model = embedding_model_request
        embedding_model_source = 'sentence-transformer'
    else:
        embedding_model = EmbeddingModel.objects.filter(model_name=embedding_model_request)[0].model_name
        embedding_model_source = EmbeddingModel.objects.filter(model_name=embedding_model_request)[0].model_source
        
    # use multi-qa-MiniLM-L6-cos-v1 embedding function
    if embedding_model == 'all-MiniLM-L6-v2':
        embedding_model_ef = embedding_functions.DefaultEmbeddingFunction()
    elif embedding_model_source == 'ollama':
        embedding_model_ef = embedding_functions.OllamaEmbeddingFunction(url=os.environ.get('OLLAMA_SERVER') + "api/embeddings", model_name=embedding_model)
    # elif '/' in embedding_model:
    #     embedding_model_ef = embedding_functions.HuggingFaceEmbeddingFunction(api_key=os.environ.get('HUGGINGFACE_API_KEY'), model_name=embedding_model)
    elif embedding_model_source == 'sentence-transformer':    
        embedding_model_ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name=embedding_model)

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
    return re.sub(r'[^a-zA-Z0-9_\-\.]', '_', filename)