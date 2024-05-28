import '../src/App.css'
import { useState, useEffect } from 'react'
import TopNav from './components/TopNav'
import GPTHome from './components/GPTHome'
import Settings from './components/Settings'
import defaultSettings from './utils/DefaultState'
import ChatHistory from './components/ChatHistory'
// import Plots from './components/Plots'
import { PublicClientApplication } from '@azure/msal-browser'
import { MsalProvider } from '@azure/msal-react'
import { msalConfig } from './utils/authConfigEnv'

const msalInstance = new PublicClientApplication(msalConfig)

const default_frontend_settings = {
  'show_no_context_switch': false,
  'azure_login': false
}

function App() {  
  const [currentSettings, setCurrentSettings] = useState(defaultSettings)
  const [showSettings, setShowSettings] = useState(currentSettings.showSettings || defaultSettings.showSettings)

  const [showChatHistory, setShowChatHistory] = useState(false)
  const [showPlotButton, setShowPlotButton] = useState(false)
  const [frontendSettings, setFrontendSettings] = useState<any>(default_frontend_settings)
  const [user, setUser] = useState<any>(null)

  const settingsCallback = (newSettings:any) => {
    setCurrentSettings(newSettings)
    if (newSettings.showSettings){
      setShowSettings(newSettings.showSettings)
    }
  }

  const loginCallback = (user:any) => {
    setUser(user)
    currentSettings.fetchDatasets = true
  }

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

  // get datasets when user login
  useEffect(()=>{
    if (user && user.user_email.length > 0 && currentSettings.fetchDatasets === true) {
        const requestOptions = {
          method: 'POST',
          headers: { 
            'Content-Type': 'application',
            'Authorization': `${process.env.NODE_ENV === 'production' ? process.env.REACT_APP_AUTH_TOKEN_PROD : process.env.REACT_APP_AUTH_TOKEN_DEV}`
          },
          body: JSON.stringify({
            'user_email': user.user_email
          })
        }
        fetch(`${process.env.REACT_APP_BACKEND_API}api/get_datasets/?format=json`, requestOptions)
          .then(response => response.json())
          .then(data => {
            setCurrentSettings({...currentSettings, datasets:data.map((d:any)=>d.dataset_name), selectedDataset:data[0].dataset_name, fetchDatasets:false})
          })
        } 
        else if ((currentSettings.selectedDataset === 'None' || currentSettings.datasetsUpdated === true) && currentSettings.fetchDatasets === true) {
          const requestOptions = {
            method: 'POST',
            headers: { 
              'Content-Type': 'application',
              'Authorization': `${process.env.NODE_ENV === 'production' ? process.env.REACT_APP_AUTH_TOKEN_PROD : process.env.REACT_APP_AUTH_TOKEN_DEV}`
            },
            body: JSON.stringify({
              'user_email': ''
            })
          }
            fetch(`${process.env.REACT_APP_BACKEND_API}api/get_datasets/?format=json`, requestOptions)
              .then(response => response.json())
              .then(data => {
                if(data.length > 0)
                  setCurrentSettings({...currentSettings, datasets:data.map((d:any)=>d.dataset_name), selectedDataset:data[0].dataset_name, fetchDatasets:false, datasetsUpdated:false})
            })
        }
    }, [user, currentSettings])

  return (
    <>
    { frontendSettings.azure_login ?
      <MsalProvider instance={msalInstance}>
        <div className='bg-gray-200'>
        <TopNav 
          setShowSettings={setShowSettings} 
          setShowChatHistory={setShowChatHistory} 
          setPlotButton={setShowPlotButton}
          showLoginButton={frontendSettings.azure_login}
          loginCallback={loginCallback}
        />
        {showSettings ?
          <Settings 
            closeSettings={() => setShowSettings(false)} 
            defaultSettings={defaultSettings} 
            currentSettings={currentSettings}
            settingsCallback={settingsCallback}
            user={user}
          /> 
          : <></>}
        {showChatHistory ? 
          <ChatHistory
            closeChatHistory={() => setShowChatHistory(false)}
            dataset = {currentSettings.selectedDataset}
            datasets = {currentSettings.datasets} 
          /> : <></>
        }
        {showPlotButton ?
            // <Plots
            //   closePlots={() => setShowPlotButton(false)}
            //   datasets = {currentSettings.datasets}   
            // />
            <></> : <></>
          }
        <GPTHome currentSettings={currentSettings} settingsCallback={settingsCallback} frontendSettings={frontendSettings}/>
        </div>
      </MsalProvider>
    :
    <div className='bg-gray-200'>
      <TopNav 
        setShowSettings={setShowSettings}
        setPlotButton={setShowPlotButton} 
        setShowChatHistory={setShowChatHistory} 
        showLoginButton={frontendSettings.azure_login}
      />
      {showSettings ?
        <Settings 
          closeSettings={() => setShowSettings(false)} 
          defaultSettings={defaultSettings} 
          currentSettings={currentSettings}
          settingsCallback={settingsCallback}
        /> 
        : <></>}
      {showChatHistory ? 
        <ChatHistory
          closeChatHistory={() => setShowChatHistory(false)}
          dataset = {currentSettings.selectedDataset}
          datasets = {currentSettings.datasets} 
        /> : <></>}
      <GPTHome currentSettings={currentSettings} settingsCallback={settingsCallback} frontendSettings={frontendSettings}/>
    </div>
  }
  {/* add footer */}
  <div className='col-span-10 text-center text-xs text-nav bg-[#2A4759] my-auto py-4 h-[6vh]'>
				<div className='text-center text-sm text-white'>
					{/* <p className='inline-block mx-2'>Designed by </p> */}
					<img src={process.env.PUBLIC_URL + '/stjude-logo-child.png'} alt='St. Jude logo' className='h-[3vh] inline-block'/>
          <p className='inline-block mx-2'>St. Jude Children's Research Hospital</p>
				</div>
			</div>
  </>
  )
}

export default App
