from django.apps import AppConfig
# from transformers import BioGptTokenizer, BioGptForCausalLM, pipeline, set_seed
# from llama_cpp import Llama
# from huggingface_hub import login
# from datasets import load_dataset
# from datasets import load_from_disk
# from sentence_transformers import SentenceTransformer
import os
# import argparse
from tqdm import tqdm
import chromadb

class TestdbConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'testdb'

    def ready(self):
        # Login to HuggingFace Hub
        # login('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')

        # Set a seed for reproducibility
        # set_seed(42)

        # Create the pipeline for BioGPT original
        # model_org = BioGptForCausalLM.from_pretrained('/code/backend/models/BioGPT-Large-PubMedQA')
        # tokenizer_org = BioGptTokenizer.from_pretrained('/code/backend/models/BioGPT-Large-PubMedQA')
        # self.org_generator = pipeline('text-generation', model=model_org, tokenizer=tokenizer_org)

        # Create the pipeline for BioGPT finetuned on KIDS2023
        # model_ft = BioGptForCausalLM.from_pretrained('/code/backend/models/BioGPT-Large-PubMedQA-finetuned-KIDS2023')
        # tokenizer_ft = BioGptTokenizer.from_pretrained('/code/backend/models/BioGPT-Large-PubMedQA-finetuned-KIDS2023')
        # self.ft_generator = pipeline('text-generation', model=model_ft, tokenizer=tokenizer_ft)

        # Create the pipeline for Llamology
        # model_path='/code/backend/models/Llama2/llama-2-chat-ggml-model.bin'
        # model_path='/code/backend/models/Llama2/llama-2-7b-chat.ggmlv3.q5_K_S.bin'
        # self.llamology = Llama(model_path=model_path, n_ctx=6024, n_batch=580)

        # Load the pre-trained SentenceTransformer model
        # self.encoder = SentenceTransformer('sentence-transformers/multi-qa-MiniLM-L6-cos-v1')

        # Load the embeddings dataset if locally downloaded or uncomment the last 2 lines to download it from the HuggingFace Hub
        # last line will store the dataset in the backend/models folder
        # self.embeddings_dataset = load_from_disk('/code/backend/models/embeddings_dataset')
        # self.embeddings_dataset = load_dataset('jdowni80/babugroup_llamology_embeddings', split='train')
        # self.embeddings_dataset.save_to_disk('/code/backend/models/embeddings_dataset')
        TestdbConfig.add_to_chroma(self)

    def add_to_chroma(self):
        documents_directory = '/code/backend/zotero_dataset'
        # collection_name = 'pub_collection'
        # Read all files in the data directory
        documents = []
        metadatas = []
        files = os.listdir(documents_directory)
        files = ['GPCR.txt']

        # Instantiate a persistent chroma client in the persist_directory.
        # Learn more at docs.trychroma.com
        client = chromadb.PersistentClient(path='/code/backend/chroma_storage/.')

        # If the collection already exists, we just return it. This allows us to add more
        # data to an existing collection.
        # client.delete_collection(name='GPCR')
        self.collection = client.get_or_create_collection(name='GPCR')

        # Create ids from the current count
        count = self.collection.count()
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
                self.collection.add(
                    ids=ids[i : i + 100],
                    documents=documents[i : i + 100],
                    metadatas=metadatas[i : i + 100],  # type: ignore
                )

            new_count = self.collection.count()
            print(f'Added {new_count - count} documents')

