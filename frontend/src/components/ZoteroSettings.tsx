import { useState, useEffect } from 'react'
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

const ZoteroSettings = (props: {
	reloadDatasetsCallabck: any
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

  const [zoteroPanel, setZoteroPanel] = useState(true)
  const [uploadPanel, setUploadPanel] = useState(false)

  const [UploadLibraryName, setUploadLibraryName] = useState('')
  const [uploadDocCount, setUploadDocCount] = useState(5)
  const emptyUploadDocs = Array.from(Array(40).keys()).map((x:any) => {return {title: '', file: null}})
  const [uploadDocs, setUploadDocs] = useState(emptyUploadDocs)
  const [uploadLibrary, setUploadLibrary] = useState(false)

//   console.log(UploadLibraryName, uploadDocs)

  useEffect(() => {
	if (addLibrary){
		const requestOptions = {
			method: 'POST',
			headers: { 
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				api_key: apiKey,
				library_id: libraryId,
				library_id_type: libraryIdType,
				collection_id: collectionId
			})
		}
		fetch(`${process.env.NODE_ENV === 'production' ? process.env.REACT_APP_API_PROD : process.env.REACT_APP_API_DEV}api/add_zotero_collection/`, requestOptions)
		.then(response => response.json())
		.then(data => {
			props.reloadDatasetsCallabck()
			setAddLibrary(false)
			setApiKey('')
			setLibraryId('')
			setCollectionId('')
			if (data.added){
				setShowSuccess(true)
				setTimeout(() => {
					setShowSuccess(false)
				}, 3000)
			
			}
		})
	}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addLibrary, apiKey, libraryId, collectionId, libraryIdType])

 	useEffect(() => {
		if (uploadLibrary){
			const formData = new FormData()
			formData.append('dataset_name', UploadLibraryName)
			uploadDocs.filter((d)=> d.file !== null && d.title !== '').forEach((doc:any) => {
				if (doc.title && doc.file){
					formData.append('paper_title', doc.title)
					formData.append('paper_attachment', doc.file[0])
				}
			})
			const requestOptions = {
				method: 'POST',
				Headers: {
					'Content-Type': 'multipart/form-data'
				},
				body: formData
			}
			fetch(`${process.env.NODE_ENV === 'production' ? process.env.REACT_APP_API_PROD : process.env.REACT_APP_API_DEV}api/upload_documents/`, requestOptions)
			.then(response => response.json())
			.then(data => {
				// props.reloadDatasetsCallabck()
				setUploadLibrary(false)
				setUploadLibraryName('')
				setUploadDocs(emptyUploadDocs)
				if (data.uploaded){
					setShowSuccess(true)
					setTimeout(() => {
						setShowSuccess(false)
					}, 3000)
				}
			})
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [uploadLibrary, UploadLibraryName, uploadDocs])

  return (
	<div className='my-4'>
		<div className='text-nav p-2 mt-2 flex justify-start'> Add new library </div>
		{/*  add choice button with 2 options */}
		<div className='flex justify-start'>
			<div className={'inline-block px-4 py-1 shadow rounded-l-lg border-2 border-panel1 ' + 
				(zoteroPanel ? 'bg-panel1 text-white cursor-default ' : 'text-panel1 bg-white cursor-pointer')}
				onClick={() => {
					setZoteroPanel(true)
					setUploadPanel(false)
				}}
			>
				Add Zotero library
			</div>
			<div className={'inline-block px-4 py-1 shadow rounded-r-lg border-2 border-panel1 ' + 
				(uploadPanel ? 'bg-panel1 text-white cursor-default ' : 'text-panel1 bg-white cursor-pointer')}
				onClick={() => {
					setZoteroPanel(false)
					setUploadPanel(true)
				}}
			>
				Upload documents
			</div>
		</div>
		{ zoteroPanel ?
			<div className='flex justify-start'>
				<div className='flex flex-col mt-4'>
					<div className='flex py-2'>
						<div className='text-nav w-40 p-1'>Zotero API key*</div>
						<input type='text' placeholder=' Zotero API key' className='rounded-md w-72 p-1 text-nav' value={apiKey} onChange={(e) => setApiKey(e.target.value)}/>
						<div className='text-white text-lg font-bold cursor-pointer mx-1 p-1 hover:bg-panel1 rounded-md' onClick={()=>{setShowAPIHelp(!showAPIHelp)}}>
							<QuestionMarkCircleIcon className='h-6 w-6 text-white cursor-pointer'/>
						</div>
						{ showAPIHelp ?
						<>
						<div className="border-solid border-r-slate-200 border-r-[4px] border-y-transparent border-y-[16px] border-l-0"></div>
						<div className='text-nav text-xs bg-slate-200 rounded-sm p-2'>
							<span>Get your API key from</span>
							<a href='https://www.zotero.org/settings/keys' target='_blank' rel='noreferrer' className='text-panel1 hover:text-blue-500'> Zotero settings</a>
						</div>
						</>: <></>}
					</div>
					{/* <div className='flex justify-center'>
						<div className='text-nav p-1 text-lg'>+</div>
					</div> */}
					<div className='flex pb-2'>
						<div className='text-nav w-40 p-1'>Zotero library ID*</div>
						<input type='text' placeholder='Zotero user ID or group ID e.g. 1234567' className='rounded-md w-72 p-1 text-nav h-8' value={libraryId} onChange={(e) => setLibraryId(e.target.value)}/>
						<div className='text-white text-lg font-bold cursor-pointer mx-1 p-1 hover:bg-panel1 rounded-md h-8' onClick={()=>{setShowLibraryIDHelp(!showLibraryIDHelp)}}>
							<QuestionMarkCircleIcon className='h-6 w-6 text-white cursor-pointer'/>
						</div>
						{ showLibraryIDHelp ?
						<>
						<div className="border-solid border-r-slate-200 border-r-[12px] border-y-transparent border-y-[28px] border-l-0"></div>
						<div className='text-nav text-xs bg-slate-200 rounded-sm p-1 w-[280px]'>
							<span>Get your User ID from</span>
							<a href='https://www.zotero.org/settings/keys' target='_blank' rel='noreferrer' className='text-panel1 hover:text-blue-500'> Zotero settings</a>
							<span>. <br/> Or your Group ID is the 7-8 digit integer after <code>/groups/</code> in zotero library URL</span>
						</div>
						</>: <></>}
					</div>
					{/* add switch to indicate user ID or group UD */}
					<div className='flex pb-2 ml-40'>
						{/* add toggle button switch */}
						<div className='flex items-center'>
							<div className='text-nav p-1'>User ID</div>
							<div className={'w-12 h-6 rounded-full bg-white flex items-center ' + (libraryIdType === 'user' ? 'justify-start' : 'justify-end')}
							onClick={() => setLibraryIdType(libraryIdType === 'user' ? 'group' : 'user')}
							>
								<div className={'w-4 h-4 rounded-full bg-panel1 m-1'}></div>
							</div>
							<div className='text-nav p-1'>Group ID</div>
							</div>
					</div>
					<div className='flex'>
						<div className='text-nav w-40 p-1'>Zotero collection ID*</div>	
						<input type='text' placeholder='Zotero collection ID e.g. ABC12DEF' className='rounded-md w-72 p-1 text-nav h-8' value={collectionId} onChange={(e) => setCollectionId(e.target.value)}/>
						<div className='text-white text-lg font-bold cursor-pointer mx-1 p-1 hover:bg-panel1 rounded-md h-8' onClick={()=>{setShowCollectionIDHelp(!showCollectionIDHelp)}}>
							<QuestionMarkCircleIcon className='h-6 w-6 text-white cursor-pointer'/>
						</div>
						{ showCollectionIDHelp ?
						<>
						<div className="border-solid border-r-slate-200 border-r-[12px] border-y-transparent border-y-[20px] border-l-0"></div>
						<div className='text-nav text-xs bg-slate-200 rounded-sm p-1 w-[280px]'>
							<span>Your collection ID is alpha-numeric key after <code>/collections/</code> in zotero collection url</span>
							
						</div>
						</>: <></>}
					
					</div>	
					{/* <div className='flex justify-center'>
						<div className='text-nav px-1 my-1'>OR</div>
					</div>
					<div className='flex pb-2'>
						<div className='text-nav w-40 p-1'>Zotero user ID</div>
						<input type='text' placeholder='Zotero user ID' className='rounded-md w-80 p-1'/>
					</div>
					<div className='flex pb-2'>
						<div className='text-nav w-40 p-1'>Zotero collection ID</div>	
						<input type='text' placeholder='Zotero collection ID' className='rounded-md w-80 p-1'/>
					</div> */}
					<div className='flex justify-start'>
						<button className='bg-panel1 text-white px-4 py-2 rounded-md my-2' onClick={()=>setAddLibrary(true)}>Add library</button>
					</div>
					{/* show sucess mesage */}
					{ showSuccess ?
					<div className='flex justify-start'>
						<div className='text-nav p-1 text-lg bg-green-200 rounded-md'>Library added successfully</div>
					</div> : <></>}
				</div>
			</div>
			: <></>
		}
		{ uploadPanel ?
			<div className='flex justify-start'>
				<div className='flex flex-col mt-4'>
					<div className='flex justify-start p-2'>
						<div className='text-nav w-40 p-1'>Library Name</div>
						<input type='text' placeholder=' Library Name' className='rounded-md w-72 px-2 py-1 text-nav'
							onChange={(e) => setUploadLibraryName(e.target.value)}
						/>
					</div>
					<div className='flex flex-col mt-2'>
						{ Array.from(Array(uploadDocCount).keys()).map((x:any) =>
						<div className='flex justify-center p-1 text-nav' key={x}>
							<div> Document {x+1}</div>
							<input type='text' placeholder=' Title*' className='rounded-md mx-2 w-72 px-2 py-1 text-nav'
								onChange={(e) => {
									let newUploadDocs:any = uploadDocs
									newUploadDocs[x].title = e.target.value
									setUploadDocs(newUploadDocs)
								}}
							/>
							<input type='file' className='rounded-md w-60'
								onChange={(e) => {
									let newUploadDocs:any = uploadDocs
									newUploadDocs[x].file = e.target.files
									setUploadDocs(newUploadDocs)
								}}
							/>
						</div>
						)}
					</div>
					<div className='flex justify-center'>
						{uploadDocCount < 41 ? <button className='text-panel1 bg-white px-4 py-2 rounded-md m-2' onClick={()=>setUploadDocCount(uploadDocCount+5)}>+5</button> : <></>}
						<button className='bg-panel1 text-white px-4 py-2 rounded-md m-2'
							onClick={() => setUploadLibrary(true)}
						>Upload documents</button>
					</div>
					{ showSuccess ?
					<div className='flex justify-start'>
						<div className='text-nav p-1 text-lg bg-green-200 rounded-md'>Library uploaded successfully</div>
					</div> : <></>}
				</div>
			</div>
			: <></>
		}
	</div>
  )
}

export default ZoteroSettings