import { render, screen } from '@testing-library/react'
// import { BrowserRouter } from 'react-router-dom'
import TopNav from '../components/TopNav'

describe('TopNav', () => {
	const renderTopNav = (setShowSettings = jest.fn()) => {
		render(
			<TopNav
				setShowUpload={jest.fn()}
				setShowSettings={setShowSettings}
				setShowChatHistory={jest.fn()}
				setPlotButton={jest.fn()}
				loginCallback={jest.fn()}
			/>
		)
		return setShowSettings
	}

	it('renders the navigation bar', () => {
		renderTopNav()

		// Assert that the navigation bar is rendered
		const navBarElement = screen.getByRole('navigation')
		expect(navBarElement).toBeInTheDocument()
	})

	// Check that the navigation bar has the correct app name
	it('renders the correct app name', () => {
		renderTopNav()

		// Assert that the navigation bar has the correct app name
		const appNameElement = screen.getByText(/MyGPT/i)
		expect(appNameElement).toBeInTheDocument()
	})

	// Check that the navigation bar has the correct app logo
	it('renders the correct app logo', () => {
		renderTopNav()

		// Assert that the navigation bar has the correct app logo
		const appLogoElement = screen.getByAltText(/mygpt_logo/i)
		expect(appLogoElement).toBeInTheDocument()
	})

	// Check that the navigation bar has the expected buttons
	it('renders the correct number of buttons', () => {
		renderTopNav()

		// Upload, Settings, History, Dark/Light mode
		const buttons = screen.getAllByRole('button')
		expect(buttons).toHaveLength(4)
	})

	// Check if clicking on settings opens a settings modal
	it('opens a settings modal when the settings button is clicked', () => {
		const setShowSettings = renderTopNav(jest.fn())

		const settingsButton = screen.getByRole('button', { name: /settings/i })
		settingsButton.click()

		// Assert that the setShowSettings function was called
		expect(setShowSettings).toHaveBeenCalled()
	})
})