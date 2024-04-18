from datasets import Dataset, load_dataset
from ragas import evaluate
from ragas.metrics import (answer_relevancy, answer_similarity, context_entity_recall)
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.chat_models import ChatOllama
import os

embeddings = HuggingFaceEmbeddings(model_name="multi-qa-MiniLM-L6-cos-v1")
llm = ChatOllama(model="llama2", base_url="http://ollama:11434")

os.environ["RAGAS_DO_NOT_TRACK"] = "false"

# ping localhost:11434



# data_samples = {
# 	'question': ['What is the capital of France?'],
# 	'answer': ['Paris'],
# 	'contexts': [['France is a country in Europe.', 'Paris is the capital of France.', 'The Eiffel Tower is in Paris.', 'The Louvre is in Paris.']],
# 	'ground_truth': ['Paris']
# }

# data_sample = {'question': ['Which private companies in the Americas are the largest GHG emitters according to the Carbon Majors database?'],
#  'ground_truth': ['The largest private companies in the Americas that are the largest GHG emitters according to the Carbon Majors database are ExxonMobil, Chevron, and Peabody.'],
#  'answer': ['According to the Carbon Majors database, the largest private companies in the Americas that are the largest GHG emitters are:\n\n1. Chevron Corporation (United States)\n2. ExxonMobil Corporation (United States)\n3. ConocoPhillips Company (United States)\n4. BP plc (United Kingdom, but with significant operations in the Americas)\n5. Royal Dutch Shell plc (Netherlands, but with significant operations in the Americas)\n6. Peabody Energy Corporation (United States)\n7. Duke Energy Corporation (United States)\n8. TotalEnergies SE (France, but with significant operations in the Americas)\n9. BHP Group Limited (Australia, but with significant operations in the Americas)\n10. Rio Tinto Group (United Kingdom/Australia, but with significant operations in the Americas)\n\nPlease note that the rankings may change over time as new data becomes available.'],
#  'contexts': [['The private companies responsible for the most emissions during this period, according to the database, are from the United States: ExxonMobil, Chevron and Peabody.\nThe largest emitter amongst state-owned companies in the Americas is Mexican company Pemex, followed by Venezuelan company Petróleos de Venezuela, S.A.']]}

data_sample = {'question': ['What does MMS stand for in the publication "Death by a thousand cuts through kinase inhibitor combinations that maximize selectivity and enable rational multitargeting"?'], 'ground_truth': ['MMS stands for Multi-compound-multitarget scoring'], 'contexts': [['MMS greatly enhances  selectivity in rational multitargeting applications. The MMS framework is generalizable to other non-  kinase biological targets where compound selectivity is a challenge and diverse compound libraries  are available. Editor\'s evaluation This study presents a valuable finding on a multi- compound- multitarget scoring (MMS) method  that combines inhibitors to maximize target inhibition and to minimize off- target inhibition. The  strategy may enable the optimization of inhibitor combinations for multiple on- targets. The evidence  supporting the claims of the authors is solid. The work will be of interest to pharmacology scientists  working in both academic and industrial sectors. Introduction The off- target effects of pharmacologic compounds against unintended targets represent a major  challenge in biomedical research.','Importantly, even in cases where using N inhibitors may be the most selective method of inhib- iting an equal number (N) of kinases, the most selective inhibitor combination does not necessarily  consist of the most selective single inhibitors against each respective kinase. MMS identifies the most  selective inhibitor set in these cases, which might not be appreciated with other selectivity evaluation  methods that score the selectivity of individual compounds. Here, we detail the implementation of the MMS framework within the scope of direct target  engagement for biomedical research. Extension of MMS to phenotypic cellular assays or in vivo  models would require additional modeling including phosphoproteomics, pharmacodynamics, and  pharmacokinetics. The global and high- off- target selectivity gains enabled by MMS lead us to hypoth- esize that it would be advantageous to test MMS candidate combinations on cellular phenotypes.  MMS may be of particular interest for rational multitargeting of therapeutic targets, such as kinases  with compensatory signaling mechanisms or those at different stages of the same signaling pathway.']], 'answer': ['MMS stands for Multi-compound-multitarget scoring, which is a method used to evaluate and optimize drug combinations for multiple targets.']}

dataset = Dataset.from_dict(data_sample)

#### amnesty test case
# amnesty_qa = load_dataset("explodinggradients/amnesty_qa", "english_v2")
# dataset = amnesty_qa["eval"]

# contexts = []
# for context in dataset[0]["contexts"]:
# 	contexts.append(str(context))
# sample_dataset = {
# 	"question": [str(dataset[0]["question"])],
# 	"answer": [str(dataset[0]["answer"])],
# 	"contexts": [contexts],
# 	"ground_truth": [str(dataset[0]["ground_truth"])]
# }

# print(amnesty_qa['eval'][0])
# print(sample_dataset)

# scores = evaluate(dataset, metrics=[faithfulness, answer_correctness], embeddings=embeddings, llm=llm)
scores = evaluate(dataset, metrics=[context_entity_recall, answer_similarity, answer_relevancy], embeddings=embeddings, llm=llm)

print(scores)