import AddLibrarySettings from './AddLibrarySettings'
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'
import FlowUpload from './FlowUpload'
import { useState, type MouseEvent } from 'react'

const UploadMenu = (props: {
	closeUpload: any,
	openSettings: any,
	currentSettings: any,
	settingsCallback: any,
	user?: any,
	djangoLogin?: any
}) => {
	const [settingMode] = useState<'classic' | 'graphical' | 'newsetting'>('newsetting');

	const settingProps = {
		currentSettings: props.currentSettings,
		settingsCallback: props.settingsCallback,
		user: props.user,
		djangoLogin: props.djangoLogin
	}

	const [activeTab, setActiveTab] = useState<"simple" | "advanced">("simple");

	const handleTabClick = (event: MouseEvent<HTMLButtonElement>, tab: "simple" | "advanced") => {
		event.preventDefault()
		event.stopPropagation()
		setActiveTab(tab)
	};

	const openLibraryManagement = () => {
		props.settingsCallback({ ...props.currentSettings, selectedPanel: 'datasets', showSettings: false, showUpload: false })
		props.closeUpload()
		props.openSettings()
	}

	return (
		<div className='fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center' onClick={props.closeUpload}>
			<div className='bg-panel1 dark:bg-panel4-dark w-3/4 max-h-[1100px] max-w-[1200px] rounded-lg' onClick={(event) => event.stopPropagation()}>
				<div className='flex justify-between items-center px-8 py-6'>
					<div className='text-2xl font-bold text-white'>
						Upload Documents
						{/* <div className='gap-2 ml-4 inline-flex text-sm font-normal'>
							<div className='text-gray-400'>(</div>
							<div
								className={`cursor-pointer ${settingMode === 'classic' ? 'text-white underline' : 'text-gray-400'}`}
								onClick={() => setSettingMode('classic')}
							>
								Classic
							</div>
							<div className='text-gray-400'>|</div>
							<div
								className={`cursor-pointer ${settingMode === 'graphical' ? 'text-white underline' : 'text-gray-400'}`}
								onClick={() => setSettingMode('graphical')}
							>
								Graphical
							</div>
							<div className='text-gray-400'>|</div>
							<div
								className={`cursor-pointer ${settingMode === 'newsetting' ? 'text-white underline' : 'text-gray-400'}`}
								onClick={() => setSettingMode('newsetting')}
							>
								New
							</div>
							<div className='text-gray-400'>)</div>
						</div> */}
					</div>
					<div className='text-2xl font-bold text-white cursor-pointer' onClick={props.closeUpload}>x</div>
				</div>
				<div className='flex gap-6 px-0 bg-panel2 dark:bg-panel2-dark rounded-b-lg overflow-y-auto h-[65vh]'>
					{settingMode === 'classic' && (
					<div className='mygptcol1 flex-1 divide-y  px-4 py-6'>
						<div className='flex justify-start mb-4'>
							<div
								className='flex items-center gap-2 bg-panel1 dark:bg-panel3-dark text-white text-sm px-4 py-2 rounded-md hover:bg-nav transition ease-in-out'
								onClick={() => { props.closeUpload(); props.openSettings(); }}
							>
								Library Management
								<ArrowTopRightOnSquareIcon className='h-4 w-4' />
							</div>
						</div>
						<AddLibrarySettings {...settingProps} />
					</div>
					)}
					{settingMode === 'graphical' && (
					<div className='mygptcol2 flex-1 divide-y py-6'>
						{/* <FlowUpload {...settingProps} /> */}
					</div>
					)}

					{settingMode === 'newsetting' && (
					<div className='flex-1 divide-y'>

						<div className="text-sm font-medium text-center text-body border-default">
							<ul className="flex flex-wrap -mb-px">
								<li className="me-2">
									<button type="button" className={`text-nav dark:text-nav-dark inline-block p-4 border-b border-transparent rounded-t-base hover:text-fg-brand hover:border-brand bg-transparent ${activeTab === 'simple' ? 'active-tab' : ''}`} onClick={(event) => handleTabClick(event, 'simple')}>Simple</button>
								</li>
								<li className="me-2">
									<button type="button" className={`text-nav dark:text-nav-dark inline-block p-4 text-fg-brand border-b border-brand rounded-t-base bg-transparent ${activeTab === 'advanced' ? 'active-tab' : ''}`} aria-current="page" onClick={(event) => handleTabClick(event, 'advanced')}>Advanced</button>
								</li>
							</ul>
						</div>


						{activeTab === "simple" && (
							<div className='px-4'>

								<AddLibrarySettings {...settingProps} />
							</div>
						)}

						{activeTab === "advanced" && (
							<FlowUpload {...settingProps} />
						)}
						<div className='flex justify-start px-4 py-4'>
							<div className='mx-4 my-auto'>To manage your libraries:</div>
							<button
								type='button'
								className='flex items-center gap-2 bg-panel1 dark:bg-panel3-dark text-white text-sm px-4 py-2 rounded-md hover:bg-nav transition ease-in-out'
								onClick={openLibraryManagement}
							>
								Library Management
								<ArrowTopRightOnSquareIcon className='h-4 w-4' />
							</button>
						</div>
					</div>
					)}
				</div>
			</div>
		</div>
	)
}

export default UploadMenu