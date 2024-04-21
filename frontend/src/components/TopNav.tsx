import { BrowserRouter } from 'react-router-dom'
import { NavBar } from './NavBar'

function TopNav(props:{
  setShowSettings:any,
  setShowChatHistory:any
}) {

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
          />
      </BrowserRouter>
    </>
  )
}

export default TopNav