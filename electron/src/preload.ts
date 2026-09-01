import { contextBridge, ipcRenderer, shell } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  openExternalUrl: (url: string) => shell.openExternal(url),
  getApiBaseUrl: () => ipcRenderer.invoke('get-api-base-url'),
  getOllamaStatus: () => ipcRenderer.invoke('get-ollama-status'),
  pullOllamaModel: (modelName: string) => ipcRenderer.invoke('pull-ollama-model', modelName),
})
