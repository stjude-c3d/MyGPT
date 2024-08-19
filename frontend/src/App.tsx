import '../src/App.css'
import { useState, useEffect } from 'react'
import TopNav from './components/TopNav'
import GPTHome from './components/GPTHome'
import Settings from './components/Settings'
import defaultSettings from './utils/DefaultState'
import ChatHistory from './components/ChatHistory'
import Disclaimer from './components/Disclaimer'
// import Plots from './components/Plots'
import { PublicClientApplication } from '@azure/msal-browser'
import { MsalProvider } from '@azure/msal-react'
import { msalConfig } from './utils/authConfigEnv'

const msalInstance = new PublicClientApplication(msalConfig)

const default_frontend_settings = {
  'show_no_context_switch': false,
  'azure_login': false, 
  'django_login': false,
  'restriction_without_login': false,
  'disable_chat_without_login': false,
}

function App() {  
  const [currentSettings, setCurrentSettings] = useState(defaultSettings)
  const [showSettings, setShowSettings] = useState(currentSettings.showSettings || defaultSettings.showSettings)

  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const [forceopenDisclaimer, setForceOpenDisclaimer] = useState(false)

  const [showChatHistory, setShowChatHistory] = useState(false)
  const [showPlotButton, setShowPlotButton] = useState(false)
  const [frontendSettings, setFrontendSettings] = useState<any>(default_frontend_settings)
  const [user, setUser] = useState<any>(null)

  const settingsCallback = (newSettings:any) => {
    newSettings.restriction_without_login = frontendSettings.restriction_without_login
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
        if (data.settings.django_login)
          setShowDisclaimer(true)
			})
	},[])

  //  set currentsettings login to true
  useEffect(()=>{
    if (user && user.user.length > 0 && currentSettings.loggedin === false) {
      setCurrentSettings({...currentSettings, loggedin:true})
    }
  }, [user, currentSettings])

  // get datasets when user login
  useEffect(()=>{
    if (user && user.user_email && user.user_email.length > 0 && currentSettings.fetchDatasets === true) {
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
    frontendSettings.django_login ?
    <div className='bg-gray-200'>
      <TopNav 
        setShowSettings={setShowSettings} 
        setShowChatHistory={setShowChatHistory} 
        setPlotButton={setShowPlotButton}
        showPopupLogin={frontendSettings.django_login}
        showLoginButton={frontendSettings.django_login}
        loginCallback={loginCallback}
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
        /> : <></>
      }
      {showPlotButton ?
        // <Plots
        //   closePlots={() => setShowPlotButton(false)}
        //   datasets = {currentSettings.datasets}   
        // />
        <></> : <></>
      }
      {showDisclaimer ?
        <Disclaimer
          disclaimerText={defaultSettings.disclaimer_text}
          showAgreementButton={currentSettings.loggedin} 
          closeDisclaimer={() => setShowDisclaimer(false)}
          forceOpenDisclaimer={forceopenDisclaimer}
        /> :
        <></>
      }
      <GPTHome currentSettings={currentSettings} settingsCallback={settingsCallback} frontendSettings={frontendSettings}/>
    </div>
    :
    <div className='bg-gray-200'>
      <TopNav 
        setShowSettings={setShowSettings}
        setPlotButton={setShowPlotButton} 
        setShowChatHistory={setShowChatHistory} 
        showLoginButton={frontendSettings.azure_login}
        loginCallback={()=>{}}
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
  <div className='flex justify-between text-nav bg-[#2A4759] my-auto py-4 h-[6vh]'>
    <div className='text-sm text-white mx-8 my-auto'>
      {/* <p className='inline-block mx-2'>Designed by </p> */}
      <img src={process.env.PUBLIC_URL + '/stjude-logo-child.png'} alt='St. Jude logo' className='h-[3vh] inline-block'/>
      <p className='inline-block mx-2'>St. Jude Children's Research Hospital</p>
    </div>
    { frontendSettings.django_login ?
      <div className='text-sm text-white mx-8 my-auto cursor-pointer'>
        <div onClick={()=>{
          setForceOpenDisclaimer(true)
          setShowDisclaimer(!showDisclaimer)
        }}>Disclaimer</div>
        </div> : <></>}
    {
      !frontendSettings.django_login ?
      <div className='text-sm text-white mx-8 my-auto'>
        <a href='https://form.asana.com/?k=rHXv4eSjiOICn2Ln1p1H_Q&d=12574667816162' target='_blank' rel='noreferrer'>feedback</a>
      </div> : <></>
    }
	</div>
  </>
  )
}

export default App
