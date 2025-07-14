import { useState, useEffect } from 'react'
import { Client } from '@modelcontextprotocol/sdk/client/index'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse'

const MCPClient = (props:{
  currentSettings:any,
  settingsCallback:any
}) => {

   // get tools from the client
  const [tools, setTools]:any = useState([])
  const [connected, setConnected] = useState(false)
  const [serverName, setServerName] = useState('')
  const [selectedTools, setSelectedTools]:any = useState([])
  // const [toolResult, setToolResult]:any = useState('')
  // const [client, setClient] = useState(new Client({
  //   name: 'MyGPT-MCP-Client',
  //   description: 'A client for MyGPT using Model Context Protocol',
  //   version: '0.1.0',
  // }))
  
  const currentSettings = props.currentSettings
  const transport = new SSEClientTransport(new URL(process.env.REACT_APP_MCP_SERVER_URL || 'http://localhost:5001/sse'))
  const client:any = new Client({
    name: 'MyGPT-MCP-Client',
    description: 'A client for MyGPT using Model Context Protocol',
    version: '0.1.0',
    transport: transport
  })

  useEffect(() => {

    if (!connected) {
      // const transport = new SSEClientTransport(new URL(serverURL))
      
      // const client = new Client({
      //   name: 'MyGPT-MCP-Client',
      //   description: 'A client for MyGPT using Model Context Protocol',
      //   version: '0.1.0',
      //   transport: transport
      // })

    // update transport when serverURL changes
    const connectToServer = async () => {
        // console.log('Connecting to MCP server at:', serverURL)
        try {
          await client.connect(transport)
          // get server name
          const serverInfo = client._serverVersion
          setServerName(serverInfo.name || 'MCP Server')
          console.log('MCP Client connected successfully')
          setConnected(true)
        } catch (error) {
          console.error('Error connecting to MCP server:', error)
          setConnected(false)
        }

        try{
          const toolsList:any = await client.listTools()
          console.log('Fetched tools:', toolsList)
          setTools(toolsList['tools'] || [])
        } catch (error) {
          console.error('Error fetching tools:', error)
          setTools([])
        }
      }

    // const fetchTools = async () => {
    //   try {
    //     // await client.connect(transport)
    //     // console.log('MCP Client connected successfully')
    //     const toolsList:any = await client.listTools()
    //     setTools(toolsList['tools'] || [])
    //   } catch (error) {
    //     console.error('Error fetching tools:', error)
    //   }
    // }

    
      connectToServer()
      // fetchTools()
      // setConnected(true)
      // setClient(clinet)
      // console.log('MCP Client transport updated with URL:', serverURL)  
  }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected])

  useEffect(() => {
    if (selectedTools.length > 0) {
      props.currentSettings.MCP_tools = selectedTools
    }
    const runSelectedTools = async () => {
      await client.connect(transport)
      props.settingsCallback({
        ...currentSettings,
        MCPTools: selectedTools,
        MCPClient: client,
      })
    }
    runSelectedTools()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[selectedTools])
  
  // useEffect(() => {
    
  //   const fetchTools = async () => {
  //     try {
  
  //       await client.connect(transport)
  //       console.log('MCP Client connected successfully')

  //       const toolsList:any = await client.listTools()
  //       setTools(toolsList['tools'] || [])
  //     } catch (error) {
  //       console.error('Error fetching tools:', error)
  //     }
  //   }
  //   fetchTools()
  // // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [serverURL, connected])

  // console.log('MCP Client connected with tools:', tools)

  // useEffect(() => {
  //   if (selectedTools.length > 0) {
  //     const runSelectedTools = async () => {
  //       try {
  //         await client.connect(transport)
  //         console.log('MCP Client connected successfully')
  //         const results = await Promise.all(selectedTools.map(async (tool:any) => {
  //           const result = await client.callTool({
  //             name: tool['name'],
  //             arguments: {user_email: 'jpatel2@stjude.org'},
  //           })
  //           return { name: tool, result: result['structuredContent'] }
  //         }))
  //         setToolResult(JSON.stringify(results, null, 2))
  //       } catch (error:any) {
  //         console.error('Error running selected tools:', error)
  //         setToolResult('Error running selected tools: ' + error.message)
  //       }
  //     }
  //     runSelectedTools()
  //   } else {
  //     setToolResult('')
  //   }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [selectedTools])

  return (
    <div className='text-white text-lg font-semibold'>
      <h2 className='text-nav dark:text-nav-dark px-2 flex justify-start my-2 font-semibold'>MCP Server configuration</h2>
      {/* add place to input server url and connect button, once connected show server name and success message */}
      <div className='px-4 py-2'>
        <div className='flex flex-col text-sm w-1/2 mx-auto'>
          <label className='text-nav dark:text-nav-dark mb-2 text-lg mx-auto'>MCP Server</label>
          {/* add example url */}
          <p className='text-xs text-gray-500 dark:text-gray-400 mb-2 mx-auto'>
            <span className='text-nav dark:text-nav-dark'>URL: {process.env.REACT_APP_MCP_SERVER_URL}</span><br/>
            <span className='text-nav dark:text-nav-dark'>Server Name: {serverName} </span>
          </p>
          {/* add connect button */}
          <button
            className='bg-panel3 dark:bg-panel2-dark text-nav dark:text-nav-dark px-4 py-2 rounded-md hover:bg-panel1 dark:hover:bg-panel4-dark'
            onClick={() => {
              if (!connected) {
                // setServerURL(tempServerURL)
                // setConnected(true)
                // console.log('Connecting to MCP server at:', tempServerURL)
                // connectToServer(tempServerURL)
                client.connect(transport)
                  .then(() => {
                    console.log('MCP Client connected successfully')
                    setConnected(true)
                  })
                  .catch((error:any) => {
                    console.error('Error connecting to MCP server:', error)
                    setConnected(false)
                  })
              } else {
                console.log('Already connected to MCP server')
              }
            }}
          >
            Connect
          </button>
          {connected && (
          <div className='mt-4 text-green-600 mx-auto'>
            Connected to MCP server
          </div>
        )}
        {!connected && (
          <div className='mt-4 text-red-600 mx-auto'>
            Failed to connect to MCP server <br/>
            reconnect by clicking the connect button again
          </div>
        )}
        </div>       
        
        { connected && tools && tools.length ?
        <div className='flex flex-col text-sm w-1/2 mt-4 mx-auto'>
          <h3 className='font-semibold mx-auto text-lg text-nav'>Available Tools</h3>
          {/* add checkbox next to the tools and add submit button */}
          <div className='flex flex-col'>
            {tools.map((tool:{name:any}, index:number) => (
              <div key={index} className='flex items-center my-2'>
                <input
                  type='checkbox'
                  id={`tool-${index}`}
                  value={tool.name}
                  checked={selectedTools.map((tool:any)=>tool.name).includes(tool.name)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedTools([...selectedTools, tool])
                    } else {
                      setSelectedTools(selectedTools.filter((t:any) => t !== tool.name))
                    }
                  }}
                />
                <label htmlFor={`tool-${index}`} className='ml-2 text-nav dark:text-nav-dark'>{tool.name}</label>
              </div>
            ))}
          </div>
        </div>
        : <div className='text-nav dark:text-nav-dark text-sm mt-4 mx-auto'>No tools available</div>}
    </div>
    </div>
  )
}

export default MCPClient