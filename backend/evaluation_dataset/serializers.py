from .models import Dataset, Question, Answer
from rest_framework import serializers

class DatasetSerializer(serializers.ModelSerializer):
	class Meta:
		model = Dataset
		fields = ['dataset_name', 'question_count', 'id']

class QuestionSerializer(serializers.ModelSerializer):
	class Meta:
		model = Question
		fields = ['mygpt_dataset_question_id', 'question_text', 'question_type', 'ground_truth', 'submitter', 'dataset', 'id']

class AnswerSerializer(serializers.ModelSerializer):
	class Meta:
		model = Answer
		fields = ['answer_text', 'answer_tag', 'correctness', 'feedback', 'context', 'reviewer', 'question', 'submission_date_time']