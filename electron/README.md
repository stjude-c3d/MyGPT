# MyGPT Desktop Application (Electron)

This directory contains the cross-platform **Electron Desktop Application** for MyGPT, wrapping the React frontend and orchestrating the Dockerized Django backend and Ollama LLM service.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** (v18+ recommended) & **npm**
- **Docker Desktop** (running in the background for Django backend and PostgreSQL)
- **Ollama** (running on `http://localhost:11434` with `llama3.2` and `nomic-embed-text` installed)

### 2. First-Time Setup
From the repository root, ensure your runtime environment files exist:
```bash
cp ../.env_backend.example ../.env_backend
cp ../.env_frontend.example ../.env_frontend
```

Install frontend dependencies:
```bash
cd ../frontend
npm install
```

Install desktop app dependencies:
```bash
cd ../electron
npm install
```

---

## 💻 Running the Desktop App in Development

Run this command from inside the `electron/` directory:
```bash
cd electron
npm run dev
```

**What this does automatically:**
1. Checks if the backend containers are up; if not, launches Docker backend (`db`, `backend`, `grobid`).
2. Starts the Vite React development server on `http://localhost:3000`.
3. Opens the native **MyGPT Electron Window** with live reloading and native app menus.

---

## 📦 Packaging Desktop Installers

To build standalone installer packages for distribution:

```bash
cd electron

# Build for current operating system
npm run dist

# Or build specifically for a target platform:
npm run dist:mac     # macOS DMG & Zip (Apple Silicon & Intel)
npm run dist:win     # Windows NSIS Installer (.exe) & Portable
npm run dist:linux   # Linux AppImage & Debian package (.deb)
```

The output installers will be placed in `electron/release/`:
* `MyGPT-1.0.2-arm64.dmg` (for Apple Silicon M1/M2/M3/M4)
* `MyGPT-1.0.2-x64.dmg` (for Intel Macs)

### 📖 End-User Distribution Guides:
* **macOS Setup & Installation Guide:** [MACOS_INSTALL_GUIDE.md](./MACOS_INSTALL_GUIDE.md) — share this guide with Mac users for first-time installation, Ollama/Docker setup, and bypassing the macOS Gatekeeper prompt.

---

## 🐳 Docker Backend Management

You can manage backend Docker containers directly via npm scripts from the `electron/` folder:

```bash
npm run docker:up      # Starts db, backend, and grobid containers in background
npm run docker:logs    # Streams backend Django logs in real-time
npm run docker:build   # Rebuilds the backend Docker image after dependency changes
npm run docker:down    # Stops all MyGPT Docker containers
```

---

## 🔌 API & Python Script Integration

When MyGPT Desktop or Docker backend is running, all REST APIs are served on `http://127.0.0.1:8000`:

1. **Interactive Swagger Documentation:**
   👉 Visit [http://127.0.0.1:8000/api/docs/](http://127.0.0.1:8000/api/docs/) in your browser.

2. **OpenAPI 3.0 JSON Schema:**
   👉 Visit [http://127.0.0.1:8000/api/schema/](http://127.0.0.1:8000/api/schema/).

3. **Running the Python Client Demo:**
   ```bash
   python3 ../examples/python_api_client.py --base-url http://127.0.0.1:8000
   ```

4. **In-App Developer Settings:**
   Inside the desktop app, go to **Settings > Developer / API** to view your active JWT access token, copy-paste ready-to-run Python snippets, or download Ollama models.
