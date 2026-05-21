import { render, screen } from '@testing-library/react'
import GPTHome from '../components/GPTHome'
import defaultSettings from '../utils/DefaultState'
import * as GPTHomeAPI from '../utils/GPTHomeAPI'
import '../__mocks__/intersectObserverMock'

jest.mock('../utils/GPTHomeAPI', () => ({
  fetchAndRegisterOllamaModels: jest.fn().mockResolvedValue(['llama3:latest']),
  fetchDatasetDetails: jest.fn().mockResolvedValue({ documents_language: 'english' }),
  fetchDocuments: jest.fn().mockResolvedValue({ dataset_type: 'papers', documents: [] }),
  fetchSections: jest.fn().mockResolvedValue({ sections: [] }),
  addDemoLibraryRequest: jest.fn().mockResolvedValue({}),
  fetchContext: jest.fn().mockResolvedValue({ relevance_score: 0, context: '', sources: [] }),
  saveAnswer: jest.fn().mockResolvedValue({ relevance_score: 0, hallucination_index_by_ml: 0 }),
}))

jest.mock('@react-pdf-viewer/core', () => ({
  Viewer: ({ fileUrl }) => <div data-testid="pdf-viewer">{fileUrl ? `viewer:${fileUrl}` : 'viewer'}</div>,
  Worker: ({ children }) => <div data-testid="pdf-worker">{children}</div>,
  SpecialZoomLevel: { ActualSize: 'ActualSize' },
  Icon: ({ children }) => <span>{children}</span>,
}))

jest.mock('@react-pdf-viewer/default-layout', () => ({
  defaultLayoutPlugin: () => ({}),
  BookmarkIcon: () => <span data-testid="bookmark-icon" />,
}))

jest.mock('@react-pdf-viewer/bookmark', () => ({
  bookmarkPlugin: () => ({
    Bookmarks: () => <div data-testid="bookmarks" />,
  }),
}))

jest.mock('@react-pdf-viewer/page-navigation', () => ({
  pageNavigationPlugin: () => ({
    jumpToPage: jest.fn(),
  }),
}))

const default_frontend_settings = {
  'show_no_context_switch': true,
  'azure_login': false, 
  'django_login': false,
  'restriction_without_login': false,
  'disable_chat_without_login': false,
}

describe('GPTHome', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    GPTHomeAPI.fetchAndRegisterOllamaModels.mockResolvedValue(['llama3:latest'])
    GPTHomeAPI.fetchDatasetDetails.mockResolvedValue({ documents_language: 'english' })
    GPTHomeAPI.fetchDocuments.mockResolvedValue({ dataset_type: 'papers', documents: [] })
    GPTHomeAPI.fetchSections.mockResolvedValue({ sections: [] })
    GPTHomeAPI.addDemoLibraryRequest.mockResolvedValue({})
    GPTHomeAPI.fetchContext.mockResolvedValue({ relevance_score: 0, context: '', sources: [] })
    GPTHomeAPI.saveAnswer.mockResolvedValue({ relevance_score: 0, hallucination_index_by_ml: 0 })
  })

  const renderGPTHome = (overrides = {}, frontendOverrides = {}) => {
    const currentSettings = {
      ...defaultSettings,
      ...overrides,
    }

    const frontendSettings = {
      ...default_frontend_settings,
      ...frontendOverrides,
    }

    return render(
      <GPTHome
        currentSettings={currentSettings}
        settingsCallback={jest.fn()}
        frontendSettings={frontendSettings}
        user={{ user_email: '', otherRoles: [] }}
      />
    )
  }

  it('renders "Ask a Question" section', () => {
    renderGPTHome()
    const element = screen.getByText(/Ask a question about a paper or a topic from your publication library. We will try to answer it using the GPT models./i)
    expect(element).toBeInTheDocument()
  })

  it('renders current library controls', () => {
    renderGPTHome()
    expect(screen.getByText(/Current library/i)).toBeInTheDocument()
  })

  it('renders question input with default placeholder', () => {
    renderGPTHome()
    expect(screen.getByPlaceholderText(/Type your question here/i)).toBeInTheDocument()
  })

  it('shows login prompt in question area when chat requires login', () => {
    renderGPTHome(
      { loggedin: false },
      { disable_chat_without_login: true }
    )

    expect(screen.getByText(/Login to chat/i)).toBeInTheDocument()
    expect(screen.queryByPlaceholderText(/Type your question here/i)).not.toBeInTheDocument()
  })

  it('shows library login message when there are no documents and user is not logged in', () => {
    renderGPTHome({ loggedin: false })
    expect(screen.getByText(/Login to view document library/i)).toBeInTheDocument()
  })
})
