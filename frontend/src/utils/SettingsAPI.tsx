// Helper: resolve the Authorization header value from current auth state
export const getAuthHeader = (user: any, djangoLogin: any): string => {
	if (user && djangoLogin) {
		return 'Bearer ' + localStorage.getItem('access')
	}
	return process.env.NODE_ENV === 'production'
		? process.env.REACT_APP_AUTH_TOKEN_PROD ?? ''
		: process.env.REACT_APP_AUTH_TOKEN_DEV ?? ''
}

// GET/POST api/get_datasets/
export const fetchDatasets = async (
	user: any,
	djangoLogin: any,
	signal?: AbortSignal
): Promise<any[]> => {
	const requestOptions: RequestInit = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': getAuthHeader(user, djangoLogin),
		},
		body: JSON.stringify(
			djangoLogin
				? user
				: user
				? { user_email: user.user_email, user_group: user.otherRoles?.length ? user.otherRoles[0] : '' }
				: { user_email: '', user_group: '' }
		),
		signal,
	}
	const response = await fetch(`${process.env.REACT_APP_BACKEND_API}api/get_datasets/`, requestOptions)
	return response.json()
}

// GET api/delete_dataset/
export const deleteDatasetRequest = async (
	dataset: string,
	userEmail: string,
	user: any,
	djangoLogin: any,
	signal?: AbortSignal
): Promise<any> => {
	const requestOptions: RequestInit = {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': getAuthHeader(user, djangoLogin),
		},
		signal,
	}
	const response = await fetch(
		`${process.env.REACT_APP_BACKEND_API}api/delete_dataset/?dataset=${encodeURIComponent(dataset)}&user_email=${encodeURIComponent(userEmail)}`,
		requestOptions
	)
	return response.json()
}

// GET api/add_dataset_embeddings/
export const addEmbeddingForDatasetRequest = async (
	dataset: string,
	signal?: AbortSignal
): Promise<any> => {
	const response = await fetch(
		`${process.env.REACT_APP_BACKEND_API}api/add_dataset_embeddings/?dataset=${encodeURIComponent(dataset)}`,
		{ method: 'GET', headers: { 'Content-Type': 'application/json' }, signal }
	)
	return response.json()
}

// GET Ollama api/tags  +  POST api/add_ollama_models/
// Returns the filtered LLM names and the first model as the default.
export const fetchAndRegisterOllamaModels = async (
	user: any,
	djangoLogin: any,
	signal?: AbortSignal
): Promise<{ llms: string[]; llm: string }> => {
	const tagsResponse = await fetch(`${process.env.REACT_APP_OLLAMA_API}api/tags`, {
		method: 'GET',
		signal,
	})
	const data = await tagsResponse.json()

	const llms: string[] = data.models
		.filter((model: any) => model.details.quantization_level !== 'F16')
		.map((model: any) => model.name)

	const llms_object = data.models.map((model: any) => ({
		name: model.name,
		size: (model.size * 1e-9).toFixed(2),
	}))

	const registerOptions: RequestInit = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': getAuthHeader(user, djangoLogin),
		},
		keepalive: true,
		body: JSON.stringify({ llms: llms_object }),
		signal,
	}
	const response2 = await fetch(
		`${process.env.REACT_APP_BACKEND_API}api/add_ollama_models/`,
		registerOptions
	)
	const data2 = await response2.json()
	console.log(data2)

	return { llms, llm: llms[0] }
}
