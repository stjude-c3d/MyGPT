import { useState } from 'react'

const ZoteroSettings = () => {
  const [apiKey, setApiKey] = useState('');
  const [libraryId, setLibraryId] = useState('');
  const [collectionId, setCollectionId] = useState('');
  const [zoteroPanel, setZoteroPanel] = useState(true);
  const [uploadPanel, setUploadPanel] = useState(false);
  const [uploadDocCount, setUploadDocCount] = useState(5);

  return (
	<div className='px-8 my-4'>
		<div className='text-nav p-2 mt-2 flex justify-center'> Add new library </div>
		{/*  add choice button with 2 options */}
		<div className='flex justify-center'>
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
			<div className='flex justify-center'>
				<div className='flex flex-col'>
					<div className='flex py-2'>
						<div className='text-nav w-40 p-1'>Zotero API key*</div>
						<input type='text' placeholder=' Zotero API key' className='rounded-md w-60 p-1' value={apiKey} onChange={(e) => setApiKey(e.target.value)}/>
					</div>
					<div className='flex justify-center'>
						<div className='text-nav p-1 text-lg'>+</div>
					</div>
					<div className='flex py-2'>
						<div className='text-nav w-40 p-1'>Zotero group ID</div>
						<input type='text' placeholder='Zotero group ID' className='rounded-md w-60 p-1' value={libraryId} onChange={(e) => setLibraryId(e.target.value)}/>
					</div>
					<div className='flex pb-2'>
						<div className='text-nav w-40 p-1'>Zotero collection ID</div>	
						<input type='text' placeholder='Zotero collection ID' className='rounded-md w-60 p-1' value={collectionId} onChange={(e) => setCollectionId(e.target.value)}/>
					</div>	
					<div className='flex justify-center'>
						<div className='text-nav p-1 my-1'>OR</div>
					</div>
					<div className='flex pb-2'>
						<div className='text-nav w-40 p-1'>Zotero user ID</div>
						<input type='text' placeholder='Zotero user ID' className='rounded-md w-60 p-1'/>
					</div>
					<div className='flex pb-2'>
						<div className='text-nav w-40 p-1'>Zotero collection ID</div>	
						<input type='text' placeholder='Zotero collection ID' className='rounded-md w-60 p-1'/>
					</div>
					<div className='flex justify-center'>
						<button className='bg-panel1 text-white px-4 py-2 rounded-md my-2'>Add library</button>
					</div>
				</div>
			</div>
			: <></>
		}
		{ uploadPanel ?
			<div className='flex justify-center'>
				<div className='flex flex-col'>
					<div className='flex flex-col mt-2'>
						{ Array.from(Array(uploadDocCount).keys()).map((x:any) =>
						<div className='flex justify-center p-1'>
							<div> Document {x+1}</div>
							<input type='text' placeholder=' Title*' className='rounded-md mx-2 w-72'/>
							<input type='file' className='rounded-md w-60'/>
						</div>
						)}
					</div>
					<div className='flex justify-center'>
						{uploadDocCount < 41 ? <button className='text-panel1 bg-white px-4 py-2 rounded-md m-2' onClick={()=>setUploadDocCount(uploadDocCount+5)}>+5</button> : <></>}
						<button className='bg-panel1 text-white px-4 py-2 rounded-md m-2'>Upload documents</button>
					</div>
				</div>
			</div>
			: <></>
		}
	</div>
  )
}

export default ZoteroSettings