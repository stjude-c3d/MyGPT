import { BrowserRouter } from 'react-router-dom'
import { NavBar } from './NavBar'

function TopNav() {

  return (
    <>
      <BrowserRouter>
        <NavBar 
            appName={'MyGPT'}
            appNameLink = {'/'}
            showAppLogo = {true}
            appLogoPath = {'./stjude-logo-child.png'}
            // appLogoLink = {'/'}
            showHistoryButton = {true}
            showSettingsButton = {true}
            backgroundColor={'#2A4759'}
          />
      </BrowserRouter>
    </>
  )
}

export default TopNav