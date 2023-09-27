import * as React from 'react'
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
	appLogoLink?: any,
	appLogoExternalLink?: any,
	showBurgerButton?: boolean,
	burgerImagePath?: any,
	burgerButtonLink?:any,
	backgroundColor?:string, 
	showLoginButton?: boolean,
	loginInstance?: any,
	loginAccounts?: any,
	isAuthenticated?: boolean,
}

const defaultNavProps : NavProps = {
	appName: 'Example App',
	appNameLink: '/',
  	showAppLogo: false,
  	showBurgerButton: false
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
			postLogoutRedirectUri: '/',
		});
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
				{
					props.showAppLogo && props.appLogoLink ?
					(<Link to={props.appLogoLink}>
						<img src={props.appLogoPath} alt='' loading='lazy' className='object-cover h-16 w-22 inline-block justify-start ml-5'/>
					</Link>) : 
					props.showAppLogo && props.appLogoExternalLink?
					(<a href={props.appLogoExternalLink} rel='noreferrer'>
						<img src={props.appLogoPath} alt='' loading='lazy' className='object-cover h-16 w-22 inline-block justify-start ml-5'/>
					</a>) :
					props.showAppLogo ?
					(<Link to='/'>
						<img src={props.appLogoPath} alt='' loading='lazy' className='object-cover h-16 w-22 inline-block justify-start ml-5'/>
					</Link>) :
					(<div></div>)
				}
				<Link to={props.appNameLink || '/' }>
					<span className='text-4xl text-white p-2 m-1 font-semibold inline-block'>{props.appName}</span>
				</Link>
				{	
					props.showBurgerButton && !props.showLoginButton ?
					(<Link to={props.burgerButtonLink}>
						<img src={props.burgerImagePath} alt='' loading='lazy' className='object-cover h-5 inline-block float-right m-5 mr-12'/>
					</Link>) : (<></>)
				}
				{	
				  props.showLoginButton && !props.showBurgerButton && props.isAuthenticated ?
				  (<Link to='/'>
					<button className='object-cover text-white bg-bsk_opp_darker rounded-full p-8 py-2 inline-block mr-8 ml-12 hover:drop-shadow-sm' 
						onClick={() => showLogoutMenu()}>
							{props.loginAccounts.length && props.loginAccounts[0].name?.split(',')[1]}
					</button>
				  </Link>) : 
				  props.showLoginButton && !props.showBurgerButton && !props.isAuthenticated ?
				  (<Link to='/'>
					<button className='object-cover text-white bg-bsk_opp_darker rounded-full px-8 py-2 inline-block mr-8 ml-12 hover:drop-shadow-sm' 
						onClick={() => handleLogin()}>
							Login
					</button>
				  </Link>)  : (<></>)
			}
			{ !props.showBurgerButton && !props.showLoginButton ? <div></div> : <></>}
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