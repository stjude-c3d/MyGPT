export const  SJRayDirectGenerateStream = async (
	llm:string, 
	question:string, systemPrompt:string, addToolsPromt:boolean, mcpResponse:string, 
	temperature:number, top_k:number, top_p:number, 
	setAnswer:any
) => {
	// const body = JSON.stringify({
	// 	model: llm,
	// 	prompt: question + (addToolsPromt ? '\n\n<tool_response>' + mcpResponse + '</tool_response>' : ''),
	// 	system: systemPrompt,
	// 	stream: true,
	// 	options: {
	// 		temperature: temperature,
	// 		top_k: top_k,
	// 		top_p: top_p,
	// 	}
	// })
	const body = JSON.stringify({
		inputs: [{
			model_name: 'gpt-oss-20b-vllm',
			// stream: true,
			inputs:
			{
				text: 'INSTRUCTION: ' + systemPrompt + '\nQUESTION: ' + question + (addToolsPromt ? '\n\n<tool_response>' + mcpResponse + '</tool_response>' : ''),
				temperature: temperature,
				top_k: top_k,
				top_p: top_p,
				max_new_tokens: 4000
			}
		}]
	})
	
	let answerReceived = false
	let header:any = {
		'Content-Type': 'application/json',
		'Accept': 'application/json'
	}
	const response = await fetch(`/sjray/v2/models/ray_gateway_router/infer`, { body, method: 'POST', headers: header })
	const reader:any = response.body?.getReader()
	let answer = ''

	while (true) {
		const { done, value } = await reader.read()
		if (done) break
		const rawjson = new TextDecoder().decode(value)
		const jsons = rawjson.split('\n').filter((j: any) => j.length)
		for (const j of jsons) {
			const obj = JSON.parse(j)
			if (obj.outputs && obj.outputs[0] && obj.outputs[0].generated_text) {
				const genText = obj.outputs[0].generated_text
				const idx = genText.indexOf('assistantfinal')
				if (idx !== -1) {
					answer = genText.substring(idx + 'assistantfinal'.length)
					setAnswer(answer)
					answerReceived = true
				}
			}
		}
	}
	return answerReceived
}


// Which are the top 3 kinases curated from Kinase curation project. Is there any information about them in this paper? If yes, then list all the mutations that were used in the substrate phosphorylation assay, activity assay or catalytic activity assay.