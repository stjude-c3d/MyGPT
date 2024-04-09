from django.db import models
from django.utils import timezone

model_types = (
	('chatGPT', 'chatGPT'),
	('AI21', 'AI21'),
	('BioGPT', 'BioGPT'),
	('BioGPT-ft', 'BioGPT-ft'),
	('Llama2', 'Llama2'),
	('Llama2-ft', 'Llama2-ft'),
	('-', '-')
)

rating_types = (
	(1, 'positive'),
	(0, 'neutral'),
	(-1, 'negative'),
)

class Dataset(models.Model):
	dataset_name = models.CharField(max_length=200, default='-')
	zotero_id = models.CharField(max_length=40, default='-')
	dataset_size = models.IntegerField(default=0)
	user = models.CharField(max_length=200, default='-')
	user_email = models.CharField(max_length=200, default='-')
	user_group = models.CharField(max_length=200, default='-')
	dataset_date_time = models.DateTimeField(default=timezone.now, null=True)

	def __str__(self):
		return self.dataset_name

class Papers(models.Model):
	paper_title = models.TextField(default='-')
	paper_attachment = models.FileField(upload_to='papers', default='-')
	highlited_attachment = models.FileField(upload_to='papers', default='-')
	paper_dataset = models.ForeignKey('Dataset', on_delete=models.CASCADE)
	paper_date_time = models.DateTimeField(default=timezone.now, null=True)

	class Meta:
		verbose_name_plural = 'papers'
		verbose_name = 'paper'

	def __str__(self):
		return self.paper_title
	
class chunks(models.Model):
	chunk_text = models.TextField(default='-')
	embedding = models.TextField(default='-')
	pca_x = models.FloatField(default=0)
	pca_y = models.FloatField(default=0)
	pca_z = models.FloatField(default=0)
	chunk_dataset = models.ForeignKey(Dataset, on_delete=models.CASCADE)
	chunk_paper = models.ForeignKey(Papers, on_delete=models.CASCADE)
	chunk_date_time = models.DateTimeField(default=timezone.now, null=True)

	class Meta:
		verbose_name_plural = 'chunks'
		verbose_name = 'chunk'

	def __str__(self):
		return (str(self.chunk_dataset) + '-' + str(self.id))
	
class Conversation(models.Model):
	conversation_dataset = models.ForeignKey('Dataset', on_delete=models.CASCADE)
	question_answer_count = models.IntegerField(default=0)
	user = models.CharField(max_length=200, default='-')
	start_date_time = models.DateTimeField(default=timezone.now, null=True)
	last_date_time = models.DateTimeField(default=timezone.now, null=True)

	def __str__(self):
		return str(self.id)

class Question(models.Model):
	question_text = models.TextField(default='-')
	relevance_score = models.FloatField(default=0)
	model_type =  models.ForeignKey('Model', on_delete=models.SET_DEFAULT, default=2)
	question_dataset = models.ForeignKey('Dataset', on_delete=models.CASCADE)
	conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE)
	saved_date_time = models.DateTimeField(default=timezone.now, null=True)

class Answer(models.Model):
	answer_text = models.TextField(default='-')
	model_type =  models.ForeignKey('Model', on_delete=models.SET_DEFAULT, default=2)
	temperature = models.FloatField(default=1)
	relevance_score = models.FloatField(default=0)
	rating = models.IntegerField(choices=rating_types, default=0)
	user_comment = models.TextField(default='-')
	saved_date_time = models.DateTimeField(default=timezone.now, null=True)
	question = models.ForeignKey(Question, on_delete=models.CASCADE)

class Source(models.Model):
	source_paper = models.TextField(default='-')
	source_page = models.IntegerField(default=0)
	context = models.TextField(default='-')
	distance = models.FloatField(default=0)
	question = models.ForeignKey(Question, on_delete=models.CASCADE, null=True)

	def __str__(self):
		return self.source_paper[:15] + ', p.' + str(self.source_page)

class Model(models.Model):
	model_name = models.CharField(max_length=200, default='-')
	model_size =  models.CharField(max_length=40, default='-')

	def __str__(self):
		return self.model_name
	
class FrontEndSettings(models.Model):
	show_no_context_switch = models.BooleanField(default=False)
	azure_login = models.BooleanField(default=False)
	saved_date_time = models.DateTimeField(default=timezone.now, null=True)