interface FAQItem {
	question: string;
	answer: string;
	image?: string | string[];
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
			"question":" 1. What information does MyGPT uses to answer my question?",
			"answer": "MyGPT uses information in the documents in your library as the primary source of  information. If the information is missing from the library, MyGPT will use inherent knowledge of LLM, which was used for the training phase of specific LLM."
		},
		{
			"question": "2. Is MyGPT using the internet to answer my question?",
			"answer": "MyGPT does not use the internet or any external API services to get information to answer your question"
		},
		{
			"question": "3. Can I use MyGPT to chat with LLM without incorporating documents pipeline (RAG), like ChatGPT?",
			"answer": "You can use MyGPT to chat directly with LLM without the RAG pipeline. At the top of the Chat panel, you can use the drop-down to switch from \"Chat with Documents\" to \"Direct chat with GPTs\". In this case, MyGPT will use LLM’s inherent knowledge to answer users' questions.",
		    "image": ["./Chat_with_document.png", "./Chat_wo_document_dropdown.png", "./Chat_wo_document.png"]
		},
		{
		   "question": "4. What happens if the information to answer the question is not available in my library?",
			"answer": "If the information needed to answer the question is unavailable in your library, MyGPT will either acknowledge that it is missing from the library or, in rare cases, use the LLM’s inherent knowledge to answer it. It will also provide confidence matrices in the form of question relevance score (QRS), answer relevance score (ARS), and hallucination index (HI). Low QRS, QRS, and high HI should be interpreted as an indication to verify and cross-reference the generated answer with the retrieved context highlighted in the documents. Suppose the question is off-topic from the subjects covered in the papers. In that case, the QRS and ARS scores will be low, and HI will be high, indicating that the generated answer does not use any information from the document and is entirely generated using the LLM's inherent knowledge."
		},
		{
			"question": "5. If I am certain my library has the necessary information to answer the question, but MyGPT is not able to find it, what should I do?",
			"answer": "We recommend several solutions if you are sure that the documents contain the information  to answer the question:<br><br><ol><li><b>1.</b> The first thing to try is rephrasing it and providing more context with your question if it’s  too short.</li><li><b>2.</b> You can also adjust QRS and ARS cut-off values from the customizations. Certain words in embedding models have a higher distance than our perceived understanding of  language as the specific domain knowledge was lacking in training of embedding  models. Increasing the QCworst and Aworst values can aid in finding the correct context from documents. </li><li><b>3.</b>        We have also observed different embedding models provide different meanings to the  same library of documents.</li></ol><br> So, if rephrasing and adjusting relevance scores doesn’t  work, we recommend creating the same library with a different embedding model."	
		},
		{
			"question": "6. What happens if the information to answer the question is contained in a figure or table?",
			"answer": "MyGPT will read tables as text and try to use that information to answer your question. However, it will not be able to parse the table and find the relationship between table column names and the data from the table. Also, MyGPT will not perform statistical analysis for data  present in the table. MyGPT will be able to read the legend of the figure. If the question can  be answered using the legend, it can answer it. However, if your question can only be  answered by interpreting the figure or by comparing data present in your figure, MyGPT will  not be able to answer it."
		},
		{
			"question": "7. If there is information on my library that is outdated or inconsistent with public information  available on the internetfacts available in public domain, will MyGPT detect the inconsistency?",
			"answer": "MyGPT is designed to perform question-answering in the context of your library of documents and will hold the information from your documents as the highest truth. If the  information in your document is outdated compared to facts in the public domain, MyGPT will answer them using only information from your documents. If the LLM has more up-to-date information about your question, the answer relevance score (ARS) and hallucination  index (HI) may be able to guide you. MyGPT also provides answers generated without the  RAG pipeline as the drop-down with the original MyGPT-generated answers. You can  compare that answer with an original answer to verify the discrepancy in relevance scores.  However, if the most up-to-date information about your topic is also missing from LLM training data, MyGPT will answer it only using information from your documents",
		    "image": ["./Dropdown_Image.png", "./Dropdown_Image_2.png"]
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