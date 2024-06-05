const defaultSettings = {
	showSettings: false,
	showLogin: false,
	settingsPanels: [ 
		{key:'datasets', text:'Publication libraries'},
		{key:'llms', text:'LLMs'},
		{key:'llm_parameters', text:'Prompt and LLM parameters'},
		{key:'sentence_transformers', text:'Sentence Transformers'},
		{key:'relevance_score', text:'Relevance score parameters'},
],
	selectedPanel: 'datasets',
	llms: [process.env.REACT_APP_DEFAULT_LLM || 'llama3'],
    defaultLlm: process.env.REACT_APP_DEFAULT_LLM || 'llama3',
	selectedLlm: process.env.REACT_APP_DEFAULT_LLM || 'llama3',
    datasets: ['None'],
	defaultDataset: 'None',
    selectedDataset: 'None',
	fetchDatasets: true,
	datasetsUpdated: false,
    default_sentence_transformer: 'multi-qa-MiniLM-L6-cos-v1',
	selected_sentence_transformer: 'multi-qa-MiniLM-L6-cos-v1',
	sentence_transformers: [
		'multi-qa-MiniLM-L6-cos-v1',
		'all-MiniLM-L6-v2',
		'all-MiniLM-L12-v2',
		'all-mpnet-base-v2', 
		'multi-qa-mpnet-base-dot-v1',
		'paraphrase-albert-small-v2'
	],
    system_prompt: 'Use following information to answer the question in less than 100 words, try not to use anything else:',
	direct_chat_system_prompt: 'Answer the question in less than 200 words.',
	fetchPapers: false,
	temperature: 0.4,
	top_k: 20,
	top_p: 0.7,
	relevance_score_cutoff: {
		best: 0.4,
		worst: 1.5
	},
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
  }

export default defaultSettings