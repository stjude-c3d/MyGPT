import { useState } from "react";
import { faq } from "../utils/FAQData";

interface FAQProps {
	closeFAQ: any,	
}

const FAQ = (props:FAQProps) =>{

	const [activeCategory, setActiveCategory] = useState<string | null>('Asking Questions');
	return (
		// create floating panel with opque background
		<div className='fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center'>
			<div className={'bg-panel1 dark:bg-panel4-dark w-3/4 max-w-[1200px] rounded-lg ' + (window.screen.availHeight < 1000 ? 'h-[95vh] max-h-[95vh]' : 'h-[70vh] max-h-[70vh]')}>
				<div className='flex justify-between'>
					<div className='text-2xl font-bold text-white mt-8 mx-8'>FAQs</div>
					<div className='text-2xl font-bold text-white mt-8 mr-8 cursor-pointer' onClick={props.closeFAQ}>x</div>
				</div>
				<div className={'flex justify-between my-6 '+ (window.screen.availHeight < 1000 ? 'h-[78vh]' : 'h-[60vh]')}>
					{/* create left side panel for questions */}
					<div className={'w-1/3 border-slate-400 border-y-2 overflow-y-auto ' + (window.screen.availHeight < 1000 ? 'h-[80vh]' : 'h-[62vh]')}>
						<div className='grid grid-cols-1 divide-y'>
							{Object.keys(faq).filter((cat:any) => faq[cat].length).map((category) => (
                            <div key={category} className='w-full'>
							<div className={`text-white text-xl cursor-pointer p-2 border-b border-white ${activeCategory === category ? 'font-normal bg-nav' : 'font-light bg-panel1 dark:bg-panel4-dark'}`}
							  onClick={() => setActiveCategory(category)}>
							  <h2>{category}</h2>
							</div>
						  </div>
						   ))}	
						</div>
					</div>
					{/* create right side for answers and sources list */}
					<div className={'w-2/3 bg-panel2 dark:bg-panel2-dark overflow-y-auto overflow-x-clip border-slate-400 border-y-2 ' + (window.screen.availHeight < 1000 ? 'h-[80vh] max-h-[80vh]' : 'h-[62vh] max-h-[62vh]')}>
					{activeCategory && (
              <div>
				<div className='text-nav dark:text-nav-dark text-2xl font-bold m-4'>{activeCategory}</div>
				
                {faq[activeCategory]?.map((item, index) => (
                  <div key={index} className='m-2'>
					<div className='text-nav dark:text-nav-dark p-2 mt-2 flex justify-start text-lg font-semibold'>{item.question}  </div>
					<div className='text-nav dark:text-nav-dark p-2'dangerouslySetInnerHTML={{ __html: item.answer }}></div>
					{item.image && (
						<div className='mt-4 flex flex-wrap items-start gap-4'>
							{(Array.isArray(item.image) ? item.image : [item.image]).map((imgSrc, imgIndex) => (
								<img
									key={`${index}-${imgIndex}`}
									src={imgSrc}
									alt={`${item.question} ${imgIndex + 1}`}
									className='w-full sm:w-[48%] h-auto object-contain self-start'
								/>
							))}
						</div>
					)}
                  </div>
                ))}
              </div>
            )}
					</div>
				</div>
			</div>
		</div>
	)
}

export default FAQ