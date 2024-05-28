import { useState, useEffect } from 'react'

const LLMSettings = (props: {
	llms:any, 
	llm:string,
	selectedLlm:string,
	currentSettings:any,
	settingsCallback:any
}) => {
	
	let currentSettings = props.currentSettings
	let llmsDownload = ['llama3', 'Mistral', 'Vicuna', 'Orca-mini', 'Phi', 'Falcon', 'Tinyllama', 'Llama2:13b', 'Llama2:70b']
		.filter((llm:string) => !props.llms.includes(llm.toLowerCase()))
	const [llmToLoad, setLlmToLoad] = useState('')
	const [message, setMessage] = useState('')
	const [modelLoaded, setModelLoaded] = useState(false)

	// add new model by calling Ollama API
	const addOllamaModel = (model_name:string) => {
		
		if(model_name !== ''){
			const model = model_name.toLowerCase()
			setLlmToLoad(model)
			
			const body = JSON.stringify({
				'name': model,
				'stream': true,
			})

			// fetch using async await
			const postData = async () => {
				const response = await fetch(`${process.env.REACT_APP_OLLAMA_API}api/pull`, {body, method: 'POST'})
				const reader:any = response.body?.getReader()
				while (true) {
					const { done, value } = await reader.read()
					if (done) {
						let new_llms = props.llms
						new_llms.push(model_name)
						currentSettings.selectedLlm = model_name
						setMessage('success')
						setModelLoaded(true)
						llmsDownload = llmsDownload.filter((llm:string) => llm !== model_name)
						break
					} else {
						const rawjson = new TextDecoder().decode(value)
						const json = JSON.parse(rawjson.split('\n')[0])
						let status = ''
						if (done === false) {
							status = json.status
						}
						if (status === 'success') {
							let new_llms = props.llms
							new_llms.push(model_name)
							setMessage(status)
							setModelLoaded(true)
							break;
						} else {
							setMessage(status)
						}
					}
				}
			}

			// check if the api is available
			fetch('http://localhost:11434/api/tags', {method: 'GET'})
			.then(response => {
				if(response.ok){
					console.log('API is available')
					postData()
				} else if (response.status === 0) {
					return Promise.reject(new Error('API is not available'))
				}
			}).catch(error => {
				console.log('Error:', error)
				setMessage(error + ' (Ollama Server unavailable)')
			})
		}
	}

	// add new model to backend API
	useEffect(() => {
		if(message === 'success' && llmToLoad !== '' && currentSettings.selectedLlm !== ''){
			// const model = currentSettings.selectedLlm.toLowerCase()
			const postData = async () => {
				const response = await fetch(`http://localhost:11434/api/tags`, {method: 'GET'})
				const data = await response.json()
				const llm = data.models.filter((model:any) => model.name.split(':')[0] === currentSettings.selectedLlm.toLowerCase())[0]
				// convert bytes to GB
				const llm_size = llm.size* 1e-9
				const llm_size_gb = llm_size.toFixed(2)
				console.log(llm_size_gb, llm)

				// add new model to backend API
				const requestOptions = {
					method: 'POST',
					headers: { 
						'Content-Type': 'application/json',
						'Authorization': `${process.env.NODE_ENV === 'production' ? process.env.REACT_APP_AUTH_TOKEN_PROD : process.env.REACT_APP_AUTH_TOKEN_DEV}`
					},
					setConnection: 'keep-alive',
					keepalive: true,
					setTimeout: 10000,
					body: JSON.stringify({
						'llms': [{ 
							'name': llm.name,
							'size': llm_size_gb,
						}]})
				}
				let llm_endpoint = 'add_ollama_models'
				fetch(`${process.env.REACT_APP_BACKEND_API}api/${llm_endpoint}/?format=json`, requestOptions)
					.then(response => response.json())
					.then((data:any) => {
						props.settingsCallback({...currentSettings, llms:llm.name})
						setLlmToLoad('')
						console.log('Success:', data)
					})
			}
			postData()
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [message, currentSettings.selectedLlm])


	  return (
		<div className='px-8 py-2 divide-y'>
			<div className='flex flex-col justify-start my-4'>
				<div className='text-nav px-2 flex justify-start my-2 text-lg font-semibold'> Available LLMs on system </div>
				<div className='text-nav px-4 flex justify-start'>
					<ul className='list-disc'>
						{props.llms.map((llm:string, index:number) => {
							return(
								<li key={index} className='ml-4'>
									<div className='flex justify-between m-1 text-nav'>
										{llm}
										<div>
											<button className={'ml-2 text-white px-2 rounded-md w-24' 
												+ (llm === props.selectedLlm ? ' bg-gray-300' : ' bg-panel1')}
												onClick={()=>{
													currentSettings.selectedLlm = llm
													props.settingsCallback(currentSettings)
												}}
												disabled={llm === props.selectedLlm ? true : false}
											>{ llm === props.selectedLlm ? 'Selected' : 'Select'}</button>
											
											{/* <button className='ml-2 bg-red-900 text-white px-2 rounded-md'
												onClick={()=>{setDeleteDataset(dataset)}}
											>Delete</button> */}
										</div>
									</div>
								</li>
							)
						})}
					</ul>
				</div>
			</div>
			{ 
				currentSettings.restrictions_without_login ? <></> :
				<div className='flex flex-col justify-start my-4'>
					<div className='text-nav px-2 flex justify-start my-2 text-lg font-semibold'> LLMs ready to download </div>
					{ 
						message === '' ? <></> :
						<div className={'ml-2 text-nav px-2 rounded-md' + (modelLoaded ? ' bg-green-200' : ' bg-orange-200')}>
							{message}
						</div>
					}
					<div className='text-nav px-4 flex justify-start'>
						<ul className='list-disc'>
							{llmsDownload.map((llm:string, index:number) => {
								return(
									<li key={index} className='ml-4'>
										<div className='flex justify-between m-1 text-nav'>
											<div className='w-32'>
												{llm}
											</div>
											<div>
												<button className={'ml-2 text-white px-2 rounded-md' + (message.length ? ' bg-gray-300' : ' bg-panel1')} 
													onClick={()=>{addOllamaModel(llm)}}
													disabled={message.length && !modelLoaded ? true : false}
												>{'Download'}</button>
											</div>
										</div>
									</li>
								)
							})}
						</ul>
					</div>
				</div>
	}
	</div>
  );
}

export default LLMSettings