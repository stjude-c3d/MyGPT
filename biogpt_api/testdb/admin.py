from django.contrib import admin
from .models import Dataset, Papers, Question, Answer, Source, ScoreCard

class DatasetAdmin(admin.ModelAdmin):
    list_display = ['dataset_name', 'zotero_id', 'dataset_size', 'dataset_date_time']

class PapersAdmin(admin.ModelAdmin):
    list_display = ['paper_title', 'paper_attachment', 'paper_dataset', 'paper_date_time']

class QuestionAdmin(admin.ModelAdmin):
    list_display = ['question_text', 'question_dataset', 'saved_date_time']

class AnswerAdmin(admin.ModelAdmin):
    list_display = ['answer_text', 'model_type', 'rating', 'question', 'saved_date_time']

class SourceAdmin(admin.ModelAdmin):
    list_display = ['source_paper', 'source_page', 'context', 'distance', 'answer']

class ScoreCardAdmin(admin.ModelAdmin):
    list_display = ['question', 'chatGPT', 'AI21', 'OpenAssistant', 'BioGPT']

admin.site.register(Dataset, DatasetAdmin)
admin.site.register(Papers, PapersAdmin)
admin.site.register(Question, QuestionAdmin)
admin.site.register(Answer, AnswerAdmin)
admin.site.register(Source, SourceAdmin)
admin.site.register(ScoreCard, ScoreCardAdmin)
