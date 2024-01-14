import pytest
from django.test import Client
from django.urls import reverse
from testdb.models import Dataset, Papers
from rest_framework.test import APIClient

@pytest.mark.django_db
class TestModels:
	# test models
	def test_dataset(self):
		# check dataset model
		dataset = Dataset.objects.all()
		assert len(dataset) == 0

	def test_papers(self):
		# check papers model
		papers = Papers.objects.all()
		assert len(papers) == 0

@pytest.mark.django_db
class TestAPI:
	def test_dataset(self):
		# check dataset api
		client = APIClient()
		response = client.get('/api/')
		assert response.status_code == 200

	def test_papers(self):
		# check papers api
		client = APIClient()
		response = client.get('/api/papers/')
		assert response.status_code == 200

	def test_datasets(self):
		# check datasets api
		client = APIClient()
		response = client.get('/api/datasets/')
		assert response.status_code == 200

	def test_questions(self):
		# check questions api
		client = APIClient()
		response = client.get('/api/questions/')
		assert response.status_code == 200

	def test_answers(self):
		# check answers api
		client = APIClient()
		response = client.get('/api/answers/')
		assert response.status_code == 200

@pytest.mark.django_db
class TestViews:
	def test_admin(self):
		# check admin view
		client = Client()
		response = client.get('/admin/')
		assert response.status_code == 302

	def test_get_papers(self):
		# check get_papers view
		client = Client()
		url = reverse('get_paper')
		response = client.get(url)
		print(response)
		assert response.status_code == 200

	def test_papers_with_dataset(self):
		# check papers with dataset view
		client = Client()
		Dataset.objects.create(dataset_name='GPCR', zotero_id='1234', dataset_size=10)
		Papers.objects.create(paper_title='test', paper_dataset=Dataset.objects.get(dataset_name='GPCR'))
		url = reverse('get_paper')
		response = client.get(url, {'dataset': 'GPCR'})
		papaers = response.json()
		assert response.status_code == 200
		assert len(papaers) == 1
		
