from django.urls import include, path
from rest_framework import routers
from . import views

router = routers.DefaultRouter()
router.register(r'questions', views.QuestionsViewSet)
router.register(r'answers', views.AnswersViewSet)

urlpatterns = [
    path('', views.home, name='home'),
    path('api/', include(router.urls)),
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
    # path('api/biogpt_original/', views.ask_biogpt_org, name='ask_biogpt_original'),
    # path('api/biogpt_finetuned/', views.ask_biogpt_ft, name='ask_biogpt_finetuned'),
    path('api/llama2/', views.ask_llamology, name='ask_llamology')
]