import '../src/App.css'
import { useState } from 'react'
import TopNav from './components/TopNav'
import GPTHome from './components/GPTHome'
import Settings from './components/Settings'
import defaultSettings from './utils/DefaultState'

function App() {  
  const [currentSettings, setCurrentSettings] = useState(defaultSettings);
  const [showSettings, setShowSettings] = useState(currentSettings.showSettings || defaultSettings.showSettings);

  const settingsCallback = (newSettings:any) => {
    setCurrentSettings(newSettings)
    if (newSettings.showSettings){
      setShowSettings(newSettings.showSettings)
    }
  }

  // useEffect(()=>{
  //   setShowSettings(currentSettings.showSettings)
  // },[currentSettings.showSettings])

  return (
   <div className='bg-gray-200'>
    <TopNav setShowSettings={setShowSettings}/>
    {showSettings ?
      <Settings 
        closeSettings={() => setShowSettings(false)} 
        defaultSettings={defaultSettings} 
        currentSettings={currentSettings}
        settingsCallback={settingsCallback}
      /> 
      : <></>}
    <GPTHome currentSettings={currentSettings} settingsCallback={settingsCallback}/>
  </div>
  )
}

export default App
