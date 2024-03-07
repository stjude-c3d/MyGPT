import { render, screen } from '@testing-library/react'
// import { BrowserRouter } from 'react-router-dom'
import TopNav from './TopNav'

describe('TopNav', () => {
	it('renders the navigation bar', () => {
		const setShowSettings = jest.fn(); // Mock function

		render(
			<TopNav setShowSettings={setShowSettings} />
		)

		// Assert that the navigation bar is rendered
		const navBarElement = screen.getByRole('navigation')
		expect(navBarElement).toBeInTheDocument()
	})

	// Check that the navigation bar has the correct app name
	it('renders the correct app name', () => {
		const setShowSettings = jest.fn(); // Mock function

		render(
			<TopNav setShowSettings={setShowSettings} />
		)

		// Assert that the navigation bar has the correct app name
		const appNameElement = screen.getByText(/MyGPT/i)
		expect(appNameElement).toBeInTheDocument()
	})

	// Check that the navigation bar has the correct app logo
	it('renders the correct app logo', () => {
		const setShowSettings = jest.fn(); // Mock function

		render(
			<TopNav setShowSettings={setShowSettings} />
		)

		// Assert that the navigation bar has the correct app logo
		const appLogoElement = screen.getByAltText(/mygpt_logo/i)
		expect(appLogoElement).toBeInTheDocument()
	})

	// Check that the navigation bar has 2 buttons
	it('renders the correct number of buttons', () => {
		const setShowSettings = jest.fn(); // Mock function

		render(
			<TopNav setShowSettings={setShowSettings} />
		)

		// Assert that the navigation bar has 2 buttons
		const buttons = screen.getAllByRole('button')
		expect(buttons).toHaveLength(2)
	})

	// Check if clicking on 2nd button opens a settings modal
	it('opens a settings modal when the settings button is clicked', () => {
		const setShowSettings = jest.fn(); // Mock function

		render(
			<TopNav setShowSettings={setShowSettings} />
		)

		// Click on the 2nd button
		const settingsButton = screen.getAllByRole('button')[1]
		settingsButton.click()

		// Assert that the setShowSettings function was called
		expect(setShowSettings).toHaveBeenCalled()
	})
})