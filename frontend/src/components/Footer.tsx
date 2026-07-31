import { useState, useEffect } from 'react'

const Footer = (props: {
	frontendSettings: any,
	onDisclaimerClick: () => void,
	onFAQClick: () => void,
}) => {
	const version = import.meta.env.REACT_APP_MYGPT_VERSION
	const year = new Date().getFullYear()

	const [backendUp, setBackendUp] = useState<boolean | null>(null)
	const [ollamaUp, setOllamaUp] = useState<boolean | null>(null)

	useEffect(() => {
		let isMounted = true
		const check = async () => {
			try {
				const r = await fetch(`${import.meta.env.REACT_APP_BACKEND_API}api/frontend_settings/?format=json`, { method: 'GET' })
				if (isMounted) setBackendUp(r.ok)
			} catch {
				if (isMounted) setBackendUp(false)
			}
			try {
				const r = await fetch(`${import.meta.env.REACT_APP_BACKEND_API}api/get_ollama_models/`, { method: 'POST' })
				const data = await r.json()
				const hasModelList = Array.isArray(data?.models)
				if (isMounted) setOllamaUp(r.ok && hasModelList)
			} catch {
				if (isMounted) setOllamaUp(false)
			}
		}
		check()
		return () => { isMounted = false }
	}, [])

	const StatusDot = ({ up, label }: { up: boolean | null; label: string }) => (
		<div className='flex items-center gap-1'>
			<span
				className={`inline-block w-2 h-2 rounded-full ${
					up === null ? 'bg-gray-400' : up ? 'bg-green-400' : 'bg-red-400'
				}`}
			/>
			<span className='opacity-70'>{label}</span>
		</div>
	)

	return (
		<div className='flex justify-between text-nav bg-[#2A4759] my-auto py-4 h-[6vh]'>
			<div className='text-sm text-white mx-8 my-auto flex flex-row items-center gap-3'>
				{/* <p className='inline-block mx-2'>Designed by </p> */}
				<img src='/stjude-logo-child.png' alt='St. Jude logo' className='h-[3vh] inline-block'/>
				<p className='inline-block'>St. Jude Children's Research Hospital</p>
				<p className='inline-block opacity-60'>© {year}</p>
			</div>
            <div className='text-sm text-white mx-8 my-auto cursor-pointer flex flex-row items-center gap-4'>
                { version && <p className='inline-block opacity-60'>MyGPT v{version}</p> }
				<StatusDot up={backendUp} label='Backend' />
				<StatusDot up={ollamaUp} label='Ollama' />
            </div>
			<div className='text-sm text-white mx-8 my-auto cursor-pointer flex flex-row'>
				{ props.frontendSettings.django_login ?
					<div onClick={props.onDisclaimerClick}>Disclaimer</div>
					: <></>
				}
				<div className='text-sm text-white mx-8 my-auto cursor-pointer' onClick={props.onFAQClick}>FAQs</div>
			</div>
		</div>
	)
}

export default Footer
