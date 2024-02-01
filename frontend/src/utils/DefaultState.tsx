const defaultSettings = {
	showSettings: false,
	settingsPanels: [ 
		{key:'datasets', text:'Publication libraries'},
		{key:'llms', text:'LLMs'},
		{key:'llm_parameters', text:'LLM parameters'},
		{key:'sentence_transformers', text:'Sentence Transformers'}
],
	selectedPanel: 'datasets',
    llm: 'llama2',
    datasets: ['GPCR'],
	defaultDataset: 'GPCR',
    selectedDataset: 'GPCR',
    sentence_transformer: 'stsb-roberta-large',
    system_prompt: 'Given the following abstract, generate a summary of the paper.',
	fetchPapers: false,
  }

export default defaultSettings