import { useState, useEffect, ReactElement} from 'react'
import { 
	Viewer, Worker, SpecialZoomLevel, Icon
} from '@react-pdf-viewer/core'
import { defaultLayoutPlugin, ToolbarProps, ToolbarSlot, BookmarkIcon } from '@react-pdf-viewer/default-layout'
import { bookmarkPlugin } from '@react-pdf-viewer/bookmark';
import '@react-pdf-viewer/bookmark/lib/styles/index.css';
import type { RenderBookmarkItemProps } from '@react-pdf-viewer/bookmark'
import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation'
import '@react-pdf-viewer/default-layout/lib/styles/index.css'
import { PaperAirplaneIcon, Cog6ToothIcon, PaperClipIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { scaleSequential, interpolateRdYlGn } from 'd3'
import Markdown from 'react-markdown'
// import Feedback from './Feedback'


function GPTHome(props:{
	currentSettings:any,
	settingsCallback:any,
	frontendSettings: any,
	user: any
}){
	const [llms, setLlms] = useState<any[]>([])
	const [selectedDataset, setSelectedDataset] = useState(props.currentSettings.selectedDataset)
	const [searchTerm, setSearchTerm] = useState<any>('')
	const [query, setQuery] = useState<any[]>([])
	const [questionRelevancescore, setQuestionRelevancescore] = useState<any[]>([])
	const [answerRelevancescore, setAnswerRelevancescore] = useState<any[]>([])
	const [hallucinationIndex, setHallucinationIndex] = useState<any>([])
	const [context, setContext] = useState<any>('')
	const [relatedQuery, setRelatedQuery] = useState<any>(false)
	const [answer, setAnswer] = useState<any>('')
	const [answerReceived, setAnswerReceived] = useState<any>(false)
	const [nullAnswer, setnullAnswer] = useState<any>('')
	const [nullAnswerReceived, setnullAnswerReceived] = useState<any>(false)
	const [answers, setAnswers] = useState<any[]>([])
	const [nullAnswers, setNullAnswers] = useState<any[]>([])
	const [showNullAnswerIndexes, setShowNullAnswerIndexes] = useState<any>([])
	const [papers, setPapers] = useState<any[]>([])
	const [focusedPaper, setFocusedPaper] = useState<any>(null)
	const [sections, setSections] = useState<any[]>([])
	const [focusedSection, setFocusedSection] = useState<any>(null)
	const [videos, setVideos] = useState<any[]>([])
	const [sourcePapers, setSourcePapers] = useState<any[]>([])
	const [sourcePages, setSourcePages] = useState<any[]>([])
	const [sourceContexts, setSourceContexts] = useState<any[]>([])
	const [sourceStarts, setSourceStarts] = useState<any[]>([])
	const [sourceStops, setSourceStops] = useState<any[]>([])
	const [sourceColorCodes, setSourceColorCodes] = useState<any[]>([])
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
	const [imageAttachment, setImageAttachment] = useState([])
	const [imageBase64, setImageBase64] = useState([])
	const [mcpOllamaTools, setMcpOllamaTools] = useState<any[]>([])
	// console.log(imageAttachment)
	console.log(props.currentSettings.MCPTools, mcpOllamaTools)

	// get llms from backend
	useEffect(()=>{

		const postData = async () => {
			const response = await fetch(`${process.env.REACT_APP_OLLAMA_API}api/tags`, {method: 'GET'})
				const data = await response.json()

				// set models
				const llms = data.models
					.filter((model:any) => model.details.quantization_level !== 'F16')
					.map((model:any) => model.name)
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
						'Authorization': `${
							props.frontendSettings && props.frontendSettings.django_login ?
							'Bearer ' + localStorage.getItem('access') :
							process.env.NODE_ENV === 'production' ? 
							process.env.REACT_APP_AUTH_TOKEN_PROD 
							: process.env.REACT_APP_AUTH_TOKEN_DEV}`
					},
				setConnection: 'keep-alive',
				keepalive: true,
				setTimeout: 10000,
				body: JSON.stringify({'llms': llms_object})
				}
				if (props.frontendSettings && props.frontendSettings.django_login && localStorage.getItem('access')?.length){
					const response2 = await fetch(`${process.env.REACT_APP_BACKEND_API}api/add_ollama_models/`, requestOptions)
					if (response2.ok){
						const data2 = await response2.json()
						console.log(data2)
					}
				}

				// add embedding models to backend API
				const embedding_models = data.models.filter((model:any) => 
					(model.details.quantization_level === 'F16' && model.details.family.includes('bert')) || (model.details.family.includes('nomic-bert')))
				
				let embedding_models_object:any = []
				embedding_models.forEach((model:any) => {
					let model_name = model.name
					let model_size = model.size* 1e-9
					let model_size_gb = model_size.toFixed(2)
					embedding_models_object.push({name: model_name, size: model_size_gb, source: 'ollama'})
				})

				const requestOptions2 = {
					method: 'POST',
					headers: { 
						'Content-Type': 'application/json',
						'Authorization': `${
							props.frontendSettings && props.frontendSettings.django_login ?
							'Bearer ' + localStorage.getItem('access') :
							process.env.NODE_ENV === 'production' ? 
							process.env.REACT_APP_AUTH_TOKEN_PROD 
							: process.env.REACT_APP_AUTH_TOKEN_DEV}`
					},
					setConnection: 'keep-alive',
					keepalive: true,
					setTimeout: 10000,
					body: JSON.stringify({'embedding_models': embedding_models_object})
				}
				if (props.frontendSettings){
					const response3 = await fetch(`${process.env.REACT_APP_BACKEND_API}api/add_embedding_models/`, requestOptions2)
					if (response3.ok){
						const data3 = await response3.json()
						console.log(data3)
					}
				}

		}
		postData()
	},[props.frontendSettings, props.frontendSettings.django_login])
	
	useEffect(()=>{
		const postData = async () => {
			const requestOptions = {
				method: 'POST',
				headers: { 
					'Content-Type': 'application/json',
					'Authorization': `${
						props.frontendSettings && props.frontendSettings.django
						? 'Bearer ' + localStorage.getItem('access')
						: process.env.NODE_ENV === 'production' ?
						process.env.REACT_APP_AUTH_TOKEN_PROD
						: process.env.REACT_APP_AUTH_TOKEN_DEV}`
				},
				body: JSON.stringify({
					'dataset': props.currentSettings.selectedDataset !== props.currentSettings.defaultDataset ? props.currentSettings.selectedDataset : props.currentSettings.defaultDataset,
					'user_email': props.user && props.user.user_email ? props.user.user_email : '',
					'user_group': props.user && props.user.otherRoles && props.user.otherRoles.length ? props.user.otherRoles[0] : ''
				  })
			}

			if (props.currentSettings.defaultDataset === props.currentSettings.selectedDataset && props.currentSettings.defaultDataset === 'None'){
				return
			}

			if((!props.currentSettings.answerWithoutContext && !papers.length && !videos.length) || (props.currentSettings.fetchPapers === true) ){
				setTimeout(async () => {
					const response = await fetch(`${process.env.REACT_APP_BACKEND_API}api/get_documents/?format=json`, requestOptions)
					const data = await response.json()
					if (data.dataset_type === 'papers'){ 
						setPapers(data.documents)
						setVideos([])
					}
					else if (data.dataset_type === 'videos'){
						setVideos(data.documents)
						setPapers([])
					}
				}, 500)
				
			}
			props.settingsCallback({...props.currentSettings, showSettings: false, fetchPapers: false})

			if (props.currentSettings.fetchPapers === true){
				setQuery([])
				setAnswers([])
				setNullAnswers([])
				setShowNullAnswerIndexes([])
				setselectedPaperIdx(0)
				setSelectedPage(0)
				setFileAttachmentType('paper_attachment')
				setSourcePapers([])
				setSourcePages([])
				setSourceColorCodes([])
				setSourceContexts([])
			}
		}
		postData()
	// eslint-disable-next-line react-hooks/exhaustive-deps	
	},[papers, query, props.currentSettings.defaultDataset, props.currentSettings.selectedDataset, props.currentSettings.fetchPapers, props.currentSettings.selectedDataset])
	
	// console.log(props.currentSettings.selectedDataset, props.currentSettings.defaultDataset)

	// set section by getting form this api/get_sections/ and dataset_name
	useEffect(()=>{
		const requestOptions = {
			method: 'POST',
			headers: { 
				'Content-Type': 'application/json',
				'Authorization': `${
					props.frontendSettings && props.frontendSettings.django_login ?
					'Bearer ' + localStorage.getItem('access') :
					process.env.NODE_ENV === 'production' ?
					process.env.REACT_APP_AUTH_TOKEN_PROD
					: process.env.REACT_APP_AUTH_TOKEN_DEV}`
			},
			body: JSON.stringify({
				dataset_name: props.currentSettings.selectedDataset !== props.currentSettings.defaultDataset ? props.currentSettings.selectedDataset : props.currentSettings.defaultDataset
			})
		}

		if (props.currentSettings.selectedDataset !== props.currentSettings.defaultDataset && props.currentSettings.selectedDataset !== 'None'){
			fetch(`${process.env.REACT_APP_BACKEND_API}api/get_sections/?format=json`, requestOptions)
				.then(response => response.json())
				.then(data => {
					if (data.sections && data.sections.length){
						setSections(data.sections)
					}else{
						setSections([])
					}
				})
		}
		else{
			setSections([])
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	},[props.currentSettings.selectedDataset, props.currentSettings.defaultDataset])

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
					'Content-Type': 'application/json',
					'Authorization': `${
						props.frontendSettings && props.frontendSettings.django_login ?
						'Bearer ' + localStorage.getItem('access') :
						process.env.NODE_ENV === 'production' ? 
						process.env.REACT_APP_AUTH_TOKEN_PROD 
						: process.env.REACT_APP_AUTH_TOKEN_DEV}`
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
				'Authorization': `${
					props.frontendSettings && props.frontendSettings.django_login ?
					'Bearer ' + localStorage.getItem('access') :
					process.env.NODE_ENV === 'production' ? 
					process.env.REACT_APP_AUTH_TOKEN_PROD 
					: process.env.REACT_APP_AUTH_TOKEN_DEV}`
			},
			setConnection: 'keep-alive',
			keepalive: true,
			setTimeout: 10000,
			body: JSON.stringify({ 
				text: query[query.length-1] && query[query.length-1].question ? query[query.length-1].question.replaceAll('"',"'") : '',
				model_type: props.currentSettings.selectedLlm,
				dataset: props.currentSettings.selectedDataset !== props.currentSettings.defaultDataset ? props.currentSettings.selectedDataset : props.currentSettings.defaultDataset,
				new_conversation: query.length === 1 ? true : false,
				document_title: focusedPaper ? focusedPaper : '',
				focused_section: focusedSection ? focusedSection.split(' (')[0] : '',
				maximum_chunks_count: props.currentSettings.maximum_chunks_count,
				no_cutoff: props.currentSettings.no_chunk_cutoff,
				related_query: relatedQuery,
				previous_query: query.length > 1 ? query[query.length-2].question.replaceAll('"',"'") : '',
				no_context: answerWithoutContext,
				sentence_transformer: props.currentSettings.selected_sentence_transformer,
				use_default_qrs: props.currentSettings.use_default_qrs,
				question_best_distance: props.currentSettings.relevance_score_cutoff.question_best,
				question_worst_distance: props.currentSettings.relevance_score_cutoff.question_worst,
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
						if (data.relevance_score === 0){
							setQuestionRelevancescore((prevQuestionRelevancescore:any)=>[...prevQuestionRelevancescore, data.relevance_score])
							setContext('None')
							setSourcePapers((prevSourcePapers:any)=>[...prevSourcePapers, []])
							setSourceContexts((prevSourceContexts:any)=>[...prevSourceContexts, []])
							setSourceColorCodes((prevSourceColorCodes:any)=>[...prevSourceColorCodes, []])
							if (papers.length){
								setSourcePages((prevSourcePages:any)=>[...prevSourcePages, []])
							}else if (videos.length){
								setSourceStarts((prevSourceStarts:any)=>[...prevSourceStarts, []])
								setSourceStops((prevSourceStops:any)=>[...prevSourceStops, []])
							}
							setAnswerReceived(false)
						}else{
							setQuestionRelevancescore((prevQuestionRelevancescore:any)=>[...prevQuestionRelevancescore, data.relevance_score])
							setContext(data.context)
							setSourcePapers((prevSourcePapers:any)=>[...prevSourcePapers, data.sources.map((s:any)=>s.document)])
							setSourceContexts((prevSourceContexts:any)=>[...prevSourceContexts, data.sources.map((s:any)=>s.context)])
							setSourceColorCodes((prevSourceColorCodes:any)=>[...prevSourceColorCodes, data.sources.map((s:any)=>{
								if (s.normalized_distance > 0.6)
									return 'green'
								else if (s.normalized_distance > 0.4)
									return 'yellow'
								else if (s.normalized_distance > 0.2)
									return 'light_yellow'
								else
									return 'gray'
							})])
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
		if (answerWithoutContext) return
		const question =  query[query.length-1] && query[query.length-1].question ? query[query.length-1].question.replaceAll('"',"'") : ''
		const systemPrompt = props.currentSettings.system_prompt + context
		
		const body:any = JSON.stringify({
			'model': props.currentSettings.selectedLlm,
			'prompt': question,
			'stream': true,
			'system': systemPrompt,
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

	// get null answer from ollama without context 
	useEffect(()=>{
		if (answerWithoutContext) return
		const question =  query[query.length-1] && query[query.length-1].question ? query[query.length-1].question.replaceAll('"',"'") : ''
		const systemPrompt = props.currentSettings.direct_chat_system_prompt
		
		const body:any = JSON.stringify({
			'model': props.currentSettings.selectedLlm,
			'prompt': question,
			'stream': true,
			'system': systemPrompt,
			'options': {
				'temperature': props.currentSettings.temperature,
				'top_k': props.currentSettings.top_k,
				'top_p': props.currentSettings.top_p,
			}
		})
		
		if(context.length > 1 && question.length > 1 && nullAnswer === ''){
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
						} else {
							setnullAnswerReceived(true)
						}
					}
					setnullAnswer(content)

					if (last_json.length && last_json[last_json.length - 1] === '}'){
						const last_json_obj = JSON.parse(last_json)
						if (last_json_obj.done === true){
							setnullAnswerReceived(true)
						}
					}
				}
			}
			postData()
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	},[query, context, props.currentSettings.selectedLlm, nullAnswer])

	useEffect(()=>{
		if (answerReceived && answer.length !== 0){
			setAnswers((prevAnswers:any)=>[...prevAnswers, {'response': answer, 'source': props.currentSettings.selectedLlm}])
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	},[answer, props.currentSettings.selectedLlm, answerReceived])

	useEffect(()=>{
		if (nullAnswerReceived && nullAnswer.length !== 0){
			setNullAnswers((prevNullAnswers:any)=>[...prevNullAnswers, nullAnswer])
			setShowNullAnswerIndexes((prevShowNullAnswerIndexes:any)=>[...prevShowNullAnswerIndexes, false])
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	},[nullAnswer, nullAnswerReceived])

	// save answer to backend database
	useEffect(()=>{
		if(answers.length && query.length && nullAnswer.length && nullAnswerReceived && answerReceived && query.length === answers.length){
			const requestOptions = {
				method: 'POST',
				headers: { 
					'Content-Type': 'application/json',
					'Authorization': `${
						props.frontendSettings && props.frontendSettings.django_login ?
						'Bearer ' + localStorage.getItem('access') :
						process.env.NODE_ENV === 'production' ? 
						process.env.REACT_APP_AUTH_TOKEN_PROD 
						: process.env.REACT_APP_AUTH_TOKEN_DEV}`
				},
				body: JSON.stringify({ 
					question_text: query[query.length-1].question.replaceAll('"',"'"),
					answer_text: answers[answers.length-1].response.replaceAll('"',"'"),
					answer_no_context_text: nullAnswer.replaceAll('"',"'"),
					model_type: answers[answers.length-1].source,
					dataset: props.currentSettings.selectedDataset !== props.currentSettings.defaultDataset ? props.currentSettings.selectedDataset : props.currentSettings.defaultDataset,
					sentence_transformer: props.currentSettings.selected_sentence_transformer,
					no_context: answerWithoutContext,
					use_default_ars: props.currentSettings.use_default_ars,
					answer_best_distance: props.currentSettings.relevance_score_cutoff.answer_best,
					answer_worst_distance: props.currentSettings.relevance_score_cutoff.answer_worst,
					use_default_hi: props.currentSettings.use_default_hi,
					a_hi: props.currentSettings.relevance_score_cutoff.HIa,
					b_hi: props.currentSettings.relevance_score_cutoff.HIb,
					c_hi: props.currentSettings.relevance_score_cutoff.HIc,
					temperature: props.currentSettings.temperature,
					top_k: props.currentSettings.top_k,
					top_p: props.currentSettings.top_p,
				})
			}
			fetch(`${process.env.REACT_APP_BACKEND_API}api/save_answer/?format=json`, requestOptions)
				.then(response => response.json())
				.then(data => {
					console.log(data)
					setAnswerRelevancescore((prevAnswerRelevancescore:any)=>[...prevAnswerRelevancescore, data.relevance_score])
					setHallucinationIndex((prevHallucinationIndex:any)=>[...prevHallucinationIndex, data.hallucination_index])
					setContext('')
					setAnswer('')
					setnullAnswer('')
					setnullAnswerReceived(false)
					setAnswerReceived(false)
				})
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	},[answers, nullAnswer, nullAnswerReceived, query, props.currentSettings.selectedDataset, props.currentSettings.defaultDataset, props.currentSettings.selected_sentence_transformer, answerWithoutContext])

	// get answer from ollama without context while chatting to LLM without documents
	useEffect(()=>{
		if (!answerWithoutContext) return
		const messages:any = []
		if (query.length && query.length !== answers.length){
			for (let i=0; i<query.length; i++){
				messages.push({
					'role': 'user',
					'content': query[i].question,
					'images': imageBase64.length ? imageBase64 : []
				})
				if (answers.length > i){
					messages.push({
						'role': 'assistant',
						'content': answers[i].response
					})
				}
			}
		}
		
		const body_:any = {
			'model': props.currentSettings.selectedLlm,
			'messages': messages,
			'stream': true,
			'options': {
				'temperature': props.currentSettings.temperature,
				'top_k': props.currentSettings.top_k,
				'top_p': props.currentSettings.top_p,
			}
		}

		if (props.currentSettings.selectedLlm === 'llama3.1:latest'){
			body_['tools'] = mcpOllamaTools
			body_['stream'] = false
		}

		const body = JSON.stringify(body_)
		
		if(messages.length > 0 && answer === '' && !answerReceived && props.currentSettings.selectedLlm !== 'llama3.1:latest'){
			// fetch using async await
			let leftover:any = ''
			const postData = async () => {
				let content = ''
				const response = await fetch(`${process.env.REACT_APP_OLLAMA_API}api/chat`, {body, method: 'POST'})
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
							content += json.message.content
						}
						else {
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
				setAnswer(content)
				setAnswerReceived(true)
			}
			postData()
		}

		else if (messages.length > 0 && answer === '' && !answerReceived && props.currentSettings.selectedLlm === 'llama3.1:latest'){
			
			const postdata2 = async () => {
			// fetch using async await
				let content = ''
				fetch(`${process.env.REACT_APP_OLLAMA_API}api/chat`, {body, method: 'POST'})
					.then(response => response.json())
					.then(async (data:any)=>{
						if (data.message && data.message.content && data.message.content.length > 0){
							content = data.message.content
						}
						else if (data.message.tool_calls && data.message.tool_calls.length > 0){
								// handle tool calls here
								await Promise.all(props.currentSettings.MCPTools.map(async (tool:any) => {
									const result = await props.currentSettings.MCPClient.callTool({
									name: tool['name'],
									arguments: data.message.tool_calls[0].arguments,
									})
									if (result.content && result.content.length > 0){
										messages.push({
											role: 'tool',
											content: JSON.stringify(result.content)
										})
									}
								}))

								// call the API again with updated messages
								const body_2:any = {
									'model': props.currentSettings.selectedLlm,
									'messages': messages,
									'stream': true,
									'options': {
										'temperature': props.currentSettings.temperature,
										'top_k': props.currentSettings.top_k,
										'top_p': props.currentSettings.top_p,
									}
								}
								const body = JSON.stringify(body_2)
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
								setAnswer(content)
								setAnswerReceived(true)
							}
					})
				
			}

			postdata2()
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	},[query, props.currentSettings.selectedLlm, answerWithoutContext])

	// save answer to backend database without context
	useEffect(()=>{
		if(answers.length && query.length && answer.length !== 0 && answerReceived && query.length === answers.length && answerWithoutContext){
			const requestOptions = {
				method: 'POST',
				headers: { 
					'Content-Type': 'application/json',
					'Authorization': `${
						props.frontendSettings && props.frontendSettings.django_login ?
						'Bearer ' + localStorage.getItem('access') :
						process.env.NODE_ENV === 'production' ?
						process.env.REACT_APP_AUTH_TOKEN_PROD
						: process.env.REACT_APP_AUTH_TOKEN_DEV}`
				},
				body: JSON.stringify({ 
					question_text: query[query.length-1].question.replaceAll('"',"'"),
					answer_text: answer.replaceAll('"',"'"),
					answer_no_context_text: '',
					model_type: props.currentSettings.selectedLlm,
					dataset: props.currentSettings.selectedDataset !== props.currentSettings.defaultDataset ? props.currentSettings.selectedDataset : props.currentSettings.defaultDataset,
					sentence_transformer: props.currentSettings.selected_sentence_transformer,
					no_context: answerWithoutContext,
					use_default_ars: props.currentSettings.use_default_ars,
					answer_best_distance: props.currentSettings.relevance_score_cutoff.answer_best,
					answer_worst_distance: props.currentSettings.relevance_score_cutoff.answer_worst,
					use_default_hi: props.currentSettings.use_default_hi,
					a_hi: props.currentSettings.relevance_score_cutoff.HIa,
					b_hi: props.currentSettings.relevance_score_cutoff.HIb,
					c_hi: props.currentSettings.relevance_score_cutoff.HIc,
					temperature: props.currentSettings.temperature,
					top_k: props.currentSettings.top_k,
					top_p: props.currentSettings.top_p,
				})
			}
			fetch(`${process.env.REACT_APP_BACKEND_API}api/save_answer/?format=json`, requestOptions)
				.then(response => response.json())
				.then(data => {
					console.log(data)
					setAnswerRelevancescore((prevAnswerRelevancescore:any)=>[...prevAnswerRelevancescore, data.relevance_score])
					setHallucinationIndex((prevHallucinationIndex:any)=>[...prevHallucinationIndex, data.hallucination_index])
					setAnswer('')
					setAnswerReceived(false)
				})
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	},[answers, query, answerWithoutContext, answerReceived, answer])

	const PageNavigationPluginInstance = pageNavigationPlugin()

	useEffect(()=>{
		// settime for the page to load
		setTimeout(()=>{
			PageNavigationPluginInstance.jumpToPage(selectedPage-1)
		}, 1000)
		// PageNavigationPluginInstance.jumpToPage(selectedPage-1)
	},[selectedPage, PageNavigationPluginInstance])

	const bookmarkPluginInstance = bookmarkPlugin()
	const { Bookmarks } = bookmarkPluginInstance

	useEffect(()=>{
		if (props.currentSettings.MCPTools && props.currentSettings.MCPTools.length){
			const mcpOllamaTools = props.currentSettings.MCP_tools.map((tool:any)=>{
				return {
					type: 'function',
					function: {
						name: tool.name,
						description: tool.description,
						parameters: {
							type: 'object',
							required: tool.inputSchema.required || [],
							properties: Object.entries(tool.inputSchema.properties).reduce((acc:any, property:any) => {
								acc[property[0]] = {
									type: property[1].type,
									description: property[1].title || ''
								};
								return acc;
							}, {})
						}
					},
				}
			})
			setMcpOllamaTools(mcpOllamaTools)
		}
    // eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.currentSettings.MCP_tools])

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

	const ExpandIcon = () => (
    <Icon size={16}>
        <path d="M.541,5.627,11.666,18.2a.5.5,0,0,0,.749,0L23.541,5.627" />
    </Icon>
);

	const CollapseIcon = () => (
		<Icon size={16}>
			<path d="M5.651,23.5,18.227,12.374a.5.5,0,0,0,0-.748L5.651.5" />
		</Icon>
	);


	const renderBookmarkItem = (renderProps: RenderBookmarkItemProps) =>
        renderProps.defaultRenderItem(
            renderProps.onClickItem,
            <>
                {renderProps.defaultRenderToggle(<ExpandIcon />, <CollapseIcon />)}
                {renderProps.defaultRenderTitle(() => {
                    renderProps.onClickTitle();
                })}
            </>
        );
	
	const DefaultLayoutPluginInstance = defaultLayoutPlugin({
		sidebarTabs: (defaultTabs:any) => [
			defaultTabs[0],
            {
                content: <Bookmarks renderBookmarkItem={renderBookmarkItem} />,
                icon: <BookmarkIcon />,
                title: 'Bookmark',
            },
		],
		renderToolbar,
	})

	const resetStates = () => {
		setQuery([])
		setAnswers([])
		setNullAnswers([])
		setShowNullAnswerIndexes([])
		setQuestionRelevancescore([])
		setAnswerRelevancescore([])
		setHallucinationIndex([])
		setSourcePapers([])
		setSourcePages([])
		setSourceContexts([])
		setSourceColorCodes([])
		setAnswer('')
	}
	return (
		<div className='grid grid-cols-10 p-4 bg-gray-200 dark:bg-neutral-800 max-w-[2000px] mx-auto h-[94vh]'>
			<div className={'mt-24 p-6 bg-panel3 dark:bg-panel2-dark rounded-lg max-h-[92vh] overflow-y-auto duration-300 ease-in-out peer-checked:bg-panel1 after:w-4 after:h-4 after:bg-white after:rounded-full after:shadow-md after:duration-300' + 
				(answerWithoutContext ? ' col-span-12 max-w-full' : ' col-span-3 max-w-4xl mr-6') }>
				<div className='text-2xl font-bold text-nav dark:text-nav-dark'>Ask a Question</div>
				<div className='text-sm text-nav my-2 dark:text-nav-dark'>Ask a question about a paper or a topic from your publication library. We will try to answer it using the GPT models.</div>
				{ answers.length && answers[answers.length-1].response ?
					<div className='p-1 mx-4 flex justify-center'>
						<button className={'px-2 py-1 mx-4 my-auto bg-white dark:bg-panel3-dark dark:text-nav-dark text-sm hover:bg-bsk_dark_blue text-bsk_dark_blue font-semibold hover:text-white hover:border-transparent rounded-full shadow-md hover:shadow-lg outline-none focus:outline-none' + (answers.length && answers[answers.length-1].response ? '':' opacity-50 cursor-not-allowed')} 
							disabled={answers.length && answers[answers.length-1].response ? false : true}
							onClick={resetStates}>
								<p className='inline-block mx-2'>
									Start a new Chat
								</p>
						</button>
					</div> : <></>
				}
				<div className='mt-4 p-1 mx-4 flex'>
					<div className='text-sm text-nav dark:text-nav-dark my-auto mx-1'>GPT model</div>
					<select 
						className='text-md text-nav bg-panel2 dark:bg-stjude dark:text-white py-1 px-2 mx-2 rounded-md w-32'
						value={props.currentSettings.selectedLlm}
						// defaultValue={props.currentSettings.defaultLlm}
						onChange={(e) => {
							if (answerWithoutContext){
								let temp_dataset = e.target.value + '_direct_chat'
								setSelectedDataset(temp_dataset)
								props.settingsCallback({...props.currentSettings, selectedLlm: e.target.value, selectedDataset: temp_dataset})
							} else
							props.settingsCallback({...props.currentSettings, selectedLlm: e.target.value})
					}}
					>
						{llms.map((model:any) => {
							return (
								<option key={model} value={model}>{model}</option>
							)
						})}
					</select>
					
				</div>
				<div className='pt-4 mb-2 flex'>
					{
						props.frontendSettings && props.frontendSettings.disable_chat_without_login && !props.currentSettings.loggedin ?
						<div className='text-sm text-nav my-auto mx-1 bg-white dark:bg-gray-500 dark:text-white rounded-lg w-full h-20 p-2.5 shadow-md'>Login to chat</div> :
						<textarea
							id='submitter' 
							rows={4}
							className='text-gray-900 dark:text-white dark:bg-gray-500 dark:placeholder:text-white text-sm rounded-2xl  block w-5/6 p-2.5 shadow-md' 
							placeholder={props.frontendSettings && props.frontendSettings.disable_chat_without_login && !props.currentSettings.loggedin ? 'Login to chat' : 'Type your question here'}
							value={searchTerm}
							readOnly={props.frontendSettings && props.frontendSettings.disable_chat_without_login && !props.currentSettings.loggedin}
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
					}
					<button 
						className='p-4 mx-2 my-auto bg-white hover:bg-bsk_dark_blue dark:bg-stjude dark:text-white text-bsk_dark_blue font-semibold hover:text-white py-2 px-3 hover:border-transparent rounded-full shadow-md hover:shadow-lg outline-none focus:outline-none h-12'
						disabled={props.frontendSettings && props.frontendSettings.disable_chat_without_login && !props.currentSettings.loggedin}
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
				{ props.currentSettings && props.currentSettings.answerWithoutContext && (props.currentSettings.selectedLlm === 'llama3.2-vision:latest' || props.currentSettings.selectedLlm.toLowerCase() === 'gemma3:27b') ?
					<div className='flex flex-row w-40 mx-4'>
					{/* attachment button for images */}
					<label htmlFor="file-upload" className="relative cursor-pointer flex justify-center items-center bg-white dark:bg-gray-500 dark:text-white shadow-md rounded-lg w-8 h-8 p-2 my-auto">
						<PaperClipIcon className='w-6 h-6 text-bsk_dark_blue'/>
					</label>
					<input id="file-upload" type="file" className="hidden" accept="image/*" multiple
						onChange={(e:any)=>{
							const files = Array.from(e.target.files);
							let images:any = []
							let imageBase64 = []
							files.forEach((file:any) => {
								let reader = new FileReader();
								reader.readAsDataURL(file);
								reader.onloadend = () => {
									images.push(reader.result);
									if (images.length === files.length) {
										setImageAttachment(images);
										imageBase64 = images.map((img:any) => img.split(',')[1]);
										setImageBase64(imageBase64);
									}
								};
							});
						}}
					/>
					<div className='text-nav my-auto mx-2'>Upload images</div>

					</div> :<></>}
				{ imageAttachment && imageAttachment.length > 0 ?
				// show images
				<div className='flex flex-col dark:text-white rounded-lg mx-4'>
					{imageAttachment.map((img:any, idx:any) => (
						<div key={idx} className='flex flex-row items-center mb-4'>
							<img src={img} alt={`attachment-${idx}`} className='px-4 h-80'/>
							<button 
								className='px-4 mx-2 bg-bsk_dark_blue dark:bg-stjude dark:text-white text-bsk_dark_blue font-semibold hover:text-white hover:border-transparent rounded-full shadow-md hover:shadow-lg outline-none focus:outline-none h-8'
								onClick={()=>{
									setImageAttachment(imageAttachment.filter((_, i) => i !== idx));
									setImageBase64(prev => prev.filter((_, i) => i !== idx));
								}}
							>
								<p className='text-white my-auto'><XMarkIcon className='w-8 h-8 inline-block'/></p>
							</button>
						</div>
					))}
				</div> : <></>}
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
				{/* show MCP tool name in tags if llm is llama3.1 */}
				{ props.currentSettings.selectedLlm === 'llama3.1:latest' && props.currentSettings.MCPTools && props.currentSettings.MCPTools.length > 0 ?
					<div className='flex flex-row flex-wrap'>
						<div className='text-sm text-nav dark:text-nav-dark my-auto mx-1'>MCP Tools:</div>
						{props.currentSettings.MCPTools.map((tool:any, idx:any) => (
							<div key={idx} className='bg-panel2 dark:bg-panel3-dark text-nav dark:text-nav-dark rounded-full px-2 py-1 m-1 text-sm'>
								{tool.name}
							</div>
						))}
					</div>
					: <></>
				}

				{ props.frontendSettings && props.frontendSettings.show_no_context_switch ? 
					<div className='p-1 mx-2 flex'>
						<label className='relative flex justify-between items-center group p-2 text-md text-nav dark:text-nav-dark'>
						<input 
							type='checkbox' 
							className='absolute left-1/2 -translate-x-1/2 w-full h-full peer appearance-none rounded-md'
							role={'switch'}
							checked={answerWithoutContext}
							onChange={
								(e:any)=>{
									setAnswerWithoutContext(e.target.checked)
									if (e.target.checked){
										resetStates()
										setSelectedDataset(props.currentSettings.selectedDataset)
										props.settingsCallback({...props.currentSettings, selectedDataset: props.currentSettings.selectedLlm + '_direct_chat', answerWithoutContext: true, fetchPapers: false})
									} else {
										resetStates()
										props.settingsCallback({...props.currentSettings, selectedDataset: selectedDataset, answerWithoutContext: false, fetchPapers: true})
									}
								}
							}
						/>
						<span className='w-10 h-4 flex items-center flex-shrink-0 mx-2 p-0 bg-gray-300 rounded-full duration-300 ease-in-out peer-checked:bg-panel1 dark:peer-checked:bg-stjude after:w-4 after:h-4 after:bg-white after:rounded-full after:shadow-md after:duration-300 peer-checked:after:translate-x-6 group-hover:after:translate-x-1'></span>
							Chat to LLM without documents
						</label>
						{/* <input type='checkbox' 
						// className="mr-2 mt-[0.3rem] h-3.5 w-8 appearance-none rounded-[0.4375rem] bg-neutral-300 before:pointer-events-none before:absolute before:h-3.5 before:w-3.5 before:rounded-full before:bg-transparent before:content-[''] after:absolute after:z-[2] after:-mt-[0.1875rem] after:h-5 after:w-5 after:rounded-full after:border-none after:bg-neutral-100 after:shadow-[0_0px_3px_0_rgb(0_0_0_/_7%),_0_2px_2px_0_rgb(0_0_0_/_4%)] after:transition-[background-color_0.2s,transform_0.2s] after:content-[''] checked:bg-primary checked:after:absolute checked:after:z-[2] checked:after:-mt-[3px] checked:after:ml-[1.0625rem] checked:after:h-5 checked:after:w-5 checked:after:rounded-full checked:after:border-none checked:after:bg-primary checked:after:shadow-[0_3px_1px_-2px_rgba(0,0,0,0.2),_0_2px_2px_0_rgba(0,0,0,0.14),_0_1px_5px_0_rgba(0,0,0,0.12)] checked:after:transition-[background-color_0.2s,transform_0.2s] checked:after:content-[''] hover:cursor-pointer focus:outline-none focus:ring-0 focus:before:scale-100 focus:before:opacity-[0.12] focus:before:shadow-[3px_-1px_0px_13px_rgba(0,0,0,0.6)] focus:before:transition-[box-shadow_0.2s,transform_0.2s] focus:after:absolute focus:after:z-[1] focus:after:block focus:after:h-5 focus:after:w-5 focus:after:rounded-full focus:after:content-[''] checked:focus:border-primary checked:focus:bg-primary checked:focus:before:ml-[1.0625rem] checked:focus:before:scale-100 checked:focus:before:shadow-[3px_-1px_0px_13px_#3b71ca] checked:focus:before:transition-[box-shadow_0.2s,transform_0.2s] dark:bg-neutral-600 dark:after:bg-neutral-400 dark:checked:bg-primary dark:checked:after:bg-primary dark:focus:before:shadow-[3px_-1px_0px_13px_rgba(255,255,255,0.4)] dark:checked:focus:before:shadow-[3px_-1px_0px_13px_#3b71ca]"
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
							<div className={'py-4 px-6 my-4 bg-panel2 dark:bg-panel3-dark rounded-lg shadow-md box2' + (props.currentSettings.darkMode ? ' user-chat-dark' : ' user-chat') }>
								<div className='flex flex-row justify-between font-bold'>
									<div className='text-nav dark:text-nav-dark text-sm py-2'>You</div>
									{
										questionRelevancescore[query.length-i-1] !== undefined  && !answerWithoutContext ? 
										(
											<div className='text-nav dark:text-nav-dark rounded-full text-xs py-2'>
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
								<div className='text-nav dark:text-nav-dark'>{query[query.length-i-1].question}</div>
							</div>
							{	answers[query.length-i-1] && answers[query.length-i-1].response ?
								// when full answers is ready to display
								<div className={'py-4 px-6 my-4 bg-panel1 dark:bg-panel4-dark rounded-lg shadow-md box2' +  (props.currentSettings.darkMode ? ' llm-chat-dark' : ' llm-chat')}>
								<div className='flex flex-row justify-between font-bold'>
									{/* <div className='text-white text-sm py-2'>
										{answers[query.length-i-1].source.split(':')[0] + ' + MyGPT'}
									</div> */}
									{!answerWithoutContext  ?  
									(
									<div>
										<select 
										className='text-sm text-nav bg-panel3 dark:bg-panel2-dark dark:text-nav-dark p-1 rounded-md inline-block'
										value={showNullAnswerIndexes[query.length-i-1] === true ? 'without_context' : 'with_context'}
										onChange={(e)=>{
											if (e.target.value === 'without_context'){
												setShowNullAnswerIndexes((prevShowNullAnswerIndexes:any)=>[...prevShowNullAnswerIndexes.slice(0, query.length-i-1), true, ...prevShowNullAnswerIndexes.slice(query.length-i)])
											}else{
												setShowNullAnswerIndexes((prevShowNullAnswerIndexes:any)=>[...prevShowNullAnswerIndexes.slice(0, query.length-i-1), false, ...prevShowNullAnswerIndexes.slice(query.length-i)])
											}
										}}
										>
											<option value={'with_context'}>{answers[query.length-i-1].source.split(':')[0] + ' + MyGPT'}</option>
											<option value={'without_context'}>{answers[query.length-i-1].source.split(':')[0]}</option>
										</select>
									</div>
									): (<div className='text-white dark:text-nav-dark text-sm py-2'>{props.currentSettings.selectedLlm}</div>)}
									<div className='flex flex-col items-end py-2'>
									{showNullAnswerIndexes[query.length - i - 1] === false && (
										<div className='text-white text-xs pb-1'>
										{
											answerRelevancescore[query.length-i-1] !== undefined && !answerWithoutContext ? 
											(
												<div className='text-white rounded-full text-xs py-1'>
													Relevance 
													<span style={{ backgroundColor: ConfidenceScoreColor(answerRelevancescore[query.length-i-1])}} 
														className= {'py-1 px-2 m-1 rounded-full' + (answerRelevancescore[query.length-i-1] > 80 || answerRelevancescore[query.length-i-1] < 20 ? ' text-white' : ' text-nav')}>
														{answerRelevancescore[query.length-i-1] + '%'}
													</span>
												</div>
											) : ''
										}
										</div>
										 )}
										{showNullAnswerIndexes[query.length - i - 1] === false && ( 
										<div className='text-white text-xs'>
											{
												hallucinationIndex[query.length-i-1] !== undefined && !answerWithoutContext ? 
												(
													<div className='text-white rounded-full text-xs py-1'>
														Hallucination
														<span style={{ backgroundColor: ConfidenceScoreColor(100 - hallucinationIndex[query.length-i-1])}} 
															className= {'py-1 px-2 m-1 rounded-full' + (hallucinationIndex[query.length-i-1] > 80 || hallucinationIndex[query.length-i-1] < 20 ? ' text-white' : ' text-nav')}>
															{hallucinationIndex[query.length-i-1] + '%'}
														</span>
													</div>
												) : ''
											}
										</div>
										 )}
									</div>
								</div>
								<div className='text-white whitespace-pre-wrap answer-div'>
									<Markdown>
										{showNullAnswerIndexes[query.length-i-1] === true? nullAnswers[query.length-i-1] : answers[query.length-i-1].response}
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
								showNullAnswerIndexes[query.length - i - 1] === false &&	questionRelevancescore[query.length-1] > 0 && sourcePapers.length && sourcePages.length && sourcePapers[query.length-i-1] && sourcePages[query.length-i-1] ?
									<>
										<div className='text-white text-sm font-bold pt-4'>
											{sourcePapers[query.length-i-1].length > 1 ? 'Sources' : 'Source'}
										</div>
										{sourcePapers[query.length-i-1].map((paper:any, index:number)=>(
											<div 
												className={ 
													selectedPaperIdx === (papers.findIndex((p:any)=>p.paper_title===paper)) && selectedPage === sourcePages[query.length-i-1][index] ? 
													'bg-slate-600 dark:bg-slate-700':''} 
												key={index} onClick={
												()=>{
													// setSourceIdx(index)
													setselectedPaperIdx(papers.findIndex((p:any)=>p.paper_title===paper))
													setSelectedPage(sourcePages[query.length-i-1][index])
													setFileAttachmentType('highlighted_attachment')
												}}
											>
											<div className='border border-gray-400'></div>
												<div className={'text-white text-sm p-2 font-normal italic ' + (sourceColorCodes[query.length-i-1][index] === 'green' ? 'bg-green-600' : sourceColorCodes[query.length-i-1][index] === 'yellow' ? 'bg-yellow-500' :  sourceColorCodes[query.length-i-1][index] === 'light_yellow' ? 'bg-amber-600' : '')}>{'Page ' + (sourcePages[query.length-i-1][index]) + ' of "' + paper + '"'}</div>
												{selectedPaperIdx === (papers.findIndex((p:any)=>p.paper_title===paper)) && selectedPage === sourcePages[query.length-i-1][index] ? 
													<div className='text-white text-sm p-2 bg-slate-600 dark:bg-slate-700'>
														<div className='text-white font-bold'>Context</div>
														{sourceContexts[query.length-i-1][index]}
													</div> : <></>
												}
											</div>
										))}
									</>
									:
									questionRelevancescore[query.length-1] > 0 && sourcePapers.length && sourceStarts.length && sourcePapers[query.length-1] && sourceStarts[query.length-1] && sourceStops.length && sourceStops[query.length-1] ?
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
													<div className='text-white text-sm p-2 bg-slate-500 dark:bg-slate-700'>
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
								<div className={'py-4 px-6 my-4 bg-panel1 dark:bg-panel4-dark rounded-lg shadow-md box2' + (props.currentSettings.darkMode ? ' llm-chat-dark' : ' llm-chat')}>
									<div className='flex flex-row justify-between font-bold'>
										{!answerWithoutContext ?
											(<div className='text-white text-sm py-1'>{props.currentSettings.selectedLlm + ' + MyGPT'}</div>)
											:(<div className='text-white dark:text-nav-dark text-sm py-2'>{props.currentSettings.selectedLlm}</div>)
										} 
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
												<div className={'text-white text-sm p-2 font-normal italic ' + (sourceColorCodes[query.length-i-1][index] === 'green' ? 'bg-green-600' : sourceColorCodes[query.length-i-1][index] === 'yellow' ? 'bg-yellow-500' :  sourceColorCodes[query.length-i-1][index] === 'light_yellow' ? 'bg-amber-600' : '')}>{'Page ' + (sourcePages[query.length-i-1][index]) + ' of "' + paper + '"'}</div>
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
												<div className='text-white text-sm p-2 font-normal italic'>{sourceStarts[query.length-i-1][index] + ' to ' + sourceStops[query.length-i-1][index] + ' of "' + paper + '"'}</div>
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
			<div className='col-span-2 mt-24 max-w-5xl w-full bg-panel1 dark:bg-panel4-dark rounded-l-lg overflow-y-auto max-h-[92vh]'>
				<div className=' p-6 text-2xl font-bold text-white'>{papers.length ? 'Your publication library' : 'Your video library'}</div>
				
				<div className='p-2 text-sm border-slate-400 border-y'>
					<div className='text-white inline-block px-2'> Current library </div>
					{/* <div className='inline-block px-2 py-1 bg-panel3 rounded-md cursor-default'>{props.currentSettings.selectedDataset.split('_').join(' ')}</div> */}
					<select 
						className='text-md text-nav bg-panel3 dark:bg-stjude dark:text-white py-1 px-2 mx-1 rounded-md w-28 inline-block'
						value={props.currentSettings.selectedDataset}
						onChange={
							(e) => {
								props.settingsCallback({
									...props.currentSettings, 
									selectedDataset: e.target.value, 
									fetchPapers: true,
									use_default_qrs: true,
									use_default_ars: true,
									use_default_hi: true,
								})
								// setSelectedDataset(e.target.value)
								props.currentSettings.selectedDataset = e.target.value
								resetStates()
							}
						}
					>
						{props.currentSettings.datasets.map((dataset:any) => {
							return (
								<option key={dataset} value={dataset}>{dataset.split('_').join(' ')}</option>
							)
						})}
					</select>
					{ (props.frontendSettings && !props.frontendSettings.restriction_without_login) || (props.frontendSettings.restriction_without_login && props.currentSettings.loggedin) ?
					<div className='mx-1 inline-block px-2 py-1 bg-white dark:bg-stjude dark:text-white rounded-md cursor-pointer hover:bg-slate-200' 
						onClick={()=>{
							props.settingsCallback({...props.currentSettings, selectedPanel: 'datasets', showSettings: true})
						}}>
						<Cog6ToothIcon className='w-4 h-4 inline-block'/>
					</div> : <></>}
				</div>
				{/* add filter column for documents */}
				{ papers.length > 1 ?
					<div className='p-2 text-sm border-slate-400 border-b'>
						<div className='text-white inline-block px-2 w-40'> Focus on document </div>
						<select 
							className={'text-md text-nav dark:bg-stjude dark:text-white py-1 px-2 mx-1 rounded-md w-40 inline-block' + (focusedPaper !== null ? ' bg-panel3' : ' bg-panel2 dark:bg-panel4-dark')}
							value={focusedPaper}
							onChange={
								(e) => {
									if (e.target.value === 'None'){
										setFocusedPaper(null)
										setselectedPaperIdx(0)
									} else {
										setFocusedPaper(e.target.value)
										setselectedPaperIdx(papers.findIndex((p:any)=>p.paper_title===e.target.value))
								}}
							}
						>
							<option value={'None'}>None</option>
							{papers.length ?
								papers.map((p:any, index:number) => {
									return (
										<option key={index} value={p['paper_title']}>{p['paper_title']}</option>
									)
								}) :
								videos.map((v:any, index:number) => {
									return (
										<option key={index} value={v['video_title']}>{v['video_title']}</option>
									)
								})
							}
						</select>
					</div>	: <></>
				}
				{ sections.length ?
					<div className='p-2 text-sm border-slate-400 border-b'>
						<div className='text-white inline-block px-2 w-full'> Focus on section (#documents) </div>
						<select 
							className={'text-md text-nav dark:bg-stjude dark:text-white py-1 px-2 mx-1 rounded-md w-40 inline-block' + (focusedSection !== null ? ' bg-panel3' : ' bg-panel2 dark:bg-panel4-dark')}
							value={focusedSection}
							onChange={
								(e) => {
									if (e.target.value === 'None'){
										setFocusedSection(null)
									} else {
										setFocusedSection(e.target.value)
									}
								}
							}
						>
							<option value={'None'}>None</option>
							{papers.length && sections.length ?
								sections.map(s=>s['section_title'] + ' (' +s['section_count']+')').map((st:any, index:number) => {
									return (
										<option key={index} value={st}>{st}</option>
									)
								}) : <></>
							}
						</select>
					</div> : <></>
				}
				
				<div className='mb-4 divide-y'>
					{/* list all the papers */}
					{ papers.length && focusedPaper === null ?
						papers.map((p:any, index:number)=>
							<div key={index} className={'p-2 ' + (selectedPaperIdx === index ? ' bg-nav cursor-default': ' bg-panel1 dark:bg-panel4-dark cursor-pointer')}>
								<div className='text-white text-sm '
									onClick={()=> {
										setselectedPaperIdx(index)
										setSelectedPage(0)
										setFileAttachmentType('paper_attachment')
									}}	
								>{p['paper_title']}</div>
							</div>
						) :
						focusedPaper !== null && papers.length ?
							papers.filter((p:any)=>p['paper_title'] === focusedPaper).map((p:any, index:number)=>
								<div key={index} className={'p-2 ' + (selectedPaperIdx === papers.findIndex((p:any)=>p.paper_title===focusedPaper) ? ' bg-nav cursor-default': ' bg-panel1 dark:bg-panel4-dark cursor-pointer')}>
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
							<div key={index} className={'p-2 ' + (selectedPaperIdx === index ? ' bg-nav cursor-default': ' bg-panel1 dark:bg-panel4-dark cursor-pointer')}>
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
			<div className='col-span-5 mt-24 p-6 max-w-5xl w-full bg-panel2 dark:bg-panel3-dark rounded-r-lg overflow-y-auto max-h-[92vh]'>
					<div className='overflow-x-auto h-full w-full pt-4 '>
						<Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.js">
						<div  className='h-[76vh]'>
							{papers.length ?
								<Viewer
								theme={props.currentSettings.darkMode ? 'dark' : 'light'}
								fileUrl={`${process.env.REACT_APP_BACKEND_API}media/${papers.length ? papers[selectedPaperIdx][fileAttachmentType] : ''}`}
								defaultScale={SpecialZoomLevel.ActualSize}
								initialPage={selectedPage-1}
								plugins={[
									DefaultLayoutPluginInstance, 
									PageNavigationPluginInstance,
									bookmarkPluginInstance,
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
								!props.currentSettings.loggedin ?
								<div>
									<div className='text-center text-nav'>
										Login to view document library
									</div>
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