import { ChildProcess, spawn, execSync } from 'child_process'
import * as path from 'path'
import * as fs from 'fs'
import * as http from 'http'
import { app } from 'electron'

export class ProcessManager {
  private backendProcess: ChildProcess | null = null
  private spawnedDocker: boolean = false
  private host: string = '127.0.0.1'
  private port: number = 8000
  private projectRoot: string

  constructor(host: string = '127.0.0.1', port: number = 8000) {
    this.host = host
    this.port = port
    // Locate the repository root
    this.projectRoot = path.resolve(app.getAppPath(), '..')
    if (!fs.existsSync(path.join(this.projectRoot, 'docker-compose.yml'))) {
      this.projectRoot = path.resolve(__dirname, '../../')
    }
  }

  public getApiBaseUrl(): string {
    return `http://${this.host}:${this.port}`
  }

  /**
   * Checks whether the backend server is already reachable
   */
  public async isBackendRunning(): Promise<boolean> {
    return new Promise((resolve) => {
      const req = http.get(`${this.getApiBaseUrl()}/api/frontend_settings/`, (res) => {
        resolve(res.statusCode !== undefined && res.statusCode < 500)
      })
      req.on('error', () => resolve(false))
      req.setTimeout(2000, () => {
        req.destroy()
        resolve(false)
      })
    })
  }

  /**
   * Attempts to launch backend services using Docker Compose
   */
  private async startDockerBackend(): Promise<boolean> {
    const composeFile = path.join(this.projectRoot, 'docker-compose.yml')
    if (!fs.existsSync(composeFile)) {
      console.log('[ProcessManager] docker-compose.yml not found at:', composeFile)
      return false
    }

    console.log('[ProcessManager] Attempting to start backend containers via Docker Compose...')
    try {
      // Check if docker is available
      execSync('docker --version', { stdio: 'ignore' })
    } catch {
      console.warn('[ProcessManager] Docker CLI not found on system.')
      return false
    }

    return new Promise((resolve) => {
      // Run docker compose up -d db backend grobid
      const dockerProc = spawn('docker', ['compose', 'up', '-d', 'db', 'backend', 'grobid'], {
        cwd: this.projectRoot,
        stdio: 'inherit',
      })

      dockerProc.on('error', (err) => {
        console.warn('[ProcessManager] docker compose failed:', err.message)
        // Try fallback to legacy docker-compose
        const legacyProc = spawn('docker-compose', ['up', '-d', 'db', 'backend', 'grobid'], {
          cwd: this.projectRoot,
          stdio: 'inherit',
        })
        legacyProc.on('close', (code) => {
          this.spawnedDocker = code === 0
          resolve(code === 0)
        })
      })

      dockerProc.on('close', (code) => {
        if (code === 0) {
          this.spawnedDocker = true
          console.log('[ProcessManager] Docker backend containers started successfully.')
          resolve(true)
        } else {
          resolve(false)
        }
      })
    })
  }

  /**
   * Starts the Django backend process (via Docker or local fallback)
   */
  public async startBackend(): Promise<void> {
    const alreadyRunning = await this.isBackendRunning()
    if (alreadyRunning) {
      console.log(`[ProcessManager] Backend server is already running and healthy on ${this.getApiBaseUrl()}`)
      return
    }

    // 1. Primary Strategy: Docker Compose
    console.log('[ProcessManager] Backend is not active. Trying Docker backend...')
    const startedDocker = await this.startDockerBackend()
    if (startedDocker) {
      const ready = await this.waitForBackendReady(45000)
      if (ready) return
    }

    // 2. Fallback Strategy: Standalone packaged binary (if present)
    const isPackaged = app.isPackaged
    if (isPackaged) {
      const resourcePath = process.resourcesPath
      const binaryFolder = path.join(resourcePath, 'backend_binary')
      const binaryName = process.platform === 'win32' ? 'mygpt-backend.exe' : 'mygpt-backend'
      const executablePath = path.join(binaryFolder, binaryName)

      if (fs.existsSync(executablePath)) {
        console.log(`[ProcessManager] Launching packaged binary: ${executablePath}`)
        this.backendProcess = spawn(executablePath, ['--host', this.host, '--port', this.port.toString()], {
          cwd: binaryFolder,
          env: { ...process.env, DJANGO_SETTINGS_MODULE: 'django_app.settings', PYTHONUNBUFFERED: '1' },
          stdio: ['ignore', 'pipe', 'pipe'],
        })
        await this.waitForBackendReady(30000)
      }
    }
  }

  /**
   * Polls the backend endpoint until it responds or timeouts
   */
  public async waitForBackendReady(timeoutMs: number = 45000): Promise<boolean> {
    const startTime = Date.now()
    const checkInterval = 1000

    console.log(`[ProcessManager] Waiting for backend at ${this.getApiBaseUrl()} to become ready...`)
    while (Date.now() - startTime < timeoutMs) {
      const isUp = await this.isBackendRunning()
      if (isUp) {
        console.log(`[ProcessManager] Backend is UP and READY on ${this.getApiBaseUrl()}!`)
        return true
      }
      await new Promise((r) => setTimeout(r, checkInterval))
    }

    console.warn(`[ProcessManager] Backend did not respond within ${timeoutMs}ms.`)
    return false
  }

  /**
   * Terminates backend child processes cleanly
   */
  public stopBackend(): void {
    if (this.backendProcess && !this.backendProcess.killed) {
      console.log('[ProcessManager] Terminating local backend process...')
      try {
        if (process.platform === 'win32') {
          spawn('taskkill', ['/pid', this.backendProcess.pid!.toString(), '/f', '/t'])
        } else {
          this.backendProcess.kill('SIGTERM')
        }
      } catch (err) {
        console.error('[ProcessManager] Error terminating backend process:', err)
      }
      this.backendProcess = null
    }
  }
}
