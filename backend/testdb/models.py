from django.db import models
from django.utils import timezone

model_types = (
	('chatGPT', 'chatGPT'),
	('AI21', 'AI21'),
	('BioGPT', 'BioGPT'),
	('BioGPT-ft', 'BioGPT-ft'),
	('Llama3', 'Llama3'),
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
	embedding_added = models.BooleanField(default=False)
	embedding_model = models.CharField(max_length=60, default='-')
	direct_chat_without_docs = models.BooleanField(default=False)
	dataset_date_time = models.DateTimeField(default=timezone.now, null=True)

	def __str__(self):
		return self.dataset_name

class Papers(models.Model):
	paper_title = models.TextField(default='-')
	paper_attachment = models.FileField(upload_to='papers', default='-')
	highlighted_attachment = models.FileField(upload_to='papers', default='-')
	paper_dataset = models.ForeignKey('Dataset', on_delete=models.CASCADE)
	paper_date_time = models.DateTimeField(default=timezone.now, null=True)

	class Meta:
		verbose_name_plural = 'papers'
		verbose_name = 'paper'

	def __str__(self):
		return self.paper_title
	
class Videos(models.Model):
	video_title = models.TextField(default='-')
	video_link = models.TextField(default='-')
	video_dataset = models.ForeignKey('Dataset', on_delete=models.CASCADE)
	video_date_time = models.DateTimeField(default=timezone.now, null=True)

	class Meta:
		verbose_name_plural = 'videos'
		verbose_name = 'video'

	def __str__(self):
		return self.video_title
	
class chunks(models.Model):
	chunk_text = models.TextField(default='-')
	embedding = models.TextField(default='-')
	pca_x = models.FloatField(default=0)
	pca_y = models.FloatField(default=0)
	pca_z = models.FloatField(default=0)
	chunk_dataset = models.ForeignKey(Dataset, on_delete=models.CASCADE)
	chunk_paper = models.ForeignKey(Papers, on_delete=models.CASCADE, null=True)
	chunk_video = models.ForeignKey(Videos, on_delete=models.CASCADE, null=True)
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
	ground_truth = models.TextField(default='-')
	embedding = models.TextField(default='-')
	pca_x = models.FloatField(default=0)
	pca_y = models.FloatField(default=0)
	pca_z = models.FloatField(default=0)
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
	embedding = models.TextField(default='-')
	pca_x = models.FloatField(default=0)
	pca_y = models.FloatField(default=0)
	pca_z = models.FloatField(default=0)
	saved_date_time = models.DateTimeField(default=timezone.now, null=True)
	question = models.ForeignKey(Question, on_delete=models.CASCADE)

class Source(models.Model):
	source_doc = models.TextField(default='-')
	source_pointer = models.IntegerField(default=0)
	context = models.TextField(default='-')
	distance = models.FloatField(default=0)
	chunk = models.ForeignKey(chunks, on_delete=models.CASCADE, null=True)
	question = models.ForeignKey(Question, on_delete=models.CASCADE, null=True)

	def __str__(self):
		return self.source_doc[:15] + ', p.' + str(self.source_pointer)

class Model(models.Model):
	model_name = models.CharField(max_length=200, default='-')
	model_size =  models.CharField(max_length=40, default='-')

	def __str__(self):
		return self.model_name
	
class FrontEndSettings(models.Model):
	show_no_context_switch = models.BooleanField(default=False)
	azure_login = models.BooleanField(default=False)
	saved_date_time = models.DateTimeField(default=timezone.now, null=True)
	restriction_without_login = models.BooleanField(default=False)

	class Meta:
		verbose_name_plural = 'FrontEndSettings'
		verbose_name = 'FrontEndSettings'