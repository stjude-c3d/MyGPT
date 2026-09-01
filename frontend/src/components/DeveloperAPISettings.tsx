import React, { useState, useEffect } from 'react'
import {
	CodeBracketSquareIcon,
	DocumentTextIcon,
	ArrowTopRightOnSquareIcon,
	ClipboardDocumentCheckIcon,
	ClipboardDocumentIcon,
	ArrowDownTrayIcon,
	CheckCircleIcon,
	XCircleIcon,
	ArrowPathIcon
} from '@heroicons/react/24/outline'

interface DeveloperAPISettingsProps {
	currentSettings: any
	settingsCallback: any
	user?: any
	djangoLogin?: boolean
}

const RECOMMENDED_MODELS = [
	{ name: 'llama3.2:latest', type: 'LLM', desc: 'Fast, lightweight general reasoning model (3B)' },
	{ name: 'llama3.1:8b', type: 'LLM', desc: 'High capability reasoning and RAG model (8B)' },
	{ name: 'nomic-embed-text:latest', type: 'Embedding', desc: 'Standard high-speed text embedding model' },
	{ name: 'bge-m3:latest', type: 'Embedding', desc: 'Multilingual multi-functionality embedding model' },
]

export const DeveloperAPISettings: React.FC<DeveloperAPISettingsProps> = ({
	currentSettings,
	djangoLogin
}) => {
	const backendUrl = (import.meta.env.VITE_BACKEND_API || 'http://127.0.0.1:8000/').replace(/\/$/, '')
	const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null)
	const [copiedToken, setCopiedToken] = useState(false)
	const [activeSnippetTab, setActiveSnippetTab] = useState<'rag' | 'datasets' | 'chat' | 'upload'>('rag')
	
	// Ollama model downloader state
	const [pullModelName, setPullModelName] = useState('')
	const [pullStatus, setPullStatus] = useState<string | null>(null)
	const [isPulling, setIsPulling] = useState(false)
	const [installedModels, setInstalledModels] = useState<string[]>([])
	const [isCheckingOllama, setIsCheckingOllama] = useState(false)
	const [ollamaOnline, setOllamaOnline] = useState<boolean | null>(null)
	const [backendOnline, setBackendOnline] = useState<boolean | null>(null)

	const jwtAccessToken = localStorage.getItem('access') || ''

	const copyToClipboard = (text: string, id: string) => {
		navigator.clipboard.writeText(text)
		if (id === 'token') {
			setCopiedToken(true)
			setTimeout(() => setCopiedToken(false), 2000)
		} else {
			setCopiedSnippet(id)
			setTimeout(() => setCopiedSnippet(null), 2000)
		}
	}

	const checkOllamaStatus = async () => {
		setIsCheckingOllama(true)
		try {
			// Check backend
			try {
				const bRes = await fetch(`${backendUrl}/api/frontend_settings/?format=json`, { method: 'GET' })
				setBackendOnline(bRes.ok)
			} catch {
				setBackendOnline(false)
			}

			// Check Ollama
			const res = await fetch(`${backendUrl}/api/get_ollama_models/`, { method: 'POST' })
			if (res.ok) {
				const data = await res.json()
				const modelNames = (data.models || []).map((m: any) => m.name)
				setInstalledModels(modelNames)
				setOllamaOnline(modelNames.length > 0 || Boolean(data.models))
			} else {
				// Fallback to direct local Ollama check
				try {
					const directRes = await fetch('http://127.0.0.1:11434/api/tags')
					if (directRes.ok) {
						const directData = await directRes.json()
						const names = (directData.models || []).map((m: any) => m.name)
						setInstalledModels(names)
						setOllamaOnline(true)
					} else {
						setOllamaOnline(false)
					}
				} catch {
					setOllamaOnline(false)
				}
			}
		} catch {
			setOllamaOnline(false)
		} finally {
			setIsCheckingOllama(false)
		}
	}

	useEffect(() => {
		checkOllamaStatus()
	}, [])

	const handlePullModel = async (modelName: string) => {
		if (!modelName.trim()) return
		setIsPulling(true)
		setPullStatus(`Pulling ${modelName}... Please wait.`)
		try {
			const res = await fetch(`${backendUrl}/api/ollama_pull_model/`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ model_name: modelName.trim() })
			})
			const data = await res.json()
			if (res.ok) {
				setPullStatus(`Successfully downloaded ${modelName}!`)
				checkOllamaStatus()
			} else {
				setPullStatus(`Error: ${data.message || data.error || 'Failed to download model'}`)
			}
		} catch (err: any) {
			setPullStatus(`Network error: ${err.message}`)
		} finally {
			setIsPulling(false)
		}
	}

	const pythonSnippets = {
		rag: `import requests

# 1. Base URL for your running MyGPT backend
BASE_URL = "${backendUrl}"

# 2. Authenticate with your Django credentials to get a JWT access token
login_res = requests.post(f"{BASE_URL}/token/", json={
    "username": "YOUR_USERNAME",
    "password": "YOUR_PASSWORD"
})
access_token = login_res.json().get("access")

headers = {
    "Authorization": f"Bearer {access_token}",
    "Content-Type": "application/json"
}

# 3. Retrieve relevant context chunks (RAG) for your research question
dataset_name = "${currentSettings.selectedDataset || 'MyGPT'}"
question = "What are the key findings of the study?"

context_res = requests.post(f"{BASE_URL}/api/get_context/", json={
    "text": question,
    "dataset": dataset_name,
    "model_type": "${currentSettings.selectedLlm || 'llama3.2:latest'}",
    "use_default_qrs": True,
    "maximum_chunks_count": 5,
    "selected_embedding_model": "${currentSettings.selectedEmbeddingModel || 'nomic-embed-text:latest'}"
}, headers=headers)

res_json = context_res.json()
print("Relevance Score:", res_json.get("relevance_score"))
sources = res_json.get("sources", [])
print(f"Top Context Sources ({len(sources)}):")
for i, src in enumerate(sources[:3]):
    print(f"[{i+1}] Doc: {src.get('document')} | Page: {src.get('page')}")
    print(f"    {src.get('context', '')[:200]}...\\n")`,

		chat: `import requests

BASE_URL = "${backendUrl}"

# Generate answer directly using MyGPT's Ollama LLM endpoint
response = requests.post(f"{BASE_URL}/api/ollama_generate/", json={
    "model": "${currentSettings.selectedLlm || 'llama3.2:latest'}",
    "prompt": "Summarize the mechanism of action in 3 concise bullet points.",
    "temperature": 0.3
})

print("LLM Response:")
print(response.json().get("response"))`,

		datasets: `import requests

BASE_URL = "${backendUrl}"

# List all available document libraries and their embedding configurations
res = requests.post(f"{BASE_URL}/api/get_datasets/", json={
    "user_email": "",
    "user_group": ""
})

datasets = res.json()
print(f"Found {len(datasets)} dataset(s):")
for d in datasets:
    print(f" - {d.get('dataset_name')} (Model: {d.get('embedding_model')})")`,

		upload: `import requests

BASE_URL = "${backendUrl}"

# Upload a research PDF or document to an existing or new dataset
files = {
    'file': open('paper.pdf', 'rb')
}
data = {
    'dataset': 'Cancer_Research_2026',
    'embedding_model': 'nomic-embed-text:latest'
}

res = requests.post(f"{BASE_URL}/api/upload_documents/", data=data, files=files)
print("Upload status:", res.json())`
	}

	return (
		<div className="p-6 flex flex-col space-y-6 text-nav dark:text-nav-dark">
			{/* Header */}
			<div className="flex items-center justify-between border-b pb-4 border-gray-300 dark:border-gray-700">
				<div>
					<h2 className="text-xl font-bold flex items-center gap-2">
						<CodeBracketSquareIcon className="h-6 w-6 text-panel1 dark:text-panel3-dark" />
						Developer API & Python Integration
					</h2>
					<p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
						Use MyGPT programmatically in your own Python scripts, Jupyter Notebooks, or pipelines.
					</p>
				</div>
				<div className="flex gap-2">
					<a
						href={`${backendUrl}/api/docs/`}
						target="_blank"
						rel="noreferrer"
						className="flex items-center gap-1.5 bg-panel1 hover:bg-nav text-white px-3 py-1.5 rounded-md text-sm font-medium transition shadow-sm"
					>
						<DocumentTextIcon className="h-4 w-4" />
						Swagger UI
						<ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
					</a>
					<a
						href={`${backendUrl}/api/schema/`}
						target="_blank"
						rel="noreferrer"
						className="flex items-center gap-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 text-gray-800 dark:text-gray-200 px-3 py-1.5 rounded-md text-sm font-medium transition"
					>
						OpenAPI JSON
						<ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
					</a>
				</div>
			</div>

			{/* Server & Auth Information Card */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div className="bg-white dark:bg-panel3-dark/40 border border-gray-200 dark:border-gray-700 p-4 rounded-lg shadow-sm">
					<h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
						API Base Endpoint
					</h3>
					<div className="flex items-center justify-between bg-gray-100 dark:bg-black/20 p-2.5 rounded font-mono text-sm">
						<span className="truncate">{backendUrl}</span>
						{backendOnline === true ? (
							<span className="text-xs bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
								<CheckCircleIcon className="h-3.5 w-3.5" /> Online
							</span>
						) : backendOnline === false ? (
							<span className="text-xs bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
								<XCircleIcon className="h-3.5 w-3.5" /> Offline / Disconnected
							</span>
						) : (
							<span className="text-xs bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full font-semibold">
								Checking...
							</span>
						)}
					</div>
					<p className="text-xs text-gray-500 mt-2">
						All REST endpoints are served on this address. You can query them locally or over the LAN.
					</p>
				</div>

				<div className="bg-white dark:bg-panel3-dark/40 border border-gray-200 dark:border-gray-700 p-4 rounded-lg shadow-sm">
					<div className="flex items-center justify-between mb-2">
						<h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
							Active JWT Access Token
						</h3>
						{jwtAccessToken && (
							<button
								onClick={() => copyToClipboard(jwtAccessToken, 'token')}
								className="text-xs flex items-center gap-1 text-panel1 hover:underline font-medium"
							>
								{copiedToken ? (
									<>
										<CheckCircleIcon className="h-3.5 w-3.5 text-green-600" /> Copied
									</>
								) : (
									<>
										<ClipboardDocumentIcon className="h-3.5 w-3.5" /> Copy Token
									</>
								)}
							</button>
						)}
					</div>
					<div className="bg-gray-100 dark:bg-black/20 p-2.5 rounded font-mono text-xs break-all text-gray-700 dark:text-gray-300 max-h-16 overflow-y-auto">
						{jwtAccessToken ? jwtAccessToken : (
							<span className="text-gray-400 italic">
								No active JWT session. Log in via Django Login or obtain a token via POST /token/.
							</span>
						)}
					</div>
					<p className="text-xs text-gray-500 mt-2">
						Send this in requests as: <code className="bg-gray-200 dark:bg-gray-800 px-1 py-0.5 rounded">Authorization: Bearer &lt;token&gt;</code>
					</p>
				</div>
			</div>

			{/* Ollama Models Management & Download Card */}
			<div className="bg-white dark:bg-panel3-dark/40 border border-gray-200 dark:border-gray-700 p-4 rounded-lg shadow-sm">
				<div className="flex items-center justify-between mb-3">
					<div className="flex items-center gap-2">
						<h3 className="text-base font-semibold">Ollama LLM & Embedding Models</h3>
						{ollamaOnline === true ? (
							<span className="flex items-center gap-1 text-xs bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-200 px-2 py-0.5 rounded-full font-medium">
								<CheckCircleIcon className="h-3.5 w-3.5" /> Connected ({installedModels.length} models)
							</span>
						) : ollamaOnline === false ? (
							<span className="flex items-center gap-1 text-xs bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200 px-2 py-0.5 rounded-full font-medium">
								<XCircleIcon className="h-3.5 w-3.5" /> Not Detected (localhost:11434)
							</span>
						) : null}
					</div>
					<button
						onClick={checkOllamaStatus}
						disabled={isCheckingOllama}
						className="text-xs flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-panel1 font-medium"
					>
						<ArrowPathIcon className={`h-3.5 w-3.5 ${isCheckingOllama ? 'animate-spin' : ''}`} /> Refresh
					</button>
				</div>

				<p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
					Download essential models for local inference without leaving the application.
				</p>

				{/* Recommended Models Quick Pull */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
					{RECOMMENDED_MODELS.map((model) => {
						const isInstalled = installedModels.some(m => m.startsWith(model.name.split(':')[0]))
						return (
							<div
								key={model.name}
								className="flex items-center justify-between border border-gray-200 dark:border-gray-700/60 p-2.5 rounded-md bg-gray-50 dark:bg-gray-800/40"
							>
								<div className="truncate mr-2">
									<div className="font-semibold text-xs flex items-center gap-1.5">
										{model.name}
										<span className="text-[10px] bg-gray-200 dark:bg-gray-700 px-1.5 py-0.2 rounded text-gray-600 dark:text-gray-300">
											{model.type}
										</span>
									</div>
									<div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{model.desc}</div>
								</div>
								{isInstalled ? (
									<span className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1 flex-shrink-0">
										<CheckCircleIcon className="h-4 w-4" /> Ready
									</span>
								) : (
									<button
										disabled={isPulling}
										onClick={() => handlePullModel(model.name)}
										className="text-xs bg-panel1 hover:bg-nav text-white px-2.5 py-1 rounded flex items-center gap-1 font-medium transition flex-shrink-0 disabled:opacity-50"
									>
										<ArrowDownTrayIcon className="h-3.5 w-3.5" /> Pull
									</button>
								)}
							</div>
						)
					})}
				</div>

				{/* Custom Pull Input */}
				<div className="flex gap-2">
					<input
						type="text"
						placeholder="Pull custom model from Ollama library (e.g. qwen2.5:7b, mistral:latest)"
						value={pullModelName}
						onChange={(e) => setPullModelName(e.target.value)}
						className="flex-1 text-xs border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 bg-white dark:bg-black/30 text-nav dark:text-nav-dark focus:outline-none focus:ring-1 focus:ring-panel1"
					/>
					<button
						disabled={isPulling || !pullModelName.trim()}
						onClick={() => handlePullModel(pullModelName)}
						className="text-xs bg-panel1 hover:bg-nav text-white px-3 py-1.5 rounded font-medium transition disabled:opacity-50 flex items-center gap-1"
					>
						<ArrowDownTrayIcon className="h-3.5 w-3.5" /> Download
					</button>
				</div>

				{pullStatus && (
					<div className="mt-2 text-xs p-2 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 rounded">
						{pullStatus}
					</div>
				)}
			</div>

			{/* Python Snippets Section */}
			<div className="bg-white dark:bg-panel3-dark/40 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
				<div className="bg-gray-100 dark:bg-black/40 border-b border-gray-200 dark:border-gray-700 px-4 py-2.5 flex items-center justify-between">
					<div className="flex space-x-2">
						<button
							onClick={() => setActiveSnippetTab('rag')}
							className={`text-xs font-semibold px-3 py-1 rounded-md transition ${
								activeSnippetTab === 'rag'
									? 'bg-panel1 text-white'
									: 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
							}`}
						>
							1. Query Context (RAG)
						</button>
						<button
							onClick={() => setActiveSnippetTab('chat')}
							className={`text-xs font-semibold px-3 py-1 rounded-md transition ${
								activeSnippetTab === 'chat'
									? 'bg-panel1 text-white'
									: 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
							}`}
						>
							2. Ollama Generation
						</button>
						<button
							onClick={() => setActiveSnippetTab('datasets')}
							className={`text-xs font-semibold px-3 py-1 rounded-md transition ${
								activeSnippetTab === 'datasets'
									? 'bg-panel1 text-white'
									: 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
							}`}
						>
							3. List Datasets
						</button>
						<button
							onClick={() => setActiveSnippetTab('upload')}
							className={`text-xs font-semibold px-3 py-1 rounded-md transition ${
								activeSnippetTab === 'upload'
									? 'bg-panel1 text-white'
									: 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
							}`}
						>
							4. Upload PDF
						</button>
					</div>

					<button
						onClick={() => copyToClipboard(pythonSnippets[activeSnippetTab], activeSnippetTab)}
						className="flex items-center gap-1 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 text-gray-800 dark:text-gray-200 px-2.5 py-1 rounded font-medium transition"
					>
						{copiedSnippet === activeSnippetTab ? (
							<>
								<ClipboardDocumentCheckIcon className="h-3.5 w-3.5 text-green-600" />
								Copied!
							</>
						) : (
							<>
								<ClipboardDocumentIcon className="h-3.5 w-3.5" />
								Copy Python Script
							</>
						)}
					</button>
				</div>

				<div className="p-4 bg-gray-900 text-gray-100 font-mono text-xs overflow-x-auto max-h-96">
					<pre>{pythonSnippets[activeSnippetTab]}</pre>
				</div>
			</div>
		</div>
	)
}

export default DeveloperAPISettings
