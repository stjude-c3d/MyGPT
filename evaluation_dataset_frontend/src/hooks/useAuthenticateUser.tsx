import { useEffect, useState } from 'react';
// import { callApiWithToken } from '../utils/FetchLogin'
import { useMsal } from '@azure/msal-react'
import { useIsAuthenticated } from '@azure/msal-react'

// Authenticate user using Microsoft Graph by access token from BSK home page redirect URL
// or by cliking Login button from navbar

const useAuthenticateUser = () => {
	const { instance, accounts } = useMsal()
	const isAuthenticated = useIsAuthenticated()

	// check if access token is expired
	const accessTokenExpiration = localStorage.getItem('bskAccessTokenExpiration')
	const now = new Date().getTime()
	if (accessTokenExpiration && now > parseInt(accessTokenExpiration)) {
		localStorage.removeItem('bskAccessToken')
		localStorage.removeItem('bskAccessTokenExpiration')
	}

	// check if access token is in local storage
	const temp_access_token = localStorage.getItem('bskAccessToken')
	const [accessToken, setAccessToken] = useState(temp_access_token ? temp_access_token : '')
	const [activeAccounts, setActiveAccounts]:any[] = useState(undefined)
	const [appRoles, setAppRoles] = useState([])

	// login using Login button from navbar
	useEffect(() => {
		if (isAuthenticated) {
			const temp_account = JSON.parse(JSON.stringify(accounts))
			setActiveAccounts(temp_account)
			const roles:any = accounts && accounts.length ? accounts[0].idTokenClaims?.roles : []
			setAppRoles(roles)
		}
		const original_url = window.location.href.split('#')[0]
		if (window.location.hash.includes('access_token'))
			window.location.assign(original_url)
	},[isAuthenticated, accounts])

	// store access token from redirect URL from BSK home page
	useEffect(() => {
		if (!accessToken.length && window.location.hash.includes('access_token')) {
			const hashParams:any = {}
			let e:any, r:any = /([^&;=]+)=?([^&;]*)/g,
				q = window.location.hash.substring(1)
			// eslint-disable-next-line no-cond-assign
			while ( e = r.exec(q)) {
				hashParams[e[1]] = decodeURIComponent(e[2])
			}
			if (hashParams['access_token']) {
				setAccessToken(hashParams['access_token'])
				// save access token to local storage
				localStorage.setItem('bskAccessToken', hashParams['access_token'])
				const expiration = new Date().getTime() + 1000 * 60 * 60 * 24 * 14
				localStorage.setItem('bskAccessTokenExpiration', expiration.toString())
			}
			const original_url = window.location.href.split('#')[0]
			window.location.assign(original_url)
		}
	}, [accessToken])

	// get user account info from by decoding access token
	useEffect(() => {
		if (accessToken.length) {
			const base64Url = accessToken.split('.')[1]
			const base64 = base64Url.replace('-', '+').replace('_', '/')
			const decodedToken = JSON.parse(window.atob(base64))
			setAppRoles(decodedToken.roles)
			setActiveAccounts([decodedToken])
		}
	}, [accessToken])
	// console.log(activeAccounts, accessToken, appRoles )

	return { activeAccounts, appRoles, instance }
};

export default useAuthenticateUser;
