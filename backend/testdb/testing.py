import pandas as pd
import pdfkit
dataset_name = 'BRAF_TEST'
base_name = 'data/pdfs/'+ dataset_name +'/paper1'
df = pd.read_excel(base_name + '.xlsx')
df.to_html(base_name + '.html')
pdfkit.from_file(base_name + '.html', base_name + '.pdf')