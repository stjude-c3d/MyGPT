from django.apps import AppConfig
from transformers import BioGptTokenizer, BioGptForCausalLM, pipeline, set_seed
# import torch

class TestdbConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'testdb'

    def ready(self):
        # # Set a seed for reproducibility
        set_seed(42)
        # device = torch.device('mps')

        # # Create the pipeline for BioGPT finetuned on KIDS2023
        model_ft = BioGptForCausalLM.from_pretrained('./models/BioGPT/BioGPT-Large-PubMedQA-finetuned-KIDS2023')
        tokenizer_ft = BioGptTokenizer.from_pretrained('./models/BioGPT/BioGPT-Large-PubMedQA-finetuned-KIDS2023')
        # self.biogpt_generator = pipeline('text-generation', model=model_ft, tokenizer=tokenizer_ft)
        self.biogpt_generator = pipeline('text-generation', model=model_ft, tokenizer=tokenizer_ft, device='mps')