import { useState, useEffect } from 'react'
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline'
import { DropdownOptions } from './DropDownMenu'

const AddLibrarySettings = (props: {
	currentSettings: any,
	settingsCallback: any, 
	user?: any,
	djangoLogin?: any
}) => {
  const [apiKey, setApiKey] = useState('')
  const [showAPIHelp, setShowAPIHelp] = useState(false)
  const [libraryId, setLibraryId] = useState('')
  const [libraryIdType, setLibraryIdType] = useState('user') // ['user', 'group']
  const [showLibraryIDHelp, setShowLibraryIDHelp] = useState(false)
  const [collectionId, setCollectionId] = useState('')
  const [showCollectionIDHelp, setShowCollectionIDHelp] = useState(false)
  const [addLibrary, setAddLibrary] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showError, setShowError] = useState(false)

  const [uploadPanel, setUploadPanel] = useState(true)
  const [zoteroPanel, setZoteroPanel] = useState(false)
  const [videoPanel, setVideoPanel] = useState(false)

  const [UploadLibraryName, setUploadLibraryName] = useState('')
  const [uploadDocCount, setUploadDocCount] = useState(5)
  const emptyUploadDocs = Array.from(Array(40).keys()).map((x:any) => {return {title: '', file: null}})
  const [uploadDocs, setUploadDocs] = useState(emptyUploadDocs)
  const [uploadLibrary, setUploadLibrary] = useState(false)
  const currentSettings = JSON.parse(JSON.stringify(props.currentSettings))

  const [videoLibraryName, setVideoLibraryName] = useState('')
  const [videoLibrary, setVideoLibrary] = useState(false)
  const [videoPlaylistURL, setVideoPlaylistURL] = useState('')
  const [videoDocURLs, setVideoDocURLs] = useState([''])

  const [useOverlap, setUseOverlap] = useState('Yes')
  const [chunkSize, setChunkSize] = useState('1000')
  const [distanceFn, setDistanceFn] = useState('l2')

