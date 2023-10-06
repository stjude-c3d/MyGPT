from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework.parsers import JSONParser
from rest_framework import viewsets
from .models import Question, Answer
from .serializers import QuestionSerializer, AnswerSerializer
from django.apps import apps
import datetime

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

# example json: {"text": "Structure of the Abl excited state 1 (E 1) To gain structural insight into the low-populated conformational states that Abl samples, we directly measured the 13C chemical shift of the methyls in these two states from the corresponding CEST profiles (Fig. 1C). We next compared the chemical shifts of these two states to the chemical shifts of Abl in complex with twelve different inhibitors (fig. S4). Structural data ( 28, 45–52) have shown that these inhibitors can capture Abl in distinct conformational states and thus we asked whether any of the low-populated conformational states sampled by unliganded Abl resembles an inhibitor-bound state. Based on above information answer this: How many conformational states Abl1 has?"}

# example json: {"text": "Given the current rate of advancements in the eld, it is only a matter of a few years before structures of the inactive states of small GPCRs can be determined routinely without the requirement for anti- bodies or other binding partners. Conclusions Cryo-EM has rapidly become the method of choice for the determination of GPCR structures coupled to either a G protein or -arrestin, and in many instances has become almost routine. Cryo-EM is also more tolerant than X-ray crystallography in terms of sample quality and quantity, as small amounts of puri ed protein ( 100mg), with some degree of receptor heterogeneity and the presence of con- taminants can still allow a cryo-EM structure to be determined, but would invariably prevent the formation of good crystals. This is because processing of cryo-EM images can separate molecules of receptor with the sameconformation and use these to determine a structure. Thus, out of 5 10 million particles in a typical cryo-EM dataset, only 100 000 300 000 particles may be used to form the nal cryo-EM map. In contrast, in a GPCR crystal every molecule needs to be precisely aligned with its identical neighbour to be able to generate a diffrac-tion pattern suitable to determine an electron density map. In a single thin GPCR crystal 1020mm long there are about a billion identical molecules, which is 10 000 times more than is required for a cryo-EM structure. In contrast with X-ray crystallography, cryo-EM has proven to be an ideal technique for determining the structures of GPCR-G protein and GPCR-arrestin complexes. This has arisen from concerted developments over the past 10 years in new electron microscopes, direct electron detectors and image processing software,that together have transformed single-particle cryo-EM [ 3436]. The rst GPCR-G protein cryo-EM structure was determined in 2017 [ 37] and since then there has been an explosion of active state GPCR cryo-EM struc- tures, which include previously intractable GPCR classes [ 38,39], complexes with different G proteins [ 6], -arrestins [ 9,10,12](Figure 1 ) and a G protein-coupled receptor kinase [ 40].  Based on above information, answer this: How Cryo-EM is helping GPCR reserach?"}

@api_view(['POST'])
def ask_biogpt(request):

    # current time
    now = datetime.datetime.now()
    answer = ''
    if request.method == 'POST':
        request_str = request.body.decode('utf-8')
        prompt = request_str.replace('{"text": "', '').replace('"}', '')
        print(prompt)
        # output = biogpt_generator(prompt, max_length=2024, num_return_sequences=1, do_sample=True)
        for x in app_config.biogpt_generator(
            prompt,
            temperature=0.4,
            max_new_tokens=4024,
            num_return_sequences=1,
            top_k=40,
            top_p=0.4,
            do_sample=True
        ):
            answer = x['generated_text'].replace(prompt, '')
            answer_response = { 'response': answer }
        # time to complete in seconds
        time_complete = datetime.datetime.now() - now
        print('response time: ', time_complete)
        # answer = output[0]['generated_text'].replace(prompt, '')
        # answer_response = { 'response': answer }
        print('biogpt: ', answer_response)

    return Response(answer_response, content_type='application/json')