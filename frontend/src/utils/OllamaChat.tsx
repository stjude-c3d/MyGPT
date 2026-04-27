export const  OllamaDirectChatStream = async (body:any, setAnswer:any, setThought:any) => {
	let content = ''
	let thought = ''
	let answerReceived = false
	const response = await fetch(`${process.env.REACT_APP_BACKEND_API}api/ollama_chat/`, {body, method: 'POST'})
	const reader:any = response.body?.getReader()
	// const decoder = new TextDecoder()
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

		for (const j of jsons){
			if (!j.trim()) {
				continue
			}
			const json = JSON.parse(j)
			if (json.done === true) {
				answerReceived = true
				continue
			}

			const chunk = json.content || ''
			if (!chunk.length) {
				continue
			}

			if (json.type === 'thinking') {
				if (setThought){
					thought += chunk
					setThought(thought)
				}
			} else {
				content += chunk
			}
		}
		setAnswer(content)
		if (setThought && thought.length) setThought(thought)
	}

	if (leftover.trim().length) {
		const json = JSON.parse(leftover)
		if (json.done === true) {
			answerReceived = true
		} else {
			const chunk = json.content || ''
			if (json.type === 'thinking') {
				if (setThought && chunk.length) {
					thought += chunk
					setThought(thought)
				}
			} else if (chunk.length) {
				content += chunk
				setAnswer(content)
			}
		}
	}

	return {content, answerReceived, thought}
}

const OllamaDirectChatNoStream = async (body:any, setAnswer:any, setThought:any) => {
	let content = ''
	let thought = ''
	let answerReceived = false
	const response = await fetch(`${process.env.REACT_APP_BACKEND_API}api/ollama_chat/`, {body, method: 'POST'})
	const data = await response.json()
	if (data.message && data.message.content) {
		content = data.message.content
		setAnswer(content)
		answerReceived = true
	}
	if (setThought && data.message && data.message.thinking){
		thought = data.message.thinking
		setThought(thought)
	}
	return {content, answerReceived, thought}
}

export const OllamaChatStreamWithToolSupport = async (body:any, setAnswer:any, MCPTools:any, MCPClient:any, stream:boolean, returnToolResponse:boolean) => {
	let answerReceived
	let content = ''
	let toolResponse = ''
	const response = await fetch(`${process.env.REACT_APP_BACKEND_API}api/ollama_chat/`, {body, method: 'POST'})
	const data = await response.json()
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
				toolResponse += JSON.stringify(result.content)
			}
		}))
		const body_2 = {
			model: body_json.model,
			options: body_json.options,
			messages: messages,
			stream: stream
		}
		if (returnToolResponse){
			content = toolResponse
			answerReceived = true
		}
		else if (!returnToolResponse && stream){
			const data = await OllamaDirectChatStream(JSON.stringify(body_2), setAnswer, ()=>{})
			answerReceived = data.answerReceived
			content = data.content
		} else {
			const data = await OllamaDirectChatNoStream(JSON.stringify(body_2), setAnswer, ()=>{})
			console.log('data_2', data)
			answerReceived = data.answerReceived
			content = data.content
		}
	}
	
	return {content, answerReceived}
}

