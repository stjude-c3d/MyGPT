import '../src/App.css'
import { useState, useEffect } from 'react'
import GPTHome from './components/GPTHome'
import TopNav from './components/TopNav'
// import Plots from './components/Plots'
import { PublicClientApplication } from '@azure/msal-browser'
import { MsalProvider } from '@azure/msal-react'
import { msalConfig } from './utils/authConfigEnv'

const msalInstance = new PublicClientApplication(msalConfig)

const default_frontend_settings = {
  'show_no_context_switch': false,
  'azure_login': false, 
  'restriction_without_login': false,
}

function App() {  
  const [frontendSettings, setFrontendSettings] = useState<any>(default_frontend_settings)


  useEffect(()=>{
		const requestOptions = {
			method: 'GET',
			headers: { 
				'Content-Type': 'application/json'
			}
		}
		fetch(`${process.env.REACT_APP_BACKEND_API}api/frontend_settings/?format=json`, requestOptions)
			.then(response => response.json())
			.then(data => {
				setFrontendSettings(data.settings)
			})
	},[])


  return (
    <>
    { frontendSettings.azure_login ?
      <MsalProvider instance={msalInstance}>
        <div className='bg-gray-200 overflow-auto'>
        <TopNav 
          setShowSettings={()=>{}} 
          setShowChatHistory={()=>{}} 
          setPlotButton={()=>{}}
          showLoginButton={true}
          loginCallback={()=>{}}
        />
        <GPTHome/>
        </div>
      </MsalProvider>
    :
    <div className='bg-gray-200'>
      <GPTHome/>
    </div>
  }
  {/* add footer */}
  <div className='flex justify-between text-nav bg-[#2A4759] my-auto py-4 h-[6vh]'>
    <div className='text-sm text-white mx-8 my-auto'>
      {/* <p className='inline-block mx-2'>Designed by </p> */}
      <img src={process.env.PUBLIC_URL + '/stjude-logo-child.png'} alt='St. Jude logo' className='h-[3vh] inline-block'/>
      <p className='inline-block mx-2'>St. Jude Children's Research Hospital</p>
    </div>
    <div className='text-sm text-white mx-8 my-auto'>
      <a href='https://form.asana.com/?k=rHXv4eSjiOICn2Ln1p1H_Q&d=12574667816162' target='_blank' rel='noreferrer'>feedback</a>
    </div>
	</div>
  </>
  )
}

export default App
