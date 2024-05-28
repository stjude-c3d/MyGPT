import { useState, useEffect } from 'react'
import { scaleSequential, interpolateRdYlGn } from 'd3'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import Markdown from 'react-markdown'

interface ChatHistoryProps {
	dataset: string,
	datasets: string[],
	closeChatHistory: any,
}

const ChatHistory = (props: ChatHistoryProps) =>{

	const ConfidenceScoreColor = scaleSequential()
		.domain([0, 100])
		.interpolator(interpolateRdYlGn)

	const [chatHistory, setChatHistory] = useState([])
	const [activeQuestion, setActiveQuestion] = useState(0)
	const [activeQuestionID, setActiveQuestionID] = useState(0)
	const [questionDetails, setQuestionDetails]:[any,any] = useState({})
	const [selectedSource, setSelectedSource] = useState(0)
	const [selectedDataset, setSelectedDataset] = useState(props.dataset)

	useEffect(() => {
		// fetch chat history from API
		fetch(`${process.env.REACT_APP_BACKEND_API}api/get_conversation_history/?dataset=${selectedDataset}`)
			.then(response => response.json())
			.then(data => {
				const questions_array:any = []
				data.conversations.forEach((conversation: any) => {
					conversation.questions_answers.forEach((question: any) => {
						questions_array.push(question)
					})
			})
			if (questions_array.length > 0) {
				setChatHistory(questions_array)
				setActiveQuestionID(questions_array[0].question_id)
			}
		})
	}, [selectedDataset])

	// fetch answers and sources for selected question
	useEffect(() => {
		if (activeQuestionID === 0) return
		fetch(`${process.env.REACT_APP_BACKEND_API}api/get_question_details/?question_id=${activeQuestionID}`)
			.then(response => response.json())
			.then(data => {
				setQuestionDetails(data)
			})
	}, [activeQuestionID])

	return (
		// create floating panel with opque background
		<div className='fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center'>
			<div className={'bg-panel1 w-3/4 max-h-[1100px] max-w-[1200px] rounded-lg ' + (window.screen.availHeight < 1000 ? 'h-[95vh]' : 'h-[75vh]')}>
				<div className='flex justify-between'>
					<div className='text-2xl font-bold text-white mt-8 mx-8'>Chat History</div>
					<div className='text-2xl font-bold text-white mt-8 mr-8 cursor-pointer' onClick={props.closeChatHistory}>x</div>
				</div>
				<div className={'flex justify-between my-6 '+ (window.screen.availHeight < 1000 ? 'h-[78vh]' : 'h-[62vh]')}>
					{/* create left side panel for questions */}
					<div className={'w-1/3 border-slate-400 border-y-2 overflow-y-auto ' + (window.screen.availHeight < 1000 ? 'h-[80vh]' : 'h-[55vh]')}>
						<div className='grid grid-cols-1 divide-y'>
							<div className='text-white py-2 px-4'>
								<div className='text-lg font-bold inline-block'>
									Library
								</div>
							{/* dropdown for datasets */}
							<select 
								className='text-md text-nav bg-panel2 py-2 px-4 mx-2 rounded-md'
								value={selectedDataset}
								onChange={(e) => setSelectedDataset(e.target.value)}
							>
								{props.datasets.map((dataset, index) => {
									return (
										<option key={index} value={dataset}>{dataset}</option>
									)
								})}
							</select>
							</div>
							<div className='text-white text-lg font-bold py-2 px-4'>Questions</div>
							{
								chatHistory && chatHistory.length === 0 ? 
									<div className='text-lg text-white px-4 mx-2'>No chat history available</div> :
									chatHistory.map((message:any, index:number) => {
									return (
										<div 
											key={index} 
											className={`text-white text-md cursor-pointer py-2 px-4 overflow-y-auto 
												${activeQuestion === index ? 'font-normal bg-nav' : 'font-light bg-panel1'}`}
											onClick={() => {
												setActiveQuestion(index)
												setActiveQuestionID(message.question_id)
											}}
										>
											{message.question}
										</div>
									)
								})
							}
						</div>
					</div>
					{/* create right side for answers and sources list */}
					<div className={'w-2/3 bg-panel3 max-h-[55vh] overflow-y-auto overflow-x-clip border-slate-400 border-y-2 ' + (window.screen.availHeight < 1000 ? 'h-[80vh]' : 'h-[55vh]')}>
					{ activeQuestionID === 0 ? <div className='px-4 mx-2'> No Q&A to display</div> :
						<>
							<div className='py-4 px-6 m-4 bg-panel2 rounded-lg shadow-md box2 user-chat'>
								<div className={'flex flex-row justify-between font-bold overflow-x-auto'}>
									<div className='text-nav text-sm py-2'>You</div>
									<div className='text-nav rounded-full text-xs py-2'>
										Relevance 
										<span style={{ backgroundColor: ConfidenceScoreColor(questionDetails.relevance_score)}} 
											className= {'py-1 px-2 m-1 rounded-full' + (questionDetails.relevance_score > 80 || questionDetails.relevance_score < 20 ? ' text-white' : ' text-nav')}>
											{questionDetails.relevance_score + '%'}
										</span>
									</div>
								</div>
								<div className='text-nav'>{questionDetails.question}</div>
							</div>
							<div className='py-4 px-6 m-4 bg-panel1 rounded-lg shadow-md box2 llm-chat'>
							{ questionDetails.answers && questionDetails.answers.length >= 0 ?
								<>
									<div className='flex flex-row justify-between font-bold'>
											<div className='text-white text-sm py-2'>{questionDetails.llm}</div>
											<div className='text-white text-xs py-2'>
												<div className='text-white rounded-full text-xs py-1'>
													Relevance 
													<span style={{ backgroundColor: ConfidenceScoreColor(questionDetails.answers[0].relevance_score)}} 
														className= {'py-1 px-2 m-1 rounded-full' + (questionDetails.answers[0].relevance_score > 80 || questionDetails.answers[0].relevance_score < 20 ? ' text-white' : ' text-nav')}>
														{questionDetails.answers[0].relevance_score + '%'}
													</span>
												</div>
											</div>
										</div>
									<div className='text-white whitespace-pre-wrap'>
										<Markdown>
											{questionDetails.answers[0].answer}
										</Markdown>
									</div>
									<div className='text-white text-sm font-bold pt-4'>
									{questionDetails.sources.length > 1 ? 'Sources' : 'Source'}
								</div>
								{questionDetails.sources.map((source:any, index:number)=>(
									<div key={index}>
										<div className='border border-gray-400'></div>
										<div 
											className={'text-white text-sm p-2 font-normal italic' + (selectedSource === index ? ' bg-nav' : ' bg-panel1')}
											onClick={() => setSelectedSource(index)}
										>
												{'Page ' + (source.page) + ' of "' + source.paper + '"'}
												{selectedSource === index ? <ChevronUpIcon className='h-4 w-4 float-right'/> : <ChevronDownIcon className='h-4 w-4 float-right'/>}
										</div>
										{selectedSource === index ? 
											<div className='text-white text-sm p-2 bg-slate-500'>
												<div className='text-white font-bold'>Context</div>
												{source.context}
											</div> : <></>
										}
									</div>
								))}
								</> : <></>}
							</div>
						</>}
					</div>
				</div>
			</div>
		</div>
	)
};

export default ChatHistory