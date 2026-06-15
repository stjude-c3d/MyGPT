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
- pdfkit
- psycopg2-binary>=2.9.9
- pycryptodome==3.19.1
- pymupdf==1.24.14
- pypdf>=6.0.0
- pystemmer
- pytest-django
- python-dotenv>=1.2.2
- pytube
- pyzotero
- requests>=2.32.5
- sacremoses
- sentence_transformers>=5.1.2
- sqlparse>=0.5.0 # not directly required, pinned by Snyk to avoid a vulnerability
- tqdm
- transformers>=4.57.2
- urllib3>=2.5.0 # not directly required, pinned by Snyk to avoid a vulnerability
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

- @azure/msal-react@^2.2.0
- @heroicons/react@^2.2.0
- @modelcontextprotocol/sdk@^1.26.0
- @react-pdf-viewer/bookmark@3.12.0
- @react-pdf-viewer/core@^3.12.0
- @react-pdf-viewer/default-layout@^3.12.0
- @react-pdf-viewer/highlight@3.12.0
- @react-pdf-viewer/page-navigation@3.12.0
- @react-three/drei@^9.122.0
- @react-three/fiber@^8.18.0
- @testing-library/jest-dom@^5.17.0
- @testing-library/react@^16.3.2
- @testing-library/user-event@^14.6.1
- @types/d3@^7.1.0
- @types/node@^16.18.126
- @types/three@^0.184.0
- @xyflow/react@^12.10.2
- better-react-mathjax@^2.3.0
- d3@7.9.0
- env-cmd@^10.1.0
- http-proxy-middleware@^3.0.5
- node-forge@^1.4.0
- nth-check@2.1.1
- react@^18.3.1
- react-dom@^18.3.0
- react-markdown@^8.0.7
- react-router-dom@^6.30.3
- react-scripts@5.0.1
- rehype-katex@^7.0.1
- remark-gfm@^3.0.1
- remark-math@^6.0.0
- three@^0.184.0
- typescript@^4.9.5
- web-vitals@^2.1.4

### Development Dependencies (`devDependencies`)

- @types/jest@^29.5.12
- @types/react-dom@^18.3.0
- @types/react@^18.3.1
- autoprefixer@^10.4.4
- jest@^29.7.0
- postcss@^8.4.31
- react-test-renderer@^18.3.1
- tailwindcss@^3.0.23
- ts-jest@^29.1.2

## Environment-Specific Dependencies and Setup

For OS, VM/server, and cloud-specific prerequisites (for example, Docker, GPU/CUDA, and Ollama installation differences), use the installation guides:

- Mac: `installation/macOS/README.md`
- Linux: `installation/linux/README.md`
- Windows: `installation/windows/README.md`
- VM/Server: `installation/vm/README.md`
- Cloud (Azure): `installation/azure/README.md`