//   console.log(UploadLibraryName, uploadDocs)

  useEffect(() => {
	if (addLibrary){
		const formData = new FormData()

		formData.append('api_key', apiKey)
		formData.append('library_id', libraryId)
		formData.append('library_id_type', libraryIdType)
		formData.append('collection_id', collectionId)
		formData.append('embedding_model', currentSettings.selectedEmbeddingModel)
		formData.append('use_overlap', useOverlap)
		formData.append('chunk_size', chunkSize)
		formData.append('distance_function', distanceFn)
		formData.append('user', props.user ? props.user.user.replace(', ','_'): '-')
		formData.append('user_email', props.user ? props.user.user_email : '-')
		formData.append('user_group', props.user && props.user.isAdmin ? 'admin' : 'user')

		const requestOptions = {
			method: 'POST',
			headers: {
				'Authorization': `${
				props.user && props.djangoLogin ?
				'Bearer ' + localStorage.getItem('access') :
					process.env.NODE_ENV === 'production' ? 
					process.env.REACT_APP_AUTH_TOKEN_PROD 
					: process.env.REACT_APP_AUTH_TOKEN_DEV}`
				},
			body: formData
		}

		fetch(`${process.env.REACT_APP_BACKEND_API}api/add_zotero_collection/`, requestOptions)
		.then(response => response.json())
		.then(data => {
			props.settingsCallback({...currentSettings, fetchDatasets: true, datasetsUpdated: true})
			setAddLibrary(false)
			setApiKey('')
			setLibraryId('')
			setCollectionId('')
			if (data.added){
				setShowSuccess(true)
			}else{
				setShowError(true)
			}
		})
	}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addLibrary, apiKey, libraryId, collectionId, libraryIdType])

 	useEffect(() => {
		if (uploadLibrary){
			const formData = new FormData()
			
			formData.append('dataset_name', UploadLibraryName)
			formData.append('embedding_model', currentSettings.selectedEmbeddingModel)
			formData.append('user', props.user ? props.user.user.replace(', ','_'): '-')
			formData.append('user_email', props.user ? props.user.user_email : '-')
			formData.append('user_group', props.user && props.user.isAdmin ? 'admin' : 'user')
			formData.append('use_overlap', useOverlap)
			formData.append('chunk_size', chunkSize)
			formData.append('distance_function', distanceFn)

			uploadDocs.filter((d)=> d.file !== null && d.title !== '').forEach((doc:any) => {
				if (doc.title && doc.file){
					formData.append('paper_title', doc.title)
					formData.append('paper_attachment', doc.file)
				}
			})
			const requestOptions = {
				method: 'POST',
				headers: {
					// 'Content-Type': 'multipart/form-data',
					'Authorization': `${
					props.user && props.djangoLogin ?
					'Bearer ' + localStorage.getItem('access') :
						process.env.NODE_ENV === 'production' ? 
						process.env.REACT_APP_AUTH_TOKEN_PROD 
						: process.env.REACT_APP_AUTH_TOKEN_DEV}`
					},
				body: formData
			}
			fetch(`${process.env.REACT_APP_BACKEND_API}api/upload_documents/`, requestOptions)
			.then(response => response.json())
			.then(data => {
				console.log(data)
				// props.reloadDatasetsCallabck()
				props.settingsCallback({...currentSettings, fetchDatasets: true, datasetsUpdated: true})
				setUploadLibrary(false)
				setUploadLibraryName('')
				setUploadDocs(emptyUploadDocs)
				if (data.uploaded){
					setShowSuccess(true)
				}else{
					setShowError(true)
				}
			})
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [uploadLibrary, UploadLibraryName, uploadDocs])

	useEffect(() => {
		if (videoLibrary){
			const formData = new FormData()
			
			formData.append('dataset_name', videoLibraryName)
			formData.append('embedding_model', currentSettings.selectedEmbeddingModel)
			formData.append('user', props.user ? props.user.user: '')
			formData.append('user_email', props.user ? props.user.user_email : '')
			formData.append('user_group', props.user && props.user.isAdmin ? 'admin' : 'user')

			formData.append('video_urls', videoDocURLs.join(',') )
			formData.append('playlist_url', videoPlaylistURL)

			const requestOptions = {
				method: 'POST',
				headers: {
					'Authorization': `${
					props.user && props.djangoLogin ?
					'Bearer ' + localStorage.getItem('access') :
						process.env.NODE_ENV === 'production' ? 
						process.env.REACT_APP_AUTH_TOKEN_PROD 
						: process.env.REACT_APP_AUTH_TOKEN_DEV}`
					},
				body: formData
			}
			fetch(`${process.env.REACT_APP_BACKEND_API}api/add_video_library/`, requestOptions)
			.then(response => response.json())
			.then(data => {
				props.settingsCallback({...currentSettings, fetchDatasets: true, datasetsUpdated: true})
				setVideoLibrary(false)
				setVideoLibraryName('')
				setVideoDocURLs([])
				if (data.added){
					setShowSuccess(true)
				}
			})
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [videoLibrary, videoLibraryName, videoDocURLs])

  return (
	<div className='my-4'>
		<div className='text-nav dark:text-nav-dark p-2 mt-2 flex justify-start text-lg font-semibold'> Add new library </div>
		{ currentSettings.restriction_without_login && !props.user ?
			<div className='text-nav dark:text-nav-dark p-2 mb-2 flex justify-start text-lg font-semibold'> Note: Please login to add library </div> : <></>
		}
		{/*  add choice button with 3 options */}
		<div className='flex justify-start'>
			<div className={'inline-block px-4 py-1 shadow rounded-l-lg border-2 border-panel1 ' + 
				(uploadPanel ? 'bg-panel1 dark:bg-panel3-dark text-white cursor-default ' : 'text-panel1 bg-white dark:bg-nav-dark dark:text-nav cursor-pointer')}
				onClick={() => {
					setZoteroPanel(false)
					setUploadPanel(true)
					setVideoPanel(false)
				}}
			>
				Upload documents
			</div>
			<div className={'inline-block px-4 py-1 shadow border-2 border-y-panel1 ' + 
				(zoteroPanel ? 'bg-panel1 dark:bg-panel3-dark text-white cursor-default ' : 'text-panel1 bg-white dark:bg-nav-dark dark:text-nav cursor-pointer')}
				onClick={() => {
					setZoteroPanel(true)
					setUploadPanel(false)
					setVideoPanel(false)
				}}
			>
				Add Zotero library
			</div>
			<div className={'inline-block px-4 py-1 shadow rounded-r-lg border-2 border-panel1 ' + 
				(videoPanel ? 'bg-panel1 dark:bg-panel3-dark text-white cursor-default ' : 'text-panel1 bg-white dark:bg-nav-dark dark:text-nav cursor-pointer')}
				onClick={() => {
					setZoteroPanel(false)
					setUploadPanel(false)
					setVideoPanel(true)
				}}
			>
				Youtube video library
			</div>
		</div>
		{ zoteroPanel ?
			<div className='flex justify-start'>
				<div className='flex flex-col mt-4'>
					{ showSuccess ?
						<div className='flex justify-start'>
							<div className='text-nav dark:text-nav-dark p-1 text-lg bg-green-200 rounded-md'>Library uploaded successfully</div>
						</div> : 
						addLibrary && !showSuccess ?
						<div className='flex justify-start'>
							<div className='text-nav dark:text-nav-dark p-1 text-lg bg-orange-200 rounded-md'>Uploading documents...</div>
						</div> :
						<></>
					}
					{ showError ?
						<div className='flex justify-start'>
							<div className='text-nav dark:text-nav-dark p-1 text-lg bg-red-200 rounded-md'>Error uploading documents</div>
						</div> : <></>	
					}
					<div className='flex py-2'>
						<div className='text-nav dark:text-nav-dark w-48 p-1'>Zotero API key*</div>
						<input type='text' disabled={currentSettings.restriction_without_login && !props.user} placeholder=' Zotero API key' className='rounded-md w-72 p-1 text-nav dark:bg-gray-500 dark:text-white dark:placeholder:text-white' value={apiKey} onChange={(e) => setApiKey(e.target.value)}/>
						<div className='text-white text-lg font-bold cursor-pointer mx-1 p-1 hover:bg-panel1 dark:bg-panel3-dark rounded-md' onClick={()=>{setShowAPIHelp(!showAPIHelp)}}>
							<QuestionMarkCircleIcon className='h-6 w-6 text-white cursor-pointer'/>
						</div>
						{ showAPIHelp ?
						<>
						<div className="border-solid border-r-slate-200 border-r-[4px] border-y-transparent border-y-[16px] border-l-0"></div>
						<div className='text-nav dark:text-nav-dark text-xs bg-slate-200 rounded-sm p-2'>
							<span>Get your API key from</span>
							<a href='https://www.zotero.org/settings/keys' target='_blank' rel='noreferrer' className='text-panel1 hover:text-blue-500'> Zotero settings</a>
						</div>
						</>: <></>}
					</div>
					{/* <div className='flex justify-center'>
						<div className='text-nav dark:text-nav-dark p-1 text-lg'>+</div>
					</div> */}
					<div className='flex pb-2'>
						<div className='text-nav dark:text-nav-dark w-48 p-1'>Zotero library ID*</div>
						<input type='text' disabled={currentSettings.restriction_without_login && !props.user} placeholder='Zotero user ID or group ID e.g. 1234567' className='rounded-md w-72 p-1 text-nav dark:bg-gray-500 dark:text-white dark:placeholder:text-white h-8' value={libraryId} onChange={(e) => setLibraryId(e.target.value)}/>
						<div className='text-white text-lg font-bold cursor-pointer mx-1 p-1 hover:bg-panel1 dark:bg-panel3-dark rounded-md h-8' onClick={()=>{setShowLibraryIDHelp(!showLibraryIDHelp)}}>
							<QuestionMarkCircleIcon className='h-6 w-6 text-white cursor-pointer'/>
						</div>
						{ showLibraryIDHelp ?
						<>
						<div className="border-solid border-r-slate-200 border-r-[12px] border-y-transparent border-y-[28px] border-l-0"></div>
						<div className='text-nav dark:text-nav-dark text-xs bg-slate-200 rounded-sm p-1 w-[280px]'>
							<span>Get your User ID from</span>
							<a href='https://www.zotero.org/settings/keys' target='_blank' rel='noreferrer' className='text-panel1 hover:text-blue-500'> Zotero settings</a>
							<span>. <br/> Or your Group ID is the 7-8 digit integer after <code>/groups/</code> in zotero library URL</span>
						</div>
						</>: <></>}
					</div>
					{/* add switch to indicate user ID or group UD */}
					<div className='flex pb-2 ml-48'>
						{/* add toggle button switch */}
						<div className='flex items-center'>
							<div className='text-nav dark:text-nav-dark p-1'>User ID</div>
							<div className={'w-12 h-6 rounded-full bg-white flex items-center ' + (libraryIdType === 'user' ? 'justify-start' : 'justify-end')}
							onClick={() => setLibraryIdType(libraryIdType === 'user' ? 'group' : 'user')}
							>
								<div className={'w-4 h-4 rounded-full bg-panel1 dark:bg-panel3-dark m-1'}></div>
							</div>
							<div className='text-nav dark:text-nav-dark p-1'>Group ID</div>
							</div>
					</div>
					<div className='flex pb-2'>
						<div className='text-nav dark:text-nav-dark w-48 p-1'>Zotero collection ID*</div>	
						<input type='text' disabled={currentSettings.restriction_without_login && !props.user} placeholder='Zotero collection ID e.g. ABC12DEF' className='rounded-md w-72 p-1 text-nav dark:bg-gray-500 dark:text-white dark:placeholder:text-white h-8' value={collectionId} onChange={(e) => setCollectionId(e.target.value)}/>
						<div className='text-white text-lg font-bold cursor-pointer mx-1 p-1 hover:bg-panel1 dark:bg-panel3-dark rounded-md h-8' onClick={()=>{setShowCollectionIDHelp(!showCollectionIDHelp)}}>
							<QuestionMarkCircleIcon className='h-6 w-6 text-white cursor-pointer'/>
						</div>
						{ showCollectionIDHelp ?
						<>
						<div className="border-solid border-r-slate-200 border-r-[12px] border-y-transparent border-y-[20px] border-l-0"></div>
						<div className='text-nav dark:text-nav-dark text-xs bg-slate-200 rounded-sm p-1 w-[280px]'>
							<span>Your collection ID is alpha-numeric key after <code>/collections/</code> in zotero collection url</span>
							
						</div>
						</>: <></>}
					
					</div>
					<div className='flex justify-start mx-2 my-1'>
						<div className='text-nav dark:text-nav-dark w-48 p-1'>Embedding Model*</div>
						<DropdownOptions
							width={'280px'}
							optionsList={props.currentSettings.embedding_models}
							defaultOption={currentSettings.selectedEmbeddingModel}
							dropDownCallback={(option:string)=>{
								props.settingsCallback({...currentSettings, selectedEmbeddingModel: option})
							}}
						/>
					</div>
					<div className='flex justify-start mx-2 my-1'>
						<div className='text-nav dark:text-nav-dark p-1 w-48'>Use Overlap</div>
						<DropdownOptions
							width={'280px'}
							optionsList={['Yes', 'No']}
							defaultOption={'Yes'}
							dropDownCallback={(option:string)=>{
								setUseOverlap(option)
							}}
						/>
					</div>
					<div className='flex justify-start mx-2 my-1'>
						<div className='text-nav dark:text-nav-dark p-1 w-48'>Chunk Size</div>
						<DropdownOptions
							width={'280px'}
							optionsList={['500', '750', '1000', '1200']}
							defaultOption={'1000'}
							dropDownCallback={(option:string)=>{
								setChunkSize(option)
							}}
						/>
					</div>
					<div className='flex justify-start mx-2 my-1'>
						<div className='text-nav dark:text-nav-dark p-1 w-48'>Distance Function</div>
						<DropdownOptions
							width={'280px'}
							optionsList={['Squared L2', 'Cosine similarity', 'Inner product']}
							defaultOption={'Squared L2'}
							dropDownCallback={(option:string)=>{
								let request_option = option === 'Cosine similarity' ? 'cosine' : 
									option === 'Inner product' ? 'inner' : 
									'l2'
								setDistanceFn(request_option)
							}}
						/>
					</div>
					<div className='flex justify-start'>
						<button className='bg-panel1 dark:bg-panel3-dark text-white px-4 py-2 rounded-md my-2' onClick={()=>setAddLibrary(true)}>Add library</button>
					</div>
				</div>
			</div>
			: <></>
		}
		{ uploadPanel ?
			<div className='flex justify-start'>
				<div className='flex flex-col mt-4'>
					{ showSuccess ?
						<div className='flex justify-start'>
							<div className='text-nav dark:text-nav-dark p-1 text-lg bg-green-200 rounded-md'>Library uploaded successfully</div>
						</div> : 
						uploadLibrary && !showSuccess ?
						<div className='flex justify-start'>
							<div className='text-nav dark:text-nav-dark p-1 text-lg bg-orange-200 rounded-md'>Uploading documents...</div>
						</div> :
						<></>
					}
					{ showError ?
						<div className='flex justify-start'>
							<div className='text-nav dark:text-nav-dark p-1 text-lg bg-red-200 rounded-md'>Error uploading documents</div>
						</div> : <></>	
					}
					{/* <div className='text-nav dark:text-nav-dark p-1 my-2'> Note: Because of limited resources on the hosting server, upload up to 7-10 PDFs per library. It may take 3-4 minutes to see a success message.</div> */}
					<div className='flex justify-start m-2'>
						<div className='text-nav dark:text-nav-dark p-1 w-48'>Library Name</div>
						<input type='text' placeholder=' Library Name' disabled={currentSettings.restriction_without_login && !props.user} className='rounded-md w-[270px] px-2 py-1 dark:bg-gray-500 dark:text-white dark:placeholder:text-white text-nav' value={UploadLibraryName}
							onChange={(e) => setUploadLibraryName(e.target.value)}
						/>
					</div>
					<div className='flex justify-start m-2'>
						{/* multiple documents upload */}
						<div className='text-nav dark:text-nav-dark p-1 w-48'>Select Documents</div>
						<input type='file' disabled={currentSettings.restriction_without_login && !props.user} multiple className='rounded-md w-60 p-1 text-nav dark:text-nav-dark' onChange={(e) => {
							const files = e.target.files
							if (files){
								const docs = Array.from(files).map((file:any) => {return {title: file.name.split('.pdf')[0], file: file}})
								setUploadDocs(docs)
							}
						}}/>
					</div>
					<div className='flex justify-start m-2'>
						<div className='text-nav dark:text-nav-dark p-1 w-48'>Embedding model</div>
						<DropdownOptions
							width={'270px'}
							optionsList={props.currentSettings.embedding_models}
							defaultOption={currentSettings.selectedEmbeddingModel}
							dropDownCallback={(option:string)=>{
								props.settingsCallback({...currentSettings, selectedEmbeddingModel: option})
							}}
						/>
					</div>
					<div className='flex justify-start m-2'>
						<div className='text-nav dark:text-nav-dark p-1 w-48'>Use Overlap</div>
						<DropdownOptions
							width={'270px'}
							optionsList={['Yes', 'No']}
							defaultOption={'Yes'}
							dropDownCallback={(option:string)=>{
								setUseOverlap(option)
							}}
						/>
					</div>
					<div className='flex justify-start m-2'>
						<div className='text-nav dark:text-nav-dark p-1 w-48'>Chunk Size</div>
						<DropdownOptions
							width={'270px'}
							optionsList={['500', '750', '1000', '1200']}
							defaultOption={'1000'}
							dropDownCallback={(option:string)=>{
								setChunkSize(option)
							}}
						/>
					</div>
					<div className='flex justify-start m-2'>
						<div className='text-nav dark:text-nav-dark p-1 w-48'>Distance Function</div>
						<DropdownOptions
							width={'270px'}
							optionsList={['Squared L2', 'Cosine similarity', 'Inner product']}
							defaultOption={'Squared L2'}
							dropDownCallback={(option:string)=>{
								let request_option = option === 'Cosine similarity' ? 'cosine' : 
									option === 'Inner product' ? 'inner' : 
									'l2'
								setDistanceFn(request_option)
							}}
						/>
					</div>

					<div className='flex justify-center'>
						<button className='bg-panel1 dark:bg-panel3-dark text-white px-4 py-2 rounded-md m-2'
							onClick={() => setUploadLibrary(true)}
						>Upload documents</button>
					</div>
				</div>
			</div>
			: <></>
		}
		{ videoPanel ?
			<div className='flex justify-start'>
				<div className='flex flex-col mt-4'>
					{ showSuccess ?
						<div className='flex justify-start'>
							<div className='text-nav dark:text-nav-dark p-1 text-lg bg-green-200 rounded-md'>Library uploaded successfully</div>
						</div> : 
						videoLibrary && !showSuccess ?
						<div className='flex justify-start'>
							<div className='text-nav dark:text-nav-dark p-1 text-lg bg-orange-200 rounded-md'>Uploading documents...</div>
						</div> :
						<></>
					}
					<div className='flex justify-start p-2'>
						<div className='text-nav dark:text-nav-dark w-40 p-1 my-2'>Library Name</div>
						<input 
							disabled={currentSettings.restriction_without_login && !props.user ? true : false} 
							// disabled={true}
							type='text' placeholder=' Library Name' className='rounded-md w-60 px-2 py-1 m-2 text-nav dark:text-white dark:bg-gray-500 dark:placeholder:text-white' value={videoLibraryName}
							onChange={(e) => setVideoLibraryName(e.target.value)}
						/>
					</div>
					{/* <div className='text-nav dark:text-nav-dark p-1 my-2'> Note: MyGPT currently supports YouTube videos with closed captions only. <br/> Because of restrictions on hosting server, YouTube upload has been disabled.
						To test the feature, we recommand installing it on your local machine.
					</div> */}
					<div className='flex justify-start p-2 flex-col'>
						<div>
							<div className='text-nav dark:text-nav-dark w-40 p-1 my-2'>YouTube Playlist link</div>
							<input 
								disabled={currentSettings.restriction_without_login && !props.user ? true : false} 
								// disabled={true}
								type='text' placeholder=' YouTube playlist link' className='rounded-md w-72 px-2 py-1 m-2 text-nav dark:text-white dark:bg-gray-500 dark:placeholder:text-white' value={videoPlaylistURL}
								onChange={(e) => setVideoPlaylistURL(e.target.value)}
							/>
						</div>
						<div className='flex justify-start text-nav dark:text-nav-dark font-bold p-1 my-2 mx-auto w-72'> OR </div>
						<div className='w-72'>
							<div className='text-nav dark:text-nav-dark p-1 my-2'>YouTube vidoe links</div>
							<div className='flex flex-col justify-start'>
								{/* for loop for uploaddoccount */}
								{[...Array(uploadDocCount)].map((_x:any, i:any) => (
									<div key={i} className='m-2'>
										<input 
										disabled={currentSettings.restriction_without_login && !props.user ? true : false} 
										// disabled={true}
										type='text' placeholder=' Youtube video link' className='rounded-md w-72 px-2 py-1 text-nav dark:text-white dark:bg-gray-500 dark:placeholder:text-white'
											value={videoDocURLs[i]} onChange={(e) =>{
												const temp = [...videoDocURLs]
												temp[i] = e.target.value
												setVideoDocURLs(temp)
											}}
										/>
									</div>
								))}
							</div>
							{uploadDocCount < 41 ? <button className='text-panel1 bg-white dark:bg-panel3-dark dark:text-nav-dark px-4 py-2 rounded-md mx-2' 
							// disabled={true} 
							onClick={()=>setUploadDocCount(uploadDocCount+5)}>+5</button> : <></>}
						</div>
					</div>
					<div className='flex justify-start text-nav dark:text-nav-dark font-bold p-1 my-2 mx-auto w-72'> AND </div>
					<div className='flex justify-start mx-2 my-1'>
						<div className='text-nav dark:text-nav-dark p-1 w-48'>Embedding Model</div>
						<DropdownOptions
							width={'280px'}
							optionsList={props.currentSettings.embedding_models}
							defaultOption={currentSettings.sentence_transformer}
							dropDownCallback={(option:string)=>{
								props.settingsCallback({...currentSettings, selectedEmbeddingModel: option})
							}}
						/>
					</div>
					<div className='flex justify-start mx-2 my-1'>
						<div className='text-nav dark:text-nav-dark p-1 w-48'>Use Overlap</div>
						<DropdownOptions
							width={'280px'}
							optionsList={['Yes', 'No']}
							defaultOption={'Yes'}
							dropDownCallback={(option:string)=>{
								setUseOverlap(option)
							}}
						/>
					</div>
					<div className='flex justify-start mx-2 my-1'>
						<div className='text-nav dark:text-nav-dark p-1 w-48'>Chunk Size</div>
						<DropdownOptions
							width={'280px'}
							optionsList={['500', '750', '1000', '1200']}
							defaultOption={'1000'}
							dropDownCallback={(option:string)=>{
								setChunkSize(option)
							}}
						/>
					</div>
					<div className='flex justify-start mx-2 my-1'>
						<div className='text-nav dark:text-nav-dark p-1 w-48'>Distance Function</div>
						<DropdownOptions
							width={'280px'}
							optionsList={['Squared L2', 'Cosine similarity', 'Inner product']}
							defaultOption={'Squared L2'}
							dropDownCallback={(option:string)=>{
								let request_option = option === 'Cosine similarity' ? 'cosine' : 
									option === 'Inner product' ? 'inner' : 
									'l2'
								setDistanceFn(request_option)
							}}
						/>
					</div>
					<div className='flex justify-start'>
						<button className='bg-panel1 text-white dark:bg-panel3-dark dark:text-nav-dark px-4 py-2 rounded-md m-2' disabled={currentSettings.restriction_without_login && !props.user ? true : false}
							onClick={() => setVideoLibrary(true)}
						>Add videos</button>
					</div>
				</div>
			</div>
			: <></>
		}
	</div>
  )
}

export default AddLibrarySettings