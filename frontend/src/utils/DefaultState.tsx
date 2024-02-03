const defaultSettings = {
	showSettings: false,
	settingsPanels: [ 
		{key:'datasets', text:'Publication libraries'},
		{key:'llms', text:'LLMs'},
		{key:'llm_parameters', text:'LLM parameters'},
		{key:'sentence_transformers', text:'Sentence Transformers'}
],
	selectedPanel: 'datasets',
	llms: ['llama2'],
    defaultLlm: 'llama2',
	selectedLlm: 'llama2',
    datasets: ['GPCR'],
	defaultDataset: 'GPCR',
    selectedDataset: 'GPCR',
    default_sentence_transformer: 'all-MiniLM-L6-v2',
	selected_sentence_transformer: 'all-MiniLM-L6-v2',
	sentence_transformers: [
		'all-MiniLM-L6-v2',
		'all-MiniLM-L12-v2', 
		'all-mpnet-base-v2', 
		'multi-qa-mpnet-base-dot-v1',
		'paraphrase-albert-small-v2'
	],
    system_prompt: 'Use following information to answer the question in less than 100 words, try not to use anything else:',
	fetchPapers: false,
  }

export default defaultSettings