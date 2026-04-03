import AddLibrarySettings from './AddLibrarySettings'
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'

const UploadMenu = (props: {
	closeUpload: any,
	openSettings: any,
	currentSettings: any,
	settingsCallback: any,
	user?: any,
	djangoLogin?: any
}) => {
	return (
		<div className='fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center'>
			<div className='bg-panel1 dark:bg-panel4-dark w-3/4 max-h-[1100px] max-w-[1200px] rounded-lg'>
				<div className='flex justify-between items-center px-8 py-6'>
					<div className='text-2xl font-bold text-white'>Upload Documents</div>
					<div className='text-2xl font-bold text-white cursor-pointer' onClick={props.closeUpload}>x</div>
				</div>
				<div className='px-8 py-6 bg-panel2 divide-y dark:bg-panel2-dark rounded-b-lg overflow-y-auto h-[65vh]'>
					<div className='flex justify-start mb-4'>
						<div
							className='flex items-center gap-2 bg-panel1 dark:bg-panel3-dark text-white text-sm px-4 py-2 rounded-md hover:bg-nav transition ease-in-out'
							onClick={() => { props.closeUpload(); props.openSettings(); }}
						>
							Library Management
                            <ArrowTopRightOnSquareIcon className='h-4 w-4'/>
						</div>
					</div>
					<AddLibrarySettings
						currentSettings={props.currentSettings}
						settingsCallback={props.settingsCallback}
						user={props.user}
						djangoLogin={props.djangoLogin}
					/>
				</div>
			</div>
		</div>
	)
}

export default UploadMenu