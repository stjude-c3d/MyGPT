import { Link } from 'react-router-dom'
import { Cog6ToothIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline'

// -----------------------------//
// Top Navigation with app name //
// -----------------------------//

interface NavProps {
	appName: string,
	appNameLink?: any,
	showAppLogo?: boolean,
	appLogoPath?: string,
	appLogoLink?: any,
	appLogoExternalLink?: any,
	showHistoryButton?: boolean,
	showSettingsButton?: boolean,
	settingButtonCallback?: any,
	burgerImagePath?: any,
	burgerButtonLink?:any,
	backgroundColor?:string, 
}

const defaultNavProps : NavProps = {
	appName: 'Example App',
	appNameLink: '/',
  	showAppLogo: false,
  	showHistoryButton: false,
	showSettingsButton: false,
}

export const NavBar = (props = defaultNavProps) => {

  	return(
	<div>
		<nav
			style={{
				backgroundColor: props.backgroundColor ? props.backgroundColor : ''
			}}
			className={'fixed w-full h-24 flex flex-wrap items-center justify-between py-3 shadow-lg navbar navbar-expand-lg navbar-light z-20' + (props.backgroundColor ? '' : ' bg-bsk_opp')} >
			<base href='/'></base>
			<div className='flex-grow items-center flex justify-between'>
				{
					props.showAppLogo && props.appLogoLink ?
					(<Link to={props.appLogoLink}>
						<img src={props.appLogoPath} alt='mygpt_logo' loading='lazy' className='object-cover h-16 w-22 inline-block justify-start ml-5'/>
					</Link>) : 
					props.showAppLogo && props.appLogoExternalLink?
					(<a href={props.appLogoExternalLink} rel='noreferrer'>
						<img src={props.appLogoPath} alt='mygpt_logo' loading='lazy' className='object-cover h-16 w-22 inline-block justify-start ml-5'/>
					</a>) :
					props.showAppLogo ?
					(<Link to='/'>
						<img src={props.appLogoPath} alt='mygpt_logo' loading='lazy' className='object-cover h-16 w-22 inline-block justify-start ml-5'/>
					</Link>) :
					(<div></div>)
				}
				<Link to={props.appNameLink || '/' }>
					<span className='text-4xl text-white p-2 m-1 font-semibold inline-block'>{props.appName}</span>
				</Link>
				<div>
					{	
						props.showHistoryButton ?
						(
							<button className='object-cover text-white bg-bsk_opp_darker rounded-full p-2 inline-block m-2 hover:drop-shadow-sm transition ease-in-out hover:bg-panel1'>
								<ArchiveBoxIcon className='h-6 w-6'/>
							</button>
						) : (<></>)
					}
					{
						props.showSettingsButton ?
						(
							<button className='object-cover text-white bg-bsk_opp_darker rounded-full p-2 inline-block ml-2 mr-8 hover:drop-shadow-sm transition ease-in-out hover:bg-panel1'
								onClick={props.settingButtonCallback}
							>
								<Cog6ToothIcon className='h-6 w-6'/>
							</button>
						) : (<></>)
					}
				</div>
			</div>
		</nav>
	</div>
  	)	
}