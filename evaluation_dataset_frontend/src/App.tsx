import { BrowserRouter, Routes, Route } from 'react-router-dom'
import '../src/App.css'
import GPTHome from './components/DatasetHome'
import TopNav from './components/TopNav'

function App() {  

  return (
    <BrowserRouter basename='/dataset'>
      <Routes>
        <Route path='/' element={
          <>
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
  }/>
  </Routes>
  </BrowserRouter>
  )
}

export default App
