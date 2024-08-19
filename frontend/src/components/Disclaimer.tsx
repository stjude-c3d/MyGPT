interface DisclaimerProps {
	disclaimerText: string,
	closeDisclaimer: any,
}

const Disclaimer = (props: DisclaimerProps) =>{
	return (
		<div className='fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center'>
			<div className={'bg-panel1 w-3/4 max-h-[700px] max-w-[1200px] rounded-lg ' + (window.screen.availHeight < 1000 ? 'h-[75vh]' : 'h-[65vh]')}>
				<div className='flex justify-between'>
					<div className='text-2xl font-bold text-white mt-8 mx-8'>Limited Access Statement</div>
					<div className='text-2xl font-bold text-white mt-8 mr-8 cursor-pointer' onClick={props.closeDisclaimer}>x</div>
				</div>
				<div className='bg-panel2 w-full my-2 py-2 h-[85%]'>
					<div className='text-nav m-8'>
						<div dangerouslySetInnerHTML={{__html: props.disclaimerText}}></div>

					</div>
				</div>
			</div>
		</div>
	)
}

export default Disclaimer