from .models import Dataset, Papers, Question, Answer, Source, ScoreCard
from rest_framework import serializers

class DatasetSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Dataset
        fields = ['dataset_name', 'zotero_id', 'dataset_size', 'dataset_date_time']

class PapersSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Papers
        fields = ['paper_title', 'paper_attachment', 'paper_dataset', 'paper_date_time']

class QuestionSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Question
        fields = ['question_text', 'question_dataset', 'saved_date_time']


class AnswerSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Answer
        fields = ['answer_text', 'model_type', 'rating', 'user_comment', 'saved_date_time', 'question']

class SourceSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Source
        fields = ['source_paper', 'source_page', 'context', 'distance', 'answer']

class ScoreCardSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = ScoreCard
        fields = ['question', 'chatGPT', 'AI21', 'OpenAssistant', 'BioGPT']