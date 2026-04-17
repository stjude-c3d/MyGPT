const defaultSettings = {
	showSettings: false,
	showUpload: false,
	showLogin: false,
	loggedin: false,
	darkMode: false,
	showFAQ: false,
	settingsPanels: [ 
		{key:'datasets', text:'Document libraries'},
		{key:'llms', text:'LLMs'},
		{key:'llm_parameters', text:'Prompt and LLM parameters'},
		{key:'embedding_models', text:'Embedding Models'},
		{key:'relevance_score', text:'Relevance score parameters'},
		{key: 'mcp', text: 'Model Context Protocol (MCP)'},
],
	selectedPanel: 'datasets',
	llms: [process.env.REACT_APP_DEFAULT_LLM || 'llama3:latest'],
    defaultLlm: process.env.REACT_APP_DEFAULT_LLM || 'llama3:latest',
	selectedLlm: process.env.REACT_APP_DEFAULT_LLM || 'llama3:latest',
    datasets: ['None'],
	defaultDataset: 'None',
    selectedDataset: 'None',
	DatasetLanguage: 'English',
	fetchDatasets: true,
	datasetsUpdated: false,
    defaultEmbeddingModel: 'nomic-embed-text:latest',
	selectedEmbeddingModel: 'nomic-embed-text:latest',
	embedding_models: [
		'multi-qa-MiniLM-L6-cos-v1',
		'all-MiniLM-L6-v2',
		'all-MiniLM-L12-v2',
		'all-mpnet-base-v2', 
		'multi-qa-mpnet-base-dot-v1',
		'paraphrase-albert-small-v2',
		'snowflake-arctic-embed:latest',
		'nomic-embed-text:latest',
		'nomic-embed-text:v1.5',
		'qwen3-embedding:latest',
		'nomic-embed-text-v2-moe:latest',
		// 'nomic-ai/nomic-embed-text-v1',
		// 'hf.co/nomic-ai/nomic-embed-text-v2-moe-GGUF:Q4_K_M',
		// 'hf.co/nomic-ai/nomic-embed-text-v1.5-GGUF:latest',
		'bge-m3:latest',
		'mxbai-embed-large:latest',
		'granite-embedding:latest'
	],
    system_prompt: '###INSTUCTIONS#### Use following information to answer the question in less than 200 words, try not to use any other information other than provided context. if the information is not in the context, then tell user that information is not found in the documents. ### CONTEXT ####',
	direct_chat_system_prompt: 'Answer the question in less than 200 words.',
	maximum_chunks_count: 15,
	no_chunk_cutoff: false,
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
		HIb: 0.5,
		HIc: 0.5,
	},
	LLM_server_API_specs: 'ollama', // 'openai', 'ollama', 'sjray'
	use_default_qrs: true,
	use_default_ars: true,
	use_default_hi: true,
	restriction_without_login: false,
	answerWithoutContext: false,
	MCP_tools: [],
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
	

