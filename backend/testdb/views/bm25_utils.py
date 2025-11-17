#libraries to import for keyword search
import bm25s
import Stemmer
from pathlib import Path
from tqdm import tqdm
import numpy as np

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

def retrieve_chunks_by_bm25(queryText, dataset_name, document_title, chunk_count=10):

    stemmer = Stemmer.Stemmer("english")

     # Tokenize the queries
    queriesTokenized = bm25s.tokenize([queryText], stemmer=stemmer)

    # if document_title is not empty, get the chunk file and create weight mask for the documents
    if document_title != '':
        chunk_file = f'/code/data/data_chunks/{dataset_name}.txt'
        with open(chunk_file, 'r') as file:
            chunk_lines = file.readlines()
        weight_mask = np.array([1 if "'title': '" + str(document_title) + "'" in line else 0 for line in chunk_lines])

    retriever_loaded = bm25s.BM25.load(f"/code/data/bm25_tokenizer/{dataset_name}", mmap=True, load_corpus=True)
    results, scores = retriever_loaded.retrieve(queriesTokenized, k=chunk_count, return_as="tuple", weight_mask=weight_mask if document_title != '' else None)

    # returns ids of the chunks as a list
    return results[0], scores[0]

def hybrid_source_combination(vector_sources, bm25_sources):
    # find duplicates from both the list with same text
    duplicates = []
    combined_sources = []
    if len(bm25_sources) == 0:
        # if vector sources are empty, return bm25 sources
        return vector_sources
    
    for vector_source in vector_sources:
        for bm25_source in bm25_sources:
            if vector_source['vector_score'] < 0.1 and bm25_source['bm25_score'] < 0.1:
                continue
            if vector_source['context'] == bm25_source['context'] and vector_source['page'] == bm25_source['page']:
                # create a new source with the same text and distance from bm25
                new_source = vector_source.copy()
                new_source['bm25_score_raw'] = bm25_source['bm25_score_raw']
                new_source['bm25_score'] = bm25_source['bm25_score']
                new_source['bm25_rank'] = bm25_source['rank']
                duplicates.append(new_source)
                break

    # add the vector sources to the combined sources not present in duplicates
    for vector_source in vector_sources:
        if vector_source['vector_score'] < 0.1:
            continue
        # check if the source is already in the combined sources
        for duplicate in duplicates:
            if vector_source['context'] == duplicate['context'] and vector_source['page'] == duplicate['page']:
                break
        else:
            # add the vector source to the combined sources
            combined_sources.append(vector_source)
    
    # add the duplicates to the combined sources
    combined_sources.extend(duplicates)

    # add the bm25 sources to the combined sources
    for bm25_source in bm25_sources:
        if  bm25_source['bm25_score'] < 0.1:
            continue
        # check if the source is already in the combined sources
        for duplicate in duplicates:
            if bm25_source['context'] == duplicate['context'] and bm25_source['page'] == duplicate['page']:
                break
        else:
            # add the bm25 source to the combined sources
            combined_sources.append(bm25_source)

    return combined_sources