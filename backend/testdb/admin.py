from django.contrib import admin
from .models import Model, Dataset, Papers, Conversation, Question, Answer, Source, FrontEndSettings

class ModelAdmin(admin.ModelAdmin):
    list_display = ['model_name', 'model_size']

class DatasetAdmin(admin.ModelAdmin):
    list_display = ['dataset_name', 'zotero_id', 'dataset_size', 'user', 'user_email', 'user_group', 'dataset_date_time']

class PapersAdmin(admin.ModelAdmin):
    list_display = ['paper_title', 'paper_attachment', 'highlited_attachment', 'paper_dataset', 'paper_date_time']

class ConversationAdmin(admin.ModelAdmin):
    list_display = ['id', 'question_answer_count', 'start_date_time', 'last_date_time', 'conversation_dataset', 'user']

class QuestionAdmin(admin.ModelAdmin):
    list_display = ['question_text', 'question_dataset', 'confidence_score' ,'conversation', 'saved_date_time']

class AnswerAdmin(admin.ModelAdmin):
    list_display = ['answer_text', 'model_type', 'rating', 'question', 'saved_date_time']

class SourceAdmin(admin.ModelAdmin):
    list_display = ['source_paper', 'source_page', 'context', 'distance', 'question']

class FrontEndSettingsAdmin(admin.ModelAdmin):
    list_display = ['show_no_context_switch', 'azure_login', 'saved_date_time']

admin.site.register(Model, ModelAdmin)
admin.site.register(Dataset, DatasetAdmin)
admin.site.register(Papers, PapersAdmin)
admin.site.register(Conversation, ConversationAdmin)
admin.site.register(Question, QuestionAdmin)
admin.site.register(Answer, AnswerAdmin)
admin.site.register(Source, SourceAdmin)
admin.site.register(FrontEndSettings, FrontEndSettingsAdmin)