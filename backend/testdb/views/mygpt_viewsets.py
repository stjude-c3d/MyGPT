from ..models import Papers, Question, Answer, Model, EmbeddingModel, DisclaimerAgreement
from ..serializers import ModelSerializer, EmbeddingModelSerializer, PapersSerializer, QuestionSerializer, AnswerSerializer, DisclaimerAgreementSerializer
from rest_framework import viewsets

####################
# API viewSets     #
####################

class ModelViewSet(viewsets.ModelViewSet):
    """
    API endpoint that shows list of models.
    """
    queryset = Model.objects.all()
    serializer_class = ModelSerializer

class EmbeddingModelViewSet(viewsets.ModelViewSet):
    """
    API endpoint that shows list of embedding models.
    """
    queryset = EmbeddingModel.objects.all()
    serializer_class = EmbeddingModelSerializer

class QuestionsViewSet(viewsets.ModelViewSet):
    """
    API endpoint that shows all questions.
    """
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer

class AnswersViewSet(viewsets.ModelViewSet):
    """
    API endpoint that shows all answers.
    """
    queryset = Answer.objects.all()
    serializer_class = AnswerSerializer

class PapersViewSet(viewsets.ModelViewSet):
    """
    API endpoint that shows all papers.
    """
    queryset = Papers.objects.all()
    serializer_class = PapersSerializer

class DisclaimerAgreementViewSet(viewsets.ModelViewSet):
    """
    API endpoint that shows all disclaimer agreements.
    """
    queryset = DisclaimerAgreement.objects.all()
    serializer_class = DisclaimerAgreementSerializer