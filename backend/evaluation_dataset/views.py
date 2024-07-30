from .models import Dataset, Question, Answer
from .serializers import DatasetSerializer, QuestionSerializer, AnswerSerializer
from rest_framework.decorators import api_view
from rest_framework.response import Response
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

@api_view(['GET'])
def get_question_by_id(request):
	"""
	API endpoint that shows a question and answers by id.
	"""
	if request.method == 'GET':
		question_id = request.GET.get('question_id')
		response_data = {}
		question = Question.objects.get(id=question_id)
		answers = Answer.objects.filter(question=question)
		question.answers = answers
		question_data = QuestionSerializer(question).data
		response_data['question'] = question_data
		response_data['answers'] = AnswerSerializer(answers, many=True).data
		return Response(response_data)