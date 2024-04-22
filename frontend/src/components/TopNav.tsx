import { useEffect, useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { NavBar } from './NavBar'
import useAuthenticateUser from '../hooks/useAuthenticateUser'

function TopNav(props:{
  setShowSettings:any,
  setShowChatHistory:any,
  showLoginButton?:boolean,
  loginCallback?:any,
}) {

  const { activeAccounts, appRoles, instance }:any = useAuthenticateUser()
	const userAuthenticated = activeAccounts && activeAccounts.length && activeAccounts[0].name ? true : false
	const [isAdmin, setIsAdmin] = useState(false)

  useEffect(()=>{
		if (activeAccounts && activeAccounts.length && appRoles && appRoles.length) {
			if (appRoles.includes('MyGPTAdmin')) {
				setIsAdmin(true)
			}
		}}, [activeAccounts, appRoles])

    useEffect(() => {
      if (userAuthenticated) {
        const user = { 'user': activeAccounts[0].name, 'user_email':  activeAccounts[0].username ,'isAdmin': isAdmin}
        props.loginCallback(user)
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userAuthenticated])

  return (
    <>
      <BrowserRouter>
        <NavBar 
            appName={'MyGPT'}
            appNameLink = {'/'}
            showAppLogo = {true}
            appLogoPath = {'./mygpt_logo.png'}
            // appLogoLink = {'/'}
            showHistoryButton = {true}
            historyButtonCallback = {() => {props.setShowChatHistory(true)}}
            showSettingsButton = {true}
            settingButtonCallback = {() => {props.setShowSettings(true)}}
            backgroundColor={'#2A4759'}
            showLoginButton={props.showLoginButton}
            loginInstance={instance}
				    loginAccounts={activeAccounts}
				    isAuthenticated={userAuthenticated}
            isAdmin={isAdmin}
          />
      </BrowserRouter>
    </>
  )
}

export default TopNav