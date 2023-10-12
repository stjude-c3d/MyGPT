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

# example json: {"text": "These scaffolds can be divided into three broad categories: PDZ scaffolds, which associate with the distal portions of GPCR carboxyl termini and can couple the GPCR to various signalling proteins such as kinases (for example, protein kinase C (PKC)), phospholipases (for example, phospholipase C (PLC)) and ion channels; non- PDZ scaffolds, such as A kinase anchor proteins (AKAPs), which bind to the cytoplasmic face of GPCRs and also associate with multiple signalling partners including kinases (for example, PKA and PKC), phosphatases (for example, serine/threonine- protein phosphatase 2B (PP2B)) and intracellularly localized receptors (such as inositol 1,4,5-triphosphate receptors (InsP 3Rs) in the endoplasmic reticulum; not shown); and arrestins, which associate with many GPCRs, disrupting G protein–GPCR interactions and driving GPCR internalization via endocytosis, and act as scaffolds to facilitate multiple interactions between GPCRs and cytoplasmic signalling proteins in a G protein- independent manner. Of note, GPCRs themselves can serve as scaffolding proteins for other membrane proteins, including other GPCRs and receptor modifying proteins, as exemplified by receptor activity- modifying proteins (RAMPs) (not shown). JLP , JNK- associated leucine- zipper protein (also known as SPAG9); KSR1, kinase suppressor of RAS1; STAT , signal transducer and activator of transcription. Nature | Vol 587 | 26 November 2020 | 653isoforms with different N termini display unique efficacy profiles in terms of activation of the Gαi subunit, recruitment of β-arrestin, and phosphorylation of ERK1/2 (ref. 19). Isoforms with C-terminal variation mostly show altered coupling, internalization and membrane traf - ficking. For instance, in the thromboxane A2 receptor, a C-terminal variant can still signal via phospholipase C, but inhibits the produc - tion of cyclic AMP instead of stimulating it20. As post-translational modifications can modulate the GPCR life cycle21, we also analysed whether experimentally validated C-terminal phosphorylation sites were preserved in non-reference isoforms. We observed that some isoforms lacked key phosphorylation sites (Extended Data Fig. 3a, b), suggesting possible trafficking differences. Engagement of these residues exposes receptor regions capable of recognizing a conserved G protein selectivity barcode (a pattern of amino acids specific to a given G protein; shown as a barcode logo). Binding to the receptor triggers a universal G protein allosteric mechanism that uncouples interactions between the α1 helix (H1), the α5 helix (H5) and the GDP- binding site of the Gα subunit and leads to GDP release. This allows GDP exchange for GTP and activation of the G protein. Connections between residues reflect inactivating (orange lines) and activating (green lines) contacts between them. Green dashed lines indicate that activation signals do not occur through direct contact. GPCR kinases (grKs). g protein- coupled receptor (gPCr)-regulating protein kinases that phosphorylate intracellular receptor sites and modulate the ability of gPCrs to interact with g proteins and other intracellular transducers. Based on above information, answer this: Are there kinases that phosphorylate GPCRs?"}

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
            top_k=60,
            top_p=0.8,
            do_sample=True
        ):
            answer = x['generated_text'].replace(prompt, '')
            answer_response = { 'response': answer }
        # time to complete in seconds
        time_complete = datetime.datetime.now() - now
        print('response time: ', time_complete)
        print('biogpt: ', answer_response)

    return Response(answer_response, content_type='application/json')