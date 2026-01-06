"""
ChromaDB vector database operations
"""
import os
import re
import json
import chromadb
import pandas as pd
import duckdb
from tqdm import tqdm
from langchain_community.llms import Ollama

from ..models import EmbeddingModel, Dataset
from .helpers import find_cutoff_distance
from .embedding_utils import get_embedding_model_ef

from .rerank_utils import (
    rerank_sources
)


# Initialize duckdb connection
con = duckdb.connect()


def add_to_chroma(dataset_name, embedding_model_request='all-MiniLM-L6-v2', distance_function='l2', chunking_method='fixed_chunk_size', use_reranker=False):
    """Add dataset to ChromaDB vector database"""
    documents_directory = '/code/data/data_chunks'
    documents = []
    metadatas = []
    files = [dataset_name + '.txt']

    # Instantiate a persistent chroma client in the persist_directory.
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
            with open(f'{documents_directory}/{filename}', 'r') as file:
                for line_number, line in enumerate(
                    tqdm((file.readlines()), desc=f'Reading {filename}'), 1
                ):
                    # Strip whitespace and append the line to the documents list
                    line = line.strip()
                    #convert line to json
                    line_json = eval(line)
                    # remove new lines and extra spaces
                    line_json['content'] = re.sub(r'\s+', ' ', line_json['content']).strip()
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
            collection.add(
                ids=ids[i : i + 100],
                documents=documents[i : i + 100],
                metadatas=metadatas[i : i + 100],  # type: ignore
            )

        new_count = collection.count()
        dataset = Dataset.objects.get(dataset_name=dataset_name)
        dataset.dataset_size = new_count
        dataset.embedding_model = embedding_model
        dataset.use_reranker = True if use_reranker == 'Yes' else False
        dataset.save()

        print(f'Added {new_count - count} documents')
        return True


def nearestDataChroma(text, dataset_name, document_title_str='', focused_section_str='', keywords_str='', embedding_model_request='multi-qa-MiniLM-L6-cos-v1', maximum_chunks_count=15, no_cutoff=False, use_reranker=False):
    """Query ChromaDB for nearest documents"""
    embedding_model_ef = get_embedding_model_ef(embedding_model_request)

    # If the collection already exists, we just return it.
    client = chromadb.PersistentClient(path='/code/chroma_storage/.')
    collection = client.get_collection(name=dataset_name, embedding_function=embedding_model_ef)

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
                where_document={keywords_filter}
            )
        else:
            keyword_results = collection.query(
                query_texts=[text],
                n_results=2,
                where={'type': {"$ne": "spreadsheet_full"}},
                where_document={'$contains': keywords[0]}
            )

    if document_title == 'all' and focused_section == 'all':
        results = collection.query(
            query_texts=[text],
            n_results=maximum_chunks_count,
            where={'type': {"$ne": "spreadsheet_full"}}
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

    print('distances: ', results['distances'][0])
    library_type = 'papers'
    if len(results['metadatas'][0]) > 0 and "page" in results['metadatas'][0][0]:
        library_type = 'papers'
    elif len(results['metadatas'][0]) > 0 and "start" in results['metadatas'][0][0]:
        library_type = 'videos'

    if use_reranker:
        # rerank the sources based on cross encoder
        sources = []
        for i in range(len(results['ids'][0])):
            source = {
                'context': results['documents'][0][i],
                'filename': results['metadatas'][0][i]['filename'],
                'vector_score': round(1 - results['distances'][0][i], 3)
            }
            if library_type == 'papers':
                source['page'] = results['metadatas'][0][i]['page']
            elif library_type == 'videos':
                source['start'] = results['metadatas'][0][i]['start']
                source['end'] = results['metadatas'][0][i]['end']
            sources.append(source)
        
        reranked_sources = rerank_sources(sources, text)
        
        # reconstruct results from reranked sources
        titles, pages, starts, stops, chunks, distances, reranked_scores = [], [], [], [], [], [], []
        context = ''
        for source in reranked_sources:
            titles.append(source['filename'])
            if library_type == 'papers':
                pages.append(source['page'])
            elif library_type == 'videos':
                starts.append(source['start'])
                stops.append(source['end'])
            chunks.append(source['context'])
            reranked_scores.append(source['reranked_score'])
            distances.append(round(1 - source['vector_score'], 3))
            context += re.sub(r'\s+', ' ', source['context'])

    else:
        if no_cutoff:
            cutoff_distance = results['distances'][0][len(results['distances'][0])-1]
        else:
            cutoff_distance = find_cutoff_distance(results['distances'][0])
        print('cutoff_distance: ', cutoff_distance)
        titles, pages, starts, stops, chunks, distances = [], [], [], [], [], []
        context = ''

        # Extract results within cutoff distance
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
                    # check if chunk array already contains the chunk
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
    
    if len(results['metadatas'][0]) > 0 and results['metadatas'][0][0]['type'] == 'spreadsheet_chunk':
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
    
    # with open("chroma_context.txt", "w") as file:
    #     file.write(context)

    ret = (titles, pages, starts, stops, chunks, distances, reranked_scores) if use_reranker else (titles, pages, starts, stops, chunks, distances, [])
    return ret


def get_answer_distance(answer1, answer2, embedding_model_request='multi-qa-MiniLM-L6-cos-v1'):
    """Embed 2 answers into vector database and get distance between them"""
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


def get_answer_distance_by_context(text, dataset_name, contexts=[''], embedding_model_request='multi-qa-MiniLM-L6-cos-v1'):
    """Get distance between answer and specific contexts"""
    embedding_model_ef = get_embedding_model_ef(embedding_model_request)
    client = chromadb.PersistentClient(path='/code/chroma_storage/.')
    collection = client.get_collection(name=dataset_name, embedding_function=embedding_model_ef)

    context_count = len(contexts)

    if context_count == 0:
        return []

    if context_count == 1:
        results = collection.query(
            query_texts=[text],
            n_results=1,
            where={'type': {"$ne": "spreadsheet_full"}},
            where_document={'$contains': contexts[0]}
        )

        distances = results['distances'][0]
        return distances

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
