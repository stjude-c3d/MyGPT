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
    sentence_transformer: 'stsb-roberta-large',
	sentence_transformers: ['stsb-roberta-large', 'stsb-roberta-base', 'stsb-bert-large', 'stsb-bert-base'],
    system_prompt: 'Use following information to answer the question in less than 100 words, try not to use anything else:',
	fetchPapers: false,
  }

export default defaultSettings