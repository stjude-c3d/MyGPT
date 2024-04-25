from django.urls import include, path
from rest_framework import routers
from . import views

router = routers.DefaultRouter()
router.register(r'llms', views.ModelViewSet)
router.register(r'papers', views.PapersViewSet)
router.register(r'questions', views.QuestionsViewSet)
router.register(r'answers', views.AnswersViewSet)

urlpatterns = [
    path('', views.home, name='home'),
    path('api/', include(router.urls)),
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
	path('api/get_datasets/', views.get_datasets, name='get_datasets'),
    path('api/get_documents/', views.get_documents, name='get_documents'),
	path('api/get_context/', views.get_context, name='get_context'),
	path('api/get_conversation_history/', views.get_conversations_by_dataset, name='conversation_history'),
	path('api/get_question_details/', views.get_question_details, name='get_question_details'),
	path('api/save_answer/', views.save_answer, name='save_answer'),
	path('api/feedback/', views.feedback_for_answers, name='feedback'),
	path('api/delete_dataset/', views.delete_dataset, name='delete_dataset'),
	path('api/add_zotero_collection/', views.add_zotero_dataset, name='add_zotero_collection'),
	path('api/upload_documents/', views.upload_documents, name='upload_documents'),
	path('api/add_ollama_models/', views.add_ollama_models, name='add_ollama_models'),
	path('api/frontend_settings/', views.get_frontend_settings, name='frontend_settings'),
	path('api/add_demo_library/', views.add_demo_dataset_api, name='add_demo_dataset'),
	path('api/add_video_library/', views.add_video_library, name='add_video_library'),
]