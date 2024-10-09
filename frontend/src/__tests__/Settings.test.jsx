import { render, screen, fireEvent } from '@testing-library/react'
import Settings from '../components/Settings'
import defaultSettings from '../utils/DefaultState'

describe('Settings', () => {
  it('renders "Settings" component', () => {
    const settingsCallback = jest.fn()
    const setShowSettings = jest.fn()

    render(<Settings 
        closeSettings={() => setShowSettings(false)} 
        defaultSettings={defaultSettings} 
        currentSettings={defaultSettings}
        settingsCallback={settingsCallback}
        djangoLogin={false}
        user={{user_email: 'abc@xyz.com'}}
      />)

    const element = screen.getByText(/Customizations/i)
    expect(element).toBeInTheDocument()
  })

  it('renders "MyGPT Workflow" svg', () => {
    const settingsCallback = jest.fn()
    const setShowSettings = jest.fn()

    const { container } = render(<Settings 
        closeSettings={() => setShowSettings(false)} 
        defaultSettings={defaultSettings} 
        currentSettings={defaultSettings}
        settingsCallback={settingsCallback}
        user={{user_email: 'abc@xyz.com'}}
      />)

    const svgEl = container.querySelector(`svg[id="MyGPT_workflow"]`)
    expect(svgEl).toBeInTheDocument()
  })

  it('renders "LLMs" settings panel', () => {
    const settingsCallback = jest.fn()
    const setShowSettings = jest.fn()
    const activeTab = 'llms'
    const activeTabTextContent = 'LLMs'

    const { container } = render(<Settings 
        closeSettings={() => setShowSettings(false)} 
        defaultSettings={defaultSettings} 
        currentSettings={defaultSettings}
        settingsCallback={settingsCallback}
        djangoLogin={false}
        user={{user_email: 'abc@xyz.com'}}
    />)

    const divEl = container.querySelector(`div[data-panel="${activeTab}"]`)

    fireEvent.click(divEl)

    expect(divEl.textContent).toBe(activeTabTextContent)
  })

  it('renders "Prompt and LLM parameters" panel', () => {
    const settingsCallback = jest.fn()
    const setShowSettings = jest.fn()
    const activeTab = 'llm_parameters'
    const activeTabTextContent = 'Prompt and LLM parameters'

    const { container } = render(<Settings 
        closeSettings={() => setShowSettings(false)} 
        defaultSettings={defaultSettings} 
        currentSettings={defaultSettings}
        settingsCallback={settingsCallback}
        djangoLogin={false}
        user={{user_email: 'abc@xyz.com'}}
    />)

    const divEl = container.querySelector(`div[data-panel="${activeTab}"]`)

    fireEvent.click(divEl)

    expect(divEl.textContent).toBe(activeTabTextContent)
  })

  it('renders "Publication libraries" panel', () => {
    const settingsCallback = jest.fn()
    const setShowSettings = jest.fn()
    const activeTab = 'datasets'
    const activeTabTextContent = 'Publication libraries'

    const { container } = render(<Settings 
        closeSettings={() => setShowSettings(false)} 
        defaultSettings={defaultSettings} 
        currentSettings={defaultSettings}
        settingsCallback={settingsCallback}
        djangoLogin={false}
        user={{user_email: 'abc@xyz.com'}}
    />)

    const divEl = container.querySelector(`div[data-panel="${activeTab}"]`)

    fireEvent.click(divEl)

    expect(divEl.textContent).toBe(activeTabTextContent)
  })

  it('renders "Embedding Models" panel', () => {
    const settingsCallback = jest.fn()
    const setShowSettings = jest.fn()
    const activeTab = 'embedding_models'
    const activeTabTextContent = 'Embedding Models'

    const { container } = render(<Settings 
        closeSettings={() => setShowSettings(false)} 
        defaultSettings={defaultSettings} 
        currentSettings={defaultSettings}
        settingsCallback={settingsCallback}
        djangoLogin={false}
        user={{user_email: 'abc@xyz.com'}}
    />)

    const divEl = container.querySelector(`div[data-panel="${activeTab}"]`)

    fireEvent.click(divEl)

    expect(divEl.textContent).toBe(activeTabTextContent)
  })

  it('renders "Relevance score parameters" panel', () => {
    const settingsCallback = jest.fn()
    const setShowSettings = jest.fn()
    const activeTab = 'relevance_score'
    const activeTabTextContent = 'Relevance score parameters'

    const { container } = render(<Settings 
        closeSettings={() => setShowSettings(false)} 
        defaultSettings={defaultSettings} 
        currentSettings={defaultSettings}
        settingsCallback={settingsCallback}
        djangoLogin={false}
        user={{user_email: 'abc@xyz.com'}}
    />)

    const divEl = container.querySelector(`div[data-panel="${activeTab}"]`)

    fireEvent.click(divEl)

    expect(divEl.textContent).toBe(activeTabTextContent)
  })
})