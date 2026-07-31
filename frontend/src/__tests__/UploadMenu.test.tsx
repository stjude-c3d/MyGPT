import { vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import UploadMenu from '../components/UploadMenu'

vi.mock('../components/AddLibrarySettings', () => ({
	default: function MockAddLibrarySettings() {
		return <div data-testid='add-library-settings'>AddLibrarySettings</div>
	}
}))

vi.mock('../components/FlowUpload', () => ({
	default: function MockFlowUpload() {
		return <div data-testid='flow-upload'>FlowUpload</div>
	}
}))

describe('UploadMenu', () => {
	const renderUploadMenu = (closeUpload = vi.fn(), openSettings = vi.fn()) => {
		render(
			<UploadMenu
				closeUpload={closeUpload}
				openSettings={openSettings}
				currentSettings={{}}
				settingsCallback={vi.fn()}
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
		const { closeUpload } = renderUploadMenu(vi.fn(), vi.fn())

		screen.getByText('x').click()
		expect(closeUpload).toHaveBeenCalledTimes(1)
	})

	it('switches to advanced tab and renders FlowUpload', () => {
		renderUploadMenu(vi.fn(), vi.fn())

		fireEvent.click(screen.getByText('Advanced'))
		expect(screen.getByTestId('flow-upload')).toBeInTheDocument()
	})
})
