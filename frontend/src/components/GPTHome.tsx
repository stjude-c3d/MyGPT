import { useState, useEffect, ReactElement} from 'react'
import { 
	Viewer, Worker, SpecialZoomLevel,
} from '@react-pdf-viewer/core'
import { defaultLayoutPlugin, ToolbarProps, ToolbarSlot } from '@react-pdf-viewer/default-layout'
import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation'
import '@react-pdf-viewer/default-layout/lib/styles/index.css'
import { PaperAirplaneIcon } from '@heroicons/react/24/outline'
import { DropdownOptions } from './DropDownMenu'
import Feedback from './Feedback'


function GPTHome(){
	const [searchTerm, setSearchTerm] = useState<any>('')
	const [query, setQuery] = useState<any[]>([])
	const [answers, setAnswers] = useState<any[]>([])
	const [papers, setPapers] = useState<any[]>([])
	const [sourcePapers, setSourcePapers] = useState<any[]>([])
	const [sourcePages, setSourcePages] = useState<any[]>([])
	const [selectedPaperIdx, setselectedPaperIdx] = useState(0)
	const [selectedPage, setSelectedPage] = useState(0)
	const [fileAttachmentType, setFileAttachmentType] = useState('paper_attachment')
	const [datasets, setDatasets] = useState<string[]>([])
	const defaultDataset = 'GPCR'
	const [selectedDataset, setSelectedDataset] = useState(defaultDataset)

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
				text: query[query.length-1] ? query[query.length-1].replaceAll('"','\\"') : '',
				dataset: selectedDataset !== defaultDataset ? selectedDataset : defaultDataset,
				new_conversation: query.length === 1 ? true : false, 
				previous_query: query.length > 1 ? query[query.length-2].replaceAll('"','\\"') : '',
			})
		}
		if(query.length && query.length !== answers.length){
			let response_answer:any = null
		// setSelectedPage(0)
		// setselectedPaperIdx(0)
			fetch(`${process.env.NODE_ENV === 'production' ? process.env.REACT_APP_API_PROD : process.env.REACT_APP_API_DEV}api/llamology/?format=json`, requestOptions)
				.then(response => response.json())
				.then(data => {
					response_answer = data
					return [...answers, data]
				})
				.then(setAnswers)
				.then(()=>{
					setSourcePapers((prevSourcePapers:any)=>[...prevSourcePapers, response_answer.sources.map((s:any)=>s.paper)])
					setSourcePages((prevSourcePages:any)=>[...prevSourcePages, response_answer.sources.map((s:any)=>s.page)])
					setSelectedPage(response_answer.sources[0].page)
					const paperIndex = papers.findIndex((p:any)=>p.paper_title === response_answer.sources[0].paper)
					setselectedPaperIdx(paperIndex)
					setPapers([])
					setFileAttachmentType('highlited_attachment')
				})
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	},[query])

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
				<div className='pt-4 mb-4 mx-4 flex'>
					<textarea
						id='submitter' 
						rows={4}
						className='text-gray-900 text-sm rounded-2xl focus:ring-blue-500 focus:border-blue-500 block w-5/6 p-2.5 shadow-md' 
						placeholder=''
						value={searchTerm}
						onChange={(e:any)=>{
							if (!e.target.value.length){
								setAnswers([])
							}
							setSearchTerm(e.target.value.replace(/\n/g, ''))
						}}
						onKeyUp={
							(e:any)=>{
								if (e.keyCode === 13){
									setQuery((prevQuery:any)=>[...prevQuery, searchTerm])
									setSearchTerm([''])
								}
							}
						}>
					</textarea>
					<button 
						className='p-4 mx-2 my-auto bg-white hover:bg-bsk_dark_blue text-bsk_dark_blue font-semibold hover:text-white py-2 px-3 hover:border-transparent rounded-full shadow-md hover:shadow-lg outline-none focus:outline-none h-12'
						onClick={() => {
								setQuery((prevQuery:any)=>[...prevQuery, searchTerm])
								setSearchTerm([''])
							}
						}
					>
						<p className='inline-block ml-2'><PaperAirplaneIcon className='w-6 h-6 inline-block'/></p>
					</button>
				</div>
				{
					query.length ? 
					<>{ query.map((_q:any, i:any)=>(
						<div key={i}>
							<div className='py-4 px-6 m-4 bg-panel2 rounded-lg shadow-md box2 user-chat'>
								<div className='flex flex-row justify-between font-bold'>
									<div className='text-nav text-sm py-2'>You</div>
								</div>
								<div className='text-nav'>{query[query.length-i-1]}</div>
							</div>
							{	answers[query.length-i-1] && answers[query.length-i-1].response ?
								<div className='py-4 px-6 m-4 bg-panel1 rounded-lg shadow-md box2 llm-chat'>
								<div className='flex flex-row justify-between font-bold'>
									<div className='text-white text-sm py-2'>{answers[query.length-i-1].source}</div>
								</div>
								<div className='text-white whitespace-pre-wrap'>{answers[query.length-i-1].response}</div>
								<Feedback
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
								/>
								{
									sourcePapers.length && sourcePages.length && sourcePapers[query.length-i-1] && sourcePages[query.length-i-1] ?
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
									<div className='flex flex-row justify-between font-bold'>
										<div className='text-white text-sm py-2'>{'Llama2'}</div>
									</div>
									<div className='text-white whitespace-pre-wrap'>{'Loading...'}</div>
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