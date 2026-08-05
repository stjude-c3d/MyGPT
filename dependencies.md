# Dependencies

This document is auto-generated from source manifests.

Regenerate with:

```bash
python3 scripts/generate_dependencies_md.py
```

## Backend Dependencies

Source: `backend/requirements.txt`

- bm25s
- chromadb==1.5.9
- Django>=5.1.15
- django-cors-headers
- django-otp>=1.7.0
- djangorestframework>=3.15.2
- djangorestframework-simplejwt>=5.3.1
- duckdb
- huggingface-hub>=0.36.0
- langchain==1.0.0a1
- langchain_community
- numpy
- ollama>=0.6.1
- openpyxl
- pandas
- psycopg2-binary>=2.9.9
- pycryptodome==3.19.1
- pymupdf==1.24.14
- pypdf>=6.0.0
- pystemmer
- pytest-django
- python-dotenv>=1.2.2
- pytube
- pyzotero
- qrcode>=8.0
- requests>=2.33.0
- sacremoses
- sentence_transformers>=5.1.2
- sqlparse>=0.5.0 # not directly required, pinned by Snyk to avoid a vulnerability
- tqdm
- transformers>=4.57.2
- urllib3>=2.7.0 # not directly required, pinned by Snyk to avoid a vulnerability
- youtube_transcript_api>=0.6.3
- zipp>=3.19.1 # not directly required, pinned by Snyk to avoid a vulnerability

## MCP Server Dependencies

Source: `MCP-server/pyproject.toml`

- anyio==4.9.0
- asyncio>=3.4.3
- fastapi>=0.116.0
- fastmcp>=2.14.5
- httpcore[asyncio]>=1.0.9
- httpx>=0.28.1
- mcp[cli]>=1.26.0
- pydantic>=2.11.7
- pydantic-core>=2.16.3

## Frontend Dependencies

Source: `frontend/package.json`

### Runtime Dependencies (`dependencies`)

- @azure/msal-react@^5.0.0
- @heroicons/react@^2.2.0
- @modelcontextprotocol/sdk@^1.29.0
- @react-three/drei@^9.122.0
- @react-three/fiber@^8.18.0
- @testing-library/jest-dom@^6.6.3
- @testing-library/react@^16.3.2
- @testing-library/user-event@^14.6.1
- @types/d3@^7.1.0
- @types/node@^20.19.9
- @types/three@^0.184.0
- @xyflow/react@^12.10.2
- better-react-mathjax@^2.3.0
- d3@7.9.0
- http-proxy-middleware@^3.0.5
- node-forge@^1.4.0
- nth-check@2.1.1
- react@^19.2.7
- react-dom@^19.2.7
- react-markdown@^8.0.7
- react-pdf@^9.0.0
- react-router@^8.3.0
- rehype-katex@^6.0.3
- remark-gfm@^3.0.1
- remark-math@^5.1.1
- three@^0.184.0
- typescript@^4.9.5
- web-vitals@^2.1.4

### Development Dependencies (`devDependencies`)

- @types/react-dom@^19.0.0
- @types/react@^19.0.0
- @vitejs/plugin-react@^5.2.0
- autoprefixer@^10.4.4
- jsdom@^24.1.3
- postcss@^8.4.31
- react-test-renderer@^19.2.7
- tailwindcss@^3.0.23
- vite@^7.3.6
- vitest@^4.1.10

## Environment-Specific Dependencies and Setup

For OS, VM/server, and cloud-specific prerequisites (for example, Docker, GPU/CUDA, and Ollama installation differences), use the installation guides:

- Mac: `installation/macOS/README.md`
- Linux: `installation/linux/README.md`
- Windows: `installation/windows/README.md`
- VM/Server: `installation/vm/README.md`
- Cloud (Azure): `installation/azure/README.md`
