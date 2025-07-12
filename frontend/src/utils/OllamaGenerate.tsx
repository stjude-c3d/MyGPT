export const  OllamaDirectGenerateStream = async (body:any, setAnswer:any) => {
	let content = ''
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