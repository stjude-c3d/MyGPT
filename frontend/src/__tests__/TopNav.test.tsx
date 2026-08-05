import { vi, type Mock } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import TopNav from '../components/TopNav'
import useAuthenticateUser from '../hooks/useAuthenticateUser'

vi.mock('../hooks/useAuthenticateUser')

const mockedUseAuthenticateUser = useAuthenticateUser as Mock

const baseProps = {
	setShowUpload: vi.fn(),
	setShowSettings: vi.fn(),
	setShowChatHistory: vi.fn(),
	setPlotButton: vi.fn(),
	loginCallback: vi.fn(),
}

describe('TopNav', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		localStorage.clear()
		mockedUseAuthenticateUser.mockReturnValue({
			activeAccounts: [],
			appRoles: [],
			instance: { loginRedirect: vi.fn(), logoutRedirect: vi.fn() },
		})
	})

	const renderTopNav = (props = {}) => {
		render(
			<TopNav
				{...baseProps}
				{...props}
			/>
		)
	}

	it('renders the navigation bar', () => {
		renderTopNav()

		const navBarElement = screen.getByRole('navigation')
		expect(navBarElement).toBeInTheDocument()
	})

	it('renders the correct app name', () => {
		renderTopNav()

		const appNameElement = screen.getByText(/MyGPT/i)
		expect(appNameElement).toBeInTheDocument()
	})

	it('renders the correct app logo', () => {
		renderTopNav()

		const appLogoElement = screen.getByAltText(/mygpt_logo/i)
		expect(appLogoElement).toBeInTheDocument()
	})

	it('renders upload, settings, history, and dark mode buttons by default', () => {
		renderTopNav()

		expect(screen.getByRole('button', { name: /upload/i })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /history/i })).toBeInTheDocument()
		expect(screen.getAllByRole('button')).toHaveLength(4)
	})

	it('opens settings when the settings button is clicked', () => {
		const setShowSettings = vi.fn()
		renderTopNav({ setShowSettings })

		const settingsButton = screen.getByRole('button', { name: /settings/i })
		fireEvent.click(settingsButton)

		expect(setShowSettings).toHaveBeenCalledWith(true)
	})

	it('hides upload and settings when restrictions are enabled and user is not authenticated', () => {
		renderTopNav({ restrictions: true })

		expect(screen.queryByRole('button', { name: /upload/i })).not.toBeInTheDocument()
		expect(screen.queryByRole('button', { name: /settings/i })).not.toBeInTheDocument()
		expect(screen.getByRole('button', { name: /history/i })).toBeInTheDocument()
	})

	it('calls loginCallback with authenticated user details from MSAL account', async () => {
		const loginCallback = vi.fn()
		mockedUseAuthenticateUser.mockReturnValue({
			activeAccounts: [{ name: 'Jane Doe', username: 'jane@org.org' }],
			appRoles: ['MyGPTAdmin', 'Reader'],
			instance: { loginRedirect: vi.fn(), logoutRedirect: vi.fn() },
		})

		renderTopNav({ loginCallback })

		await waitFor(() => {
			expect(loginCallback).toHaveBeenCalledWith({
				user: 'Jane Doe',
				user_email: 'jane@org.org',
				isAdmin: false,
				otherRoles: ['Reader'],
			})
		})
	})
})