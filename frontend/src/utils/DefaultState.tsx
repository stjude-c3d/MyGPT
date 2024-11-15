const defaultSettings = {
	showSettings: false,
	showLogin: false,
	loggedin: false,
	darkMode: false,
	settingsPanels: [ 
		{key:'datasets', text:'Publication libraries'},
		{key:'llms', text:'LLMs'},
		{key:'llm_parameters', text:'Prompt and LLM parameters'},
		{key:'embedding_models', text:'Embedding Models'},
		{key:'relevance_score', text:'Relevance score parameters'},
],
	selectedPanel: 'datasets',
	llms: [process.env.REACT_APP_DEFAULT_LLM || 'llama3:latest'],
    defaultLlm: process.env.REACT_APP_DEFAULT_LLM || 'llama3:latest',
	selectedLlm: process.env.REACT_APP_DEFAULT_LLM || 'llama3:latest',
    datasets: ['None'],
	defaultDataset: 'None',
    selectedDataset: 'None',
	fetchDatasets: true,
	datasetsUpdated: false,
    defaultEmbeddingModel: 'multi-qa-MiniLM-L6-cos-v1',
	selectedEmbeddingModel: 'multi-qa-MiniLM-L6-cos-v1',
	embedding_models: [
		'multi-qa-MiniLM-L6-cos-v1',
		'all-MiniLM-L6-v2',
		'all-MiniLM-L12-v2',
		'all-mpnet-base-v2', 
		'multi-qa-mpnet-base-dot-v1',
		'paraphrase-albert-small-v2',
		'snowflake-arctic-embed:latest',
		'nomic-embed-text:latest',
		'bge-m3:latest',
		'mxbai-embed-large:latest'
	],
    system_prompt: 'Use following information to answer the question in less than 200 words, try not to use anything else:',
	direct_chat_system_prompt: 'Answer the question in less than 200 words.',
	fetchPapers: false,
	temperature: 0.4,
	top_k: 20,
	top_p: 0.7,
	relevance_score_cutoff: {
		question_best: 0.2,
		question_worst: 1.7,
		answer_best: 0.12,
		answer_worst: 1.42,
		HIa: 1,
		HIb: 0.33,
		HIc: 0.67,
	},
	use_default_qrs: true,
	use_default_ars: true,
	use_default_hi: true,
	restriction_without_login: false,
	answerWithoutContext: false,
	papers: [
		{
			"paper_title": "Control of G protein-coupled receptor function via membrane-interacting intrinsically disordered C-terminal domains",
			"paper_attachment": "./papers/paper1.pdf",
			"highlited_attachment": "-",
			"paper_dataset": 70,
			"paper_date_time": "2024-03-03T07:10:38.676Z"
		},
		{
			"paper_title": "Analysis of single-cell transcriptomes links enrichment of olfactory receptors with cancer cell differentiation status and prognosis",
			"paper_attachment": "./papers/paper2.pdf",
			"highlited_attachment": "-",
			"paper_dataset": 70,
			"paper_date_time": "2024-03-03T07:10:38.780Z"
		},
		{
			"paper_title": "Allosteric Modulation of GPCRs of Class A by Cholesterol",
			"paper_attachment": "./papers/paper3.pdf",
			"highlited_attachment": "-",
			"paper_dataset": 70,
			"paper_date_time": "2024-03-03T07:10:38.880Z"
		},
		{
			"paper_title": "GPCRs in Autocrine and Paracrine Regulations",
			"paper_attachment": "papers/paper4.pdf",
			"highlited_attachment": "-",
			"paper_dataset": 70,
			"paper_date_time": "2024-03-03T07:10:38.914Z"
		},
		{
			"paper_title": "Targeting GPCRs and Their Signaling as a Therapeutic Option in Melanoma",
			"paper_attachment": "papers/paper5.pdf",
			"highlited_attachment": "-",
			"paper_dataset": 70,
			"paper_date_time": "2024-03-03T07:10:38.929Z"
		},
		{
			"paper_title": "Targeting GPCRs to treat cardiac fibrosis",
			"paper_attachment": "papers/paper6.pdf",
			"highlited_attachment": "-",
			"paper_dataset": 70,
			"paper_date_time": "2024-03-03T07:10:38.951Z"
		},
		{
			"paper_title": "Structure determination of GPCRs: cryo-EM compared with X-ray crystallography",
			"paper_attachment": "papers/paper7.pdf",
			"highlited_attachment": "-",
			"paper_dataset": 70,
			"paper_date_time": "2024-03-03T07:10:38.965Z"
		},
		{
			"paper_title": "Common activation mechanism of class A GPCRs",
			"paper_attachment": "papers/paper8.pdf",
			"highlited_attachment": "-",
			"paper_dataset": 70,
			"paper_date_time": "2024-03-03T07:10:38.981Z"
		},
		{
			"paper_title": "Selectivity determinants of GPCR–G-protein binding",
			"paper_attachment": "papers/paper9.pdf",
			"highlited_attachment": "-",
			"paper_dataset": 70,
			"paper_date_time": "2024-03-03T07:10:39.039Z"
		},
		{
			"paper_title": "Mechanisms of signalling and biased agonism in G protein-coupled receptors",
			"paper_attachment": "papers/paper10.pdf",
			"highlited_attachment": "-",
			"paper_dataset": 70,
			"paper_date_time": "2024-03-03T07:10:39.164Z"
		}
	],
	disclaimer_text: `
	<p>
		This website is intended solely for authorized reviewers of “Accelerating Scientific Insights with MyGPT” submitted to [Journal Name]. The purpose of this website is to provide a demonstration of the MyGPT software described in the article, allowing reviewers to evaluate its features and capabilities.
		</br>
		</br>
		By accessing this website, you acknowledge that:
		</br>
		</br>
		<ol style="list-style-type: decimal; padding-left: 30px;">
			<li>You are an authorized reviewer of “Accelerating Scientific Insights with MyGPT” and have been provided login credentials by the authors.</li>
			<li>Your access to this website is strictly limited to review purposes only, and you will not use or disclose any information obtained from this website for any other purpose.</li>
			<li>You will maintain the confidentiality of all information and materials accessed through this website, including any proprietary or confidential information related to MyGPT.</li>
		</ol>
		
		</br>		
		Upon completion of the review process, all uploaded documents, questions provided by reviewers, and answers generated during the review process will be removed from the Website. The Website will be reset to its original state, and no information or materials will be retained or used for any purpose other than facilitating the review process.
		</br>
		</br>
		By logging in and accessing this website, you agree to be bound by these terms and conditions. If you are not an authorized reviewer or do not agree with these terms, please do not access this website.
		</br>
		</br>
		<b>Important:</b> This website is intended for review and should not be used for other purposes. The MyGPT application described in the article is subject to the GNU General Public License v3.0 . Any unauthorized use of the software or its features is strictly prohibited.
		
		</p>`
  }

  export default defaultSettings;

  interface FAQItem {
	question: string;
	answer: string;
  }
  
  interface FAQData {
	[key: string]: FAQItem[];
  }
  

  export const faq :FAQData ={
	"Asking Questions" : [
        {
	    "question": "1. What kind of questions can I ask MyGPT?",
	    "answer": "During MyGPT evaluation, we have used six different question types as follows: <br/>• <b>Keyword search:</b> An acronym or a definition from the papers.For example, 'What is acetyl-CoA?' <br/><b>• Summarization:</b> Question that summarize a topic or method. For example, 'What is the proof that pathogenic gain-of-function mutations can shift the equilibrium towards the active state in FGFRs?'<br/> <b>• Yes/no: </b>The answer can be a simple yes or no. For example, 'Does the regulatory domain inhibit the PAK4 kinase activity?' <br/> <b>• Data query: </b>Question to find data or other facts from a section or information from several papers. For example, 'Where are the leukemia-related breakpoints located in CBP/p300?'<br/> <b>• Complex question:</b> A research question to collect information from different parts of a paper and synthesize a response. For example, “What are the biggest issues facing the development of better CAR-T therapies? Rank them in order of difficulty and provide examples with citations on all potential strategies to overcome these limitations. </br> <b>• Irrelevant question: </b>A question about a topic that is not covered by the publication library. For example, asking questions about Harry Potter to a library of GPCR documents: “What does Hagrid give Harry as a Christmas present?”.  </br>  You can also ask questions that do not follow the above categories, and MyGPT will answer  them if they are within the limits of LLMs and RAG concepts. Several tasks, such as  performing statistical analysis, analyzing whole documents, or listing references from  literature with high accuracy, are beyond the current capability of LLMs and MyGPT"
		},
		{
			"question": "2. Can I ask any questions about topics from my library?",
			"answer": "You can ask questions that can be answered using the information available within your document library. If the data is missing from the documents, MyGPT will not be able to answer it or will let you know that the information is missing from your papers."
		},
		{
			"question": "3. Can I ask a question about information that is in tables or figures in the library documents?",
			"answer": " MyGPT will read tables as text and try to use that information to answer your question. However, it will not be able to parse the table and find the relationship between table  columns and information from the table. Also, MyGPT will not perform statistical analysis for data present in the table. MyGPT can’t find information from the figures if it can only be answered by interpreting it or by performing the statistical analysis, although it will be able toread the legend of the figure. If the question can be answered using the legend, it can answer it."
		}
	],
	"MyGPT answers" : [
		{
			"question":" 1. What information will does MyGPT uses to answer my question?",
			"answer": "MyGPT uses information in the documents in your library as the primary source of  information. If the information is missing from the library, MyGPT will use inherent knowledge of LLM, which was used for the training phase of specific LLM."
		},
		{
			"question": "2. Is MyGPT using the internet to answer my question?",
			"answer": "MyGPT does not use the internet or any external API services to get information to answer your question"
		},
		{
			"question": "3. Can I use MyGPT to chat with LLM without incorporating documents pipeline (RAG), like ChatGPT?",
			"answer": "You can use MyGPT to chat directly with LLM without the RAG pipeline. Under the input box where users can ask questions, we have provided a switch to skip the RAG pipeline. In this  case, MyGPT will use LLM’s inherent knowledge to answer user’s questions"	
		},
		{
		   "question": "4. What happens if the information to answer the question is not available in my library?",
			"answer": "If the information to answer the question is unavailable in your library, MyGPT will use its inherent knowledge to answer it. It will also provide confidence matrices in the form of  question relevance score (QRS), answer relevance score (ARS) and hallucination index  (HI). Low QRS, QRS, and high HI should be interpreted as an indication to verify and cross-reference the generated answer with the retrieved context highlighted in the documents.  Suppose the question is off-topic from the subjects covered in the papers. In that case, the  QRS score will be zero, indicating the generated answer does not use any information from  the document and is entirely generated using inherent knowledge of LLM."
		},
		{
			"question": "5. If I am certain my library has the necessary information to answer the question, but MyGPT is not able to find it, what should I do?",
			"answer": "We recommend several solutions if you are sure that the documents contain the information  to answer the question. 1.         The first thing to try is rephrasing it and providing more context with your question if it’s  too short. 2.         You can also adjust QRS and ARS cut-off values from the customizations. Certain words in embedding models have a higher distance than our perceived understanding of  language as the specific domain knowledge was lacking in training of embedding  models. Increasing the QCworst and Aworst values can aid in finding the correct context from documents. 3.         We have also observed different embedding models provide different meanings to the  same library of documents. So, if rephrasing and adjusting relevance scores doesn’t  work, we recommend creating the same library with a different embedding model."	
		},
		{
			"question": "6. What happens if the information to answer the question is contained in a figure or table?",
			"answer": "MyGPT will read tables as text and try to use that information to answer your question. However, it will not be able to parse the table and find the relationship between table column names and the data from the table. Also, MyGPT will not perform statistical analysis for data  present in the table. MyGPT will be able to read the legend of the figure. If the question can  be answered using the legend, it can answer it. However, if your question can only be  answered by interpreting the figure or by comparing data present in your figure, MyGPT will  not be able to answer it."
		},
		{
			"question": "7. If there is information on my library that is outdated or inconsistent with public information  available on the internetfacts available in public domain, will MyGPT detect the inconsistency?",
			"answer": "MyGPT is designed to perform question-answering in the context of your library of documents and will hold the information from your documents as the highest truth. If the  information in your document is outdated compared to facts in the public domain, MyGPT will answer them using only information from your documents. If the LLM has more up-to-date information about your question, the answer relevance score (ARS) and hallucination  index (HI) may be able to guide you. MyGPT also provides answers generated without the  RAG pipeline as the drop-down with the original MyGPT-generated answers. You can  compare that answer with an original answer to verify the discrepancy in relevance scores.  However, if the most up-to-date information about your topic is also missing from LLM training data, MyGPT will answer it only using information from your documents"
		},
		{
			"question": "8. If the answer is related to up-to-date information that is contained in my library but that was missing from the training data used for the LLM being used, will MyGPT be able to answer accurately?",
			"answer": "Yes, MyGPT uses the facts present in your documents as the highest truth and will be able to  use them as context to answer your question. MyGPT does not rely on LLM training data and eliminates the need for periodic retraining of LLMs with new information"
		},
	],
     'confidence Metrics': [],
	 'Library Creation':[],
	 'Installation' :[],
	 'Customization':[],
	 'General developers':[]
 
  }
	

