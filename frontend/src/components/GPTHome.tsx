import { useState, useEffect, ReactElement} from 'react'
import { 
	Viewer, Worker, SpecialZoomLevel,
} from '@react-pdf-viewer/core'
import { defaultLayoutPlugin, ToolbarProps, ToolbarSlot } from '@react-pdf-viewer/default-layout'
import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation'
import '@react-pdf-viewer/default-layout/lib/styles/index.css'
import { PaperAirplaneIcon, LinkIcon } from '@heroicons/react/24/outline'
import { schemeRdYlGn, scaleLinear } from 'd3'
import { DropdownOptions } from './DropDownMenu'
// import Feedback from './Feedback'


function GPTHome(){
	const [searchTerm, setSearchTerm] = useState<any>('')
	const [query, setQuery] = useState<any[]>([])
	const [confidenceScores, setConfidenceScores] = useState<any[]>([])
	const [context, setContext] = useState<any>('')
	const [relatedQuery, setRelatedQuery] = useState<any>(false)
	const [answer, setAnswer] = useState<any>('')
	const [answerReceived, setAnswerReceived] = useState<any>(false)
	const [answers, setAnswers] = useState<any[]>([])
	const [papers, setPapers] = useState<any[]>([])
	const [sourcePapers, setSourcePapers] = useState<any[]>([])
	const [sourcePages, setSourcePages] = useState<any[]>([])
	const [selectedPaperIdx, setselectedPaperIdx] = useState(0)
	const [selectedPage, setSelectedPage] = useState(0)
	const [fileAttachmentType, setFileAttachmentType] = useState('paper_attachment')
	const [datasets, setDatasets] = useState<string[]>([])
	const defaultDataset = 'GPCR'
	const [llms, setLlms] = useState<any[]>([])
	const [llm, setLlm] = useState<any>(llms !== undefined && llms.length ? llms[0].model_name : '')
	const [selectedDataset, setSelectedDataset] = useState(defaultDataset)
	const ConfidenceScoreScale = scaleLinear().domain([0, 1]).range([0, 100])
	const confidenceColor = (score:number) => {
		return schemeRdYlGn[9][Math.round(ConfidenceScoreScale(score)/10)]
	}

	// get llms from backend
	useEffect(()=>{
		const requestOptions = {
			method: 'GET',
			headers: { 
				'Content-Type': 'application/json'
			}
		}
		fetch(`${process.env.NODE_ENV === 'production' ? process.env.REACT_APP_API_PROD : process.env.REACT_APP_API_DEV}api/llms/`, requestOptions)
			.then(response => response.json())
			.then(data => {
				setLlms(data.results.map((l:any)=>l.model_name.split(':')[0]))
				setLlm(data.results[0].model_name)
			})
	},[])

	useEffect(()=>{
		const requestOptions = {
			method: 'GET',
			headers: { 
				'Content-Type': 'application/json'
			}
		}
		if(!papers.length)
			fetch(`${process.env.NODE_ENV === 'production' ? process.env.REACT_APP_API_PROD : process.env.REACT_APP_API_DEV}api/get_papers/?dataset=${selectedDataset !== defaultDataset ? selectedDataset : defaultDataset }&format=json`, requestOptions)
				.then(response => response.json())
				.then(data => setPapers(data))
	},[papers, query, defaultDataset, selectedDataset])

	useEffect(()=>{
		const requestOptions = {
			method: 'GET',
			headers: { 
				'Content-Type': 'application/json'
			}
		}
		if(!datasets.length)
			fetch(`${process.env.NODE_ENV === 'production' ? process.env.REACT_APP_API_PROD : process.env.REACT_APP_API_DEV}api/datasets/`, requestOptions)
				.then(response => response.json())
				.then(data => {
					const dataset_names = data.results.map((d:any)=>d.dataset_name)
					if (dataset_names && dataset_names.length && dataset_names.includes(defaultDataset)){
						dataset_names.splice(dataset_names.indexOf(defaultDataset), 1)
						dataset_names.unshift(defaultDataset)
					} else {
						dataset_names.unshift(defaultDataset)
					}
					setDatasets(dataset_names)
				})
	},[datasets.length])

	
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
				text: query[query.length-1] && query[query.length-1].question ? query[query.length-1].question.replaceAll('"','\\"') : '',
				model_type: llm,
				dataset: selectedDataset !== defaultDataset ? selectedDataset : defaultDataset,
				new_conversation: query.length === 1 ? true : false, 
				related_query: relatedQuery,
				previous_query: query.length > 1 ? query[query.length-2].question.replaceAll('"','\\"') : '',
			})
		}
		if(query.length && query.length !== answers.length){
		// setSelectedPage(0)
		// setselectedPaperIdx(0)
		setRelatedQuery(false)
		let llm_endpoint = 'get_context'
			fetch(`${process.env.NODE_ENV === 'production' ? process.env.REACT_APP_API_PROD : process.env.REACT_APP_API_DEV}api/${llm_endpoint}/?format=json`, requestOptions)
				.then(response => response.json())
				.then((data:any) => {
					if (data.confidence_score === 0){
						setConfidenceScores((prevConfidenceScores:any)=>[...prevConfidenceScores, data.confidence_score])
						setContext('None')
					}else{
						setConfidenceScores((prevConfidenceScores:any)=>[...prevConfidenceScores, data.confidence_score])
						setContext(data.context)
						setSourcePapers((prevSourcePapers:any)=>[...prevSourcePapers, data.sources.map((s:any)=>s.paper)])
						setSourcePages((prevSourcePages:any)=>[...prevSourcePages, data.sources.map((s:any)=>s.page)])
						setSelectedPage(data.sources[0].page)
						const paperIndex:number = papers.findIndex((p:any)=>p.paper_title === data.sources[0].paper)
						setselectedPaperIdx(paperIndex)
						setPapers([])
						setFileAttachmentType('highlited_attachment')
						setAnswerReceived(false)
					}
				})
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	},[query])

	// get answer from the ollama
	useEffect(()=>{
		const question =  query[query.length-1] && query[query.length-1].question ? query[query.length-1].question.replaceAll('"','\\"') : ''
		const body = JSON.stringify({
			'model': llm,
			'prompt': context.length && context !== 'None' ? context + '\n Based on above context answer this question: ' + question : question,
		})
		if(context.length > 1 && question.length > 1){
			// fetch using async await
			const postData = async () => {
				let content = ''
				const response = await fetch(`http://localhost:11434/api/generate`, {body, method: 'POST'})
				const reader:any = response.body?.getReader()
				while (true) {
					const { done, value } = await reader.read()
					if (done) {
						break;
					}
					const rawjson = new TextDecoder().decode(value);
					const json = JSON.parse(rawjson)

					if (json.done === false) {
						content += json.response
					}else{
						setAnswerReceived(true)
					}
					setAnswer(content)
				}
			}
			postData()
		}
	},[query, context, llm])

	useEffect(()=>{
		if (answerReceived)
			setAnswers((prevAnswers:any)=>[...prevAnswers, {'response': answer, 'source': llm}])
	},[answer, llm, answerReceived])

	// save asnwer to backend database
	useEffect(()=>{
		if(answers.length && query.length && query.length === answers.length){
			const requestOptions = {
				method: 'POST',
				headers: { 
					'Content-Type': 'application/json',
					'Authorization': `${process.env.NODE_ENV === 'production' ? process.env.REACT_APP_AUTH_TOKEN_PROD : process.env.REACT_APP_AUTH_TOKEN_DEV}`
				},
				body: JSON.stringify({ 
					question_text: query[query.length-1].question,
					answer_text: answers[answers.length-1].response,
					model_type: answers[answers.length-1].source,
				})
			}
			fetch(`${process.env.NODE_ENV === 'production' ? process.env.REACT_APP_API_PROD : process.env.REACT_APP_API_DEV}api/save_answer/?format=json`, requestOptions)
				.then(response => response.json())
				.then(data => {
					console.log(data)
				})
		}
	},[answers, query])

	useEffect(()=>{
		PageNavigationPluginInstance.jumpToPage(selectedPage-1)
	// eslint-disable-next-line react-hooks/exhaustive-deps
	},[selectedPage])

	// console.log('answers', answers)

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

	const PageNavigationPluginInstance = pageNavigationPlugin()

	return (
		<div className='grid grid-cols-10 p-4 bg-gray-200 max-w-[2000px] mx-auto h-screen'>
			<div className='col-span-3 mt-24 mr-6 p-6 max-w-4xl bg-panel3 rounded-lg max-h-[92vh] overflow-y-auto'>
				<div className='text-2xl font-bold text-nav'>Ask a Question</div>
				<div className='text-sm text-nav my-2'>Ask a question about a paper or a topic from your publication library. We will try to answer it using the GPT models.</div>
				<div className='p-1 mx-4 flex'>
					<div className='text-sm text-nav my-auto mx-1'>GPT model</div>
					<DropdownOptions
						optionsList={llms !== undefined && llms.length ? llms : []}
						defaultOption={llm}
						dropDownCallback={(option:string)=>{
							setLlm(llms.find((l:any)=>l.split(':')[0] === option))
						}}
					/>
					<button className={'px-2 py-1 mx-4 my-auto bg-white text-sm hover:bg-bsk_dark_blue text-bsk_dark_blue font-semibold hover:text-white hover:border-transparent rounded-full shadow-md hover:shadow-lg outline-none focus:outline-none' + (answers.length && answers[answers.length-1].response ? '':' opacity-50 cursor-not-allowed')} 
						disabled={answers.length && answers[answers.length-1].response ? false : true}
						onClick={
							()=>{
								setQuery([])
								setAnswers([])
							}
						}>
							<p className='inline-block mx-2'>
								Clear Chat
							</p>
					</button>
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
				{ answers.length && answers[answers.length-1].response && searchTerm.length ?
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
					 : null }
				{
					query.length ? 
					<>{ query.map((_q:any, i:any)=>(
						<div key={i}>
							<div className='py-4 px-6 m-4 bg-panel2 rounded-lg shadow-md box2 user-chat'>
								<div className='flex flex-row justify-between font-bold'>
									<div className='text-nav text-sm py-2'>You</div>
									<div className='text-nav text-xs py-2'>{query[query.length-i-1].related ? <LinkIcon className='w-4 h-4 inline-block'/> : null}</div>
								</div>
								<div className='text-nav'>{query[query.length-i-1].question}</div>
							</div>
							{	answers[query.length-i-1] && answers[query.length-i-1].response ?
								<div className='py-4 px-6 m-4 bg-panel1 rounded-lg shadow-md box2 llm-chat'>
								<div className='flex flex-row justify-between font-bold'>
									<div className='text-white text-sm py-2'>{answers[query.length-i-1].source.split(':')[0]}</div>
									<div className='text-white text-xs py-2'>
									{
											confidenceScores[query.length-i-1] !== undefined ? 
											(
												<div className='text-white rounded-full text-xs py-1'>
													Relevance 
													<span style={{ backgroundColor: confidenceColor(confidenceScores[query.length-i-1])}} className= 'text-nav py-1 px-2 m-1 rounded-full'>
														{confidenceScores[query.length-i-1]}
													</span>
												</div>
											) : ''
										}
									</div>
								</div>
								<div className='text-white whitespace-pre-wrap'>{answers[query.length-i-1].response}</div>
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
										fetch(`${process.env.NODE_ENV === 'production' ? process.env.REACT_APP_API_PROD : process.env.REACT_APP_API_DEV}api/feedback/?format=json`, requestOptions)
											.then(response => response.json())
											.then(data => {
												console.log(data)
											})
									}}
								/> */}
								{
									confidenceScores[query.length-i-1] > 0 && sourcePapers.length && sourcePages.length && sourcePapers[query.length-i-1] && sourcePages[query.length-i-1] ?
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
													setFileAttachmentType('highlited_attachment')
												}}
											>
												<div className='border border-gray-400'></div>
												<div className='text-white text-sm p-2 font-normal italic'>{'Page ' + (sourcePages[query.length-i-1][index]) + ' of "' + paper + '"'}</div>
											</div>
										))}
									</>
									: <></>
									}
								</div> 
								: (
								<div className='py-4 px-6 m-4 bg-panel1 rounded-lg shadow-md box2 llm-chat'>
									<div className='flex flex-row justify-between font-bold mt-2 mb-4'>
										<div className='text-white text-sm py-1'>{llm.split(':')[0]}</div>
										{
											confidenceScores[query.length-1] !== undefined ? 
											(
												<div className='text-white rounded-full text-xs py-1'>
													Relevance 
													<span style={{ backgroundColor: confidenceColor(confidenceScores[query.length-1])}} className= 'text-nav py-1 px-2 m-1 rounded-full'>
														{confidenceScores[query.length-1]}
													</span>
												</div>
											) : ''
										}
									</div>
									<div className='text-white whitespace-pre-wrap'>{answer.length ? answer: 'Generating answer...'}</div>
									{
									confidenceScores[query.length-1] > 0 && sourcePapers.length && sourcePages.length && sourcePapers[query.length-1] && sourcePages[query.length-1] ?
									<>
										<div className='text-white text-sm font-bold pt-4'>
											{sourcePapers[query.length-1].length > 1 ? 'Sources' : 'Source'}
										</div>
										{sourcePapers[query.length-1].map((paper:any, index:number)=>(
											<div 
												className={ 
													selectedPaperIdx === (papers.findIndex((p:any)=>p.paper_title===paper)) && selectedPage === sourcePages[query.length-1][index] ? 
													'bg-slate-500':''} 
												key={index} onClick={
												()=>{
													// setSourceIdx(index)
													setselectedPaperIdx(papers.findIndex((p:any)=>p.paper_title===paper))
													setSelectedPage(sourcePages[query.length-1][index])
													setFileAttachmentType('highlited_attachment')
												}}
											>
												<div className='border border-gray-400'></div>
												<div className='text-white text-sm p-2 font-normal italic'>{'Page ' + (sourcePages[query.length-1][index]) + ' of "' + paper + '"'}</div>
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
			<div className='col-span-2 mt-24 max-w-5xl w-full bg-panel1 rounded-l-lg overflow-y-auto max-h-[92vh]'>
				<div className=' p-6 text-2xl font-bold text-white'>Your publication library</div>
				
				<div className='p-2 text-sm border-slate-400 border-y'>
					<div className='text-white inline-block px-2'> Current library </div>
					<div className='inline-block'>
						<DropdownOptions
							optionsList={datasets}
							defaultOption={datasets[0]}
							dropDownCallback={(option:string)=>{
								setPapers([])
								setSelectedDataset(option)
							}}
						/>
					</div>
				</div>
				<div className='mb-4 divide-y'>
					{/* list all the papers */}
					{
						papers.map((p:any, index:number)=>
							<div key={index} className={'p-2' + (selectedPaperIdx === index ? ' bg-nav': ' bg-panel1')}>
								<div className='text-white text-sm '
									onClick={()=> {
										setselectedPaperIdx(index)
										setSelectedPage(0)
										setFileAttachmentType('paper_attachment')
									}}	
								>{p['paper_title']}</div>
							</div>
						)
					}
				</div>
			</div>
			<div className='col-span-5 mt-24 p-6 max-w-5xl w-full bg-panel2 rounded-r-lg overflow-y-auto max-h-[92vh]'>
					<div className='overflow-x-auto h-full w-full pt-4 '>
						<Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.js">
						<div  className='h-[76vh]'>
							<Viewer
								fileUrl={`${process.env.NODE_ENV === 'production' ? process.env.REACT_APP_API_PROD : process.env.REACT_APP_API_DEV}media/${papers.length ? papers[selectedPaperIdx][fileAttachmentType] : ''}`}
								defaultScale={SpecialZoomLevel.ActualSize}
								initialPage={selectedPage-1}
								plugins={[
									DefaultLayoutPlunginInstance, 
									PageNavigationPluginInstance,
								]}
							/>
						</div>
					</Worker>
					</div>
			</div>
		</div>
	)
}

export default GPTHome