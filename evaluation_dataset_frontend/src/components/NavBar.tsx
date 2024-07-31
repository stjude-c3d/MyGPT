import { useState } from 'react'
import { Link } from 'react-router-dom'

// -----------------------------//
// Top Navigation with app name //
// -----------------------------//

interface NavProps {
	appName: string,
	appNameLink?: any,
	showAppLogo?: boolean,
	appLogoPath?: string,
	appLogoExternalLink?: any,
	showPlotButton?: boolean,
	plotButtonCallback?: any,
	showHistoryButton?: boolean,
	historyButtonCallback?: any,
	showSettingsButton?: boolean,
	settingButtonCallback?: any,
	burgerImagePath?: any,
	burgerButtonLink?:any,
	backgroundColor?:string,
	showLoginButton?: boolean,
	loginInstance?: any,
	loginAccounts?: any,
	isAuthenticated?: boolean,
	isAdmin?: boolean,
	isReviewer?: boolean,
}

const defaultNavProps : NavProps = {
	appName: 'Example App',
	appNameLink: '/',
  	showAppLogo: false,
  	showHistoryButton: false,
	showSettingsButton: false,
	showLoginButton: false,
}

export const NavBar = (props = defaultNavProps) => {

	const [showLogout, setShowLogout] = useState(false)
	const loginRequest = {
		scopes: ['User.Read']
	}

	const handleLogin = () => {
		props.loginInstance.loginRedirect(loginRequest).catch((e:any) => {
			console.log(e);
		});
    }

	const handleLogout = () => {
		props.loginInstance.logoutRedirect({
			postLogoutRedirectUri: '/dataset',
		});
		localStorage.clear()
	}

	const showLogoutMenu = () => {
		if(!showLogout) setShowLogout(true)
		else setShowLogout(false)
	}

  	return(
	<div>
		<nav
			style={{
				backgroundColor: props.backgroundColor ? props.backgroundColor : ''
			}}
			className={'fixed w-full h-24 flex flex-wrap items-center justify-between py-3 shadow-lg navbar navbar-expand-lg navbar-light z-20' + (props.backgroundColor ? '' : ' bg-bsk_opp')} >
			<base href='/'></base>
			<div className='flex-grow items-center flex justify-between'>
				<div className='flex flex-row mx-8'>
					<div>
					{
						props.showAppLogo ?
						(<Link to='/'>
							<img src={props.appLogoPath} alt='mygpt_logo' loading='lazy' className='object-cover h-16 w-22 inline-block justify-start'/>
						</Link>) :
						(<div></div>)
					}
					</div>
					<div className='mx-4 my-auto font-display'>
						<Link to={props.appNameLink || '/' }>
							<span className='text-4xl text-white p-2 inline-block'>{props.appName}</span>
						</Link>
					</div>
				</div>
				<div className='flex flex-row mx-6'>
					{	
						props.showLoginButton && props.isAuthenticated ?
						(<Link to='/'>
							<button className='object-cover text-white bg-panel1 rounded-full p-8 py-2 inline-block hover:drop-shadow-sm hover:bg-panel2 hover:text-nav' 
								onClick={() => showLogoutMenu()}>
									{props.loginAccounts.length && props.loginAccounts[0].name?.split(',')[1]}
							</button>
						</Link>) : 
						props.showLoginButton && !props.isAuthenticated ?
						(<Link to='/'>
							<button className='object-cover text-white bg-panel1 rounded-full px-8 py-2 inline-block hover:drop-shadow-sm  hover:bg-panel2 hover:text-nav' 
								onClick={() => handleLogin()}>
									Login
							</button>
						</Link>)  : (<></>)
					}
				</div>
			</div>
		</nav>
		{
			showLogout ? (
				<div className='mt-24 py-2 fixed bg-bsk_blue right-0 z-20'>
					<button className='object-cover text-bsk_dark_blue rounded-full h-[50px] w-[100px] inline-block mr-8 ml-12 hover:bolder'
						onClick={() => handleLogout()}>
						Logout
					</button>
				</div>
			) : null
		}
	</div>
  	)	
}