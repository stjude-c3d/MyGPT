"""
YouTube video processing functions
"""
import chromadb
from tqdm import tqdm
from youtube_transcript_api import YouTubeTranscriptApi
from django.utils.timezone import make_aware
import datetime

from ..models import Dataset, EmbeddingModel
from .embedding_utils import get_embedding_model_ef


def get_youtube_transcript(dataset_name, video_ids, video_titles):
    """Extract and save YouTube video transcripts"""
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


def add_video_to_chroma(dataset_name, embedding_model_request='multi-qa-MiniLM-L6-cos-v1'):
    """Add video transcripts to ChromaDB"""
    documents_directory = '/code/data/data_chunks'
    documents = []
    metadatas = []
    files = [dataset_name + '.txt']

    # Instantiate a persistent chroma client in the persist_directory.
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

        print(f'Added {new_count - count} documents')

        return
