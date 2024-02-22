from django.urls import include, path
from rest_framework import routers
from . import views

router = routers.DefaultRouter()
router.register(r'llms', views.ModelViewSet)
router.register(r'papers', views.PapersViewSet)
router.register(r'datasets', views.DataSetsViewSet)
router.register(r'questions', views.QuestionsViewSet)
router.register(r'answers', views.AnswersViewSet)

urlpatterns = [
    path('', views.home, name='home'),
    path('api/', include(router.urls)),
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
    path('api/get_papers/', views.get_papers, name='get_paper'),
	path('api/get_context/', views.get_context, name='get_context'),
	path('api/save_answer/', views.save_answer, name='save_answer'),
	path('api/feedback/', views.feedback_for_answers, name='feedback'),
	path('api/delete_dataset/', views.delete_dataset, name='delete_dataset'),
	path('api/add_zotero_collection/', views.add_zotero_dataset, name='add_zotero_collection'),
	path('api/upload_documents/', views.upload_documents, name='upload_documents'),
	path('api/add_ollama_models/', views.add_ollama_models, name='add_ollama_models'),
]