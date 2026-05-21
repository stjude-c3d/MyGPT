export const  OllamaDirectChatStream = async (body:any, setAnswer:any, setThought:any) => {
	let content = ''
	let thought = ''
	let answerReceived = false
	const response = await fetch(`${process.env.REACT_APP_BACKEND_API}api/ollama_chat/`, {body, method: 'POST'})
	const reader:any = response.body?.getReader()
	const decoder = new TextDecoder()
	let buffer = ''

	const handleEvent = (json:any) => {
		if (json.done === true) {
			answerReceived = true
			return
		}

		const chunk = json.content || ''
		if (!chunk.length) {
			return
		}

		if (json.type === 'thinking') {
			if (setThought) {
				thought += chunk
				setThought(thought)
			}
		} else {
			content += chunk
		}
	}

	const processBuffer = () => {
		let didProgress = true
		while (didProgress) {
			didProgress = false

			if (buffer.includes('\n')) {
				const parts = buffer.split('\n')
				buffer = parts.pop() || ''

				for (const line of parts) {
					const trimmed = line.trim()
					if (!trimmed) {
						continue
					}
					try {
						const json = JSON.parse(trimmed)
						handleEvent(json)
						didProgress = true
					} catch {
						buffer = trimmed + '\n' + buffer
						break
					}
				}
				continue
			}

			const trimmedBuffer = buffer.trim()
			if (!trimmedBuffer) {
				buffer = ''
				break
			}

			if (trimmedBuffer.includes('}{')) {
				buffer = trimmedBuffer.replace(/}\s*{/g, '}\n{')
				didProgress = true
				continue
			}

			if (trimmedBuffer.startsWith('{') && trimmedBuffer.endsWith('}')) {
				try {
					const json = JSON.parse(trimmedBuffer)
					handleEvent(json)
					buffer = ''
					didProgress = true
				} catch {
					// Wait for additional bytes to complete JSON.
				}
			}
		}
	}

	while (true) {
		const { done, value } = await reader.read()
		if (done) {
			break;
		}

		buffer += decoder.decode(value, { stream: true })
		processBuffer()
		setAnswer(content)
		if (setThought && thought.length) setThought(thought)
	}

	buffer += decoder.decode()
	processBuffer()
	if (buffer.trim().length) {
		try {
			const json = JSON.parse(buffer.trim())
			handleEvent(json)
		} catch {
			// Ignore trailing incomplete JSON if stream ended unexpectedly.
		}
		setAnswer(content)
		if (setThought && thought.length) setThought(thought)
	}

	return {content, answerReceived, thought}
}

const OllamaDirectChatNoStream = async (body:any, setAnswer:any, setThought:any) => {
	let content = ''
	let thought = ''
	let answerReceived = false
	const response = await fetch(`${process.env.REACT_APP_BACKEND_API}api/ollama_chat/`, {body, method: 'POST'})
	const data = await response.json()
	if (data.content) {
		content = data.content
		setAnswer(content)
		answerReceived = true
	}
	if (setThought && data.thinking){
		thought = data.thinking
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
	if (data.tool_calls && data.tool_calls.length > 0){
		let body_json = JSON.parse(body)
		let messages = body_json.messages || []
		// handle tool calls here
		await Promise.all(MCPTools.map(async (tool:any) => {
			const result = await MCPClient.callTool({
			name: tool['name'],
			arguments: data.tool_calls[0].function.arguments,
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

