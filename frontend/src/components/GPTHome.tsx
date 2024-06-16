import { useState, useEffect, ReactElement} from 'react'
import { 
	Viewer, Worker, SpecialZoomLevel,
} from '@react-pdf-viewer/core'
import { defaultLayoutPlugin, ToolbarProps, ToolbarSlot } from '@react-pdf-viewer/default-layout'
import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation'
import '@react-pdf-viewer/default-layout/lib/styles/index.css'
import { PaperAirplaneIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'
import { scaleSequential, interpolateRdYlGn } from 'd3'
import Markdown from 'react-markdown'
// import Feedback from './Feedback'


function GPTHome(props:{
	currentSettings:any,
	settingsCallback:any,
	frontendSettings: any
}){
	const [llms, setLlms] = useState<any[]>([])
	const [searchTerm, setSearchTerm] = useState<any>('')
	const [query, setQuery] = useState<any[]>([])
	const [questionRelevancescore, setQuestionRelevancescore] = useState<any[]>([])
	const [answerRelevancescore, setAnswerRelevancescore] = useState<any[]>([])
	const [context, setContext] = useState<any>('')
	const [relatedQuery, setRelatedQuery] = useState<any>(false)
	const [answer, setAnswer] = useState<any>('')
	const [answerReceived, setAnswerReceived] = useState<any>(false)
	const [answers, setAnswers] = useState<any[]>([])
	const [papers, setPapers] = useState<any[]>([])
	const [videos, setVideos] = useState<any[]>([])
	const [sourcePapers, setSourcePapers] = useState<any[]>([])
	const [sourcePages, setSourcePages] = useState<any[]>([])
	const [sourceContexts, setSourceContexts] = useState<any[]>([])
	const [sourceStarts, setSourceStarts] = useState<any[]>([])
	const [sourceStops, setSourceStops] = useState<any[]>([])
	const [selectedPaperIdx, setselectedPaperIdx] = useState(0)
	const [selectedPage, setSelectedPage] = useState(0)
	const [selectedStart, setSelectedStart] = useState(0)
	const [selectedStop, setSelectedStop] = useState(0)
	const [fileAttachmentType, setFileAttachmentType] = useState('paper_attachment')
	const ConfidenceScoreColor = scaleSequential()
		.domain([0, 100])
		.interpolator(interpolateRdYlGn)

	const [answerWithoutContext, setAnswerWithoutContext] = useState(props.currentSettings.answerWithoutContext)

	const [addDemoLibrary, setAddDemoLibrary] = useState(false)

		// get llms from backend
		useEffect(()=>{

			const postData = async () => {
				const response = await fetch(`${process.env.REACT_APP_OLLAMA_API}api/tags`, {method: 'GET'})
					const data = await response.json()
	
					// set models
					const llms = data.models.map((model:any) => model.name)
					setLlms(llms)
	
					// add new model to backend API
					let llms_object:any = []
					data.models.forEach((model:any) => {
						// let llm_name = model.name.split(':')[0]
						let llm_name = model.name
						let llm_size = model.size* 1e-9
						let llm_size_gb = llm_size.toFixed(2)
						llms_object.push({name: llm_name, size: llm_size_gb})
					})
					
					const requestOptions = {
						method: 'POST',
						headers: { 
							'Content-Type': 'application/json',
							'Authorization': `${process.env.NODE_ENV === 'production' ? process.env.REACT_APP_AUTH_TOKEN_PROD : process.env.REACT_APP_AUTH_TOKEN_DEV}`
						},
					setConnection: 'keep-alive',
					keepalive: true,
					setTimeout: 10000,
					body: JSON.stringify({'llms': llms_object})
					}
					const response2 = await fetch(`${process.env.REACT_APP_BACKEND_API}api/add_ollama_models/`, requestOptions)
					const data2 = await response2.json()
					console.log(data2)
	
			}
			postData()
		},[])

	useEffect(()=>{
		const requestOptions = {
			method: 'GET',
			headers: { 
				'Content-Type': 'application/json'
			}
		}

		if (props.currentSettings.defaultDataset === props.currentSettings.selectedDataset && props.currentSettings.defaultDataset === 'None'){
			return
		}

		if((!props.currentSettings.answerWithoutContext && !papers.length && !videos.length) || props.currentSettings.fetchPapers === true){
			fetch(`${process.env.REACT_APP_BACKEND_API}api/get_documents/?dataset=${props.currentSettings.selectedDataset !== props.currentSettings.defaultDataset ? props.currentSettings.selectedDataset : props.currentSettings.defaultDataset }&format=json`, requestOptions)
				.then(response => response.json())
				.then(data => {
					if (data.dataset_type === 'papers'){ 
						setPapers(data.documents)
						setVideos([])
					}
					else if (data.dataset_type === 'videos'){
						setVideos(data.documents)
						setPapers([])
					}
				})
			
			props.settingsCallback({...props.currentSettings, showSettings: false, fetchPapers: false})
			if (props.currentSettings.fetchPapers === true){
				setQuery([])
				setAnswers([])
				setselectedPaperIdx(0)
				setSelectedPage(0)
				setFileAttachmentType('paper_attachment')
				setSourcePapers([])
				setSourcePages([])
			}
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	},[papers, query, props.currentSettings.defaultDataset, props.currentSettings.selectedDataset, props.currentSettings.fetchPapers, props.currentSettings.selectedDataset])
	
	// console.log(props.currentSettings.selectedDataset, props.currentSettings.defaultDataset)

	// change answer without context 
	useEffect(()=>{
		setAnswerWithoutContext(props.currentSettings.answerWithoutContext)
	},[props.currentSettings.answerWithoutContext])

	// add demo library
	useEffect(()=>{
		if(addDemoLibrary){
			const requestOptions = {
				method: 'GET',
				headers: { 
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					sentence_transformer: props.currentSettings.selected_sentence_transformer
				})
			}
			fetch(`${process.env.REACT_APP_BACKEND_API}api/add_demo_library/?format=json`, requestOptions)
				.then(response => response.json())
				.then(data => {
					console.log(data)
					setAddDemoLibrary(false)
					props.settingsCallback({...props.currentSettings, selectedDataset: 'GPCR' , showSettings: false, fetchPapers: true})
				})
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	},[addDemoLibrary])
	
	// get context from the backend vector database
	useEffect(()=>{
		// setAnswers([])
		// setSourceReceived(false)
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
				text: query[query.length-1] && query[query.length-1].question ? query[query.length-1].question.replaceAll('"',"'") : '',
				model_type: props.currentSettings.selectedLlm,
				dataset: props.currentSettings.selectedDataset !== props.currentSettings.defaultDataset ? props.currentSettings.selectedDataset : props.currentSettings.defaultDataset,
				new_conversation: query.length === 1 ? true : false, 
				related_query: relatedQuery,
				previous_query: query.length > 1 ? query[query.length-2].question.replaceAll('"',"'") : '',
				no_context: answerWithoutContext,
				sentence_transformer: props.currentSettings.selected_sentence_transformer
			})
		}
		if(query.length && query.length !== answers.length){
			// setSelectedPage(0)
			// setselectedPaperIdx(0)
			setRelatedQuery(false)
			let llm_endpoint = 'get_context'
				fetch(`${process.env.REACT_APP_BACKEND_API}api/${llm_endpoint}/?format=json`, requestOptions)
					.then(response => response.json())
					.then((data:any) => {
						setAnswerReceived(false)
						if (data.relevance_score === 0){
							setQuestionRelevancescore((prevQuestionRelevancescore:any)=>[...prevQuestionRelevancescore, data.relevance_score])
							setContext('None')
							setSourcePapers((prevSourcePapers:any)=>[...prevSourcePapers, []])
							setSourceContexts((prevSourceContexts:any)=>[...prevSourceContexts, []])
							if (papers.length){
								setSourcePages((prevSourcePages:any)=>[...prevSourcePages, []])
							}else if (videos.length){
								setSourceStarts((prevSourceStarts:any)=>[...prevSourceStarts, []])
								setSourceStops((prevSourceStops:any)=>[...prevSourceStops, []])
							}
						}else{
							setQuestionRelevancescore((prevQuestionRelevancescore:any)=>[...prevQuestionRelevancescore, data.relevance_score])
							setContext(data.context)
							setSourcePapers((prevSourcePapers:any)=>[...prevSourcePapers, data.sources.map((s:any)=>s.document)])
							setSourceContexts((prevSourceContexts:any)=>[...prevSourceContexts, data.sources.map((s:any)=>s.context)])
							if (data.sources[0].page !== ''){
								setSourcePages((prevSourcePages:any)=>[...prevSourcePages, data.sources.map((s:any)=>s.page)])
								setSelectedPage(data.sources[0].page)
								const paperIndex:number = papers.findIndex((p:any)=>p.paper_title === data.sources[0].document)
								setselectedPaperIdx(paperIndex)
								setFileAttachmentType('highlighted_attachment')
								setPapers([])
							} else if (data.sources[0].start !== 0){
								setSourceStarts((prevSourceStarts:any)=>[...prevSourceStarts, data.sources.map((s:any)=>s.start)])
								setSourceStops((prevSourceStops:any)=>[...prevSourceStops, data.sources.map((s:any)=>s.stop)])
								const videoIndex:number = videos.findIndex((v:any)=>v.video_title === data.sources[0].document)
								setselectedPaperIdx(videoIndex)
							}
							setAnswerReceived(false)
						}
					})
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	},[query])

	// get answer from the ollama
	useEffect(()=>{
		const question =  query[query.length-1] && query[query.length-1].question ? query[query.length-1].question.replaceAll('"',"'") : ''
		const systemPrompt = answerWithoutContext ? props.currentSettings.direct_chat_system_prompt : props.currentSettings.system_prompt + context
		
		const body:any = JSON.stringify({
			'model': props.currentSettings.selectedLlm,
			'prompt': question,
			'stream': true,
			'system': answerWithoutContext ? '' : systemPrompt,
			'options': {
				'temperature': props.currentSettings.temperature,
				'top_k': props.currentSettings.top_k,
				'top_p': props.currentSettings.top_p,
			}
		})
		
		if(context.length > 1 && question.length > 1){
			// fetch using async await
			let leftover:any = ''
			const postData = async () => {
				let content = ''
				const response = await fetch(`${process.env.REACT_APP_OLLAMA_API}api/generate`, {body, method: 'POST'})
				const reader:any = response.body?.getReader()
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
							setAnswerReceived(true)
						}
					}
					setAnswer(content)

					if (last_json.length && last_json[last_json.length - 1] === '}'){
						const last_json_obj = JSON.parse(last_json)
						if (last_json_obj.done === true){
							setAnswerReceived(true)
						}
					}
				}
			}
			postData()
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	},[query, context, props.currentSettings.selectedLlm])

	useEffect(()=>{
		if (answerReceived && answer.length !== 0){
			setAnswers((prevAnswers:any)=>[...prevAnswers, {'response': answer, 'source': props.currentSettings.selectedLlm}])
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	},[answer, props.currentSettings.selectedLlm, answerReceived])

	// save answer to backend database
	useEffect(()=>{
		if(answers.length && query.length && query.length === answers.length){
			const requestOptions = {
				method: 'POST',
				headers: { 
					'Content-Type': 'application/json',
					'Authorization': `${process.env.NODE_ENV === 'production' ? process.env.REACT_APP_AUTH_TOKEN_PROD : process.env.REACT_APP_AUTH_TOKEN_DEV}`
				},
				body: JSON.stringify({ 
					question_text: query[query.length-1].question.replaceAll('"',"'"),
					answer_text: answers[answers.length-1].response.replaceAll('"',"'"),
					model_type: answers[answers.length-1].source,
					dataset: props.currentSettings.selectedDataset !== props.currentSettings.defaultDataset ? props.currentSettings.selectedDataset : props.currentSettings.defaultDataset,
					sentence_transformer: props.currentSettings.selected_sentence_transformer,
					no_context: answerWithoutContext,
				})
			}
			fetch(`${process.env.REACT_APP_BACKEND_API}api/save_answer/?format=json`, requestOptions)
				.then(response => response.json())
				.then(data => {
					console.log(data)
					setAnswerRelevancescore((prevAnswerRelevancescore:any)=>[...prevAnswerRelevancescore, data.relevance_score])
					setContext('')
					setAnswer('')
				})
		}
	},[answers, query, props.currentSettings.selectedDataset, props.currentSettings.defaultDataset, props.currentSettings.selected_sentence_transformer, answerWithoutContext])

	const PageNavigationPluginInstance = pageNavigationPlugin()

	useEffect(()=>{
		// settime for the page to load
		setTimeout(()=>{
			PageNavigationPluginInstance.jumpToPage(selectedPage-1)
		}, 1000)
		// PageNavigationPluginInstance.jumpToPage(selectedPage-1)
	},[selectedPage, PageNavigationPluginInstance])

	// console.log('answers', answers, query, questionRelevancescore, answerRelevancescore)

	const renderToolbar = (Toolbar: (props: ToolbarProps) => ReactElement) => (
		<Toolbar>
			{(slots: ToolbarSlot) => {
				const {
					CurrentPageInput,
					Download,
					EnterFullScreen,
					GoToNextPage,
					GoToPreviousPage,
					NumberOfPages,
					ShowSearchPopover,
					Zoom,
					ZoomIn,
					ZoomOut,
				} = slots;
				return (
					<div
						style={{
							alignItems: 'center',
							display: 'flex',
							width: '100%',
						}}
					>
						<div style={{ padding: '0px 2px' }}>
							<ShowSearchPopover />
						</div>
						<div style={{ padding: '0px 2px' }}>
							<ZoomOut />
						</div>
						<div style={{ padding: '0px 2px' }}>
							<Zoom />
						</div>
						<div style={{ padding: '0px 2px' }}>
							<ZoomIn />
						</div>
						<div style={{ padding: '0px 2px', marginLeft: 'auto' }}>
							<GoToPreviousPage />
						</div>
						<div className='flex flex-row text-sm my-auto align-middle'>
							<CurrentPageInput />
						</div>
						<div className='flex flex-row text-sm my-auto align-middle'>
							of <NumberOfPages />
						</div>
						<div style={{ padding: '0px 2px' }}>
							<GoToNextPage />
						</div>
						<div style={{ padding: '0px 2px', marginLeft: 'auto' }}>
							<EnterFullScreen />
						</div>
						<div style={{ padding: '0px 2px' }}>
							<Download />
						</div>
					</div>
				);
			}}
		</Toolbar>
	)

	const DefaultLayoutPlunginInstance = defaultLayoutPlugin({
		sidebarTabs: (defaultTabs) => {
			return defaultTabs.filter((tab) => tab === defaultTabs[0])
		},
		renderToolbar,
	})

	return (
		<div className='grid grid-cols-10 p-4 bg-gray-200 max-w-[2000px] mx-auto h-[94vh]'>
			<div className={'mt-24 p-6 bg-panel3 rounded-lg max-h-[92vh] overflow-y-auto duration-300 ease-in-out peer-checked:bg-panel1 after:w-4 after:h-4 after:bg-white after:rounded-full after:shadow-md after:duration-300' + 
				(answerWithoutContext ? ' col-span-12 max-w-full' : ' col-span-3 max-w-4xl mr-6') }>
				<div className='text-2xl font-bold text-nav'>Ask a Question</div>
				<div className='text-sm text-nav my-2'>Ask a question about a paper or a topic from your publication library. We will try to answer it using the GPT models.</div>
				{ answers.length && answers[answers.length-1].response ?
					<div className='p-1 mx-4 flex justify-center'>
						<button className={'px-2 py-1 mx-4 my-auto bg-white text-sm hover:bg-bsk_dark_blue text-bsk_dark_blue font-semibold hover:text-white hover:border-transparent rounded-full shadow-md hover:shadow-lg outline-none focus:outline-none' + (answers.length && answers[answers.length-1].response ? '':' opacity-50 cursor-not-allowed')} 
							disabled={answers.length && answers[answers.length-1].response ? false : true}
							onClick={
								()=>{
									setQuery([])
									setAnswers([])
									setQuestionRelevancescore([])
									setAnswerRelevancescore([])
									setSourcePapers([])
									setSourcePages([])
								}
							}>
								<p className='inline-block mx-2'>
									Start a new Chat
								</p>
						</button>
					</div> : <></>
				}
				<div className='mt-4 p-1 mx-4 flex'>
					<div className='text-sm text-nav my-auto mx-1'>GPT model</div>
					<select 
						className='text-md text-nav bg-panel2 py-1 px-2 mx-2 rounded-md w-32'
						value={props.currentSettings.selectedLlm}
						onChange={(e) => props.settingsCallback({...props.currentSettings, selectedLlm: e.target.value})}
					>
						{llms.map((model:any) => {
							return (
								<option key={model} value={model}>{model}</option>
							)
						})}
					</select>
					
				</div>
				<div className='pt-4 mb-2 mx-4 flex'>
					<textarea
						id='submitter' 
						rows={4}
						className='text-gray-900 text-sm rounded-2xl focus:ring-blue-500 focus:border-blue-500 block w-5/6 p-2.5 shadow-md' 
						placeholder=''
						value={searchTerm}
						onChange={(e:any)=>{
							if (!e.target.value.length){
								// setAnswers([])
							}
							setSearchTerm(e.target.value.replace(/\n/g, ''))
						}}
						onKeyUp={
							(e:any)=>{
								if (e.keyCode === 13){
									setQuery((prevQuery:any)=>[...prevQuery, 
										{'question':searchTerm, 'related': relatedQuery}
									])
									setSearchTerm('')
								}
							}
						}>
					</textarea>
					<button 
						className='p-4 mx-2 my-auto bg-white hover:bg-bsk_dark_blue text-bsk_dark_blue font-semibold hover:text-white py-2 px-3 hover:border-transparent rounded-full shadow-md hover:shadow-lg outline-none focus:outline-none h-12'
						onClick={() => {
							setQuery((prevQuery:any)=>[...prevQuery, 
									{'question':searchTerm, 'related': relatedQuery}
								])
								setSearchTerm('')
							}
						}
					>
						<p className='inline-block ml-2'><PaperAirplaneIcon className='w-6 h-6 inline-block'/></p>
					</button>
				</div>
				{/* { answers.length && answers[answers.length-1].response && searchTerm.length ?
					<div className='p-1 mx-4 flex'>
						<input type='checkbox' className="mr-2 mt-[0.3rem] h-3.5 w-8 appearance-none rounded-[0.4375rem] bg-neutral-300 before:pointer-events-none before:absolute before:h-3.5 before:w-3.5 before:rounded-full before:bg-transparent before:content-[''] after:absolute after:z-[2] after:-mt-[0.1875rem] after:h-5 after:w-5 after:rounded-full after:border-none after:bg-neutral-100 after:shadow-[0_0px_3px_0_rgb(0_0_0_/_7%),_0_2px_2px_0_rgb(0_0_0_/_4%)] after:transition-[background-color_0.2s,transform_0.2s] after:content-[''] checked:bg-primary checked:after:absolute checked:after:z-[2] checked:after:-mt-[3px] checked:after:ml-[1.0625rem] checked:after:h-5 checked:after:w-5 checked:after:rounded-full checked:after:border-none checked:after:bg-primary checked:after:shadow-[0_3px_1px_-2px_rgba(0,0,0,0.2),_0_2px_2px_0_rgba(0,0,0,0.14),_0_1px_5px_0_rgba(0,0,0,0.12)] checked:after:transition-[background-color_0.2s,transform_0.2s] checked:after:content-[''] hover:cursor-pointer focus:outline-none focus:ring-0 focus:before:scale-100 focus:before:opacity-[0.12] focus:before:shadow-[3px_-1px_0px_13px_rgba(0,0,0,0.6)] focus:before:transition-[box-shadow_0.2s,transform_0.2s] focus:after:absolute focus:after:z-[1] focus:after:block focus:after:h-5 focus:after:w-5 focus:after:rounded-full focus:after:content-[''] checked:focus:border-primary checked:focus:bg-primary checked:focus:before:ml-[1.0625rem] checked:focus:before:scale-100 checked:focus:before:shadow-[3px_-1px_0px_13px_#3b71ca] checked:focus:before:transition-[box-shadow_0.2s,transform_0.2s] dark:bg-neutral-600 dark:after:bg-neutral-400 dark:checked:bg-primary dark:checked:after:bg-primary dark:focus:before:shadow-[3px_-1px_0px_13px_rgba(255,255,255,0.4)] dark:checked:focus:before:shadow-[3px_-1px_0px_13px_#3b71ca]"
						role={'switch'}
							onChange={
								(e:any)=>{
									if (e.target.checked){
										setRelatedQuery(true)
									}
								}
							}
						/>
						<p className='inline-block mx-2 text-sm'>
							related to previous question
						</p>
					</div>
					 : null } */}
				{ props.frontendSettings && props.frontendSettings.show_no_context_switch ? 
					<div className='p-1 mx-2 flex'>
						<label className='relative flex justify-between items-center group p-2 text-md text-nav'>
						<input 
							type='checkbox' 
							className='absolute left-1/2 -translate-x-1/2 w-full h-full peer appearance-none rounded-md'
							role={'switch'}
							checked={answerWithoutContext}
							onChange={
								(e:any)=>{
									setAnswerWithoutContext(e.target.checked)
								}
							}
						/>
						<span className='w-10 h-4 flex items-center flex-shrink-0 mx-2 p-0 bg-gray-300 rounded-full duration-300 ease-in-out peer-checked:bg-panel1 after:w-4 after:h-4 after:bg-white after:rounded-full after:shadow-md after:duration-300 peer-checked:after:translate-x-6 group-hover:after:translate-x-1'></span>
							Chat to LLM without documents
						</label>
						{/* <input type='checkbox' 
						// className="mr-2 mt-[0.3rem] h-3.5 w-8 appearance-none rounded-[0.4375rem] bg-neutral-300 before:pointer-events-none before:absolute before:h-3.5 before:w-3.5 before:rounded-full before:bg-transparent before:content-[''] after:absolute after:z-[2] after:-mt-[0.1875rem] after:h-5 after:w-5 after:rounded-full after:border-none after:bg-neutral-100 after:shadow-[0_0px_3px_0_rgb(0_0_0_/_7%),_0_2px_2px_0_rgb(0_0_0_/_4%)] after:transition-[background-color_0.2s,transform_0.2s] after:content-[''] checked:bg-primary checked:after:absolute checked:after:z-[2] checked:after:-mt-[3px] checked:after:ml-[1.0625rem] checked:after:h-5 checked:after:w-5 checked:after:rounded-full checked:after:border-none checked:after:bg-primary checked:after:shadow-[0_3px_1px_-2px_rgba(0,0,0,0.2),_0_2px_2px_0_rgba(0,0,0,0.14),_0_1px_5px_0_rgba(0,0,0,0.12)] checked:after:transition-[background-color_0.2s,transform_0.2s] checked:after:content-[''] hover:cursor-pointer focus:outline-none focus:ring-0 focus:before:scale-100 focus:before:opacity-[0.12] focus:before:shadow-[3px_-1px_0px_13px_rgba(0,0,0,0.6)] focus:before:transition-[box-shadow_0.2s,transform_0.2s] focus:after:absolute focus:after:z-[1] focus:after:block focus:after:h-5 focus:after:w-5 focus:after:rounded-full focus:after:content-[''] checked:focus:border-primary checked:focus:bg-primary checked:focus:before:ml-[1.0625rem] checked:focus:before:scale-100"
							role={'switch'}
							checked={answerWithoutContext}
							onChange={
								(e:any)=>{
									setAnswerWithoutContext(e.target.checked)
								}
							}
						/>
						<p className='inline-block mx-2 text-sm text-nav'>
							Answer without context
						</p> */}
					</div>
					 : null }
				{
					query.length ? 
					<>{ query.map((_q:any, i:any)=>(
						<div key={i}>
							<div className='py-4 px-6 m-4 bg-panel2 rounded-lg shadow-md box2 user-chat'>
								<div className='flex flex-row justify-between font-bold'>
									<div className='text-nav text-sm py-2'>You</div>
									{
										questionRelevancescore[query.length-i-1] !== undefined  && !answerWithoutContext ? 
										(
											<div className='text-nav rounded-full text-xs py-2'>
												Relevance 
												<span style={{ backgroundColor: ConfidenceScoreColor(questionRelevancescore[query.length-i-1])}} 
													className= {'py-1 px-2 m-1 rounded-full' + (questionRelevancescore[query.length-i-1] > 80 || questionRelevancescore[query.length-i-1] < 20 ? ' text-white' : ' text-nav')}>
													{questionRelevancescore[query.length-i-1] + '%'}
												</span>
											</div>
										) : ''
									}
									{/* <div className='text-nav text-xs py-2'>{query[query.length-i-1].related ? <LinkIcon className='w-4 h-4 inline-block'/> : null}</div> */}
								</div>
								<div className='text-nav'>{query[query.length-i-1].question}</div>
							</div>
							{	answers[query.length-i-1] && answers[query.length-i-1].response ?
								// when full answers is ready to display
								<div className='py-4 px-6 m-4 bg-panel1 rounded-lg shadow-md box2 llm-chat'>
								<div className='flex flex-row justify-between font-bold'>
									<div className='text-white text-sm py-2'>{answers[query.length-i-1].source.split(':')[0]}</div>
									<div className='text-white text-xs py-2'>
									{
										answerRelevancescore[answers.length-1] !== undefined && !answerWithoutContext ? 
										(
											<div className='text-white rounded-full text-xs py-1'>
												Relevance 
												<span style={{ backgroundColor: ConfidenceScoreColor(answerRelevancescore[answers.length-i-1])}} 
													className= {'py-1 px-2 m-1 rounded-full' + (answerRelevancescore[answers.length-i-1] > 80 || answerRelevancescore[answers.length-i-1] < 20 ? ' text-white' : ' text-nav')}>
													{answerRelevancescore[answers.length-i-1] + '%'}
												</span>
											</div>
										) : ''
									}
									</div>
								</div>
								<div className='text-white whitespace-pre-wrap answer-div'>
									<Markdown>
										{answers[query.length-i-1].response}
									</Markdown>
								</div>
								{/* <Feedback
									answer={JSON.parse(JSON.stringify(answers[query.length-i-1]))}
									feedbackReceived={(answers[query.length-i-1].rating && answers[query.length-i-1].rating !== 0) ? true : false}
									feedbackCallback={(feedback:any)=>{
										const requestOptions = {
											method: 'POST',
											headers: { 
												'Content-Type': 'application/json',
												'Authorization': `${process.env.NODE_ENV === 'production' ? process.env.REACT_APP_AUTH_TOKEN_PROD : process.env.REACT_APP_AUTH_TOKEN_DEV}`
											},
											body: JSON.stringify({ 
												answer_text: answers[query.length-i-1].response,
												dataset: selectedDataset !== defaultDataset ? selectedDataset : defaultDataset, 
												rating: feedback.rating,
												user_comment: feedback.user_comment,
											})
										}
										fetch(`${process.env.REACT_APP_BACKEND_API}api/feedback/?format=json`, requestOptions)
											.then(response => response.json())
											.then(data => {
												console.log(data)
											})
									}}
								/> */}
								{
									questionRelevancescore[query.length-1] > 0 && sourcePapers.length && sourcePages.length && sourcePapers[query.length-i-1] && sourcePages[query.length-i-1] ?
									<>
										<div className='text-white text-sm font-bold pt-4'>
											{sourcePapers[query.length-i-1].length > 1 ? 'Sources' : 'Source'}
										</div>
										{sourcePapers[query.length-i-1].map((paper:any, index:number)=>(
											<div 
												className={ 
													selectedPaperIdx === (papers.findIndex((p:any)=>p.paper_title===paper)) && selectedPage === sourcePages[query.length-i-1][index] ? 
													'bg-slate-500':''} 
												key={index} onClick={
												()=>{
													// setSourceIdx(index)
													setselectedPaperIdx(papers.findIndex((p:any)=>p.paper_title===paper))
													setSelectedPage(sourcePages[query.length-i-1][index])
													setFileAttachmentType('highlighted_attachment')
												}}
											>
											<div className='border border-gray-400'></div>
												<div className='text-white text-sm p-2 font-normal italic'>{'Page ' + (sourcePages[query.length-i-1][index]) + ' of "' + paper + '"'}</div>
												{selectedPaperIdx === (papers.findIndex((p:any)=>p.paper_title===paper)) && selectedPage === sourcePages[query.length-i-1][index] ? 
													<div className='text-white text-sm p-2 bg-slate-500'>
														<div className='text-white font-bold'>Context</div>
														{sourceContexts[query.length-i-1][index]}
													</div> : <></>
												}
											</div>
										))}
									</>
									:
									questionRelevancescore[query.length-1] > 0 && sourcePapers.length && sourceStarts.length && sourceStarts[query.length-1] && sourcePapers[query.length-1] && sourcePapers[query.length-1] && sourceStops.length && sourceStops[query.length-1] ?
									<>
									<div className='text-white text-sm font-bold pt-4'>
											{sourcePapers[query.length-i-1].length > 1 ? 'Sources' : 'Source'}
										</div>
										{sourcePapers[query.length-i-1].map((paper:any, index:number)=>(
											<div 
												className={ 
													selectedPaperIdx === (videos.findIndex((p:any)=>p.video_title===paper)) && 
													selectedStart === parseInt(sourceStarts[query.length-i-1][index].split(':')[0])*3600 + parseInt(sourceStarts[query.length-i-1][index].split(':')[1])*60 + parseInt(sourceStarts[query.length-i-1][index].split(':')[2]) ? 
													'bg-slate-500':''} 
												key={index} onClick={
												()=>{
													// setSourceIdx(index)
													setselectedPaperIdx(videos.findIndex((p:any)=>p.video_title===paper))
													const start = sourceStarts[query.length-i-1][index].split(':')
													const stop = sourceStops[query.length-i-1][index].split(':')
													// convert hhmmss to seconds
													let start_time = parseInt(start[0])*3600 + parseInt(start[1])*60 + parseInt(start[2])
													let stop_time = parseInt(stop[0])*3600 + parseInt(stop[1])*60 + parseInt(stop[2])
													setSelectedStart(start_time)
													setSelectedStop(stop_time)
												}}
											>
											<div className='border border-gray-400'></div>
												<div className='text-white text-sm p-2 font-normal italic'>{sourceStarts[query.length-i-1][index] + ' to ' + sourceStops[query.length-i-1][index] + ' of "' + paper + '"'}</div>
												{selectedPaperIdx === (papers.findIndex((p:any)=>p.paper_title===paper)) && selectedPage === sourcePages[query.length-i-1][index] ? 
													<div className='text-white text-sm p-2 bg-slate-500'>
														<div className='text-white font-bold'>Context</div>
														{sourceContexts[query.length-i-1][index]}
													</div> : <></>
												}
											</div>
										))}
									</>
									: <></>
									}
								</div> 
								: (
								// when answer is being generated
								<div className='py-4 px-6 m-4 bg-panel1 rounded-lg shadow-md box2 llm-chat'>
									<div className='flex flex-row justify-between font-bold mt-2 mb-4'>
										<div className='text-white text-sm py-1'>{props.currentSettings.selectedLlm}</div>
									</div>
									<div className='text-white whitespace-pre-wrap answer-div'>
										<Markdown>
											{answer.length ? answer: 'Generating answer...'}
										</Markdown>
									</div>
									{
									questionRelevancescore[query.length-1] > 0 && sourcePapers.length && sourcePages.length && sourcePages[query.length-1] && sourcePapers[query.length-1] ?
									<>
										<div className='text-white text-sm font-bold pt-4'>
											{sourcePapers[query.length-1].length > 1 ? 'Sources' : 'Source'}
										</div>
										{sourcePapers[query.length-1].map((paper:any, index:number)=>(
											<div 
												className={ 
													selectedPaperIdx === (videos.findIndex((p:any)=>p.video_title===paper)) && 
													selectedStart === parseInt(sourceStarts[query.length-i-1][index].split(':')[0])*3600 + parseInt(sourceStarts[query.length-i-1][index].split(':')[1])*60 + parseInt(sourceStarts[query.length-i-1][index].split(':')[2]) ? 
													'bg-slate-500':''} 
												key={index} onClick={
												()=>{
													// setSourceIdx(index)
													setselectedPaperIdx(papers.findIndex((p:any)=>p.paper_title===paper))
													setSelectedPage(sourcePages[query.length-1][index])
													setFileAttachmentType('highlighted_attachment')
												}}
											>
												<div className='border border-gray-400'></div>
												<div className='text-white text-sm p-2 font-normal italic'>{'Page ' + (sourcePages[query.length-1][index]) + ' of "' + paper + '"'}</div>
											</div>
										))}
									</>:
									questionRelevancescore[query.length-1] > 0 && sourcePapers.length && sourceStarts.length && sourceStarts[query.length-1] && sourcePapers[query.length-1] && sourceStops.length && sourceStops[query.length-1] ?
									<>
									<div className='text-white text-sm font-bold pt-4'>
											{sourcePapers[query.length-i-1].length > 1 ? 'Sources' : 'Source'}
										</div>
										{sourcePapers[query.length-i-1].map((paper:any, index:number)=>(
											<div 
												// className={ 
												// 	selectedPaperIdx === (papers.findIndex((p:any)=>p.paper_title===paper)) && selectedPage === sourcePages[query.length-i-1][index] ? 
												// 	'bg-slate-500':''} 
												key={index} onClick={
												()=>{
													// setSourceIdx(index)
													setselectedPaperIdx(videos.findIndex((p:any)=>p.video_title===paper))
													const start = sourceStarts[query.length-i-1][index].split(':')
													const stop = sourceStops[query.length-i-1][index].split(':')
													// convert hhmmss to seconds
													let start_time = parseInt(start[0])*3600 + parseInt(start[1])*60 + parseInt(start[2])
													let stop_time = parseInt(stop[0])*3600 + parseInt(stop[1])*60 + parseInt(stop[2])
													setSelectedStart(start_time)
													setSelectedStop(stop_time)
												}}
											>
											<div className='border border-gray-400'></div>
												<div className='text-white text-sm p-2 font-normal italic'>{sourceStarts[query.length-1][index] + ' to ' + sourceStops[query.length-1][index] + ' of "' + paper + '"'}</div>
											</div>
										))}
									</>
									: <></>
									}
								</div>
								)
							}
						</div>
				))}</> : query.length && !answers.length ?
						<div className='inline-block mx-2 my-1 text-center font-bold w-full text-nav'>Loading...</div> :
						null
				}
			</div>
			{ !answerWithoutContext ? 
			<>				
			<div className='col-span-2 mt-24 max-w-5xl w-full bg-panel1 rounded-l-lg overflow-y-auto max-h-[92vh]'>
				<div className=' p-6 text-2xl font-bold text-white'>{papers.length ? 'Your publication library' : 'Your video library'}</div>
				
				<div className='p-2 text-sm border-slate-400 border-y'>
					<div className='text-white inline-block px-2'> Current library </div>
					{/* <div className='inline-block px-2 py-1 bg-panel3 rounded-md cursor-default'>{props.currentSettings.selectedDataset.split('_').join(' ')}</div> */}
					<select 
						className='text-md text-nav bg-panel3 py-1 px-2 mx-1 rounded-md w-28 inline-block'
						value={props.currentSettings.selectedDataset}
						onChange={(e) => props.settingsCallback({...props.currentSettings, selectedDataset: e.target.value, fetchPapers: true})}
					>
						{props.currentSettings.datasets.map((dataset:any) => {
							return (
								<option key={dataset} value={dataset}>{dataset.split('_').join(' ')}</option>
							)
						})}
					</select>
					<div className='mx-1 inline-block px-2 py-1 bg-white rounded-md cursor-pointer hover:bg-slate-200' 
						onClick={()=>{
							props.settingsCallback({...props.currentSettings, selectedPanel: 'datasets', showSettings: true})
						}}>
						<Cog6ToothIcon className='w-4 h-4 inline-block'/>
					</div>
				</div>
				<div className='mb-4 divide-y'>
					{/* list all the papers */}
					{ papers.length ?
						papers.map((p:any, index:number)=>
							<div key={index} className={'p-2 ' + (selectedPaperIdx === index ? ' bg-nav cursor-default': ' bg-panel1 cursor-pointer')}>
								<div className='text-white text-sm '
									onClick={()=> {
										setselectedPaperIdx(index)
										setSelectedPage(0)
										setFileAttachmentType('paper_attachment')
									}}	
								>{p['paper_title']}</div>
							</div>
						) :
						videos.length ?
						videos.map((v:any, index:number)=>
							<div key={index} className={'p-2 ' + (selectedPaperIdx === index ? ' bg-nav cursor-default': ' bg-panel1 cursor-pointer')}>
								<div className='text-white text-sm '
									onClick={()=> {
										setselectedPaperIdx(index)
										setSelectedPage(0)
										setFileAttachmentType('paper_attachment')
									}}	
								>{v['video_title']}</div>
							</div>
						) : <></>
					}
				</div>
			</div>
			<div className='col-span-5 mt-24 p-6 max-w-5xl w-full bg-panel2 rounded-r-lg overflow-y-auto max-h-[92vh]'>
					<div className='overflow-x-auto h-full w-full pt-4 '>
						<Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.js">
						<div  className='h-[76vh]'>
							{papers.length ?
								<Viewer
								fileUrl={`${process.env.REACT_APP_BACKEND_API}media/${papers.length ? papers[selectedPaperIdx][fileAttachmentType] : ''}`}
								defaultScale={SpecialZoomLevel.ActualSize}
								initialPage={selectedPage-1}
								plugins={[
									DefaultLayoutPlunginInstance, 
									PageNavigationPluginInstance,
								]}
								/> : videos.length && videos[selectedPaperIdx] && videos[selectedPaperIdx]['video_link'] ?
								// show embedded youtube videos
									<div className='p-2'>
										<iframe 
											className='w-full h-[40vh]' 
											src={videos[selectedPaperIdx]['video_link'].replace('watch?v=', 'embed/') + '?start=' + selectedStart + '&end=' + selectedStop + (selectedStart !== 0 ? '&autoplay=1&cc_load_policy=1': '')}
											title={videos[selectedPaperIdx]['video_title']}
											allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
											allowFullScreen
											referrerPolicy='no-referrer'
										>
										</iframe>
										</div>
								:
								<div>
									<div className='text-center text-nav'>
										No papers available.
									</div>
									<div className='text-center text-nav mb-2'>
										You can load demo dataset by clicking on the following button.
									</div>
									<div className='text-center'>
										<button 
											className='p-2 mx-2 my-auto bg-white hover:bg-bsk_dark_blue text-bsk_dark_blue font-semibold hover:text-white py-2 px-3 hover:border-transparent rounded-full shadow-md hover:shadow-lg outline-none focus:outline-none'
											onClick={()=>{
												setAddDemoLibrary(true)
											}}
										>
											<p className='inline-block ml-2'>
												Load demo "GPCR" library
											</p>
										</button>
									</div>
									<div className='text-center text-nav mt-2'>
										Or you can add your own library from Settings menu.
									</div>
								</div>
							}
						</div>
					</Worker>
				</div>
			</div>
			</>	:
			<></>
			}
		</div>
	)
}

export default GPTHome