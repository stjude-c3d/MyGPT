export const  OllamaDirectChatStream = async (body:any, setAnswer:any) => {
	let content = ''
	let answerReceived = false
	const response = await fetch(`${process.env.REACT_APP_OLLAMA_API}api/chat`, {body, method: 'POST'})
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
					content += json.message.content
				}
				else {
					setAnswer(content)
					answerReceived = true
				}
			}
			setAnswer(content)
		}
		return {content, answerReceived}
	}

export const OllamaChatStreamWithToolSupport = async (body:any, setAnswer:any, MCPTools:any, MCPClient:any) => {
	let answerReceived
	fetch(`${process.env.REACT_APP_OLLAMA_API}api/chat`, {body, method: 'POST'})
		.then(response => response.json())
		.then(async (data:any)=>{
			if (data.message.tool_calls && data.message.tool_calls.length > 0){
					let body_json = JSON.parse(body)
					let messages = body_json.messages || []
					// handle tool calls here
					await Promise.all(MCPTools.map(async (tool:any) => {
						const result = await MCPClient.callTool({
						name: tool['name'],
						arguments: data.message.tool_calls[0].function.arguments,
						})
						if (result.content && result.content.length > 0){
							messages.push({
								role: 'tool',
								content: JSON.stringify(result.content)
							})
						}
					}))
					const body_2 = {
						model: body_json.model,
						options: body_json.options,
						messages: messages,
						stream: true
					}
					const data_2 = await OllamaDirectChatStream(JSON.stringify(body_2), setAnswer)
					answerReceived = data_2.answerReceived
				}
			})
	return {answerReceived}
}

