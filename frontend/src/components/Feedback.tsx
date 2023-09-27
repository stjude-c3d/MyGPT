import { useState } from 'react'
import { HandThumbUpIcon, HandThumbDownIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'

function Feedback(props:{
	answer: any,
	feedbackReceived: boolean,
	feedbackCallback: any
}){
	const [liked, setLiked] = useState(false)
	const [disliked, setDisliked] = useState(false)
	const [comment, setComment] = useState('')
	const [feedbackSent, setFeedbackSent] = useState(false)

	return (
		<div className='mt-4 p-4'>
			{ 
				props.feedbackReceived || feedbackSent ?
				(<div className='flex justify-center text-sm italic'>
					<p className='text-sm text-white'>Thanks for your feedback!</p>
				</div>) :
				(<>
				<div className='flex justify-start'>
					<button onClick={()=>{
						setDisliked(!disliked)
						setLiked(false)
					}}>
						<HandThumbDownIcon className={'w-8 h-8 inline-block mr-2 p-1 rounded-md' + (disliked ? ' bg-white text-slate-600 hover:text-white hover:bg-bsk_dark_blue border-slate-600 border' : ' text-white bg-slate-600 hover:text-white hover:border-transparent hover:bg-bsk_dark_blue')}/>
					</button>
					<button onClick={()=>{
						setLiked(!liked)
						setDisliked(false) 
					}}>
						<HandThumbUpIcon className={'w-8 h-8 inline-block mr-2 p-1 rounded-md' + (liked ? ' bg-white text-slate-600 hover:text-white hover:bg-bsk_dark_blue border-slate-600 border' : ' text-white bg-slate-600 hover:text-white hover:border-transparent hover:bg-bsk_dark_blue')}/>
					</button>
					{ liked || disliked ? 
					<button onClick={()=>{
						props.feedbackCallback({
							'answer': props.answer,
							'rating': liked ? 1 : -1,
							'user_comment': comment
						})
						setLiked(false)
						setDisliked(false)
						setComment('')
						setFeedbackSent(true)
					}}>
						<PaperAirplaneIcon className={'w-8 h-8 inline-block p-1 rounded-md text-white bg-slate-600 hover:text-white hover:border-transparent hover:bg-bsk_dark_blue'}/>
					</button>  : <></>}
				</div>
					{liked || disliked ?
					<div className='flex justify-center my-2'>
						<textarea
							id='submitter' 
							rows={2}
							className='text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 p-2 mr-2 shadow-md w-full' 
							placeholder={`add optional comment &\nclick send to submit`}
							value={comment}
							onChange={(e:any)=>{
								if (!e.target.value.length){
									setComment('')
								}
								setComment(e.target.value.replace(/\n/g, ''))
						}}>
						</textarea>
					</div> : <></>}
					</>
			)}
		</div>
	)
}

export default Feedback