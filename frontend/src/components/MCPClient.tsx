import { useState, useEffect, useRef } from 'react'
import { Client } from '@modelcontextprotocol/sdk/client/index'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse'

const MCPClient = (props:{
  currentSettings:any,
  settingsCallback:any,
  onMCPClientReady?: (client: any) => void
}) => {

   // get tools from the client
  const [tools, setTools]:any = useState([])
  const [connected, setConnected] = useState(false)
  const [serverName, setServerName] = useState('')
  const [selectedTools, setSelectedTools]:any = useState([])
  const clientRef = useRef<any>(null)
  const transportRef = useRef<any>(null)
  const connectPromiseRef = useRef<Promise<any> | null>(null)
  // const [toolResult, setToolResult]:any = useState('')
  // const [client, setClient] = useState(new Client({
  //   name: 'MyGPT-MCP-Client',
  //   description: 'A client for MyGPT using Model Context Protocol',
  //   version: '0.1.0',
  // }))
  
  const currentSettings = props.currentSettings
  const getClient = () => {
    if (!transportRef.current) {
      transportRef.current = new SSEClientTransport(
        new URL(process.env.REACT_APP_MCP_SERVER_URL || 'http://localhost:5001/sse')
      )
    }
    if (!clientRef.current) {
      clientRef.current = new Client({
        name: 'MyGPT-MCP-Client',
        description: 'A client for MyGPT using Model Context Protocol',
        version: '0.1.0',
      })
    }
    return clientRef.current
  }

  const ensureConnected = async () => {
    if (connected && clientRef.current) {
      return clientRef.current
    }
    if (connectPromiseRef.current) {
      return connectPromiseRef.current
    }

    connectPromiseRef.current = (async () => {
      const client = getClient()
      await client.connect(transportRef.current)
      const serverInfo = client._serverVersion || {}
      setServerName(serverInfo.name || 'MCP Server')
      setConnected(true)
      return client
    })()

    try {
      return await connectPromiseRef.current
    } catch (error) {
      setConnected(false)
      throw error
    } finally {
      connectPromiseRef.current = null
    }
  }

  useEffect(() => {
    let isMounted = true

    const connectAndFetchTools = async () => {
      try {
        const client = await ensureConnected()
        const toolsList:any = await client.listTools()
        if (isMounted) {
          setTools(toolsList['tools'] || [])
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error connecting to MCP server:', error)
          setTools([])
          setConnected(false)
        }
      }
    }

    connectAndFetchTools()

    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const syncSelectedTools = async () => {
      if (selectedTools.length > 0) {
        props.currentSettings.MCP_tools = selectedTools
      }

      let client = clientRef.current
      if (!client) {
        try {
          client = await ensureConnected()
        } catch (error) {
          console.error('Error ensuring MCP client connection:', error)
        }
      }

      // Store the live client instance in a module-level ref so callers can
      // access it without putting it in the serialisable settings object.
      props.settingsCallback({
        ...currentSettings,
        MCPTools: selectedTools,
        MCPClient: client,
      })
      // Expose the client separately so consumers can call it directly.
      if (props.onMCPClientReady) {
        props.onMCPClientReady(client)
      }
    }

    syncSelectedTools()
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
                ensureConnected()
                  .then(async (client:any) => {
                    console.log('MCP Client connected successfully')
                    setConnected(true)

                    try {
                      const toolsList:any = await client.listTools()
                      setTools(toolsList['tools'] || [])
                    } catch (error:any) {
                      console.error('Error fetching tools:', error)
                      setTools([])
                    }
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
                      setSelectedTools(selectedTools.filter((t:any) => t.name !== tool.name))
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