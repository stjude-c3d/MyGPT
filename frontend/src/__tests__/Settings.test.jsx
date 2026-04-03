import { fireEvent, render, screen } from '@testing-library/react'
import Settings from '../components/Settings'
import defaultSettings from '../utils/DefaultState'

jest.mock('../components/LLMSettings', () => () => <div data-testid='llm-settings'>LLM Settings</div>)
jest.mock('../components/EmbeddingSettings', () => () => <div data-testid='embedding-settings'>Embedding Settings</div>)
jest.mock('../components/RelevanceScoresSettings', () => () => <div data-testid='relevance-settings'>Relevance Settings</div>)
jest.mock('../components/MCPClient', () => () => <div data-testid='mcp-client'>MCP Client</div>)

describe('Settings', () => {
  const baseProps = {
    closeSettings: jest.fn(),
    defaultSettings,
    currentSettings: defaultSettings,
    settingsCallback: jest.fn(),
    djangoLogin: false,
    user: { user_email: 'abc@xyz.com', otherRoles: [] }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'log').mockImplementation(() => {})

    global.fetch = jest.fn((url) => {
      const urlStr = typeof url === 'string' ? url : (url && url.url ? url.url : String(url))

      if (urlStr.includes('get_datasets')) {
        return Promise.resolve({
          json: () => Promise.resolve([])
        })
      }

      if (urlStr.includes('api/tags') || urlStr.includes('/tags')) {
        return Promise.resolve({
          json: () => Promise.resolve({ models: [] })
        })
      }

      if (urlStr.includes('add_ollama_models')) {
        return Promise.resolve({
          json: () => Promise.resolve({ added: true })
        })
      }

      return Promise.resolve({ json: () => Promise.resolve({}) })
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders Settings header', () => {
    render(<Settings {...baseProps} />)
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('renders expected panel tabs', () => {
    const { container } = render(<Settings {...baseProps} />)
    const datasetsPanel = container.querySelector('div[data-panel="datasets"]')
    const llmsPanel = container.querySelector('div[data-panel="llms"]')
    const llmParamsPanel = container.querySelector('div[data-panel="llm_parameters"]')
    const embeddingPanel = container.querySelector('div[data-panel="embedding_models"]')
    const relevancePanel = container.querySelector('div[data-panel="relevance_score"]')

    expect(datasetsPanel).toHaveTextContent('Document libraries')
    expect(llmsPanel).toHaveTextContent('LLMs')
    expect(llmParamsPanel).toHaveTextContent('Prompt and LLM parameters')
    expect(embeddingPanel).toHaveTextContent('Embedding Models')
    expect(relevancePanel).toHaveTextContent('Relevance score parameters')
  })

  it('shows Add New Library button when openUpload is provided', () => {
    render(<Settings {...baseProps} openUpload={jest.fn()} />)
    expect(screen.getByText('Add New Library')).toBeInTheDocument()
  })

  it('triggers close and upload open on Add New Library click', () => {
    const closeSettings = jest.fn()
    const openUpload = jest.fn()

    render(
      <Settings
        {...baseProps}
        closeSettings={closeSettings}
        openUpload={openUpload}
      />
    )

    fireEvent.click(screen.getByText('Add New Library'))

    expect(closeSettings).toHaveBeenCalledTimes(1)
    expect(openUpload).toHaveBeenCalledTimes(1)
  })
})