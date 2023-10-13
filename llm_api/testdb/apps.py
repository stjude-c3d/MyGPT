from django.apps import AppConfig
from llama_cpp import Llama


class TestdbConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'testdb'

    def ready(self):
        # Create the pipeline for Llama2
        model_path='./models/Llama2/llama-2-13b-chat.ggmlv3.q5_K_S.bin'
        #  for google colab notebook
        # model_path='/content/MyGPT/llm_api/models/Llama2/llama-2-7b-chat.ggmlv3.q5_K_S.bin'
        ## T40 - Llama2 7b - with 32GB RAM can handle n_gpu_layers=28, n_ctx=2040, n_batch=580 with response time less than a minute
        ## A100 - Llama2 7b - with 32GB RAM can handle n_gpu_layers=48, n_ctx=2040, n_batch=580 with response time less than 10 secs
        ## T40 - Llama2 13b - with 32GB RAM can handle n_gpu_layers=28, n_ctx=2040, n_batch=580 with response time less than a minute
        ## A100 - Llama2 13b - with 32GB RAM can handle n_gpu_layers=24, n_ctx=2040, n_batch=580 with response time less than 10 secs
        self.llama2 = Llama(model_path=model_path, n_gpu_layers=56, n_ctx=6024, n_batch=1080)