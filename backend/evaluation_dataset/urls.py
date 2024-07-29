from django.urls import include, path
from rest_framework import routers
from .views import DatasetViewSet, QuestionViewSet, AnswerViewSet

router = routers.DefaultRouter()
router.register(r'libraries', DatasetViewSet)
router.register(r'questions', QuestionViewSet)
router.register(r'answers', AnswerViewSet)

urlpatterns = [
	path('', include(router.urls))
]