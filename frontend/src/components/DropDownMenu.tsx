interface DropdownOptionsProps {
	optionsList: string[],
	defaultOption?: string,
	disabled?: boolean,
	disabledOptions?: string[],
	dropDownCallback: any
}

const defaultDropdownOptionsProps : DropdownOptionsProps = {
	optionsList: ['ABL1', 'ABL2', 'SRC', 'EGFR' ],
	defaultOption: 'SRC',
	disabled: false,
	dropDownCallback: () => {}
}

// dropdown menu that appears when dropdown button is pressed
export const DropdownOptions = (props = defaultDropdownOptionsProps) => {

	if (!props.optionsList.length) return <></>
	const defaultOption = props.defaultOption?.length ? props.defaultOption : props.optionsList[0]
	// const choiceList = props.optionsList.filter((option:string) => option !== defaultOption)
	return (
		<div className='relative inline-block text-left'>
			<select 
				className='border border-bsk_dark_blue rounded focus:ring-blue-500 focus:border-blue-500 block text-sm h-7 w-28'
				onChange={(e) => props.dropDownCallback(e.target.value)}
				defaultValue={defaultOption}
				disabled={props.disabled}
			>	
				{/* <option>{defaultOption}</option> */}
				{props.optionsList.map((option:string, index:number) => {
					return(
						<option
							key={index} 
							value={option}
							disabled={props.disabledOptions?.includes(option)}
						>
							{option}
						</option>
					)
				}
				)}
			</select>
		</div>
	)
}