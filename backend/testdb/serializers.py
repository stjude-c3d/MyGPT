from .models import Model, Dataset, Papers, chunks, Conversation, Question, Answer, Source, FrontEndSettings
from rest_framework import serializers

class ModelSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Model
        fields = ['model_name', 'model_size']

class DatasetSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Dataset
        fields = ['dataset_name', 'zotero_id', 'dataset_size', 'dataset_date_time', 'user', 'user_email', 'user_group', 'embedding_model', 'embedding_added', 'direct_chat_without_docs']

class PapersSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Papers
        fields = ['paper_title', 'paper_attachment', 'paper_dataset', 'paper_date_time']

class ChunksSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = chunks
        fields = ['chunk_text', 'embedding', 'pca_x', 'pca_y', 'pca_z', 'chunk_dataset', 'chunk_paper', 'chunk_date_time']

class QuestionSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Question
        fields = ['question_text', 'ground_truth', 'question_dataset', 'saved_date_time']

class ConversationSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Conversation
        fields = ['conversation_dataset', 'question_answer_count', 'user', 'start_date_time', 'last_date_time']

class AnswerSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Answer
        fields = ['answer_text', 'model_type', 'rating', 'user_comment', 'saved_date_time', 'question']

class SourceSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Source
        fields = ['source_doc', 'source_pointer', 'context', 'distance', 'question']

class FrontEndSettingsSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = FrontEndSettings
        fields = ['show_no_context_switch', 'azure_login', 'restriction_without_login', 'saved_date_time']