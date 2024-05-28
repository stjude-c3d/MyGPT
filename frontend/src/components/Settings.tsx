import {useState, useEffect} from 'react'
import Workflow from './Workflow'
import { DropdownOptions } from './DropDownMenu'
import AddLibrarySettings from './AddLibrarySettings'
import LLMSettings from './LLMSettings'
import { MagnifyingGlassMinusIcon, MagnifyingGlassPlusIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline'

const Settings = (props:{
	closeSettings:any,
	defaultSettings:any,
	currentSettings:any,
	settingsCallback:any,
	user?:any
}) => {
	const [activeTab, setActiveTab] = useState(props.currentSettings.selectedPanel || props.defaultSettings.selectedPanel)
	const [workflowZoomedIn, setWorkflowZoomedIn] = useState(false)
	const [workflowCollapsed, setWorkflowCollapsed] = useState(false)

	const currentSettings = JSON.parse(JSON.stringify(props.currentSettings || props.defaultSettings))
	const [datasets, setDatasets]:[any, any] = useState([])
	const [selectedDataset, setSelectedDataset] = useState(props.currentSettings.selectedDataset || props.defaultSettings.selectedDataset)
	const [deleteDataset, setDeleteDataset] = useState('')

	const [addEmbeddingForDataset, setAddEmbeddingForDataset] = useState('')

	const [llms, setLlms] = useState<any[]>(props.currentSettings.llms || props.defaultSettings.llms)
	const [llm, setLlm] = useState(props.currentSettings.selectedLlm || props.defaultSettings.selectedLlm)

	const [editPrompt, setEditPrompt] = useState(false)
	useEffect(()=>{
		const requestOptions = {
			method: 'POST',
			headers: { 
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(props.user ? props.user : {'user_email': ''})
		}
		if(!datasets.length || props.currentSettings.fetchDatasets)
			fetch(`${process.env.REACT_APP_BACKEND_API}api/get_datasets/`, requestOptions)
				.then(response => response.json())
				.then(data => {
					const dataset_names = data.map((d:any)=>d.dataset_name)
					const dataset_details:any = []
					dataset_names.forEach((dataset:string) => {
						const dataset_detail = {'dataset': dataset, 'embedding_added': data.filter((d:any)=>d.dataset_name === dataset)[0].embedding_added}
						dataset_details.push(dataset_detail)
					})
					props.settingsCallback({...currentSettings, datasets: dataset_names, fetchDatasets: false})
					if (dataset_names && dataset_names.length && dataset_names.includes(props.defaultSettings.selectedDataset)){
						dataset_names.splice(dataset_names.indexOf(props.defaultSettings.selectedDataset), 1)
						dataset_names.unshift(props.defaultSettings.selectedDataset)
					} else {
						dataset_names.unshift(props.defaultSettings.selectedDataset)
					}
					setDatasets(dataset_details)
				})
	// eslint-disable-next-line react-hooks/exhaustive-deps
	},[datasets.length, props.currentSettings.fetchDatasets])

	useEffect(()=>{
		currentSettings.selectedDataset = selectedDataset
	},[selectedDataset, currentSettings])

	useEffect(()=>{
		if(deleteDataset){
			const requestOptions = {
				method: 'GET',
				headers: { 
					'Content-Type': 'application/json'
				}
			}
			fetch(`${process.env.REACT_APP_BACKEND_API}api/delete_dataset/?dataset=${deleteDataset}`, requestOptions)
				.then(response => response.json())
				.then(data => {
					console.log(data)
					setDeleteDataset('')
					const dataset_names = currentSettings.datasets.filter((d:string)=>d !== deleteDataset)
					props.settingsCallback({...currentSettings, datasets: dataset_names, selectedDataset: dataset_names[0]})
				
				})
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [deleteDataset, currentSettings])

	useEffect(()=>{
		if(addEmbeddingForDataset){
			const requestOptions = {
				method: 'GET',
				headers: { 
					'Content-Type': 'application/json'
				}
			}
			fetch(`${process.env.REACT_APP_BACKEND_API}api/add_dataset_embeddings/?dataset=${addEmbeddingForDataset}`, requestOptions)
				.then(response => response.json())
				.then(data => {
					console.log(data)
					setAddEmbeddingForDataset('')
					const dataset_details = datasets.map((dataset:any) => {
						if (dataset.dataset === addEmbeddingForDataset) dataset.embedding_added = true
						return dataset
					})
					setDatasets(dataset_details)
				})
		}
	}, [addEmbeddingForDataset, datasets])

	// get llms from backend
	useEffect(()=>{

		const postData = async () => {
			const response = await fetch(`${process.env.REACT_APP_OLLAMA_API}api/tags`, {method: 'GET'})
				const data = await response.json()

				// set models
				const llms = data.models.map((model:any) => model.name)
				const llm = llms[0]
				setLlms(llms)
				setLlm(llm)

				// add new model to backend API
				let llms_object:any = []
				data.models.forEach((model:any) => {
					let llm_name = model.name.split(':')[0]
					let llm_size = model.size* 1e-9
					let llm_size_gb = llm_size.toFixed(2)
					llms_object.push({name: llm_name, size: llm_size_gb})
				})
				
				const requestOptions = {
					method: 'POST',
					headers: { 
						'Content-Type': 'application/json',
						'Authorization': `${process.env.NODE_ENV === 'production' ? process.env.REACT_APP_AUTH_TOKEN_PROD : process.env.REACT_APP_AUTH_TOKEN_DEV}`
					},
				setConnection: 'keep-alive',
				keepalive: true,
				setTimeout: 10000,
				body: JSON.stringify({'llms': llms_object})
				}
				const response2 = await fetch(`${process.env.REACT_APP_BACKEND_API}api/add_ollama_models/`, requestOptions)
				const data2 = await response2.json()
				console.log(data2)

		}
		postData()
	},[])

	return (
		// create floating panel with opque background
		<div className='fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center'>
			<div className={'bg-panel1 w-3/4 max-h-[1100px] max-w-[1200px] rounded-lg ' + (window.screen.availHeight < 1000 ? 'h-[95vh]' : 'h-[75vh]')}>
				<div className='flex justify-between'>
					<div className='text-2xl font-bold text-white mt-8 mx-8'>Settings</div>
					<div className='text-2xl font-bold text-white mt-8 mr-8 cursor-pointer' onClick={props.closeSettings}>x</div>
				</div>
				<div className={'flex justify-between my-6 '+ (window.screen.availHeight < 1000 ? 'h-[78vh]' : 'h-[62vh]')}>
					{/* create left side vericle tabs */}
					<div className={'w-1/4 border-slate-400 border-y-2 ' + (window.screen.availHeight < 1000 ? 'h-[80vh]' : 'h-[55vh]')}>
						<div className='grid grid-cols-1 divide-y'>
							{ props.defaultSettings.settingsPanels.map((panel:any, index:number) => {
								return(
									<div 
										key={index} 
										data-panel={panel.key}
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
					<div className={'w-3/4 bg-panel2 overflow-y-auto ' + (window.screen.availHeight < 1000 ? 'h-[80vh]' : 'h-[55vh]')}>
						<div className={'mx-4 my-4 px-4 bg-gray-300 rounded-md ' + (workflowZoomedIn ? 'h-[45vh]' : workflowCollapsed ? 'h-8' : 'h-[29vh]')}>
							<div className='flex justify-between m-1'>
								<div className='text-panel1 text-lg font-bold'>MyGPT Workflow</div>
								<div className='flex flex-row justify-between'>
									{ window.screen.availHeight < 1000 ? 
										<div className='flex m-1'>
											<div className='text-panel1 text-lg font-bold cursor-pointer p-1 hover:bg-panel1 hover:text-white rounded-md' onClick={()=>setWorkflowZoomedIn(!workflowZoomedIn)}>
												{workflowZoomedIn ? <MagnifyingGlassMinusIcon className='h-5 w-5'/> : <MagnifyingGlassPlusIcon className='h-5 w-5'/>}
											</div>
										</div> : <></>
									}
									<div className='flex m-1'>
										<div className='text-panel1 text-lg font-bold cursor-pointer p-1 hover:bg-panel1 hover:text-white rounded-md' onClick={()=>setWorkflowCollapsed(!workflowCollapsed)}>
											{workflowCollapsed ? <ChevronUpIcon className='h-5 w-5'/> : <ChevronDownIcon className='h-5 w-5'/>}
										</div>
									</div>
								</div>
							</div>
							<Workflow focusComponent={activeTab} zoomedIn={workflowZoomedIn} collapsed={workflowCollapsed}/>
						</div>
						{ activeTab === 'datasets' ?
							<div className={'px-8 py-2 flex flex-col divide-y ' + (workflowCollapsed ? ' h-[60vh] max-h-[770px]' : ' h-[40vh] max-h-[470px]')}>
								{/* list of available libraries */}
								<div className='flex flex-col justify-start mt-4'>
									<div className='text-nav px-2 flex justify-start mt-2 text-lg font-semibold'> Available libraries </div>
									<div className='text-nav px-4 flex justify-start'>
										<ul className='list-disc'>
											{datasets.filter((d:any)=>d !== 'None').map((dataset:any, index:number) => {
												return(
													<li key={index} className='ml-4'>
														<div className='flex justify-between m-1'>
															{dataset.dataset.split('_').join(' ')}
															<div>
																<button className={'ml-2 text-white px-2 rounded-md w-24' 
																	+ (dataset.dataset === currentSettings.selectedDataset ? ' bg-gray-300' : ' bg-panel1')}
																	onClick={()=>{
																		setSelectedDataset(dataset.dataset)
																		props.settingsCallback({...currentSettings, selectedDataset: dataset.dataset, fetchPapers: true})
																	}}
																	disabled={dataset.dataset === currentSettings.selectedDataset ? true : false}
																>{ dataset.dataset === currentSettings.selectedDataset ? 'Selected' : 'Select'}</button>
																
																{/* <button className={'ml-2 text-white px-2 rounded-md w-48' + (dataset['embedding_added'] ? ' bg-gray-300' : ' bg-panel1' )}
																	disabled={dataset['embedding_added'] ? true : false}
																	onClick={()=>{
																		setAddEmbeddingForDataset(dataset.dataset)
																	}}
																>
																	{ dataset['embedding_added'] ? 'added in vector space' : 'add to vector space'}
																</button> */}
																{ 
																	(props.currentSettings.restrictions_without_login && props.user) || !props.currentSettings.restrictions_without_login ?
																	<button className='ml-2 bg-red-900 text-white px-2 rounded-md'
																		onClick={()=>{setDeleteDataset(dataset.dataset)}}
																	>Delete</button>
																	: <></>
																}
															</div>
														</div>
													</li>
												)
											})}
										</ul>
									</div>
									<div className='flex justify-start text-sm text-nav mt-4'>
										<p>
											<b>Note:</b> Deleting a library is irreversible action and will remove all papers and annotations associated with it.
										</p>
										</div>
								</div>

									{/* add new library */}
									<AddLibrarySettings
										currentSettings={currentSettings}
										settingsCallback={props.settingsCallback}
										user={props.user}
									/>
								</div> : <></>
							}
							{ activeTab === 'llms' ?
								<LLMSettings
									llms={llms}
									llm={llm}
									selectedLlm={currentSettings.selectedLlm}
									currentSettings={currentSettings}
									settingsCallback={props.settingsCallback}
								/> : <></>
						}
						{ activeTab === 'llm_parameters' ?
							<div className='px-8 py-2 flex flex-col'>
								<div className='text-nav inline-block px-2 mx-4 my-2 text-lg font-semibold'>System Prompt</div>
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
									<button className='bg-panel1 text-white px-4 py-1 rounded-md mx-4 my-2' onClick={()=>setEditPrompt(!editPrompt)}>{editPrompt ? 'Save' : 'Edit' }</button>
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
									<div className='text-nav inline-block px-2 mx-4 my-2 text-lg font-semibold'>Current Sentence Transformer</div>
									<div className='mx-4 px-2'>
										<DropdownOptions
											width={'180px'}
											optionsList={props.defaultSettings.sentence_transformers}
											defaultOption={currentSettings.sentence_transformer}
											dropDownCallback={(option:string)=>{
												props.settingsCallback({...currentSettings, selected_sentence_transformer: option})
											}}
										/>
									</div>
								</div>
								<div className='m-2'>
									<div className='text-nav inline-block px-2 mx-4 my-2 text-lg font-semibold'>Available Sentence Transformer</div>
									<div className='mx-4'>
										<ul className='list-disc ml-4'>
											{props.defaultSettings.sentence_transformers.map((st:string, index:number) => {
												return(
													<li key={index} className='ml-4 text-nav text-sm'>
															{st + (st === props.defaultSettings.default_sentence_transformer ? ' (default)' : '')}
													</li>
												)
											})}
										</ul>
									</div>
								</div>
								<div className='m-2'>
									<div className='text-nav inline-block px-2 mx-4 my-2 text-lg font-semibold'>
										<div className='text-nav p-1 my-1'>Add other Sentence Transformers</div>
										<p className='text-sm ml-4'> You can choose any Sentence Transformer from this list: <a className='underline' href='https://www.sbert.net/docs/pretrained_models.html'>SBERT.net</a></p>
										<input type='text' placeholder='Sentence Transformer' className='rounded-md w-60 p-1 ml-4'/>
										<button className='bg-panel1 text-white px-4 py-1 rounded-md m-2'>Add</button>
									</div>
								</div>
							</div> : <></>
						}
						{
							activeTab === 'relevance_score' ?
							<div className='px-8 py-2 flex flex-col divide-y'>
								<div className='m-2'>
									<div className='text-nav inline-block px-2 mx-4 my-2 text-lg font-semibold'>Relevance Score Cutoff</div>
									<div className='mx-4 px-2 w-[200px]'>
										<div className='flex justify-between'>
											<div className='text-nav p-1 my-1'>Best</div>
											<input type='number' placeholder='Best' className='rounded-md w-20 p-1 m-1' value={currentSettings.relevance_score_cutoff.best} onChange={(e)=>props.settingsCallback({...currentSettings, relevance_score_cutoff: {...currentSettings.relevance_score_cutoff, best: e.target.value}})}/>
										</div>
										<div className='flex justify-between'>
											<div className='text-nav p-1 my-1'>Worst</div>
											<input type='number' placeholder='Worst' className='rounded-md w-20 p-1 m-1' value={currentSettings.relevance_score_cutoff.worst} onChange={(e)=>props.settingsCallback({...currentSettings, relevance_score_cutoff: {...currentSettings.relevance_score_cutoff, worst: e.target.value}})}/>
										</div>
									</div>
									<button className='bg-panel1 text-white px-4 py-1 rounded-md mx-4 my-2' onClick={()=>props.settingsCallback(currentSettings)}>Save</button>
									<button className='bg-panel1 text-white px-4 py-1 rounded-md mx-4 my-2' onClick={()=>props.settingsCallback(props.defaultSettings)}>Reset</button>
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
