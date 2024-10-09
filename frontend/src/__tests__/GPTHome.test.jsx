import { render, screen } from '@testing-library/react'
import GPTHome from '../components/GPTHome'
import { Viewer } from '@react-pdf-viewer/core'
import defaultSettings from '../utils/DefaultState'
import '../__mocks__/intersectObserverMock'

const default_frontend_settings = {
  'show_no_context_switch': false,
  'azure_login': false, 
  'django_login': false,
  'restriction_without_login': false,
  'disable_chat_without_login': false,
}

describe('GPTHome', () => {
  it('renders "Ask a Question" section', () => {
    const settingsCallback = jest.fn()

    render(<GPTHome currentSettings={defaultSettings} settingsCallback={settingsCallback} frontendSettings={default_frontend_settings}/>)
    const element = screen.getByText(/Ask a question about a paper or a topic from your publication library. We will try to answer it using the GPT models./i)
    expect(element).toBeInTheDocument()
  })

  it('renders "Your publication library" section', () => {
    const settingsCallback = jest.fn()

    render(<GPTHome currentSettings={defaultSettings} settingsCallback={settingsCallback} frontendSettings={default_frontend_settings}/>)
    expect(screen.getByText(/Current library/i)).toBeInTheDocument()
  })

  it('renders PDF viewer', () => {
    const settingsCallback = jest.fn()

    render(<GPTHome currentSettings={defaultSettings} settingsCallback={settingsCallback} frontendSettings={default_frontend_settings}/>)
    expect(Viewer).toBeDefined()
  })
})
