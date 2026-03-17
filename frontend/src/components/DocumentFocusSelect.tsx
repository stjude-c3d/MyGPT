import { useEffect, useRef, useState } from 'react'

type DocumentFocusSelectProps = {
	papers: any[]
	videos: any[]
	focusedPapers: string[]
	setFocusedPapers: (papers: string[]) => void
	setSelectedPaperIdx: (index: number) => void
}

function DocumentFocusSelect({
	papers,
	videos,
	focusedPapers,
	setFocusedPapers,
	setSelectedPaperIdx,
}: DocumentFocusSelectProps) {
	const [isPopupOpen, setIsPopupOpen] = useState(false)
	const popupRef = useRef<HTMLDivElement | null>(null)

	const items = papers.length
		? papers.map((p: any) => p.paper_title)
		: videos.map((v: any) => v.video_title)

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
				setIsPopupOpen(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [])

	const toggleItem = (title: string, checked: boolean) => {
		if (checked) {
			setFocusedPapers([...focusedPapers, title])
			if (papers.length) {
				setSelectedPaperIdx(papers.findIndex((p: any) => p.paper_title === title))
			}
			return
		}

		setFocusedPapers(focusedPapers.filter((paperTitle: string) => paperTitle !== title))
		setSelectedPaperIdx(0)
	}

	return (
		<div ref={popupRef} className='p-2 text-sm border-slate-400 border-b relative'>
			<div className='flex items-center gap-2 px-2'>
				<button
					type='button'
					className={'text-sm text-nav dark:text-white py-1 px-3 rounded-md inline-flex items-center border ' + (focusedPapers.length > 0 ? 'bg-panel3 border-panel3 dark:bg-stjude' : 'bg-panel2 dark:bg-panel4-dark border-slate-500')}
					onClick={() => setIsPopupOpen(!isPopupOpen)}
				>
					Focused documents
					<span className='text-xs text-nav bg-white dark:bg-panel2-dark dark:text-white ml-2 px-2 py-1 rounded-full'>
						{focusedPapers.length > 0 ? 
							 focusedPapers.length
							 : `All - ${papers.length}`
						}
					</span>
				</button>
			</div>

			{isPopupOpen ? (
				<div className='absolute left-2 right-2 top-12 z-20 bg-nav dark:bg-panel3-dark border border-slate-500 rounded-md shadow-lg p-2'>
					<div className='flex items-center justify-between mb-2'>
						<div className='text-white text-xs'>Select documents</div>
						{ 
							focusedPapers.length ?
								<button
									type='button'
									className='text-xs text-nav bg-panel3 dark:bg-panel2-dark dark:text-white px-2 py-1 rounded-md hover:opacity-90'
									onClick={() => {
										setFocusedPapers([])
										setSelectedPaperIdx(0)
									}}
								>
									Clear
								</button> : 
							null
						}
					</div>
					<div className='max-h-44 overflow-y-auto space-y-1'>
						{items.map((title: string, index: number) => (
							<label key={index} className='flex items-center gap-2 text-white text-sm cursor-pointer'>
								<input
									type='checkbox'
									className='h-4 w-4 accent-nav'
									checked={focusedPapers.includes(title)}
									onChange={(e) => toggleItem(title, e.target.checked)}
								/>
								<span className='truncate'>{title}</span>
							</label>
						))}
					</div>
				</div>
			) : null}
		</div>
	)
}

export default DocumentFocusSelect
