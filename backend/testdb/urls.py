from django.urls import include, path
from rest_framework import routers
from . import views

router = routers.DefaultRouter()
router.register(r'papers', views.PapersViewSet)
router.register(r'datasets', views.DataSetsViewSet)
router.register(r'questions', views.QuestionsViewSet)
router.register(r'answers', views.AnswersViewSet)
router.register(r'scorecard', views.ScoreCardViewSet)

urlpatterns = [
    path('', views.home, name='home'),
    path('api/', include(router.urls)),
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
    path('api/get_papers/', views.get_papers, name='get_paper'),
    path('api/post_question_answer/', views.post_new_question_answer, name='post_question_answer'),
    path('api/biogpt_original/', views.ask_biogpt_org, name='ask_biogpt_original'),
    path('api/biogpt_finetuned/', views.ask_biogpt_ft, name='ask_biogpt_finetuned'),
    path('api/llamology/', views.ask_llamology, name='ask_llamology'),
	path('api/feedback/', views.feedback_for_answers, name='feedback'),
]