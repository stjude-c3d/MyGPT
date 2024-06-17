import json
f = open('results/query_results_llama3_embed1.json')
text = f.readlines()
fulltext = ""

for line in text:
    fulltext += line
print(json.loads(fulltext))