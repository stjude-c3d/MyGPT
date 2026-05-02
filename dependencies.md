# Dependencies

This document summarizes project dependencies for MyGPT.

## Backend Dependencies

Source: `backend/requirements.txt`

- Django>=5.0.14
- psycopg2-binary>=2.8
- requests>=2.32.5
- djangorestframework
- django-cors-headers
- djangorestframework-simplejwt>=5.3.1
- sacremoses
- transformers>=4.57.2
- sentence_transformers>=5.1.2
- pypdf
- pandas
- pyzotero
- pymupdf==1.24.14
- numpy
- chromadb==0.5.7
- tqdm
- python-dotenv
- pytest-django
- pytube
- youtube_transcript_api
- pdfkit
- ollama>=0.6.1
- duckdb
- openpyxl
- langchain_community
- langchain==1.0.0a1
- huggingface-hub>=0.36.0
- pycryptodome==3.15.0
- sqlparse>=0.5.0
- bm25s
- pystemmer
- zipp>=3.19.1

## Frontend Dependencies

Source: `frontend/package.json`

### Runtime Dependencies (`dependencies`)

- @azure/msal-react@^2.0.22
- @heroicons/react@^2.1.5
- @modelcontextprotocol/sdk@^1.21.1
- @react-pdf-viewer/bookmark@3.12.0
- @react-pdf-viewer/core@^3.12.0
- @react-pdf-viewer/default-layout@^3.12.0
- @react-pdf-viewer/highlight@3.12.0
- @react-pdf-viewer/page-navigation@3.12.0
- @react-three/drei@^9.122.0
- @react-three/fiber@^8.18.0
- @testing-library/jest-dom@^5.17.0
- @testing-library/react@^15.0.7
- @testing-library/user-event@^13.5.0
- @types/d3@^7.1.0
- @types/node@^16.18.108
- @types/three@^0.180.0
- better-react-mathjax@^2.3.0
- d3@7.9.0
- env-cmd@^10.1.0
- http-proxy-middleware@^3.0.5
- node-forge@^1.3.2
- nth-check@2.1.1
- react@^18.3.1
- react-dom@^18.3.0
- react-markdown@^8.0.7
- react-router-dom@^6.30.1
- react-scripts@5.0.1
- rehype-katex@^7.0.1
- remark-math@^6.0.0
- three@^0.181.2
- typescript@^4.9.5
- web-vitals@^2.1.4

### Development Dependencies (`devDependencies`)

- @types/jest@^29.5.12
- @types/react@^18.3.1
- @types/react-dom@^18.3.0
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
