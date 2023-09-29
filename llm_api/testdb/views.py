from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework.parsers import JSONParser
from rest_framework import viewsets
from .models import Question, Answer
from .serializers import QuestionSerializer, AnswerSerializer
from django.apps import apps
import json

app_config = apps.get_app_config('testdb')

def home(request):
    # load GPCR data from GPCRdb Rest api query
    questions = Question.objects.all()

    # load TGGA variant data from csv file
    answers = Answer.objects.all()

    return render(request, 'home.html', {'questions': questions, 'answers': answers})

####################
# API viewSets     #
####################

class QuestionsViewSet(viewsets.ModelViewSet):
    """
    API endpoint that shows protein families.
    """
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer

class AnswersViewSet(viewsets.ModelViewSet):
    """
    API endpoint that shows protein families.
    """
    queryset = Answer.objects.all()
    serializer_class = AnswerSerializer

####################
# APIs             #
####################

@api_view(['POST'])

# example JSON: {"text":"<s>[INST] <<SYS>> You are a helpful, respectful, and honest assistant. Always answer as helpfully as possible, while being safe. Your answers should not include any harmful, unethical, racist, sexist, toxic, dangerous, or illegal content. Please ensure that your responses are socially unbiased and positive in nature. If a question does not make any sense or is not factually coherent, explain why instead of answering something not correct. You will answer the given query denoted by '[Query]' using context, denoted by '[Context]'. The context will come from various sources. Certain pieces of context will be irrelevant, while others will be relevant. Use relevant pieces of context to respond to the query. <</SYS>> [Context] Structure of the Abl excited state 1 (E 1) To gain structural insight into the low-populated conformational states that Abl samples, we directly measured the 13C chemical shift of the methyls in these two states from the corresponding CEST profiles (Fig. 1C). We next compared the chemical shifts of these two states to the chemical shifts of Abl in complex with twelve different inhibitors (fig. S4). Structural data ( 28, 45–52) have shown that these inhibitors can capture Abl in distinct conformational states and thus we asked whether any of the low-populated conformational states sampled by unliganded Abl resembles an inhibitor-bound state. [Query] How many conformational states Abl1 has? [/INST] [Reply] "}

# example JSON: {"text":"<s>[INST] <<SYS>> You are a helpful, respectful, and honest assistant. Always answer as helpfully as possible, while being safe. Your answers should not include any harmful, unethical, racist, sexist, toxic, dangerous, or illegal content. Please ensure that your responses are socially unbiased and positive in nature. If a question does not make any sense or is not factually coherent, explain why instead of answering something not correct. You will answer the given query denoted by '[Query]' using context, denoted by '[Context]'. The context will come from various sources. Certain pieces of context will be irrelevant, while others will be relevant. Use relevant pieces of context to respond to the query. <</SYS>> [Context] Given the current rate of advancements in the eld, it is only a matter of a few years before structures of the inactive states of small GPCRs can be determined routinely without the requirement for anti- bodies or other binding partners. Conclusions Cryo-EM has rapidly become the method of choice for the determination of GPCR structures coupled to either a G protein or -arrestin, and in many instances has become almost routine. Cryo-EM is also more tolerant than X-ray crystallography in terms of sample quality and quantity, as small amounts of puri ed protein ( 100mg), with some degree of receptor heterogeneity and the presence of con- taminants can still allow a cryo-EM structure to be determined, but would invariably prevent the formation of good crystals. This is because processing of cryo-EM images can separate molecules of receptor with the sameconformation and use these to determine a structure. Thus, out of 5 10 million particles in a typical cryo-EM dataset, only 100 000 300 000 particles may be used to form the nal cryo-EM map. In contrast, in a GPCR crystal every molecule needs to be precisely aligned with its identical neighbour to be able to generate a diffrac-tion pattern suitable to determine an electron density map. In a single thin GPCR crystal 1020mm long there are about a billion identical molecules, which is 10 000 times more than is required for a cryo-EM structure. In contrast with X-ray crystallography, cryo-EM has proven to be an ideal technique for determining the structures of GPCR-G protein and GPCR-arrestin complexes. This has arisen from concerted developments over the past 10 years in new electron microscopes, direct electron detectors and image processing software,that together have transformed single-particle cryo-EM [ 3436]. The rst GPCR-G protein cryo-EM structure was determined in 2017 [ 37] and since then there has been an explosion of active state GPCR cryo-EM struc- tures, which include previously intractable GPCR classes [ 38,39], complexes with different G proteins [ 6], -arrestins [ 9,10,12](Figure 1 ) and a G protein-coupled receptor kinase [ 40].  [Query] How Cryo-EM is helping GPCR reserach?[/INST] [Reply]"}
def ask_llamology(request):
    answer = ''
    if request.method == 'POST':
        request_str = request.body.decode('utf-8')
        prompt = request_str.replace('{"text": "', '').replace('"}', '')
        print(prompt)
        output = app_config.llama2(prompt, max_tokens=2024, temperature=0, top_k=10, top_p=0.1, echo=True)
        answer = output['choices'][0]['text'].replace(prompt, '')
        answer_response = { 'response': answer }
        print(answer_response)

    return Response(answer_response, content_type='application/json')