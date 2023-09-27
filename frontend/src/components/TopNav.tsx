import { BrowserRouter } from 'react-router-dom'
import { NavBar } from './NavBar'

function TopNav() {

  return (
    <>
      <BrowserRouter>
        <NavBar 
            appName={'MyGPT'}
            appNameLink = {'/'}
            showAppLogo = {false}
            // appLogoPath = {'./BlueSky_Kinase_logo.png'}
            // appLogoLink = {'/'}
            showBurgerButton = {false}
            burgerImagePath = {'./burger-button.png'}
            burgerButtonLink ={'/'}
            backgroundColor={'#2A4759'}
          />
      </BrowserRouter>
    </>
  )
}

export default TopNav