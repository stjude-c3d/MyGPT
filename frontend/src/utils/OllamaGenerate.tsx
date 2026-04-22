export const  OllamaDirectGenerateStream = async (
	llm:string, 
	question:string, systemPrompt:string, addToolsPromt:boolean, mcpResponse:string, 
	temperature:number, top_k:number, top_p:number, 
	setAnswer:any, setThought:any
) => {
	const body = JSON.stringify({
		model: llm,
		prompt: question + (addToolsPromt ? '\n\n<tool_response>' + mcpResponse + '</tool_response>' : ''),
		system: systemPrompt,
		stream: true,
		think: setThought ? true : false,
		options: {
			temperature: temperature,
			top_k: top_k,
			top_p: top_p,
		}
	})
	
	let content = ''
	let thought = ''
	let answerReceived = false
	const response = await fetch(`${process.env.REACT_APP_OLLAMA_API}api/generate`, {body, method: 'POST'})
	const reader:any = response.body?.getReader()
	let leftover:any = ''
	while (true) {
		const { done, value } = await reader.read()
		if (done) {
			break;
		}
		let rawjson = new TextDecoder().decode(value);
		let jsons = []
		if (leftover.length > 0){
			rawjson = leftover + rawjson
			leftover = ''
		}
		if (rawjson.includes('\n')){
			jsons = rawjson.split('\n')
				.filter((j:any)=>j.length)
		}else{
			jsons = [rawjson]
		}
		let last_json:any = ''
		if (rawjson.includes('\n') && rawjson.length > 1000){
			last_json = jsons.pop()
			if (last_json[last_json.length-1] !== '}'){
				leftover = last_json
			}
		}

		for (const j of jsons){
			const json = JSON.parse(j)
			if (json.done === false) {
				content += json.response
				if (setThought){
					if(json.thinking && json.thinking.length){
						thought += json.thinking
						setThought(thought)
					}					
				}
			}else{
				answerReceived = true
			}
		}
		setAnswer(content)

		if (last_json.length && last_json[last_json.length - 1] === '}'){
			const last_json_obj = JSON.parse(last_json)
			if (last_json_obj.done === true){
				answerReceived = true
			}
		}
	}
	return answerReceived
}

export const OllamaDirectGenerateNoStream = async (
	llm:string, 
	question:string, systemPrompt:string, addToolsPromt:boolean, mcpResponse:string, 
	temperature:number, top_k:number, top_p:number, 
	setAnswer:any, setThought:any
) => {
	const body = JSON.stringify({
		model: llm,
		prompt: question + (addToolsPromt ? '\n\n<tool_response>' + mcpResponse + '</tool_response>' : ''),
		system: systemPrompt,
		stream: false,
		think: setThought ? true : false,
		options: {
			temperature: temperature,
			top_k: top_k,
			top_p: top_p,
		}
	})
	
	let content = ''
	// let thought = ''
	let answerReceived = false
	const response = await fetch(`${process.env.REACT_APP_OLLAMA_API}api/generate`, {body, method: 'POST'})
	const data = await response.json()
	if (data.response) {
		content = data.response
		answerReceived = true
	}
	if (setThought && data.thinking){
		setThought(data.thinking)
	}
	setAnswer(content)
	return answerReceived
}


// Which are the top 3 kinases curated from Kinase curation project. Is there any information about them in this paper? If yes, then list all the mutations that were used in the substrate phosphorylation assay, activity assay or catalytic activity assay.