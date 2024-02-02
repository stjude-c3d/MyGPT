import {useState, useEffect} from 'react'
import Workflow from './Workflow'
import { DropdownOptions } from './DropDownMenu'
import ZoteroSettings from './ZoteroSettings'
import { MagnifyingGlassMinusIcon, MagnifyingGlassPlusIcon } from '@heroicons/react/24/outline'

const Settings = (props:{
	closeSettings:any,
	defaultSettings:any,
	currentSettings:any,
	settingsCallback:any
}) => {
	const [activeTab, setActiveTab] = useState(props.currentSettings.selectedPanel || props.defaultSettings.selectedPanel)
	const [workflowZoomedIn, setWorkflowZoomedIn] = useState(false)

	const currentSettings = JSON.parse(JSON.stringify(props.currentSettings || props.defaultSettings))
	const [datasets, setDatasets] = useState<string[]>([])
	const [selectedDataset, setSelectedDataset] = useState(props.currentSettings.selectedDataset || props.defaultSettings.selectedDataset)

	const [llms, setLlms] = useState<any[]>(props.currentSettings.llms || props.defaultSettings.llms)
	const [llm, setLlm] = useState(props.currentSettings.selectedLlm || props.defaultSettings.selectedLlm)

	const [editPrompt, setEditPrompt] = useState(false)
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

	// get llms from backend
	useEffect(()=>{
		const requestOptions = {
			method: 'GET',
			headers: { 
				'Content-Type': 'application/json'
			}
		}
		fetch(`${process.env.NODE_ENV === 'production' ? process.env.REACT_APP_API_PROD : process.env.REACT_APP_API_DEV}api/llms/`, requestOptions)
			.then(response => response.json())
			.then(data => {
				setLlms(data.results.map((l:any)=>l.model_name.split(':')[0]))
				setLlm(data.results[0].model_name.split(':')[0])
			})
	},[])

	return (
		// create floating panel with opque background
		<div className='fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center'>
			<div className={'bg-panel1 w-3/4 max-h-[1100px] rounded-lg ' + (window.screen.availHeight < 1000 ? 'h-[95vh]' : 'h-[75vh]')}>
				<div className='flex justify-between'>
					<div className='text-2xl font-bold text-white mt-8 mx-8'>Settings</div>
					<div className='text-2xl font-bold text-white mt-8 mr-8 cursor-pointer' onClick={props.closeSettings}>x</div>
				</div>
				<div className={'flex justify-between my-6 '+ (window.screen.availHeight < 1000 ? 'h-[78vh]' : 'h-[62vh]')}>
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
						<div className={'mx-4 my-4 px-4 bg-gray-300 rounded-md ' + (workflowZoomedIn ? 'h-[45vh]' : 'h-[29vh]')}>
							<div className='flex justify-between'>
								<div className='text-white text-lg font-bold'>MyGPT Workflow</div>
								{ window.screen.availHeight < 1000 ? 
									<div className='flex'>
										<div className='text-white text-lg font-bold cursor-pointer pt-2' onClick={()=>setWorkflowZoomedIn(!workflowZoomedIn)}>
											{workflowZoomedIn ? <MagnifyingGlassMinusIcon className='h-6 w-6'/> : <MagnifyingGlassPlusIcon className='h-6 w-6'/>}
										</div>
									</div> : <></>
								}
							</div>
							<Workflow focusComponent={activeTab} zoomedIn={workflowZoomedIn}/>
						</div>
						{ activeTab === 'datasets' ?
							<div className='px-8 py-2 flex flex-col divide-y overflow-y-scroll h-[40vh] max-h-[470px]'>
								<div className='flex flex-col justify-center my-2'>
									<div className='text-nav px-2 flex justify-center mb-2'> Current library </div>
									<div className='flex justify-center'>
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
								</div>
								{/* list of available libraries */}
								<div className='flex flex-col justify-center my-4'>
									<div className='text-nav px-2 flex justify-center mt-2'> Available libraries </div>
									<div className='text-nav px-8 flex justify-center'>
										<ul className='list-disc'>
											{datasets.map((dataset:string, index:number) => {
												return(
													<li key={index} className='ml-4'>
														<div className='flex justify-between m-1'>
															{dataset}
															<button className='ml-2 bg-panel1 text-white px-2 rounded-md'>Delete</button>
														</div>
													</li>
												)
											})}
										</ul>
									</div>
								</div>

								{/* add new library */}
								<ZoteroSettings/>
								</div> : <></>
							}
							{ activeTab === 'llms' ?
								<div className='px-8 py-2'>
									<div className='text-nav inline-block px-2'> Current LLM </div>
									<div className='inline-block'>
										<DropdownOptions
											optionsList={llms}
											defaultOption={llm}
											dropDownCallback={(option:string)=>{
												currentSettings.selectedLlm = option
												props.settingsCallback(currentSettings)
											}}
										/>
										</div>
								</div> : <></>
						}
						{ activeTab === 'llm_parameters' ?
							<div className='px-8 py-2 flex flex-col'>
								<div className='text-nav inline-block px-2 mx-4 my-2'>System Prompt</div>
								<div className='mx-4'>
									<textarea
										rows={5}
										cols={30}
										placeholder='System prompt' 
										className='rounded-md w-80 p-1'
										value={currentSettings.system_prompt}
										onChange={(e)=>props.settingsCallback({...currentSettings, system_prompt: e.target.value})}
										disabled={editPrompt ? false : true}
									/>
									</div>
								<div>
									<button className='bg-panel1 text-white px-4 py-1 rounded-md mx-4 my-2' onClick={()=>setEditPrompt(true)}>Edit</button>
									{
									props.defaultSettings.system_prompt !== currentSettings.system_prompt ?
										<button className='bg-panel1 text-white px-4 py-1 rounded-md mx-4 my-2' onClick={()=>{
											props.settingsCallback({...currentSettings, system_prompt: props.defaultSettings.system_prompt})
										}}>Reset</button> : <></>
									}
									
								</div>
							</div> : <></>
						}
						{
							activeTab === 'sentence_transformers' ?
							<div className='px-8 py-2 flex flex-col divide-y'>
								<div className='m-2'>
									<div className='text-nav inline-block px-2 mx-4 my-2'>Current Sentence Transformer</div>
									<div className='mx-4'>
										<DropdownOptions
											optionsList={props.defaultSettings.sentence_transformers}
											defaultOption={currentSettings.sentence_transformer}
											dropDownCallback={(option:string)=>{
												props.settingsCallback({...currentSettings, sentence_transformer: option})
											}}
										/>
									</div>
								</div>
								<div className='m-2'>
									<div className='text-nav inline-block px-2 mx-4 my-2'>Available Sentence Transformer</div>
									<div className='mx-4'>
										<ul className='list-disc'>
											{props.defaultSettings.sentence_transformers.map((st:string, index:number) => {
												return(
													<li key={index} className='ml-4'>
															{st}
													</li>
												)
											})}
										</ul>
									</div>
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
