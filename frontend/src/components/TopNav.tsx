import { useEffect, useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { NavBar } from './NavBar'
import useAuthenticateUser from '../hooks/useAuthenticateUser'

function TopNav(props:{
  setShowSettings:any,
  setShowChatHistory:any,
  setPlotButton:any,
  restrictions?:any,
  showLoginButton?:boolean,
  showPopupLogin?:boolean,
  loginCallback?:any,
  darkMode?:boolean,
  darkModeCallback?:any
}) {

  const { activeAccounts, appRoles, instance }:any = useAuthenticateUser()
	const userAuthenticated = activeAccounts && activeAccounts.length && activeAccounts[0].name ? true : false
	const [isAdmin, setIsAdmin] = useState(false)
  const [djangoAuthenticated, setDjangoAuthenticated] = useState(false)
  const [djangoUser, setDjangoUser]:any = useState({})

  useEffect(()=>{
    // if access_token is present, get user info
    if (localStorage.getItem('access')) {
      const requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${process.env.NODE_ENV === 'production' ? process.env.REACT_APP_AUTH_TOKEN_PROD : process.env.REACT_APP_AUTH_TOKEN_DEV}`
        },
        body: JSON.stringify({
          'access_token': localStorage.getItem('access')
        })
      }


      fetch(`${process.env.REACT_APP_BACKEND_API}api/get_username/?format=json`, requestOptions)
        .then(response => {
          if (response.status === 401) {
            localStorage.removeItem('access')
            return { 'user': null }
          }
          else
          return response.json()
        })
        .then(data => {
          if (data.username && data.username.length > 0) {
            const user = { 'user': data.username, 'user_email': data.user_email, 'user_group': data.user_group }
            setDjangoAuthenticated(true)
            setDjangoUser(user)
          }
        })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  useEffect(()=>{
		if (activeAccounts && activeAccounts.length && appRoles && appRoles.length) {
			if (appRoles.includes('MyGPTAdmin')) {
				setIsAdmin(true)
			}
		}}, [activeAccounts, appRoles])

    useEffect(() => {
      if (userAuthenticated) {
        const user = { 
          'user': activeAccounts[0].name, 
          'user_email':  activeAccounts[0].username ,
          'isAdmin': isAdmin, 
          'otherRoles': appRoles.filter((role:any) => role !== 'MyGPTAdmin') 
        }
        props.loginCallback(user)
      } else if (djangoAuthenticated && djangoUser.user) {
        props.loginCallback(djangoUser)
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userAuthenticated, djangoAuthenticated])

  return (
    <>
      <BrowserRouter>
        <NavBar 
            appName={'MyGPT'}
            appNameLink = {'/'}
            showAppLogo = {true}
            appLogoPath = {'./mygpt_logo_color_dark.png'}
            // appLogoLink = {'/'}
            showPlotButton = {false}
            plotButtonCallback = {() => {props.setPlotButton(true)}}
            // showHistoryButton = {props.restrictions && (djangoAuthenticated || userAuthenticated) ? true : !props.restrictions ? true : false}
            showHistoryButton = {true}
            historyButtonCallback = {() => {props.setShowChatHistory(true)}}
            showSettingsButton = {props.restrictions && (djangoAuthenticated || userAuthenticated) ? true : !props.restrictions ? true : false}
            settingButtonCallback = {() => {props.setShowSettings(true)}}
            backgroundColor={'#2A4759'}
            showLoginButton={props.showLoginButton}
            showPopupLogin={props.showPopupLogin}
            loginInstance={instance}
				    loginAccounts={activeAccounts}
				    isAuthenticated={userAuthenticated || djangoAuthenticated}
            djangoUser={djangoUser}
            isAdmin={isAdmin}
            darkMode={props.darkMode}
            darkModeCallback={props.darkModeCallback}
          />
      </BrowserRouter>
    </>
  )
}

export default TopNav 