interface FAQProps {
	closeFAQ: any,	
}

const FAQ = (props:FAQProps) =>{

	return (
		// create floating panel with opque background
		<div className='fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center'>
			<div className={'bg-panel1 dark:bg-panel4-dark w-3/4 max-w-[1200px] rounded-lg ' + (window.screen.availHeight < 1000 ? 'h-[95vh] max-h-[95vh]' : 'h-[70vh] max-h-[70vh]')}>
				<div className='flex justify-between'>
					<div className='text-2xl font-bold text-white mt-8 mx-8'>FAQs</div>
					<div className='text-2xl font-bold text-white mt-8 mr-8 cursor-pointer' onClick={props.closeFAQ}>x</div>
				</div>
				<div className={'flex justify-between my-6 '+ (window.screen.availHeight < 1000 ? 'h-[78vh]' : 'h-[62vh]')}>
					{/* create left side panel for questions */}
					<div className={'w-1/3 border-slate-400 border-y-2 overflow-y-auto ' + (window.screen.availHeight < 1000 ? 'h-[80vh]' : 'h-[62vh]')}>
						<div className='grid grid-cols-1 divide-y'>
							<div className='text-white py-2 px-4'>
								
							{/* dropdown for datasets */}
							
							</div>
							
						</div>
					</div>
					{/* create right side for answers and sources list */}
					<div className={'w-2/3 bg-panel3 dark:bg-neutral-800 overflow-y-auto overflow-x-clip border-slate-400 border-y-2 ' + (window.screen.availHeight < 1000 ? 'h-[80vh] max-h-[80vh]' : 'h-[62vh] max-h-[62vh]')}>
					
					</div>
				</div>
			</div>
		</div>
	)
}

export default FAQ