import {useState, useEffect} from 'react'
import Workflow from './Workflow'
import { DropdownOptions } from './DropDownMenu'

const Settings = (props:{
	closeSettings:any,
	defaultSettings:any,
	currentSettings:any,
	settingsCallback:any
}) => {
	const [activeTab, setActiveTab] = useState(props.defaultSettings.selectedPanel)

	const currentSettings = JSON.parse(JSON.stringify(props.currentSettings || props.defaultSettings))
	const [datasets, setDatasets] = useState<string[]>([])
	const [selectedDataset, setSelectedDataset] = useState(props.currentSettings.selectedDataset || props.defaultSettings.selectedDataset)

	useEffect(()=>{
		const requestOptions = {
			method: 'GET',
			headers: { 
				'Content-Type': 'application/json'
			}
		}
		if(!datasets.length)
			fetch(`${process.env.NODE_ENV === 'production' ? process.env.REACT_APP_API_PROD : process.env.REACT_APP_API_DEV}api/datasets/`, requestOptions)
				.then(response => response.json())
				.then(data => {
					const dataset_names = data.results.map((d:any)=>d.dataset_name)
					props.settingsCallback({...currentSettings, datasets: dataset_names})
					if (dataset_names && dataset_names.length && dataset_names.includes(props.defaultSettings.selectedDataset)){
						dataset_names.splice(dataset_names.indexOf(props.defaultSettings.selectedDataset), 1)
						dataset_names.unshift(props.defaultSettings.selectedDataset)
					} else {
						dataset_names.unshift(props.defaultSettings.selectedDataset)
					}
					setDatasets(dataset_names)
				})
	// eslint-disable-next-line react-hooks/exhaustive-deps
	},[datasets.length])

	useEffect(()=>{
		currentSettings.selectedDataset = selectedDataset
	},[selectedDataset, currentSettings])
	console.log(currentSettings)

	return (
		// create floating panel with opque background
		<div className='fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center'>
			<div className='bg-panel1 w-3/4 h-5/6 rounded-lg'>
				<div className='flex justify-between'>
					<div className='text-2xl font-bold text-white mt-8 mx-8'>Settings</div>
					<div className='text-2xl font-bold text-white mt-8 mr-8 cursor-pointer' onClick={props.closeSettings}>x</div>
				</div>
				<div className='flex justify-between my-6 h-5/6'>
					{/* create left side vericle tabs */}
					<div className='w-1/4 border-slate-400 border-y-2 h-full'>
						<div className='grid grid-cols-1 divide-y'>
							{ props.defaultSettings.settingsPanels.map((panel:any, index:number) => {
								return(
									<div 
										key={index} 
										className={`text-white text-xl cursor-pointer p-2 ${activeTab === panel.key ? 'font-normal bg-nav' : 'font-light bg-panel1'}`}
										onClick={() => setActiveTab(panel.key)}
									>
										{panel.text}
									</div>
								)

							})}
						</div>
					</div>
					{/* create right side list of settings */}
					<div className='w-3/4 bg-panel2 h-full'>
						<div className='mx-4 my-4 px-4 bg-gray-300 rounded-md'>
							<Workflow focusComponent={activeTab}/>
						</div>
						{ activeTab === 'datasets' ?
							<div className='px-8 py-2'>
								<div className='text-nav inline-block px-2'> Current library </div>
								<div className='inline-block'>
								<DropdownOptions
									optionsList={datasets}
									defaultOption={currentSettings.selectedDataset}
									dropDownCallback={(option:string)=>{
										setSelectedDataset(option)
										// currentSettings.selectedDataset = option
										props.settingsCallback({...currentSettings, selectedDataset: option, fetchPapers: true})
									}}
								/>
							</div>
							</div> : <></>
						}
					</div>
				</div>
			</div>
		</div>
	);
};

export default Settings
