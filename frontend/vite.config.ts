import fs from 'fs'
import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Load root-level .env_frontend (not Vite's default .env naming) for local `vite`/`vite build`
// runs outside Docker Compose. Vars already in process.env (e.g. injected via Compose's
// env_file:) take precedence and are never overwritten.
const rootEnvPath = path.resolve(__dirname, '../.env_frontend')
if (fs.existsSync(rootEnvPath)) {
	for (const line of fs.readFileSync(rootEnvPath, 'utf-8').split('\n')) {
		const trimmed = line.trim()
		if (!trimmed || trimmed.startsWith('#')) continue
		const eqIndex = trimmed.indexOf('=')
		if (eqIndex === -1) continue
		const key = trimmed.slice(0, eqIndex).trim()
		const value = trimmed.slice(eqIndex + 1).trim().replace(/^['"]|['"]$/g, '')
		if (process.env[key] === undefined) {
			process.env[key] = value
		}
	}
}

// Proxies /sjray the same way CRA's src/setupProxy.js used to.
const sjRayTarget = process.env.REACT_APP_SJ_RAY_API || 'https://svltgpt01a.stjude.org/'

export default defineConfig({
	plugins: [react()],
	// Keep the REACT_APP_ prefix so existing .env_frontend files and docs don't need renaming.
	envPrefix: ['VITE_', 'REACT_APP_'],
	// Matches CRA's output dir so existing docker-compose bind mounts keep working.
	build: {
		outDir: 'build',
	},
	server: {
		host: true,
		port: 3000,
		proxy: {
			'/sjray': {
				target: sjRayTarget,
				changeOrigin: true,
				secure: false,
				rewrite: (requestPath) => requestPath.replace(/^\/sjray/, ''),
			},
		},
	},
	resolve: {
		alias: [
			{
				find: '@modelcontextprotocol/sdk/client/index',
				replacement: path.resolve(__dirname, 'node_modules/@modelcontextprotocol/sdk/dist/esm/client/index'),
			},
			{
				find: '@modelcontextprotocol/sdk/client/sse',
				replacement: path.resolve(__dirname, 'node_modules/@modelcontextprotocol/sdk/dist/esm/server/sse'),
			},
		],
	},
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: ['./src/setupTests.ts'],
	},
})
