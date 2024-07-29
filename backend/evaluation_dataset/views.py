from .models import Dataset, Question, Answer
from .serializers import DatasetSerializer, QuestionSerializer, AnswerSerializer
from rest_framework import viewsets, permissions

####################
# API viewSets     #
####################

class DatasetViewSet(viewsets.ModelViewSet):
	"""
	API endpoint that shows list of datasets.
	"""
	queryset = Dataset.objects.all()
	serializer_class = DatasetSerializer
	permission_classes = [permissions.IsAuthenticated]


class QuestionViewSet(viewsets.ModelViewSet):
	"""
	API endpoint that shows all questions.
	"""
	queryset = Question.objects.all()
	serializer_class = QuestionSerializer
	permission_classes = [permissions.IsAuthenticated]

class AnswerViewSet(viewsets.ModelViewSet):
	"""
	API endpoint that shows all answers.
	"""
	queryset = Answer.objects.all()
	serializer_class = AnswerSerializer
	permission_classes = [permissions.IsAuthenticated]
