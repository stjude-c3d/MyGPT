import { render, screen } from '@testing-library/react'
import UploadMenu from '../components/UploadMenu'

jest.mock('../components/AddLibrarySettings', () => {
	return function MockAddLibrarySettings() {
		return <div data-testid='add-library-settings'>AddLibrarySettings</div>
	}
})

describe('UploadMenu', () => {
	const renderUploadMenu = (closeUpload = jest.fn(), openSettings = jest.fn()) => {
		render(
			<UploadMenu
				closeUpload={closeUpload}
				openSettings={openSettings}
				currentSettings={{}}
				settingsCallback={jest.fn()}
			/>
		)
		return { closeUpload, openSettings }
	}

	it('renders title and add-library section', () => {
		renderUploadMenu()

		expect(screen.getByText('Upload Documents')).toBeInTheDocument()
		expect(screen.getByTestId('add-library-settings')).toBeInTheDocument()
	})

	it('closes menu when close icon is clicked', () => {
		const { closeUpload } = renderUploadMenu(jest.fn(), jest.fn())

		screen.getByText('x').click()
		expect(closeUpload).toHaveBeenCalledTimes(1)
	})

	it('redirects to settings when Library Management is clicked', () => {
		const { closeUpload, openSettings } = renderUploadMenu(jest.fn(), jest.fn())

		screen.getByText('Library Management').click()
		expect(closeUpload).toHaveBeenCalledTimes(1)
		expect(openSettings).toHaveBeenCalledTimes(1)
	})
})
