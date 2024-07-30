from django.urls import include, path
from rest_framework import routers
from .views import DatasetViewSet, QuestionViewSet, AnswerViewSet, get_question_by_id

router = routers.DefaultRouter()
router.register(r'libraries', DatasetViewSet)
router.register(r'questions', QuestionViewSet)
router.register(r'answers', AnswerViewSet)

urlpatterns = [
	path('', include(router.urls)),
	path('get_question_by_id/', get_question_by_id, name='get_question_by_id'),
]