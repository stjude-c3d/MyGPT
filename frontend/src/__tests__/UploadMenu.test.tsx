import { fireEvent, render, screen } from '@testing-library/react'
import UploadMenu from '../components/UploadMenu'

jest.mock('../components/AddLibrarySettings', () => {
	return function MockAddLibrarySettings() {
		return <div data-testid='add-library-settings'>AddLibrarySettings</div>
	}
})

jest.mock('../components/FlowUpload', () => {
	return function MockFlowUpload() {
		return <div data-testid='flow-upload'>FlowUpload</div>
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
		expect(screen.getByText('Simple')).toBeInTheDocument()
		expect(screen.getByText('Advanced')).toBeInTheDocument()
		expect(screen.getAllByTestId('add-library-settings').length).toBeGreaterThan(0)
	})

	it('closes menu when close icon is clicked', () => {
		const { closeUpload } = renderUploadMenu(jest.fn(), jest.fn())

		screen.getByText('x').click()
		expect(closeUpload).toHaveBeenCalledTimes(1)
	})

	it('switches to advanced tab and renders FlowUpload', () => {
		renderUploadMenu(jest.fn(), jest.fn())

		fireEvent.click(screen.getByText('Advanced'))
		expect(screen.getByTestId('flow-upload')).toBeInTheDocument()
	})
})
