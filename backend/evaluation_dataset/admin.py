from django.contrib import admin
from .models import Dataset, Question, Answer

class DatasetAdmin(admin.ModelAdmin):
	list_display = ['dataset_name', 'question_count']

class QuestionAdmin(admin.ModelAdmin):
	list_display = ['question_text', 'question_type', 'ground_truth', 'submitter', 'dataset']

class AnswerAdmin(admin.ModelAdmin):
	list_display = ['answer_text', 'answer_tag', 'correctness', 'reviewer', 'question', 'submission_date_time']

admin.site.register(Dataset, DatasetAdmin)
admin.site.register(Question, QuestionAdmin)
admin.site.register(Answer, AnswerAdmin)
