import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Cog6ToothIcon, InboxIcon, ChartBarSquareIcon } from '@heroicons/react/24/outline'

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
	showPopupLogin?: boolean,
	loginInstance?: any,
	loginAccounts?: any,
	isAuthenticated?: boolean,
	djangoUser?: any,
	isAdmin?: boolean,
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

		if (props.showPopupLogin) {
			showDjangoLoginMenu()
			return
		}
		props.loginInstance.loginRedirect(loginRequest).catch((e:any) => {
			console.log(e);
		});
    }

	const handleLogout = () => {

		if (props.djangoUser && props.showPopupLogin) {

			const requestOptions = {
				method: 'POST',
				headers: { 
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${localStorage.getItem('access')}`
				 },
				body: JSON.stringify({ 'refresh_token': localStorage.getItem('refresh') })
			}
			fetch(`${process.env.REACT_APP_BACKEND_API}logout/`, requestOptions)
			.then(response => {
				if (response.status === 204) {
					console.log('Logged out successfully')
				}
			})

			setDjangoLoggedIn(false)
			setUsername('')
			setPassword('')
			// remove access tokens
			localStorage.removeItem('access')
			localStorage.removeItem('refresh')
			setShowLogout(false)
			window.location.reload()
			return
		}

		props.loginInstance.logoutRedirect({
			postLogoutRedirectUri: '/',
		});
		localStorage.clear()
	}

	const showLogoutMenu = () => {
		if(!showLogout) setShowLogout(true)
		else setShowLogout(false)
	}

	const [showDjangoLogin, setShowDjangoLogin] = useState(false)
	const [djangoLoggedIn, setDjangoLoggedIn] = useState(false)
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')

	const showDjangoLoginMenu = () => {
		if(!showDjangoLogin) setShowDjangoLogin(true)
		else setShowDjangoLogin(false)
	}

	const AttemptDhagoLogin = () => {
		const data = {
			'username': username,
			'password': password
		}

		fetch(`${process.env.REACT_APP_BACKEND_API}token/`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data)
		})
		.then(response => response.json())
		.then(data => {
			localStorage.setItem('access', data.access)
			localStorage.setItem('refresh', data.refresh)
			setShowDjangoLogin(false)
			setDjangoLoggedIn(true)
			window.location.reload()
		})
		.catch((error) => {
			console.error('Error:', error)
		})
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
						props.showPlotButton ?
						(
							<button className='object-cover text-white bg-bsk_opp_darker rounded-full p-2 inline-block ml-2 hover:drop-shadow-sm transition ease-in-out hover:bg-panel1'
								onClick={props.plotButtonCallback}
							>
								<ChartBarSquareIcon className='h-6 w-6'/>
							</button>
						) : (<></>)
					}
					{	
						props.showHistoryButton ?
						(
							<button className='object-cover text-white bg-bsk_opp_darker rounded-full p-2 inline-block ml-2 hover:drop-shadow-sm transition ease-in-out hover:bg-panel1'
								onClick={props.historyButtonCallback}
							>
								<InboxIcon className='h-6 w-6'/>
							</button>
						) : (<></>)
					}
					{
						props.showSettingsButton ?
						(
							<button className='object-cover text-white bg-bsk_opp_darker rounded-full p-2 inline-block mx-2 hover:drop-shadow-sm transition ease-in-out hover:bg-panel1'
								onClick={props.settingButtonCallback}
							>
								<Cog6ToothIcon className='h-6 w-6'/>
							</button>
						) : (<></>)
					}
					{	
						props.showLoginButton && props.isAuthenticated && !props.showPopupLogin ?
						(<Link to='/'>
							<button className='object-cover text-white bg-panel1 rounded-full p-8 py-2 inline-block hover:drop-shadow-sm hover:bg-panel2 hover:text-nav' 
								onClick={() => showLogoutMenu()}>
									{props.loginAccounts && props.loginAccounts.length && props.loginAccounts[0].name?.split(',')[1]}
							</button>
						</Link>) 
						: (djangoLoggedIn && username) || (props.isAuthenticated && props.djangoUser) ?
						(<Link to='/'>
							<button className='object-cover text-white bg-panel1 rounded-full p-8 py-2 inline-block hover:drop-shadow-sm hover:bg-panel2 hover:text-nav' 
								onClick={() => showLogoutMenu()}>
									{
										djangoLoggedIn && username ? username : (props.isAuthenticated && props.djangoUser) ? 
										props.djangoUser.user : '' 
									}
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
			showDjangoLogin && props.showPopupLogin  ? (
				<div className='mt-24 py-2 fixed bg-bsk_blue right-0 z-20'>
					<div className='flex flex-col'>
						<input type='text' className='object-cover text-bsk_dark_blue rounded-md h-[50px] w-[200px] px-2 mx-4 my-2 hover:bolder'
							onChange={(e) => setUsername(e.target.value)}
							placeholder='Username'/>
						<input type='password' className='object-cover text-bsk_dark_blue rounded-md h-[50px] w-[200px] px-2 mx-4 my-2 hover:bolder'
							onChange={(e) => setPassword(e.target.value)}
							placeholder='Password'/>
						<button className='object-cover bg-panel1 text-panel3 rounded-full h-[50px] w-[100px] mx-auto hover:bolder'
							onClick={() => AttemptDhagoLogin()}>
							Login
						</button>
					</div>
				</div>
			) : null
		}
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