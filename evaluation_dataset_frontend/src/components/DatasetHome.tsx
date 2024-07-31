import { useEffect, useState } from 'react'
import base64 from 'base-64'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/20/solid'
import { scaleOrdinal, schemeCategory10 } from 'd3'
import PieChartApp from '@mb-group/pie_chart_widget'
import Feedback from './Feedback'
import useAuthenticateUser from '../hooks/useAuthenticateUser'

function DatasetHome(){

	const [datasets, setDatasets] = useState<any>([])
	const [datasetCount, setDatasetCount] = useState<any>({})
	const [datasetFilter, setDatasetFilter] = useState<any>(null)
	const [originalQuestions, setOriginalQuestions] = useState<any>([])
	const [questions, setQuestions] = useState<any>([])
	const [questionTypeCount, setQuestionTypeCount] = useState<any>({})
	const [questionTypeFilter, setQuestionTypeFilter] = useState<any>(null)
	const [selectedQuestion, setSelectedQuestion] = useState<any>(null)
	const [answers, setAnswers] = useState<any>([])
	const [feedbackReceived, setFeedbackReceived] = useState(false)

	const { activeAccounts, appRoles }:any = useAuthenticateUser()
	const [isAdmin, setIsAdmin] = useState(false)
  	const [isReviewer, setIsReviewer] = useState(false)

  useEffect(()=>{
		if (activeAccounts && activeAccounts.length && appRoles && appRoles.length) {
			if (appRoles.includes('MyGPTAdmin')) {
				setIsAdmin(true)
			}
      if (appRoles.includes('MyGPTReviewer')) {
        setIsReviewer(true)
      }
		}}, [activeAccounts, appRoles])

	let dataset_colors:any
	let question_type_colors:any

	if (datasetCount.length && questions.length) {
		const dataset_names:any[] = datasetCount
			.sort((a:any,b:any)=>b.value-a.value)
			.map((d:any) => d.category)

		dataset_colors = scaleOrdinal()
			.domain(dataset_names)
			.range(schemeCategory10)
	}

	if (questionTypeCount.length && questions.length) {
		const question_type_names:any[] = questionTypeCount
			.sort((a:any,b:any)=>b.value-a.value)
			.map((d:any) => d.category)

		question_type_colors = scaleOrdinal()
			.domain(question_type_names)
			.range(schemeCategory10)
	}

	useEffect(()=>{
		const requestOptions = {
			method: 'GET',
			headers: { 
				'Content-Type': 'application/json',
				'Authorization': 'Basic ' + base64.encode(`${process.env.REACT_APP_DJANGO_USER}:${process.env.REACT_APP_DJANGO_PASSWORD}`)
			},
		}
		fetch(`${process.env.REACT_APP_BACKEND_API}evaluation_dataset/libraries/?format=json`, requestOptions)
			.then(response => response.json())
			.then(data => {setDatasets(data.results)})
	},[])

	useEffect(()=>{
		const requestOptions = {
			method: 'GET',
			headers: { 
				'Content-Type': 'application/json',
				'Authorization': 'Basic ' + base64.encode(`${process.env.REACT_APP_DJANGO_USER}:${process.env.REACT_APP_DJANGO_PASSWORD}`)	
			},
		}
		if(datasets.length > 0) {
			fetch(`${process.env.REACT_APP_BACKEND_API}evaluation_dataset/questions/?format=json`, requestOptions)
				.then(response => response.json())
				.then(data => {
					const quesiton_data = data.results.map((d:any)=>{
						return {
							question: d.question_text,
							question_id: d.id,
							question_type: d.question_type,
							ground_truth: d.ground_truth,
							dataset: datasets.find((ds:any)=>ds.id===d.dataset).dataset_name
						}
					})
					
					let dataset_count:any = []
					datasets.forEach((dataset:any) => {
						dataset_count.push({
							category: dataset.dataset_name,
							value: quesiton_data.filter((q:any)=>q.dataset === dataset.dataset_name).length
						})
					})

					let question_type_count:any = []
					quesiton_data.forEach((q:any) => {
						let temp_type = question_type_count.find((qt:any)=>qt.category === q.question_type)
						if (temp_type){
							temp_type.value += 1
						} else {
							question_type_count.push({
								category: q.question_type,
								value: 1
							})
						}
					})

					setQuestions(quesiton_data.sort((a:any,b:any)=>a.question_id-b.question_id))
					setOriginalQuestions(quesiton_data.sort((a:any,b:any)=>a.question_id-b.question_id))
					setDatasetCount(dataset_count)
					setQuestionTypeCount(question_type_count)
				})
			}
	},[datasets])

	useEffect(()=>{
		const requestOptions = {
			method: 'GET',
			headers: { 
				'Content-Type': 'application/json',
				'Authorization': 'Basic ' + base64.encode(`${process.env.REACT_APP_DJANGO_USER}:${process.env.REACT_APP_DJANGO_PASSWORD}`)
			},
		}
		if(selectedQuestion !== null){
			fetch(`${process.env.REACT_APP_BACKEND_API}evaluation_dataset/get_question_by_id/?question_id=${selectedQuestion}&format=json`, requestOptions)
				.then(response => response.json())
				.then(data => {setAnswers(data.answers)})
		setFeedbackReceived(false)
		}
	}
	,[selectedQuestion, feedbackReceived])

	return (
		<div className='grid grid-cols-10 p-4 bg-gray-200 max-w-[2000px] mx-auto h-[94vh]'>
			<div className='col-span-10'>
				<div className='mt-24 mx-4'>
					{ datasetCount.length && questionTypeCount.length ?
					<div className='grid grid-cols-2 gap-4 mb-4'>
					{/* first column */}
					<div className='col-span-1 p-4 bg-white shadow-md rounded-md'>
						<div className='flex flex-col justify-center items-center'>
							<div className='p-4 text-xl text-bsk_dark_blue'>Publication library</div>
							<PieChartApp
							chartData={datasetCount}
							size='small'
							hideCounts={true}
							showLegend={true}
							applyFilterOnClick={true}
							filteredCategory={datasetFilter}
							clickPieCallback={(data:any) => {
								if (data && data.category){
									let temp_questions = questions
										.filter((q:any)=>q.dataset === data.category)
									setQuestions(temp_questions)
								}else{
									setQuestions(originalQuestions)
								}
								setDatasetFilter(data && data.category ? data.category : null)
							}}
						/>
						</div>
					</div>
					{/* second column */}
					<div className='col-span-1 p-4 bg-white shadow-md rounded-md'>
						<div className='flex flex-col justify-center items-center'>
							<div className='p-4 text-xl text-bsk_dark_blue'>Question types</div>
							<PieChartApp
							chartData={questionTypeCount}
							size='small'
							hideCounts={true}
							showLegend={true}
							applyFilterOnClick={true}
							filteredCategory={questionTypeFilter}
							clickPieCallback={(data:any) => {
								if (data && data.category){
									let temp_questions = questions
										.filter((q:any)=>q.question_type === data.category)
									setQuestions(temp_questions)
								}else{
									setQuestions(originalQuestions)
								}
								setQuestionTypeFilter(data && data.category ? data.category : null)
							}}
						/>
						</div>
					</div>
				</div>: <></>}
				</div>
				<div className='flex justify-center m-4'>
					<div className='grid'>
						{ datasetCount.length && questionTypeCount.length ?
							questions.map((q:any)=>{
								return (
									<div key={q.question_id} className='bg-white rounded-lg p-4 m-1'>
										<div className='flex justify-between'>
											<div>
												<div className='text-sm px-2 bg-panel3 mx-1 rounded-full py-1 inline-block align-middle'>{q.question_id-26}</div>
												<div className={'text-xs text-white font-semibold mx-1 rounded-full px-2 py-1 inline-block align-middle opacity-70' + (datasets.length ? ' ' : ' bg-panel1')} style={{backgroundColor: dataset_colors(q.dataset)}}>{q.dataset}</div>
												<div className={'text-xs text-white font-semibold mx-1 rounded-full px-2 py-1 inline-block align-middle opacity-70' + ( questions.length ? ' ' : ' bg-panel1')} style={{backgroundColor: question_type_colors(q.question_type)}}>{q.question_type.replace('_',' ')}</div>
												<div className='inline-block mx-2 cursor-pointer text-nav' onClick={() => {
														setSelectedQuestion(q.question_id)
														// setShowDetails(!showDetails)
													}}>{q.question}</div>
											</div>
											<div>
												<button 
													className='p-2 mx-2 my-auto bg-white text-bsk_dark_blue h-6'
													onClick={() => {
														setSelectedQuestion(q.question_id)
														// setShowDetails(!showDetails)
													}}
													>
													<p className='inline-block ml-2'>
													{
														selectedQuestion === q.question_id ? 
														<ChevronUpIcon className='w-6 h-6 inline-block'/> : 
														<ChevronDownIcon className='w-6 h-6 inline-block'/>
													}
													</p>
												</button>
											</div>
										</div>
										{
											selectedQuestion === q.question_id ? 
											<div className='pt-4 px-4 m-1 bg-white rounded-lg transition-transform ease-in-out delay-100'>
												<div className='text-md font-bold text-panel1 mx-1 rounded-full px-2 py-1 inline-block align-middle'>Ground Truth</div>
												<div className='inline-block m-2 p-2 bg-sky-50 rounded-md text-nav'>{q.ground_truth}</div>
											</div> : null
										}
										{
											selectedQuestion === q.question_id ? 
											<div className='px-4 m-1 bg-white rounded-lg transition-transform ease-in-out delay-100'>
												<div className='text-md font-bold text-panel1 mx-1 rounded-full px-2 py-1 inline-block align-middle'>Answers</div>
												{
													answers.map((a:any, i:number)=>{
														return (
															<div key={i} className='inline-block m-2 bg-sky-50 rounded-md p-2'>
																<div className='text-sm font-bold text-panel1 mx-1 rounded-full px-2 py-1 inline-block align-middle'>Setting {i+1}</div>
																<div className='inline-block mx-2 p-2 text-nav'>{a.answer_text}</div>
																	<Feedback
																		answer={JSON.parse(JSON.stringify(a.answer_text))}
																		feedbackReceived={(a.correctness && a.correctness !== '-') ? true : false}
																		liked={a.correctness === 'yes'}
																		disliked={a.correctness === 'no'}
																		allowFeedback={isAdmin || isReviewer}
																		feedbackCallback={(feedback:any)=>{
																			const requestOptions = {
																				method: 'PUT',
																				headers: { 
																					'Content-Type': 'application/json',
																					'Authorization': 'Basic ' + base64.encode(`${process.env.REACT_APP_DJANGO_USER}:${process.env.REACT_APP_DJANGO_PASSWORD}`)
																				},
																				body: JSON.stringify({
																					'answer_text': a.answer_text,
																					'question': a.question,
																					'answer_tags': a.answer_tags,
																					'correctness': feedback.rating === 1 ? 'yes' : feedback.rating === -1 ? 'no' : '-',
																					'feedback': feedback.user_comment.length ? feedback.user_comment : '-',
																					'context': a.context,
																					'reviewer': activeAccounts[0].name,
																					'submission_date_time': new Date().toISOString()
																				})
																			}
																			fetch(`${process.env.REACT_APP_BACKEND_API}evaluation_dataset/answers/${a.id}/`, requestOptions)
																				.then(response => response.json())
																				.then(data => {
																					let newAnswers = data
																					answers.forEach((ans:any, i:number)=>{
																						if (ans.id === a.id){
																							newAnswers = [...answers]
																							newAnswers[i] = data
																						}
																					})
																				})

																			setFeedbackReceived(true)

																		}}
																	/>
															</div>
														)
													})
												}
											</div> : null
										}
									</div>
								)
							})	: null
						}
					</div>
				</div>
			</div>
		</div>
	)
}

export default DatasetHome