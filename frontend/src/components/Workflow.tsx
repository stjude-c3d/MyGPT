const Workflow = (props:{
	zoomedIn: boolean,
	focusComponent: string
}) => {
	return (
		<div className="flex justify-center">
			<svg id="MyGPT_workflow" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1241 656.57" style={ props.zoomedIn ? {'height':'40vh'} : {'height': '25vh'}}>
			<g className="cls-99">
				<path className="cls-118" d="M719,304.51h291V65.51c0-6.6-5.4-12-12-12H273c-6.6,0-12,5.4-12,12v517c0,6.6,5.4,12,12,12h446v-290Z"/>
				<g>
				<polyline className="cls-22" points="719 309.51 719 304.51 724 304.51"/>
				<line className="cls-19" x1="733.69" y1="304.51" x2="1000.16" y2="304.51"/>
				<polyline className="cls-22" points="1005 304.51 1010 304.51 1010 299.51"/>
				<path className="cls-21" d="M1010,289.5V65.51c0-6.6-5.4-12-12-12H273c-6.6,0-12,5.4-12,12v517c0,6.6,5.4,12,12,12h435.99"/>
				<polyline className="cls-22" points="714 594.51 719 594.51 719 589.51"/>
				<line className="cls-20" x1="719" y1="579.86" x2="719" y2="314.34"/>
				</g>
			</g>
			<g className="cls-99">
				<rect className="cls-118" x="1" y="56.51" width="190" height="538" rx="12" ry="12"/>
				<rect className="cls-30" x="1" y="56.51" width="190" height="538" rx="12" ry="12"/>
			</g>
			<g className="cls-99">
				<rect className="cls-118" x="576" y="69.51" width="415" height="205" rx="12" ry="12"/>
				<rect className="cls-29" x="576" y="69.51" width="415" height="205" rx="12" ry="12"/>
			</g>
			<g className="cls-97">
				<path className="cls-118" d="M1232.13,51.51h-201.4v279.17c0,6.75-3.54,12.27-7.87,12.27h-234.86v239.29c0,6.75,3.54,12.27,7.87,12.27h436.26c4.33,0,7.87-5.52,7.87-12.27V63.79c0-6.75-3.54-12.27-7.87-12.27Z"/>
				<g>
				<polyline className="cls-23" points="1035.73 51.51 1030.73 51.51 1030.73 56.51"/>
				<path className="cls-27" d="M1030.73,66.33v264.36c0,6.75-3.54,12.27-7.87,12.27h-224.95"/>
				<polyline className="cls-23" points="793 342.95 788 342.95 788 347.95"/>
				<path className="cls-28" d="M788,357.98v224.26c0,6.75,3.54,12.27,7.87,12.27h436.26c4.33,0,7.87-5.52,7.87-12.27V63.79c0-6.75-3.54-12.27-7.87-12.27h-191.39"/>
				</g>
			</g>
			<g>
				<line className="cls-25" x1="195" y1="164.51" x2="286.88" y2="164.51"/>
				<polygon className="cls-44" points="301 164.51 281.1 172.65 285.82 164.51 281.1 156.39 301 164.51"/>
			</g>
			<g id="publications">
				<text className={ props.focusComponent === 'datasets' ? 'cls-35 cls-35-focus' : "cls-35"} transform="translate(38.28 253.46)"><tspan x="0" y="0">Online </tspan><tspan className="cls-51" x="47.71" y="0">P</tspan><tspan className="cls-100" x="55.98" y="0">ublic</tspan><tspan className="cls-77" x="88.59" y="0">a</tspan><tspan x="96.24" y="0">tion</tspan><tspan x="36.56" y="19.2">Lib</tspan><tspan className="cls-119" x="56.96" y="19.2">r</tspan><tspan x="62.11" y="19.2">a</tspan><tspan className="cls-37" x="69.82" y="19.2">r</tspan><tspan className="cls-100" x="75.46" y="19.2">y </tspan><tspan x="2.78" y="38.4">(</tspan><tspan className="cls-61" x="7.32" y="38.4">Z</tspan><tspan x="15.98" y="38.4">o</tspan><tspan className="cls-40" x="24.76" y="38.4">t</tspan><tspan x="29.96" y="38.4">e</tspan><tspan className="cls-109" x="37.98" y="38.4">r</tspan><tspan x="43.05" y="38.4">o/EndNo</tspan><tspan className="cls-73" x="102.41" y="38.4">t</tspan><tspan className="cls-101" x="107.61" y="38.4">e)</tspan></text>
				<g>
				<g className={props.focusComponent === 'datasets' ? 'cls-13-focus' : "cls-13"}>
					<path d="M98.22,163.11h-23.08c-.38,0-.68-.3-.68-.68v-.09c0-2,1.61-3.62,3.6-3.62h20.16c.38,0,.68.3.68.68v3.03c0,.38-.3.68-.68.68ZM75.9,161.75h21.64v-1.67h-19.48c-1.03,0-1.91.71-2.16,1.67Z"/>
					<path d="M70.17,165.67h-21.26c-.38,0-.68-.3-.68-.68v-41.74c0-.38.3-.68.68-.68h3.12c.38,0,.68.3.68.68v35.46h19.48c1.98,0,3.6,1.62,3.6,3.62v.09c0,.38-.3.68-.68.68h-4.27v1.89c0,.38-.3.68-.68.68ZM49.6,164.31h19.9v-1.89c0-.38.3-.68.68-.68h4.19c-.26-.96-1.13-1.67-2.16-1.67h-20.16c-.38,0-.68-.3-.68-.68v-35.46h-1.77v40.38Z"/>
					<path d="M101.71,165.67h-22.11c-.38,0-.68-.3-.68-.68v-1.89h-3.78c-.38,0-.68-.3-.68-.68v-.09c0-2,1.61-3.62,3.6-3.62h19.48v-35.46c0-.38.3-.68.68-.68h3.49c.38,0,.68.3.68.68v41.74c0,.38-.3.68-.68.68ZM80.27,164.31h20.75v-40.38h-2.13v35.46c0,.38-.3.68-.68.68h-20.16c-1.03,0-1.91.71-2.16,1.67h3.7c.38,0,.68.3.68.68v1.89Z"/>
					<path d="M75.04,169.51h-.32c-1.57,0-5.23,0-5.23-3.64v-3.45c0-.38.3-.68.68-.68h9.42c.38,0,.68.3.68.68v3.45c0,3.64-3.67,3.64-5.23,3.64ZM70.85,163.11v2.77c0,1.68,1.01,2.28,3.87,2.28h.32c2.86,0,3.87-.6,3.87-2.28v-2.77h-8.06Z"/>
					<path d="M75.14,163.02c-.38,0-.68-.3-.68-.68v-39.34c0-2,1.61-3.62,3.6-3.62h20.16c.38,0,.68.3.68.68v39.34c0,.38-.3.68-.68.68h-20.16c-1.24,0-2.24,1.01-2.24,2.26,0,.38-.3.68-.68.68ZM78.06,120.74c-1.24,0-2.24,1.01-2.24,2.26v36.51c.62-.49,1.39-.79,2.24-.79h19.48v-37.99h-19.48Z"/>
					<path d="M75.12,163.02c-.38,0-.68-.3-.68-.68,0-1.25-1.01-2.26-2.24-2.26h-20.16c-.38,0-.68-.3-.68-.68v-39.34c0-.38.3-.68.68-.68h20.16c1.98,0,3.6,1.62,3.6,3.62v39.34c0,.38-.3.68-.68.68ZM52.72,158.72h19.48c.85,0,1.63.3,2.24.79v-36.51c0-1.25-1.01-2.26-2.24-2.26h-19.48v37.99Z"/>
					<path d="M75.12,163.11h-23.08c-.38,0-.68-.3-.68-.68v-3.03c0-.38.3-.68.68-.68h20.16c1.98,0,3.6,1.62,3.6,3.62v.09c0,.38-.3.68-.68.68ZM52.72,161.75h21.64c-.26-.96-1.13-1.67-2.16-1.67h-19.48v1.67Z"/>
					<path d="M92.9,125.64h-12.74c-.38,0-.68-.3-.68-.68s.3-.68.68-.68h12.74c.38,0,.68.3.68.68s-.3.68-.68.68Z"/>
					<path d="M92.9,154.16h-3.8c-.38,0-.68-.3-.68-.68s.3-.68.68-.68h3.8c.38,0,.68.3.68.68s-.3.68-.68.68Z"/>
					<path d="M92.9,132.77h-12.74c-.38,0-.68-.3-.68-.68s.3-.68.68-.68h12.74c.38,0,.68.3.68.68s-.3.68-.68.68Z"/>
					<path d="M92.9,139.9h-12.74c-.38,0-.68-.3-.68-.68s.3-.68.68-.68h12.74c.38,0,.68.3.68.68s-.3.68-.68.68Z"/>
					<path d="M92.9,147.03h-12.74c-.38,0-.68-.3-.68-.68s.3-.68.68-.68h12.74c.38,0,.68.3.68.68s-.3.68-.68.68Z"/>
					<path d="M69.95,139.9h-12.74c-.38,0-.68-.3-.68-.68s.3-.68.68-.68h12.74c.38,0,.68.3.68.68s-.3.68-.68.68Z"/>
					<path d="M69.95,147.03h-12.74c-.38,0-.68-.3-.68-.68s.3-.68.68-.68h12.74c.38,0,.68.3.68.68s-.3.68-.68.68Z"/>
					<path d="M69.95,154.16h-12.74c-.38,0-.68-.3-.68-.68s.3-.68.68-.68h12.74c.38,0,.68.3.68.68s-.3.68-.68.68Z"/>
					<path d="M65.38,133.78h-8.17c-.38,0-.68-.3-.68-.68v-8.17c0-.38.3-.68.68-.68h8.17c.38,0,.68.3.68.68v8.17c0,.38-.3.68-.68.68ZM57.89,132.42h6.81v-6.81h-6.81v6.81Z"/>
					<path d="M86.23,157.06h-5.82c-.38,0-.68-.3-.68-.68v-5.82c0-.38.3-.68.68-.68h5.82c.38,0,.68.3.68.68v5.82c0,.38-.3.68-.68.68ZM81.1,155.71h4.46v-4.46h-4.46v4.46Z"/>
				</g>
				<rect className={props.focusComponent === 'datasets' ? 'cls-18-focus' : "cls-18"} x="22.75" y="86.01" width="154" height="117" rx="9.58" ry="9.58"/>
				<rect className={props.focusComponent === 'datasets' ? 'cls-18-focus' : "cls-18"} x="30.75" y="93.51" width="138" height="101" rx="8.45" ry="8.45"/>
				<path className={props.focusComponent === 'datasets' ? 'cls-18-focus' : "cls-18"} d="M125.91,224.02c-10.36,0-18.75-8.65-18.75-19.31,0-.69.04-1.36.1-2.03h-4.6v-.1h-8.54c.07.67.11,1.35.11,2.03,0,10.67-9.06,19.31-20.23,19.31-1.95,0-3.83-.27-5.62-.76v7.37h30.96v.1h31.78v-7.37c-1.65.49-3.4.76-5.21.76Z"/>
				<path className={props.focusComponent === 'datasets' ? 'cls-26-focus' : "cls-26"} d="M156.12,110.14h-19.89l-2.51-6.68h-12.76l-2.73,7.27c-.56.46-.92,1.15-.92,1.93v25.35c0,1.39,1.13,2.51,2.51,2.51h36.29c1.39,0,2.51-1.13,2.51-2.51v-25.35c0-1.39-1.13-2.51-2.51-2.51Z"/>
				<line className={props.focusComponent === 'datasets' ? 'cls-26-focus' : "cls-26"} x1="123.32" y1="118.51" x2="148.32" y2="118.51"/>
				<line className={props.focusComponent === 'datasets' ? 'cls-26-focus' : "cls-26"} x1="124.32" y1="123.51" x2="141.32" y2="123.51"/>
				<path className={props.focusComponent === 'datasets' ? 'cls-26-focus' : "cls-26"} d="M154.29,155.58h-19.89l-2.51-6.68h-12.76l-2.73,7.27c-.56.46-.92,1.15-.92,1.93v25.35c0,1.39,1.13,2.51,2.51,2.51h36.29c1.39,0,2.51-1.13,2.51-2.51v-25.35c0-1.39-1.13-2.51-2.51-2.51Z"/>
				<line className={props.focusComponent === 'datasets' ? 'cls-26-focus' : "cls-26"} x1="121.49" y1="163.96" x2="146.49" y2="163.96"/>
				<line className={props.focusComponent === 'datasets' ? 'cls-26-focus' : "cls-26"} x1="122.49" y1="168.96" x2="139.49" y2="168.96"/>
				</g>
			</g>
			<text className="cls-59" transform="translate(197.89 198.7)"><tspan x="0" y="0">E</tspan><tspan className="cls-120" x="6.89" y="0">x</tspan><tspan x="13.55" y="0">t</tspan><tspan className="cls-103" x="18.19" y="0">r</tspan><tspan className="cls-111" x="22.69" y="0">a</tspan><tspan className="cls-120" x="29.44" y="0">c</tspan><tspan x="35.9" y="0">t </tspan><tspan className="cls-67" x="43.5" y="0">t</tspan><tspan className="cls-41" x="48.05" y="0">e</tspan><tspan className="cls-114" x="55.02" y="0">x</tspan><tspan className="cls-80" x="61.68" y="0">t f</tspan><tspan className="cls-14" x="73.37" y="0">r</tspan><tspan x="77.81" y="0">om </tspan><tspan x="-.15" y="16.8">public</tspan><tspan className="cls-82" x="36.34" y="16.8">a</tspan><tspan x="43.04" y="16.8">tions and </tspan><tspan x="2.31" y="33.6">split i</tspan><tspan className="cls-88" x="33.28" y="33.6">n</tspan><tspan className="cls-67" x="40.99" y="33.6">t</tspan><tspan x="45.54" y="33.6">o chunks</tspan></text>
			<g id="data_chunks">
				<rect className="cls-18" x="314.51" y="87.51" width="128" height="159" rx="6.91" ry="6.91"/>
				<rect className="cls-18" x="325.51" y="101.51" width="104" height="26"/>
				<rect className="cls-18" x="325.51" y="137.51" width="104" height="26"/>
				<rect className="cls-18" x="326.51" y="173.51" width="104" height="26"/>
				<rect className="cls-18" x="326.51" y="207.51" width="104" height="26"/>
				<line className="cls-26" x1="366.51" y1="110.51" x2="421.51" y2="110.51"/>
				<line className="cls-26" x1="367.51" y1="115.51" x2="398.51" y2="115.51"/>
				<line className="cls-26" x1="364.51" y1="146.51" x2="419.51" y2="146.51"/>
				<line className="cls-26" x1="387.96" y1="151.13" x2="418.96" y2="151.13"/>
				<line className="cls-26" x1="364.51" y1="181.51" x2="395.51" y2="181.51"/>
				<line className="cls-26" x1="364.51" y1="187.51" x2="419.51" y2="187.51"/>
				<line className="cls-26" x1="362.51" y1="215.51" x2="417.51" y2="215.51"/>
				<line className="cls-26" x1="362.51" y1="221.51" x2="417.51" y2="221.51"/>
				<text className="cls-35" transform="translate(338.95 269.51)"><tspan x="0" y="0">D</tspan><tspan className="cls-85" x="10.66" y="0">a</tspan><tspan x="18.3" y="0">ta chunks</tspan></text>
				<text className="cls-12" transform="translate(333.26 120.37)"><tspan x="0" y="0">01</tspan></text>
				<text className="cls-12" transform="translate(331.26 155.37)"><tspan x="0" y="0">02</tspan></text>
				<text className="cls-12" transform="translate(335.02 225.37)"><tspan x="0" y="0">n</tspan></text>
				<text className="cls-12" transform="translate(333.5 187.37)"><tspan x="0" y="0">...</tspan></text>
			</g>
			<text className="cls-59" transform="translate(460.28 190.7)"><tspan className="cls-92" x="0" y="0">C</tspan><tspan x="7.97" y="0">o</tspan><tspan className="cls-116" x="15.65" y="0">n</tspan><tspan className="cls-14" x="23.24" y="0">v</tspan><tspan x="29.83" y="0">e</tspan><tspan className="cls-16" x="36.85" y="0">r</tspan><tspan x="41.76" y="0">t </tspan><tspan className="cls-67" x="49.36" y="0">t</tspan><tspan className="cls-41" x="53.91" y="0">e</tspan><tspan className="cls-120" x="60.89" y="0">x</tspan><tspan x="67.55" y="0">t i</tspan><tspan className="cls-88" x="78.43" y="0">n</tspan><tspan className="cls-67" x="86.14" y="0">t</tspan><tspan x="90.69" y="0">o </tspan><tspan className="cls-14" x="10.43" y="16.8">v</tspan><tspan className="cls-80" x="17.02" y="16.8">e</tspan><tspan className="cls-114" x="24.04" y="16.8">c</tspan><tspan className="cls-67" x="30.49" y="16.8">t</tspan><tspan x="35.04" y="16.8">ors using </tspan><tspan className="cls-69" x="-12.85" y="33.6">S</tspan><tspan className="cls-80" x="-5.86" y="33.6">e</tspan><tspan className="cls-88" x="1.15" y="33.6">n</tspan><tspan className="cls-67" x="8.87" y="33.6">t</tspan><tspan x="13.42" y="33.6">en</tspan><tspan className="cls-67" x="28.2" y="33.6">c</tspan><tspan className="cls-80" x="34.39" y="33.6">e</tspan><tspan className="cls-31" x="41.4" y="33.6"> </tspan><tspan className="cls-95" x="43.8" y="33.6">T</tspan><tspan className="cls-103" x="50.13" y="33.6">r</tspan><tspan x="54.63" y="33.6">ans</tspan><tspan className="cls-116" x="74.7" y="33.6">f</tspan><tspan x="78.6" y="33.6">o</tspan><tspan className="cls-55" x="86.29" y="33.6">r</tspan><tspan className="cls-111" x="90.92" y="33.6">mer</tspan></text>
			<g id="sentence_transformer">
				<g className={props.focusComponent === 'sentence_transformers' ? 'cls-13-focus' : "cls-13"}>
				<path  d="M637.49,181.51c-.83,0-1.5-.67-1.5-1.5v-5.09c-.93-.07-1.85-.21-2.77-.4-1.47-.31-2.88-.78-4.23-1.39l-2.68,4.44c-.21.34-.54.59-.94.69-.4.1-.82.05-1.18-.15-4.05-2.23-7.42-5.45-9.77-9.31-.21-.34-.26-.74-.16-1.12.11-.38.36-.7.72-.9l4.64-2.58c-1.06-2.1-1.71-4.38-1.9-6.69l-5.34.02c-.42-.04-.81-.15-1.1-.43-.29-.28-.46-.66-.46-1.05,0-4.5,1.23-8.89,3.54-12.74.21-.34.54-.59.94-.69.4-.1.82-.05,1.18.15l4.65,2.56c1.37-1.91,3.11-3.57,5.1-4.9l-2.67-4.38c-.45-.74-.18-1.69.58-2.11,2.81-1.56,5.9-2.6,9.17-3.1,1.41-.21,2.8-.32,4.12-.33h.06c.83,0,1.5.67,1.5,1.5l.02,5.13c2.44.18,4.8.78,6.99,1.78l2.67-4.44c.2-.34.54-.59.94-.69.4-.1.82-.05,1.18.15,4.03,2.21,7.4,5.39,9.75,9.21.45.73.21,1.69-.54,2.11l-4.61,2.57c1.07,2.11,1.72,4.38,1.92,6.7l5.34-.04c.4-.04.81.15,1.11.43.29.28.46.66.46,1.05,0,4.56-1.24,8.96-3.57,12.82-.21.34-.55.59-.94.69-.4.1-.82.05-1.18-.15l-4.65-2.57c-1.38,1.91-3.11,3.57-5.11,4.88l2.66,4.38c.45.73.18,1.69-.57,2.1-4.03,2.22-8.63,3.4-13.3,3.4h-.05ZM637.52,172.8c.81,0,1.46.69,1.46,1.55v5.24c2.92-.21,5.77-1.02,8.38-2.38l-2.54-4.65c-.38-.69-.13-1.59.54-2,2.4-1.46,4.4-3.58,5.79-6.11.42-.77,1.36-1.03,2.11-.57l4.22,2.59c1.3-2.79,2.06-5.84,2.24-8.95l-4.93.04c-.4,0-.77-.16-1.04-.45-.28-.29-.43-.69-.43-1.1,0-2.94-.75-5.84-2.16-8.4-.2-.36-.25-.78-.15-1.18.1-.4.34-.74.68-.95l4.29-2.65c-1.63-2.56-3.72-4.76-6.15-6.47l-2.47,4.56c-.19.36-.51.62-.89.73-.38.11-.78.05-1.11-.15-2.4-1.46-5.11-2.23-7.85-2.23-.83,0-1.51-.66-1.51-1.49v-5.29c-.66.05-1.32.13-1.98.24-2.25.38-4.4,1.1-6.4,2.15l2.55,4.64c.38.69.14,1.59-.54,2-2.4,1.47-4.4,3.59-5.78,6.12-.42.77-1.36,1.03-2.11.58l-4.22-2.58c-1.28,2.77-2.03,5.78-2.22,8.87l4.94-.02c.36,0,.76.16,1.04.45.28.29.43.69.43,1.1,0,2.93.74,5.83,2.15,8.38.2.36.25.78.15,1.18-.1.4-.34.74-.68.95l-4.29,2.64c1.63,2.56,3.71,4.77,6.13,6.48l2.48-4.56c.19-.36.51-.62.89-.72.37-.11.77-.05,1.11.16,1.39.85,2.89,1.47,4.46,1.84,1.13.27,2.26.4,3.38.41.02,0,.03,0,.05,0Z"/>
				<path  d="M637.58,165.6c-4.86,0-8.81-3.95-8.81-8.81s3.95-8.81,8.81-8.81,8.81,3.95,8.81,8.81-3.95,8.81-8.81,8.81ZM637.58,150.98c-3.2,0-5.81,2.61-5.81,5.81s2.61,5.81,5.81,5.81,5.81-2.61,5.81-5.81-2.61-5.81-5.81-5.81Z"/>
				<path  d="M593.11,164.96c-.83,0-1.5-.67-1.5-1.5s.67-1.5,1.5-1.5c3.26,0,5.91-2.65,5.91-5.91,0-.83.67-1.5,1.5-1.5s1.5.67,1.5,1.5c0,4.91-4,8.91-8.91,8.91Z"/>
				<path  d="M615.79,126.58c-.83,0-1.5-.67-1.5-1.5s.67-1.5,1.5-1.5c3.26,0,5.91-2.65,5.91-5.91,0-.83.67-1.5,1.5-1.5s1.5.67,1.5,1.5c0,4.91-4,8.91-8.91,8.91Z"/>
				<path  d="M659.75,126.58c-.83,0-1.5-.67-1.5-1.5s.67-1.5,1.5-1.5c3.26,0,5.91-2.65,5.91-5.91,0-.83.67-1.5,1.5-1.5s1.5.67,1.5,1.5c0,4.91-4,8.91-8.91,8.91Z"/>
				<path  d="M681.97,164.96c-.83,0-1.5-.67-1.5-1.5s.67-1.5,1.5-1.5c3.26,0,5.91-2.65,5.91-5.91,0-.83.67-1.5,1.5-1.5s1.5.67,1.5,1.5c0,4.91-4,8.91-8.91,8.91Z"/>
				<path  d="M659.75,203.72c-.83,0-1.5-.67-1.5-1.5s.67-1.5,1.5-1.5c3.26,0,5.91-2.65,5.91-5.91,0-.83.67-1.5,1.5-1.5s1.5.67,1.5,1.5c0,4.91-4,8.91-8.91,8.91Z"/>
				<path  d="M615.79,203.72c-.83,0-1.5-.67-1.5-1.5s.67-1.5,1.5-1.5c3.26,0,5.91-2.65,5.91-5.91,0-.83.67-1.5,1.5-1.5s1.5.67,1.5,1.5c0,4.91-4,8.91-8.91,8.91Z"/>
				<path  d="M648.47,196.51h-21.39c-.81,0-1.43-.66-1.45-1.47-.11-5.31-4.52-9.62-9.82-9.62-1.79,0-3.56.5-5.1,1.44-.34.21-.76.27-1.15.17-.39-.1-.73-.35-.93-.7l-11.14-19.3c-.41-.72-.13-1.61.58-2.02,3.03-1.76,4.91-5.02,4.91-8.5s-1.88-6.74-4.91-8.5c-.72-.42-.99-1.3-.58-2.02l10.98-19.01c.2-.35.54-.61.94-.71.4-.1.82-.03,1.16.19,1.58,1,3.39,1.53,5.25,1.53,5.42,0,9.84-4.41,9.84-9.84v-.11c-.02-.4.14-.79.42-1.08.28-.29.67-.45,1.07-.45h21.28c.4,0,.78.16,1.07.44.28.28.44.67.43,1.07,0,.03,0,.13,0,.16,0,5.39,4.41,9.8,9.84,9.8,1.76,0,3.49-.48,5.02-1.39.34-.21.76-.26,1.15-.16.39.1.72.35.92.7l10.83,18.77c.2.35.25.76.15,1.14-.1.39-.36.71-.71.91-3.08,1.75-4.99,5.03-4.99,8.55s1.91,6.81,4.99,8.55c.35.2.6.53.71.91.1.39.05.8-.15,1.14l-10.98,19.02c-.41.72-1.33,1-2.05.59-1.49-.86-3.18-1.31-4.89-1.31-5.3,0-9.71,4.32-9.82,9.62-.02.81-.64,1.47-1.45,1.47ZM628.51,193.51h18.52c.86-6.24,6.28-11.09,12.7-11.09,1.73,0,3.44.35,5.03,1.03l9.59-16.6c-3.27-2.4-5.24-6.24-5.24-10.34s1.98-7.94,5.24-10.34l-9.41-16.3c-1.64.73-3.41,1.11-5.2,1.11-6.62,0-12.08-5.04-12.76-11.48h-18.41c-.68,6.44-6.14,11.48-12.76,11.48-1.9,0-3.77-.43-5.49-1.24l-9.52,16.48c3.22,2.41,5.17,6.22,5.17,10.28s-1.95,7.87-5.17,10.28l9.69,16.79c1.67-.76,3.48-1.16,5.31-1.16,6.43,0,11.84,4.86,12.7,11.09Z"/>
				<path  d="M593.11,168.89c-7.08,0-12.84-5.76-12.84-12.84s5.76-12.84,12.84-12.84c2.24,0,4.46.6,6.42,1.73h0c3.96,2.29,6.42,6.55,6.42,11.11s-2.46,8.82-6.42,11.11c-1.95,1.13-4.17,1.73-6.42,1.73ZM593.11,146.2c-5.43,0-9.84,4.41-9.84,9.84s4.41,9.84,9.84,9.84c1.72,0,3.42-.46,4.92-1.33,3.04-1.76,4.93-5.02,4.93-8.52s-1.89-6.76-4.93-8.52c-1.5-.87-3.2-1.33-4.91-1.33Z"/>
				<path  d="M615.79,130.51c-2.42,0-4.8-.69-6.86-2-3.75-2.37-5.98-6.43-5.98-10.85,0-7.08,5.76-12.84,12.84-12.84s12.73,5.68,12.83,12.66c0,.05,0,.16,0,.19,0,7.08-5.76,12.84-12.84,12.84ZM615.79,107.82c-5.43,0-9.84,4.41-9.84,9.84,0,3.38,1.72,6.49,4.59,8.31,1.58,1,3.4,1.53,5.25,1.53,5.43,0,9.84-4.42,9.84-9.84v-.11s0,0,0-.01c-.07-5.36-4.48-9.72-9.83-9.72Z"/>
				<path  d="M659.75,130.51c-7.08,0-12.84-5.76-12.84-12.84,0-.04,0-.15,0-.19.09-6.97,5.85-12.66,12.83-12.66s12.84,5.76,12.84,12.84c0,4.49-2.41,8.72-6.28,11.03-1.99,1.19-4.26,1.81-6.56,1.81ZM659.75,107.82c-5.35,0-9.77,4.36-9.83,9.72,0,.03,0,.13,0,.16,0,5.39,4.41,9.81,9.84,9.81,1.76,0,3.5-.48,5.02-1.39,3.02-1.8,4.82-4.96,4.82-8.45,0-5.43-4.41-9.84-9.84-9.84Z"/>
				<path  d="M681.97,168.89c-2.21,0-4.4-.58-6.33-1.67-4.02-2.28-6.52-6.56-6.52-11.17s2.5-8.89,6.52-11.17c1.93-1.09,4.12-1.67,6.33-1.67,7.08,0,12.84,5.76,12.84,12.84s-5.76,12.84-12.84,12.84ZM681.97,146.2c-1.69,0-3.37.44-4.84,1.28-3.08,1.75-5,5.03-5,8.56s1.91,6.81,5,8.56c1.48.84,3.15,1.28,4.84,1.28,5.43,0,9.84-4.41,9.84-9.84s-4.41-9.84-9.84-9.84Z"/>
				<path  d="M659.75,207.66c-7.08,0-12.84-5.76-12.84-12.84,0-.08,0-.16,0-.24.15-6.97,5.91-12.6,12.83-12.6,2.23,0,4.43.59,6.37,1.7h0c3.99,2.29,6.47,6.56,6.47,11.14,0,7.08-5.76,12.84-12.84,12.84ZM659.75,184.97c-5.31,0-9.72,4.32-9.83,9.63,0,.06,0,.12,0,.19,0,5.45,4.41,9.87,9.84,9.87s9.84-4.41,9.84-9.84c0-3.51-1.9-6.79-4.96-8.54h0c-1.49-.85-3.17-1.3-4.88-1.3Z"/>
				<path  d="M615.79,207.66c-7.08,0-12.84-5.76-12.84-12.84,0-4.51,2.31-8.6,6.17-10.96,2.02-1.23,4.33-1.88,6.67-1.88,6.92,0,12.68,5.63,12.83,12.56,0,.12.01.2.01.28,0,7.08-5.76,12.84-12.84,12.84ZM616.16,184.97c-1.79,0-3.56.5-5.11,1.44-3.34,2.03-5.16,5.76-4.65,9.71.57,4.43,4.21,7.98,8.65,8.47,5.92.65,10.95-3.99,10.95-9.78v-.21s-.01,0-.01,0c-.11-5.31-4.52-9.63-9.83-9.63Z"/>
				</g>
				<text className={props.focusComponent === 'sentence_transformers' ? 'cls-34-focus' : 'cls-34'} transform="translate(598.96 231.9)"><tspan x="10" y="0">Sentence</tspan><tspan className="cls-100" x="0" y="18">Transformer</tspan></text>
			</g>
			<g>
				<line className="cls-25" x1="711" y1="164.51" x2="802.88" y2="164.51"/>
				<polygon className="cls-44" points="817 164.51 797.1 172.65 801.82 164.51 797.1 156.39 817 164.51"/>
			</g>
			<text className="cls-59" transform="translate(723.91 198.33)"><tspan className="cls-32" x="0" y="0">S</tspan><tspan className="cls-50" x="6.86" y="0">t</tspan><tspan x="11.41" y="0">o</tspan><tspan className="cls-14" x="19.1" y="0">r</tspan><tspan x="23.53" y="0">e </tspan><tspan className="cls-107" x="33.52" y="0">v</tspan><tspan x="40.11" y="0">e</tspan><tspan className="cls-114" x="47.12" y="0">c</tspan><tspan className="cls-50" x="53.58" y="0">t</tspan><tspan className="cls-111" x="58.13" y="0">ors </tspan><tspan x="-18.3" y="16.8">i</tspan><tspan className="cls-88" x="-15.02" y="16.8">n</tspan><tspan className="cls-67" x="-7.31" y="16.8">t</tspan><tspan x="-2.76" y="16.8" xmlSpace="preserve">o  </tspan><tspan className="cls-14" x="10.86" y="16.8">v</tspan><tspan x="17.46" y="16.8">e</tspan><tspan className="cls-120" x="24.47" y="16.8">c</tspan><tspan className="cls-67" x="30.93" y="16.8">t</tspan><tspan x="35.48" y="16.8">or d</tspan><tspan className="cls-88" x="58.6" y="16.8">a</tspan><tspan x="65.3" y="16.8">tbase</tspan></text>
			<g id="Vector_db">
				<text className="cls-34" transform="translate(832.56 251.1)"><tspan className="cls-113" x="0" y="0">V</tspan><tspan x="8.4" y="0">e</tspan><tspan className="cls-121" x="16.42" y="0">c</tspan><tspan className="cls-73" x="23.79" y="0">t</tspan><tspan className="cls-100" x="28.99" y="0">or D</tspan><tspan className="cls-85" x="57.06" y="0">a</tspan><tspan x="64.7" y="0">tabase</tspan></text>
				<g>
				<ellipse className="cls-18" cx="888.04" cy="93.77" rx="52.8" ry="12.55"/>
				<line className="cls-17" x1="941.71" y1="94.2" x2="941.71" y2="214.51"/>
				<line className="cls-17" x1="835.24" y1="95.06" x2="835.24" y2="214.51"/>
				<path className="cls-18" d="M941.71,213.21c0,6.93-23.64,12.55-52.8,12.55s-52.8-5.62-52.8-12.55"/>
				<path className="cls-18" d="M941.89,183.35c0,6.93-23.64,12.55-52.8,12.55s-52.8-5.62-52.8-12.55"/>
				<path className="cls-18" d="M941.89,153.49c0,6.93-23.64,12.55-52.8,12.55s-52.8-5.62-52.8-12.55"/>
				<path className="cls-18" d="M941.8,123.63c0,6.93-23.64,12.55-52.8,12.55s-52.8-5.62-52.8-12.55"/>
				<text className="cls-11" transform="translate(851.09 123.04) rotate(11.13)"><tspan x="0" y="0">0</tspan></text>
				<text className="cls-11" transform="translate(858.4 124.46) rotate(7.79)"><tspan x="0" y="0">1</tspan></text>
				<text className="cls-11" transform="translate(865.66 125.41) rotate(5.93)"><tspan x="0" y="0"> </tspan></text>
				<text className="cls-11" transform="translate(868.68 125.73) rotate(4.95)"><tspan x="0" y="0"> </tspan></text>
				<text className="cls-11" transform="translate(871.68 125.98) rotate(4.04)"><tspan x="0" y="0"> </tspan></text>
				<text className="cls-11" transform="translate(874.71 126.2) rotate(3.18)"><tspan x="0" y="0"> </tspan></text>
				<text className="cls-11" transform="translate(877.73 126.37) rotate(2.34)"><tspan x="0" y="0"> </tspan></text>
				<text className="cls-11" transform="translate(880.73 126.49) rotate(1.55)"><tspan x="0" y="0"> </tspan></text>
				<text className="cls-11" transform="translate(883.78 126.57) rotate(.59)"><tspan x="0" y="0">-</tspan></text>
				<text className="cls-11" transform="translate(888.12 126.64) rotate(-.88)"><tspan x="0" y="0">0</tspan></text>
				<text className="cls-11" transform="translate(895.36 126.5) rotate(-2.22)"><tspan x="0" y="0">.</tspan></text>
				<text className="cls-11" transform="translate(898.38 126.41) rotate(-3.65)"><tspan x="0" y="0">0</tspan></text>
				<text className="cls-11" transform="translate(905.72 125.94) rotate(-5.9)"><tspan x="0" y="0">9</tspan></text>
				<text className="cls-11" transform="translate(913.07 125.18) rotate(-8.62)"><tspan x="0" y="0">8</tspan></text>
				<text className="cls-11" transform="translate(852.98 150.85) rotate(10.77)"><tspan x="0" y="0">0</tspan></text>
				<text className="cls-11" transform="translate(860.3 152.22) rotate(7.53)"><tspan x="0" y="0">2</tspan></text>
				<text className="cls-11" transform="translate(867.54 153.14) rotate(5.7)"><tspan x="0" y="0"> </tspan></text>
				<text className="cls-11" transform="translate(870.57 153.44) rotate(4.75)"><tspan x="0" y="0"> </tspan></text>
				<text className="cls-11" transform="translate(873.58 153.69) rotate(3.85)"><tspan x="0" y="0"> </tspan></text>
				<text className="cls-11" transform="translate(876.61 153.89) rotate(2.99)"><tspan x="0" y="0"> </tspan></text>
				<text className="cls-11" transform="translate(879.63 154.05) rotate(2.16)"><tspan x="0" y="0"> </tspan></text>
				<text className="cls-11" transform="translate(882.64 154.16) rotate(1.37)"><tspan x="0" y="0"> </tspan></text>
				<text className="cls-11" transform="translate(885.66 154.23) rotate(.59)"><tspan x="0" y="0"> </tspan></text>
				<text className="cls-11" transform="translate(888.65 154.28) rotate(-.7)"><tspan x="0" y="0">0</tspan></text>
				<text className="cls-11" transform="translate(895.91 154.17) rotate(-2.04)"><tspan x="0" y="0">.</tspan></text>
				<text className="cls-11" transform="translate(898.93 154.09) rotate(-3.46)"><tspan x="0" y="0">2</tspan></text>
				<text className="cls-11" transform="translate(906.26 153.64) rotate(-5.67)"><tspan x="0" y="0">3</tspan></text>
				<text className="cls-11" transform="translate(913.61 152.91) rotate(-8.34)"><tspan x="0" y="0">0</tspan></text>
				<text className="cls-11" transform="translate(853.58 182.09) rotate(11.58)"><tspan x="0" y="0">.</tspan></text>
				<text className="cls-11" transform="translate(856.54 182.69) rotate(10.03)"><tspan x="0" y="0">.</tspan></text>
				<text className="cls-11" transform="translate(859.5 183.21) rotate(8.69)"><tspan x="0" y="0">.</tspan></text>
				<text className="cls-11" transform="translate(862.47 183.67) rotate(7.49)"><tspan x="0" y="0"> </tspan></text>
				<text className="cls-11" transform="translate(865.49 184.06) rotate(6.4)"><tspan x="0" y="0"> </tspan></text>
				<text className="cls-11" transform="translate(868.51 184.4) rotate(5.39)"><tspan x="0" y="0"> </tspan></text>
				<text className="cls-11" transform="translate(871.55 184.68) rotate(4.45)"><tspan x="0" y="0"> </tspan></text>
				<text className="cls-11" transform="translate(874.55 184.92) rotate(3.57)"><tspan x="0" y="0"> </tspan></text>
				<text className="cls-11" transform="translate(877.58 185.1) rotate(2.72)"><tspan x="0" y="0"> </tspan></text>
				<text className="cls-11" transform="translate(880.59 185.25) rotate(1.9)"><tspan x="0" y="0"> </tspan></text>
				<text className="cls-11" transform="translate(883.63 185.35) rotate(.94)"><tspan x="0" y="0">-</tspan></text>
				<text className="cls-11" transform="translate(887.98 185.44) rotate(-.53)"><tspan x="0" y="0">0</tspan></text>
				<text className="cls-11" transform="translate(895.21 185.35) rotate(-1.86)"><tspan x="0" y="0">.</tspan></text>
				<text className="cls-11" transform="translate(898.22 185.28) rotate(-3.25)"><tspan x="0" y="0">0</tspan></text>
				<text className="cls-11" transform="translate(905.57 184.86) rotate(-5.45)"><tspan x="0" y="0">0</tspan></text>
				<text className="cls-11" transform="translate(912.9 184.16) rotate(-8.05)"><tspan x="0" y="0">8</tspan></text>
				<text className="cls-11" transform="translate(852.48 212.39) rotate(10.44)"><tspan x="0" y="0">n</tspan></text>
				<text className="cls-11" transform="translate(860.29 213.77) rotate(8)"><tspan x="0" y="0"> </tspan></text>
				<text className="cls-11" transform="translate(863.32 214.19) rotate(6.86)"><tspan x="0" y="0"> </tspan></text>
				<text className="cls-11" transform="translate(866.35 214.56) rotate(5.81)"><tspan x="0" y="0"> </tspan></text>
				<text className="cls-11" transform="translate(869.38 214.86) rotate(4.85)"><tspan x="0" y="0"> </tspan></text>
				<text className="cls-11" transform="translate(872.39 215.12) rotate(3.94)"><tspan x="0" y="0"> </tspan></text>
				<text className="cls-11" transform="translate(875.41 215.32) rotate(3.08)"><tspan x="0" y="0"> </tspan></text>
				<text className="cls-11" transform="translate(878.42 215.49) rotate(2.25)"><tspan x="0" y="0"> </tspan></text>
				<text className="cls-11" transform="translate(881.44 215.6) rotate(1.45)"><tspan x="0" y="0"> </tspan></text>
				<text className="cls-11" transform="translate(884.46 215.68) rotate(.68)"><tspan x="0" y="0"> </tspan></text>
				<text className="cls-11" transform="translate(887.47 215.74) rotate(-.62)"><tspan x="0" y="0">0</tspan></text>
				<text className="cls-11" transform="translate(894.69 215.64) rotate(-1.95)"><tspan x="0" y="0">.</tspan></text>
				<text className="cls-11" transform="translate(897.71 215.56) rotate(-3.36)"><tspan x="0" y="0">9</tspan></text>
				<text className="cls-11" transform="translate(905.04 215.13) rotate(-5.56)"><tspan x="0" y="0">8</tspan></text>
				<text className="cls-11" transform="translate(912.41 214.41) rotate(-8.2)"><tspan x="0" y="0">7</tspan></text>
				</g>
			</g>
			<g id="MyGPT_ui">
				<text className="cls-34" transform="translate(73.4 565.04)"><tspan className="cls-47" x="0" y="0">M</tspan><tspan className="cls-100" x="12.98" y="0">yGPT </tspan><tspan className="cls-40" x="-20.86" y="19.2">U</tspan><tspan x="-10.61" y="19.2">ser </tspan><tspan className="cls-78" x="12.37" y="19.2">I</tspan><tspan className="cls-85" x="16.35" y="19.2">n</tspan><tspan className="cls-40" x="25.17" y="19.2">t</tspan><tspan x="30.37" y="19.2">e</tspan><tspan className="cls-89" x="38.38" y="19.2">r</tspan><tspan x="44.1" y="19.2">fa</tspan><tspan className="cls-40" x="56.48" y="19.2">c</tspan><tspan className="cls-100" x="63.55" y="19.2">e</tspan></text>
				<g>
				<rect className="cls-18" x="21.75" y="394.24" width="154" height="117" rx="9.58" ry="9.58"/>
				<rect className="cls-18" x="29.75" y="401.74" width="138" height="101" rx="8.45" ry="8.45"/>
				<path className="cls-18" d="M124.91,532.25c-10.36,0-18.75-8.65-18.75-19.31,0-.69.04-1.36.1-2.03h-4.6v-.1h-8.54c.07.67.11,1.35.11,2.03,0,10.67-9.06,19.31-20.23,19.31-1.95,0-3.83-.27-5.62-.76v7.37h30.96v.1h31.78v-7.37c-1.65.49-3.4.76-5.21.76Z"/>
				<path className="cls-13" d="M62.19,467.16c-4.27,0-7.74-3.47-7.74-7.74v-.52c0-.63.51-1.14,1.14-1.14s1.14.51,1.14,1.14v.52c0,3.01,2.45,5.47,5.47,5.47s5.47-2.45,5.47-5.47v-.52c0-.63.51-1.14,1.14-1.14s1.14.51,1.14,1.14v.52c0,4.27-3.47,7.74-7.74,7.74Z"/>
				<path className="cls-13" d="M82.78,478.68h-40.97c-.32,0-.63-.14-.85-.38-.22-.24-.32-.56-.28-.88l1.55-14.12c.03-3.06,2.54-5.54,5.61-5.54h9.55v-4.14c0-.41.22-.78.57-.98.35-.2.78-.21,1.14,0,2.04,1.16,4.34,1.13,6.39-.11.35-.21.79-.22,1.15-.02.36.2.58.58.58.99v4.27h9.55c3.07,0,5.57,2.48,5.61,5.54l1.55,14.12c.03.32-.07.64-.28.88-.22.24-.52.38-.85.38ZM43.08,476.4h38.43l-1.42-12.92s0-.08,0-.12c0-1.84-1.49-3.33-3.33-3.33h-10.69c-.63,0-1.14-.51-1.14-1.14v-3.61c-1.71.6-3.55.62-5.26.07v3.54c0,.63-.51,1.14-1.14,1.14h-10.69c-1.84,0-3.33,1.49-3.33,3.33,0,.04,0,.08,0,.12l-1.42,12.92Z"/>
				<path className="cls-13" d="M62.19,455.75c-1.47,0-2.89-.39-4.23-1.15-3.92-2.23-6.46-7.33-6.46-13.01,0-.45.02-.89.05-1.33.04-.59.52-1.05,1.11-1.06,4.29-.1,8.17-2.05,9.89-4.96.19-.33.54-.54.92-.56.39-.02.75.15.97.46,1.55,2.08,4.22,3.57,7.33,4.09.5.08.88.48.94.98.11.85.16,1.63.16,2.39,0,5.52-2.44,10.57-6.22,12.86-1.41.86-2.92,1.29-4.47,1.29ZM53.78,441.42c0,.06,0,.11,0,.17,0,4.87,2.08,9.2,5.3,11.03,2.04,1.16,4.34,1.13,6.39-.11,3.11-1.89,5.12-6.17,5.12-10.92,0-.42-.02-.85-.06-1.29-2.74-.61-5.17-1.89-6.91-3.64-2.18,2.67-5.77,4.42-9.84,4.76Z"/>
				<path className="cls-13" d="M52.69,441.48c-.31,0-.61-.13-.82-.35-.22-.23-.33-.55-.31-.87.51-7.31,5.08-12.82,10.64-12.82,5.23,0,9.65,4.95,10.53,11.76.05.36-.08.72-.34.96-.26.25-.63.36-.98.3-3.09-.52-5.84-1.88-7.77-3.81-2.37,2.9-6.4,4.71-10.91,4.82,0,0-.02,0-.03,0ZM62.19,429.72c-3.95,0-7.4,4.03-8.22,9.4,3.75-.42,7.04-2.26,8.58-4.88.19-.33.54-.54.92-.56.39-.02.75.15.97.46,1.27,1.71,3.31,3.02,5.72,3.72-1.12-4.8-4.31-8.14-7.97-8.14Z"/>
				<path className="cls-13" d="M47.37,478.68c-.63,0-1.14-.51-1.14-1.14v-3.47c0-.63.51-1.14,1.14-1.14s1.14.51,1.14,1.14v3.47c0,.63-.51,1.14-1.14,1.14Z"/>
				<path className="cls-13" d="M52.12,478.68c-.63,0-1.14-.51-1.14-1.14v-3.47c0-.63.51-1.14,1.14-1.14s1.14.51,1.14,1.14v3.47c0,.63-.51,1.14-1.14,1.14Z"/>
				<path className="cls-13" d="M56.87,478.68c-.63,0-1.14-.51-1.14-1.14v-3.47c0-.63.51-1.14,1.14-1.14s1.14.51,1.14,1.14v3.47c0,.63-.51,1.14-1.14,1.14Z"/>
				<path className="cls-13" d="M61.61,478.68c-.63,0-1.14-.51-1.14-1.14v-3.47c0-.63.51-1.14,1.14-1.14s1.14.51,1.14,1.14v3.47c0,.63-.51,1.14-1.14,1.14Z"/>
				<path className="cls-13" d="M66.36,478.68c-.63,0-1.14-.51-1.14-1.14v-3.47c0-.63.51-1.14,1.14-1.14s1.14.51,1.14,1.14v3.47c0,.63-.51,1.14-1.14,1.14Z"/>
				<path className="cls-13" d="M71.1,478.68c-.63,0-1.14-.51-1.14-1.14v-3.47c0-.63.51-1.14,1.14-1.14s1.14.51,1.14,1.14v3.47c0,.63-.51,1.14-1.14,1.14Z"/>
				<path className="cls-13" d="M75.85,478.68c-.63,0-1.14-.51-1.14-1.14v-3.47c0-.63.51-1.14,1.14-1.14s1.14.51,1.14,1.14v3.47c0,.63-.51,1.14-1.14,1.14Z"/>
				<path className="cls-26" d="M148.46,415.51h-41c-4.83,0-8.79,3.95-8.79,8.79v15.26l-2.21,4.5-3.93,8.01,6.97-.66c1.4,3,4.44,5.1,7.96,5.1h41c4.83,0,8.79-3.95,8.79-8.79v-23.43c0-4.83-3.95-8.79-8.79-8.79Z"/>
				<text className="cls-9" transform="translate(106.32 439.78)"><tspan x="0" y="0">Q</tspan></text>
				<line className="cls-26" x1="119.17" y1="433.15" x2="146.5" y2="433.15"/>
				<line className="cls-26" x1="127.96" y1="438.48" x2="150.66" y2="438.48"/>
				<path className="cls-26" d="M106.53,464.04h37.68c4.44,0,8.07,2.26,8.07,5.03v8.74l2.03,2.58,3.61,4.58-6.4-.38c-1.29,1.72-4.08,2.92-7.32,2.92h-37.68c-4.44,0-8.07-2.26-8.07-5.03v-13.41c0-2.77,3.63-5.03,8.07-5.03Z"/>
				<text className="cls-12" transform="translate(102.7 480.24)"><tspan x="0" y="0" xmlSpace="preserve"> A ...</tspan></text>
				</g>
			</g>
			<g>
				<line className="cls-24" x1="412.49" y1="396.98" x2="548.99" y2="260.48"/>
				<polygon className="cls-43" points="558.98 250.49 550.66 270.31 548.25 261.22 539.16 258.81 558.98 250.49"/>
			</g>
			<g>
				<rect className="cls-18" x="308.43" y="413.1" width="128" height="115.92" rx="6.91" ry="6.91"/>
				<rect className="cls-18" x="319.43" y="427.1" width="104" height="26"/>
				<text className="cls-6" transform="translate(330.12 444.2)"><tspan x="0" y="0">Q</tspan></text>
				<line className="cls-26" x1="353.04" y1="436.19" x2="408.04" y2="436.19"/>
				<line className="cls-26" x1="376.49" y1="440.81" x2="407.49" y2="440.81"/>
				<text className="cls-35" transform="translate(330.71 565.46)"><tspan className="cls-73" x="0" y="0">U</tspan><tspan x="10.26" y="0">ser </tspan><tspan className="cls-98" x="33.23" y="0">Q</tspan><tspan x="44.3" y="0">ue</tspan><tspan className="cls-37" x="61.14" y="0">r</tspan><tspan x="66.77" y="0">y</tspan></text>
			</g>
			<g>
				<line className="cls-24" x1="195" y1="461.51" x2="286.88" y2="461.51"/>
				<polygon className="cls-43" points="301 461.51 281.1 469.65 285.82 461.51 281.1 453.39 301 461.51"/>
			</g>
			<g>
				<rect className="cls-18" x="569.11" y="412.74" width="128" height="117.27" rx="6.91" ry="6.91"/>
				<rect className="cls-18" x="580.11" y="426.74" width="104" height="26"/>
				<text className="cls-10" transform="translate(587.86 444.84)"><tspan className="cls-5" x="0" y="0">Q</tspan><tspan className="cls-70" x="11.26" y="0" xmlSpace="preserve">       0.250</tspan></text>
				<text className="cls-35" transform="translate(585.23 565.1)"><tspan className="cls-98" x="0" y="0">Q</tspan><tspan x="11.07" y="0">ue</tspan><tspan className="cls-37" x="27.9" y="0">r</tspan><tspan className="cls-72" x="33.54" y="0">y </tspan><tspan className="cls-109" x="44.46" y="0">v</tspan><tspan className="cls-100" x="52" y="0">e</tspan><tspan className="cls-121" x="60.01" y="0">c</tspan><tspan className="cls-40" x="67.39" y="0">t</tspan><tspan className="cls-100" x="72.59" y="0">or</tspan></text>
			</g>
			<g>
				<line className="cls-24" x1="635.78" y1="260.51" x2="635.78" y2="388.43"/>
				<polygon className="cls-43" points="635.78 402.55 627.65 382.65 635.78 387.37 643.91 382.65 635.78 402.55"/>
			</g>
			<g id="Prompt">
				<rect className={props.focusComponent === 'llm_parameters' ? 'cls-18-focus' : 'cls-18'} x="829.79" y="412.74" width="128" height="116.27" rx="6.91" ry="6.91"/>
				<rect className={props.focusComponent === 'llm_parameters' ? 'cls-18-focus' : 'cls-18'} x="840.79" y="426.74" width="104" height="26"/>
				<text className={props.focusComponent === 'llm_parameters' ? 'cls-6-focus cls-6' : 'cls-6'} transform="translate(851.48 443.84)"><tspan x="0" y="0">Q</tspan></text>
				<line className={props.focusComponent === 'llm_parameters' ? 'cls-26-focus' : 'cls-26'} x1="874.4" y1="435.84" x2="929.4" y2="435.84"/>
				<line className={props.focusComponent === 'llm_parameters' ? 'cls-26-focus' : 'cls-26'} x1="897.85" y1="440.45" x2="928.85" y2="440.45"/>
				<text className={props.focusComponent === 'llm_parameters' ? 'cls-35-focus cls-35' : 'cls-35'} transform="translate(842.67 566.1)"><tspan className="cls-83" x="0" y="0">P</tspan><tspan className="cls-109" x="8.26" y="0">r</tspan><tspan className="cls-72" x="13.33" y="0">ompt </tspan><tspan className="cls-117" x="53.25" y="0">f</tspan><tspan className="cls-100" x="57.71" y="0">or LLM</tspan></text>
				<rect className={props.focusComponent === 'llm_parameters' ? 'cls-18-focus' : 'cls-18'} x="840.79" y="461.12" width="104" height="54.39"/>
				<text className={props.focusComponent === 'llm_parameters' ? 'cls-6-focus cls-6' : 'cls-6'} transform="translate(846.8 478.22)"><tspan className="cls-83" x="0" y="0">C</tspan><tspan className="cls-100" x="9.15" y="0">o</tspan><tspan className="cls-119" x="18.18" y="0">n</tspan><tspan className="cls-73" x="27.25" y="0">t</tspan><tspan className="cls-86" x="32.77" y="0">e</tspan><tspan className="cls-121" x="40.9" y="0">x</tspan><tspan x="49.01" y="0">t</tspan></text>
				<line className={props.focusComponent === 'llm_parameters' ? 'cls-26-focus' : 'cls-26'} x1="874.4" y1="487.22" x2="929.4" y2="487.22"/>
				<line className={props.focusComponent === 'llm_parameters' ? 'cls-26-focus' : 'cls-26'} x1="897.85" y1="492.84" x2="928.85" y2="492.84"/>
				<line className={props.focusComponent === 'llm_parameters' ? 'cls-26-focus' : 'cls-26'} x1="874.29" y1="498.81" x2="929.29" y2="498.81"/>
				<line className={props.focusComponent === 'llm_parameters' ? 'cls-26-focus' : 'cls-26'} x1="873.32" y1="504.51" x2="904.32" y2="504.51"/>
			</g>
			<g id="Answer">
				<rect className="cls-18" x="1090.47" y="404.97" width="128" height="152.04" rx="6.91" ry="6.91"/>
				<rect className="cls-18" x="1103.5" y="483.5" width="104" height="63.04"/>
				<text className="cls-2" transform="translate(1113.82 502.6)"><tspan className="cls-33"><tspan className="cls-93" x="0" y="0">S</tspan><tspan x="8.4" y="0">ou</tspan><tspan className="cls-48" x="26.53" y="0">rc</tspan><tspan x="39.12" y="0">e</tspan></tspan><tspan className="cls-106"><tspan className="cls-62" x="0" y="14.4">P</tspan><tspan x="6.56" y="14.4">ublic</tspan><tspan className="cls-40" x="31.96" y="14.4">a</tspan><tspan x="37.98" y="14.4">tion title</tspan></tspan><tspan className="cls-106"><tspan className="cls-36" x="0" y="28.8">P</tspan><tspan className="cls-75" x="6.46" y="28.8">age</tspan></tspan></text>
				<text className="cls-35" transform="translate(1130.98 577.34)"><tspan className="cls-15" x="0" y="0">A</tspan><tspan x="9.74" y="0">ns</tspan><tspan className="cls-109" x="24.96" y="0">w</tspan><tspan className="cls-100" x="36.58" y="0">er</tspan></text>
				<rect className="cls-18" x="1103.47" y="419.35" width="104" height="54.39"/>
				<text className="cls-6" transform="translate(1109.96 436.46)"><tspan className="cls-115" x="0" y="0">A</tspan><tspan className="cls-72" x="10.1" y="0">ns</tspan><tspan className="cls-122" x="25.92" y="0">w</tspan><tspan x="37.7" y="0">er</tspan></text>
				<line className="cls-26" x1="1137.08" y1="445.45" x2="1192.08" y2="445.45"/>
				<line className="cls-26" x1="1136.97" y1="457.05" x2="1191.97" y2="457.05"/>
				<line className="cls-26" x1="1136" y1="462.75" x2="1167" y2="462.75"/>
				<line className="cls-26" x1="1158.53" y1="451.07" x2="1189.53" y2="451.07"/>
			</g>
			<g id="LLMs">
				<g className={props.focusComponent === 'llms' ? 'cls-13-focus' : 'cls-13'}>
				<path  d="M1127.6,151.62c-.25,0-.5-.05-.73-.17l-44.63-21.43c-.84-.4-1.19-1.41-.79-2.25.4-.84,1.41-1.19,2.25-.79l44.01,21.13,47.25-16.15c.88-.3,1.84.17,2.14,1.05.3.88-.17,1.84-1.05,2.14l-47.9,16.38c-.18.06-.36.09-.55.09Z"/>
				<path  d="M1174.68,158.12s-.02,0-.03,0c-.93-.02-1.67-.78-1.66-1.71l.25-15.12c.02-.92.77-1.66,1.68-1.66,0,0,.02,0,.03,0,.93.01,1.67.78,1.66,1.71l-.25,15.12c-.02.92-.77,1.66-1.68,1.66Z"/>
				<path  d="M1126.97,208.33c-.28,0-.56-.07-.82-.21l-45.29-25.08c-.54-.3-.87-.86-.87-1.47v-46.18c0-.93.76-1.69,1.68-1.69s1.69.75,1.69,1.69v45.19l43.62,24.16,7.49-3.96c.82-.43,1.84-.12,2.28.7.44.82.12,1.84-.7,2.28l-8.29,4.38c-.25.13-.52.2-.79.2Z"/>
				<path  d="M1175.5,135.25c-.21,0-.42-.04-.63-.12l-47.37-19.02-44.08,12.37c-.9.25-1.83-.27-2.08-1.17-.25-.9.27-1.83,1.17-2.08l44.64-12.53c.36-.1.74-.08,1.08.06l47.91,19.23c.86.35,1.28,1.33.94,2.19-.26.66-.9,1.06-1.56,1.06Z"/>
				<path  d="M1084.6,181.97c-.69,0-1.34-.43-1.59-1.12-.31-.88.14-1.84,1.02-2.15l7.62-2.73c.88-.31,1.84.14,2.15,1.02.31.88-.14,1.84-1.02,2.16l-7.62,2.73c-.19.07-.38.1-.57.1ZM1098.88,176.85c-.69,0-1.34-.43-1.59-1.12-.31-.88.14-1.84,1.02-2.16l7.61-2.73c.88-.31,1.84.14,2.16,1.02.31.88-.14,1.84-1.02,2.15l-7.62,2.73c-.19.07-.38.1-.57.1ZM1113.15,171.73c-.69,0-1.34-.43-1.59-1.12-.31-.87.14-1.84,1.02-2.15l7.61-2.73c.88-.31,1.84.14,2.16,1.02.31.88-.14,1.84-1.02,2.16l-7.62,2.73c-.19.07-.38.1-.57.1ZM1127.43,166.61c-.69,0-1.34-.43-1.59-1.12-.31-.88.14-1.84,1.02-2.16l.64-.23c.88-.31,1.84.14,2.15,1.02.31.88-.14,1.84-1.02,2.16l-.64.23c-.19.07-.38.1-.57.1Z"/>
				<path  d="M1127.53,150.55c-.93,0-1.69-.75-1.69-1.69v-33.37c0-.93.76-1.68,1.69-1.68s1.68.75,1.68,1.68v33.37c0,.93-.75,1.69-1.68,1.69Z"/>
				<path  d="M1127.56,206.55h-.02c-.93-.01-1.68-.78-1.66-1.71l.74-54.93c.01-.93.77-1.68,1.71-1.66.93.01,1.68.78,1.66,1.71l-.75,54.93c-.01.92-.76,1.66-1.68,1.66Z"/>
				<g>
					<path  d="M1167.75,183.84c-.25,0-.49-.05-.72-.16l-32-15.19c-.84-.4-1.2-1.4-.8-2.25.4-.84,1.4-1.2,2.24-.8l31.31,14.86,29.82-12.97c.85-.37,1.85.02,2.22.87.37.85-.02,1.85-.87,2.22l-30.53,13.27c-.21.09-.44.14-.67.14Z"/>
					<path  d="M1165.87,220.8c-.28,0-.56-.07-.81-.21l-30.59-16.85c-.54-.3-.87-.86-.87-1.48v-36.21c0-.93.75-1.68,1.69-1.68s1.69.75,1.69,1.68v35.21l28.88,15.91,29.94-17.43.5-22.81c.02-.93.79-1.67,1.72-1.65.93.02,1.67.79,1.65,1.72l-.52,23.76c-.01.59-.33,1.12-.84,1.42l-31.58,18.38c-.26.15-.55.23-.85.23Z"/>
					<path  d="M1198.27,169.87c-.22,0-.45-.04-.66-.14l-29.94-12.84-31.4,10.24c-.89.29-1.84-.19-2.12-1.08-.29-.88.19-1.84,1.08-2.13l32-10.44c.39-.13.81-.11,1.19.05l30.52,13.1c.86.37,1.25,1.36.88,2.21-.27.64-.9,1.02-1.55,1.02Z"/>
					<path  d="M1166.37,219.6h-.04c-.93-.02-1.67-.79-1.65-1.73l.69-28.98c.02-.93.8-1.67,1.72-1.65.93.02,1.67.8,1.64,1.73l-.69,28.98c-.02.92-.77,1.65-1.68,1.65Z"/>
				</g>
				</g>
				<text className={props.focusComponent === 'llms' ? 'cls-71 cls-71-focus' : "cls-71"} transform="translate(1129.44 251.09)"><tspan x="0" y="0">LLMs</tspan></text>
			</g>
			<text className="cls-4" transform="translate(189.46 144.11) rotate(.01)"><tspan className="cls-64" x="0" y="0">P</tspan><tspan className="cls-52" x="9.85" y="0">r</tspan><tspan className="cls-105" x="16.09" y="0">e</tspan><tspan className="cls-74" x="25.9" y="0">-p</tspan><tspan className="cls-52" x="42.1" y="0">r</tspan><tspan x="48.35" y="0">o</tspan><tspan className="cls-52" x="58.5" y="0">c</tspan><tspan x="66.42" y="0">essing</tspan></text>
			<text className="cls-1" transform="translate(1044.38 73.71) scale(1.03 1)"><tspan className="cls-58" x="0" y="0">LLM se</tspan><tspan className="cls-57" x="41.34" y="0">r</tspan><tspan className="cls-56" x="46.63" y="0">v</tspan><tspan className="cls-58" x="53.56" y="0">er</tspan><tspan className="cls-63" x="65.77" y="0"> </tspan></text>
			<text className="cls-3" transform="translate(199.06 422.75)"><tspan className="cls-96" x="0" y="0">R</tspan><tspan x="10.3" y="0">eal-time </tspan><tspan x="21.25" y="21.6">Q&amp;A</tspan></text>
			<text className="cls-59" transform="translate(708.46 347.4) rotate(-45)"><tspan x="0" y="0">Simila</tspan><tspan className="cls-55" x="35.18" y="0">r</tspan><tspan x="39.82" y="0">i</tspan><tspan className="cls-90" x="43.09" y="0">t</tspan><tspan x="47.85" y="0">y sea</tspan><tspan className="cls-14" x="76.72" y="0">r</tspan><tspan x="81.16" y="0">ch </tspan></text>
			<text className="cls-59" transform="translate(841.82 329.83)"><tspan x="0" y="0">Similar </tspan><tspan x="3.67" y="16.8">chunk </tspan><tspan className="cls-14" x="2" y="33.6">r</tspan><tspan className="cls-80" x="6.44" y="33.6">et</tspan><tspan className="cls-55" x="18.09" y="33.6">r</tspan><tspan x="22.72" y="33.6">i</tspan><tspan className="cls-88" x="26" y="33.6">v</tspan><tspan x="32.68" y="33.6">al</tspan></text>
			<text className="cls-59" transform="translate(446.84 351.48) rotate(-45)"><tspan className="cls-112" x="0" y="0">V</tspan><tspan x="7.35" y="0">e</tspan><tspan className="cls-120" x="14.36" y="0">c</tspan><tspan className="cls-67" x="20.82" y="0">t</tspan><tspan x="25.37" y="0">o</tspan><tspan className="cls-55" x="33.05" y="0">r</tspan><tspan x="37.69" y="0">i</tspan><tspan className="cls-87" x="40.96" y="0">z</tspan><tspan className="cls-80" x="46.86" y="0">e que</tspan><tspan className="cls-39" x="79.45" y="0">r</tspan><tspan x="84.38" y="0">y</tspan></text>
			<line className="cls-24" x1="1150" y1="587.51" x2="1150" y2="619.51"/>
			<line className="cls-24" x1="97" y1="619.51" x2="1150" y2="619.51"/>
			<g>
				<line className="cls-24" x1="97" y1="599.45" x2="97" y2="619.51"/>
				<polygon className="cls-43" points="89.59 605.07 97 601.92 104.41 605.07 97 587.51 89.59 605.07"/>
			</g>
			<g>
				<line className="cls-25" x1="459" y1="162.51" x2="550.88" y2="162.51"/>
				<polygon className="cls-44" points="565 162.51 545.1 170.65 549.82 162.51 545.1 154.39 565 162.51"/>
			</g>
			<g>
				<line className="cls-24" x1="674.22" y1="394.06" x2="810.72" y2="257.56"/>
				<polygon className="cls-43" points="820.71 247.57 812.39 267.39 809.98 258.3 800.89 255.89 820.71 247.57"/>
			</g>
			<g>
				<line className="cls-24" x1="892.47" y1="261.8" x2="892.47" y2="389.71"/>
				<polygon className="cls-43" points="892.47 403.83 884.34 383.93 892.47 388.66 900.6 383.93 892.47 403.83"/>
			</g>
			<g>
				<line className="cls-24" x1="938.22" y1="397.06" x2="1074.72" y2="260.56"/>
				<polygon className="cls-43" points="1084.71 250.57 1076.39 270.39 1073.98 261.3 1064.89 258.89 1084.71 250.57"/>
			</g>
			<g>
				<line className="cls-24" x1="1149.47" y1="258.8" x2="1149.47" y2="386.71"/>
				<polygon className="cls-43" points="1149.47 400.83 1141.34 380.93 1149.47 385.66 1157.6 380.93 1149.47 400.83"/>
			</g>
			<text className="cls-59" transform="translate(507.67 634.14)"><tspan className="cls-46" x="0" y="0">R</tspan><tspan x="7.59" y="0">espond with </tspan><tspan className="cls-32" x="83.38" y="0">A</tspan><tspan x="91.91" y="0">ns</tspan><tspan className="cls-107" x="105.22" y="0">w</tspan><tspan x="115.39" y="0">er and sou</tspan><tspan className="cls-107" x="176.27" y="0">r</tspan><tspan className="cls-67" x="180.71" y="0">c</tspan><tspan className="cls-81" x="186.9" y="0">e</tspan></text>
			<text className="cls-59" transform="translate(942.03 364.28) rotate(-45)"><tspan className="cls-69" x="0" y="0">S</tspan><tspan className="cls-80" x="6.99" y="0">end que</tspan><tspan className="cls-38" x="55.24" y="0">r</tspan><tspan x="60.17" y="0">y </tspan><tspan className="cls-67" x="69.73" y="0">t</tspan><tspan x="74.28" y="0">o LLM with </tspan><tspan x="18.53" y="16.8">chunks as </tspan><tspan className="cls-67" x="78.39" y="16.8">c</tspan><tspan x="84.58" y="16.8">o</tspan><tspan className="cls-88" x="92.27" y="16.8">n</tspan><tspan className="cls-67" x="99.98" y="16.8">t</tspan><tspan className="cls-41" x="104.53" y="16.8">e</tspan><tspan className="cls-114" x="111.5" y="16.8">x</tspan><tspan x="118.17" y="16.8">t</tspan></text>
			<text className="cls-7" transform="translate(589.34 90.02)"><tspan className="cls-32" x="0" y="0">C</tspan><tspan x="8.19" y="0">h</tspan><tspan className="cls-53" x="16.2" y="0">r</tspan><tspan className="cls-111" x="21.06" y="0">oma*</tspan></text>
			<text className="cls-60" transform="translate(1068.61 102.34)"><tspan x="0" y="0">Llama2* + BioGPT*</tspan></text>
			<text className="cls-8" transform="translate(11.23 74.66) scale(1.02 1)"><tspan className="cls-108" x="0" y="0">U</tspan><tspan className="cls-110" x="8.96" y="0">ser </tspan><tspan className="cls-68" x="29.4" y="0">I</tspan><tspan className="cls-102" x="33.09" y="0">n</tspan><tspan className="cls-66" x="40.83" y="0">t</tspan><tspan className="cls-79" x="45.55" y="0">e</tspan><tspan className="cls-104" x="52.6" y="0">r</tspan><tspan x="57.84" y="0">fa</tspan><tspan className="cls-54" x="69.14" y="0">c</tspan><tspan className="cls-79" x="75.15" y="0">e</tspan></text>
			<text className="cls-7" transform="translate(278.57 73.1)"><tspan className="cls-94" x="0" y="0">B</tspan><tspan className="cls-80" x="8.11" y="0">ac</tspan><tspan className="cls-91" x="21.5" y="0">k</tspan><tspan x="28.53" y="0">end </tspan><tspan className="cls-69" x="54.79" y="0">S</tspan><tspan x="62.15" y="0">e</tspan><tspan className="cls-49" x="69.37" y="0">r</tspan><tspan className="cls-116" x="74.66" y="0">v</tspan><tspan className="cls-80" x="81.59" y="0">er</tspan></text>
			<text className="cls-59" transform="translate(996.22 653.07)"><tspan x="0" y="0">*</tspan><tspan className="cls-91" x="5.81" y="0">T</tspan><tspan x="12.67" y="0">hi</tspan><tspan className="cls-14" x="23.72" y="0">r</tspan><tspan x="28.15" y="0">d </tspan><tspan className="cls-76" x="39.02" y="0">P</tspan><tspan x="46.1" y="0">a</tspan><tspan className="cls-16" x="52.85" y="0">r</tspan><tspan className="cls-90" x="57.76" y="0">t</tspan><tspan x="62.52" y="0">y open-sou</tspan><tspan className="cls-14" x="127.76" y="0">r</tspan><tspan className="cls-67" x="132.2" y="0">c</tspan><tspan className="cls-80" x="138.39" y="0">e </tspan><tspan className="cls-67" x="148.37" y="0">c</tspan><tspan className="cls-80" x="154.56" y="0">ompone</tspan><tspan className="cls-82" x="204.36" y="0">n</tspan><tspan x="212.07" y="0">ts</tspan></text>
			{/* <text className="cls-42" transform="translate(452.76 15.07)"><tspan x="0" y="0">Open </tspan><tspan className="cls-64" x="45.47" y="0">A</tspan><tspan className="cls-65" x="56.27" y="0">cc</tspan><tspan x="72.18" y="0">ess </tspan><tspan className="cls-84" x="99.27" y="0">P</tspan><tspan x="108.56" y="0">ipeline of </tspan><tspan className="cls-45" x="182.27" y="0">M</tspan><tspan x="196.86" y="0">yGPT</tspan></text> */}
			</svg>
		</div>
	)
}

export default Workflow
