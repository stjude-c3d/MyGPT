import { useState } from 'react'
import { HandThumbUpIcon, HandThumbDownIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'

function Feedback(props:{
	answer: any,
	liked: boolean,
	disliked: boolean,
	allowFeedback: boolean,
	feedbackReceived: boolean,
	feedbackCallback: any
}){
	const [liked, setLiked] = useState(false)
	const [disliked, setDisliked] = useState(false)
	const [comment, setComment] = useState('')
	const [feedbackSent, setFeedbackSent] = useState(false)

	return (
		<div className='px-4'>
			<>
				<div className='flex justify-start'>
					<button disabled={props.allowFeedback ? false : true} onClick={()=>{
						setDisliked(!disliked)
						setLiked(false)
					}}>
						<HandThumbDownIcon className={'w-8 h-8 inline-block mr-2 p-1 rounded-md' + ((props.disliked  && !disliked && !liked && props.allowFeedback) || (!props.disliked && disliked && props.allowFeedback)
							? ' bg-red-700 text-white hover:text-white hover:bg-bsk_dark_blue border-slate-600 border' : (props.disliked && !disliked && !liked) || (!props.disliked && disliked) 
							? ' bg-red-700 text-white border-slate-600 border' : props.allowFeedback 
							? ' text-white bg-panel3 hover:text-white hover:border-transparent hover:bg-bsk_dark_blue' : ' text-white bg-panel3')}/>
					</button>
					<button disabled={props.allowFeedback ? false : true} onClick={()=>{
						setLiked(!liked)
						setDisliked(false) 
					}}>
						<HandThumbUpIcon className={'w-8 h-8 inline-block mr-2 p-1 rounded-md' + ((props.liked && !disliked && !liked && props.allowFeedback ) || (!props.liked && liked && props.allowFeedback) 
							? ' bg-green-600 text-white hover:text-white hover:bg-bsk_dark_blue border-slate-600 border' : (props.liked && !disliked && !liked ) || (!props.liked && liked) 
							? ' bg-green-600 text-white border-slate-600 border' : props.allowFeedback 
							? ' text-white bg-panel3 hover:text-white hover:border-transparent hover:bg-bsk_dark_blue' : ' text-white bg-panel3')}/>
					</button>
					{ liked || disliked || (props.liked && disliked) || (props.disliked && liked) ? 
					<button onClick={()=>{
						props.feedbackCallback({
							'answer': props.answer,
							'rating': liked ? 1 : disliked ? -1 : 0,
							'user_comment': comment
						})
						setLiked(false)
						setDisliked(false)
						setComment('')
						setFeedbackSent(true)
					}}>
						<PaperAirplaneIcon className={'w-8 h-8 inline-block p-1 rounded-md text-white bg-panel2 hover:text-white hover:border-transparent hover:bg-bsk_dark_blue'}/>
					</button>  : <></>}
				</div>
				{feedbackSent? <div className='text-sm italic'>
					<p className='text-sm text-nav'>Thanks for your feedback!</p>
				</div> : <></>}
					{liked || disliked ?
					<div className='flex justify-center my-1'>
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
					</div>: <></>}
					</>
		</div>
	)
}

export default Feedback