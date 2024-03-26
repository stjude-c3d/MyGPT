import { render, screen } from '@testing-library/react'
import GPTHome from '../components/GPTHome'
import { Viewer } from '@react-pdf-viewer/core'
import defaultSettings from '../utils/DefaultState'
import '../__mocks__/intersectObserverMock'


describe('GPTHome', () => {
  it('renders "Ask a Question" section', () => {
    const settingsCallback = jest.fn()

    render(<GPTHome currentSettings={defaultSettings} settingsCallback={settingsCallback}/>)
    const element = screen.getByText(/Ask a question about a paper or a topic from your publication library. We will try to answer it using the GPT models./i)
    expect(element).toBeInTheDocument()
  })

  it('renders "Your publication library" section', () => {
    const settingsCallback = jest.fn()

    render(<GPTHome currentSettings={defaultSettings} settingsCallback={settingsCallback}/>)
    expect(screen.getByText(/Current library/i)).toBeInTheDocument()
  })

  it('renders PDF viewer', () => {
    const settingsCallback = jest.fn()

    render(<GPTHome currentSettings={defaultSettings} settingsCallback={settingsCallback}/>)
    expect(Viewer).toBeDefined()
  })
})
