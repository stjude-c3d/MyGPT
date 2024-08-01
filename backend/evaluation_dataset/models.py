from django.db import models
from django.utils import timezone

correction_choice = (
	('yes', 'yes'),
	('no', 'no'),
	('-', '-')
)

question_types = (
	('keyword', 'keyword'),
	('yes/no', 'yes/no'),
	('data_query', 'data_query'),
	('summarization', 'summarization'),
	('complex_question', 'complex_question'),
	('irrelevant_question', 'irrelevant_question'),
	('other', 'other'),
)

answer_tags = (
	('best_1', 'best_1'),
	('best_2', 'best_2'),
	('mygpt_beta', 'mygpt_beta'),
)

class Dataset(models.Model):
	dataset_name = models.CharField(max_length=200, default='-')
	question_count = models.IntegerField(default=0)

	def __str__(self):
		return self.dataset_name
	
class Question(models.Model):
	mygpt_dataset_question_id = models.IntegerField(default=0)
	question_text = models.TextField(default='-')
	question_type = models.CharField(max_length=20, choices=question_types, default='keyword')
	ground_truth = models.TextField(default='-')
	submitter = models.CharField(max_length=200, default='-')
	dataset = models.ForeignKey('Dataset', on_delete=models.CASCADE)

	def __str__(self):
		return self.question_text
	
class Answer(models.Model):
	answer_text = models.TextField(default='-')
	answer_tag = models.CharField(max_length=20, choices=answer_tags, default='best_1')
	correctness = models.CharField(max_length=20, choices=correction_choice, default='-')
	feedback = models.TextField(default='-')
	context = models.TextField(default='-')
	reviewer = models.CharField(max_length=200, default='-')
	question = models.ForeignKey('Question', on_delete=models.CASCADE)
	submission_date_time = models.DateTimeField(default=timezone.now, null=True)