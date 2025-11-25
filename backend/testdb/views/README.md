# Quick Reference: Refactored Utils Modules

## Visual Module Structure

```
┌─────────────────────────────────────────────────────────┐
│                       apis.py                           │
│              (Main API endpoints)                       │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
    ┌──────────────┴───────────────────────────┐
    │                                           │
    ▼                                           ▼
┌─────────────────┐                    ┌──────────────────┐
│   helpers.py    │                    │  vector_db.py    │
│                 │                    │                  │
│ • sanitize      │                    │ • add_to_chroma  │
│ • normalize     │                    │ • nearestData    │
│ • time convert  │                    │ • distances      │
└─────────────────┘                    └──────────────────┘
                                                 │
    ┌────────────────────────────────────────────┤
    │                                            │
    ▼                                            ▼
┌──────────────────┐                    ┌───────────────────┐
│ embedding_utils  │◄───────────────────│   analytics.py    │
│                  │                    │                   │
│ • get_model_ef   │                    │ • PCA             │
│ • add_embeddings │                    │ • relevance       │
│ • cutoff_dist    │                    │ • scoring         │
└────────┬─────────┘                    └───────────────────┘
         │
         │ uses
         ▼
┌──────────────────────┐
│ embedding_functions  │
│                      │
│ • HuggingFace        │
│ • Ollama             │
│ • Ray                │
└──────────────────────┘

         ┌──────────────────┬─────────────────────┐
         │                  │                     │
         ▼                  ▼                     ▼
┌──────────────┐   ┌────────────────┐   ┌────────────────────┐
│document_proc │   │video_processing│   │dataset_management  │
│              │   │                │   │                    │
│ • PDF ops    │   │ • YouTube      │   │ • upload datasets  │
│ • highlight  │   │ • transcripts  │   │ • demo datasets    │
│ • GROBID     │   │ • add_video    │   │ • conversations    │
└──────────────┘   └────────────────┘   └────────────────────┘
         │
         │
         ▼
┌──────────────────┐      ┌──────────────────┐
│zotero_integration│      │   bm25_utils     │
│                  │      │                  │
│ • get_chunks     │      │ • index_doc      │
│ • API client     │      │ • retrieve       │
└──────────────────┘      │ • hybrid_search  │
                          └──────────────────┘
```

## For Developers: Where to Find Functions

### 📁 Module Organization

#### `helpers.py` - General Utilities
```python
from .helpers import sanitize_filename, seconds_to_hhmmss, min_max_normalization, find_cutoff_distance
```
- `sanitize_filename(filename)` - Clean filenames for safe storage
- `seconds_to_hhmmss(seconds)` - Convert seconds to HH:MM:SS
- `min_max_normalization(data, best_val, worst_val, reverse)` - Normalize data
- `find_cutoff_distance(distances)` - Find distance cutoff

#### `document_processing.py` - PDF & Documents
```python
from .document_processing import getPDFContent, convert_to_pdf, extractPDFImages, highlight_pdf, get_toc_from_grobid
```
- `getPDFContent(path)` - Extract text from PDF
- `convert_to_pdf(input_file, output_dir)` - Convert files to PDF
- `extractPDFImages(path, title, data_list)` - Extract images from PDF
- `highlight_pdf(input_file, output_file, source_grp)` - Add highlights to PDF
- `get_toc_from_grobid(pdf_path)` - Extract table of contents

#### `embedding_utils.py` - Embeddings
```python
from .embedding_utils import get_embedding_model_ef, get_embedding_cutoff_distance, add_embeddings_to_chunks, add_embeddings_to_qna
```
- `get_embedding_model_ef(embedding_model_request, add_distances)` - Get embedding function
- `get_embedding_cutoff_distance(embedding_model_ef, chunks, question, answer, answer_no_context)` - Calculate cutoffs
- `add_embeddings_to_chunks(dataset)` - Add embeddings to chunks
- `add_embeddings_to_qna(text, text_type, embedding_model_request)` - Add embeddings to Q&A

#### `vector_db.py` - ChromaDB Operations
```python
from .vector_db import add_to_chroma, nearestDataChroma, get_answer_distance, get_answer_distance_by_context
```
- `add_to_chroma(dataset_name, embedding_model_request, distance_function, chunking_method)` - Add to ChromaDB
- `nearestDataChroma(text, dataset_name, document_title_str, focused_section_str, keywords_str, ...)` - Query ChromaDB
- `get_answer_distance(answer1, answer2, embedding_model_request)` - Distance between answers
- `get_answer_distance_by_context(text, dataset_name, contexts, embedding_model_request)` - Distance by context

#### `analytics.py` - Scoring & PCA
```python
from .analytics import add_pca_to_chunks, add_pca_to_qna_and_dataset, save_chunks_pca_to_file, get_relevance_score
```
- `add_pca_to_chunks()` - Add PCA to chunks
- `add_pca_to_qna_and_dataset(question_id)` - Add PCA to Q&A and dataset
- `save_chunks_pca_to_file()` - Save PCA to file
- `get_relevance_score(distances, embedding_model, question, use_default, qrs_lower, qrs_upper)` - Calculate score

#### `video_processing.py` - YouTube
```python
from .video_processing import get_youtube_transcript, add_video_to_chroma
```
- `get_youtube_transcript(dataset_name, video_ids, video_titles)` - Extract YouTube transcripts
- `add_video_to_chroma(dataset_name, embedding_model_request)` - Add videos to ChromaDB

#### `zotero_integration.py` - Zotero
```python
from .zotero_integration import get_zotero_chunks
```
- `get_zotero_chunks(library_id, library_id_type, collection_id, users_api_key, ...)` - Import Zotero collection

#### `dataset_management.py` - Datasets
```python
from .dataset_management import add_dataset_from_upload, add_demo_dataset, get_conversation_json, get_previous_qna_json
```
- `add_dataset_from_upload(request)` - Create dataset from upload
- `add_demo_dataset(embedding_model_request)` - Add demo dataset
- `get_conversation_json(question_text)` - Get conversation history
- `get_previous_qna_json(question_text)` - Get previous Q&A

#### `bm25_utils.py` - BM25 Keyword Search
```python
from .bm25_utils import index_document_by_bm25, retrieve_chunks_by_bm25, hybrid_source_combination, get_answer_distance_by_context_bm25
```
- `index_document_by_bm25(dataset_name)` - Create BM25 index for keyword search
- `retrieve_chunks_by_bm25(queryText, dataset_name, document_title, chunk_count)` - Retrieve chunks using BM25
- `hybrid_source_combination(vector_sources, bm25_sources)` - Combine vector and BM25 search results
- `get_answer_distance_by_context_bm25(text, contexts)` - Get BM25 distance by context

#### `embedding_functions.py` - Custom Embedding Functions
```python
from .embedding_functions import HuggingFaceEmbeddingFunction, OllamaEmbeddingFunction, RayEmbeddingFunction
```
- `HuggingFaceEmbeddingFunction(api_key, model_name)` - HuggingFace API embeddings
- `OllamaEmbeddingFunction(url, model_name)` - Ollama server embeddings
- `RayEmbeddingFunction(url, model_name)` - Ray server embeddings


## Module Dependencies

```
apis.py
  └─> utils.py (re-export hub)
       ├─> helpers.py
       ├─> document_processing.py
       ├─> embedding_utils.py
       │    ├─> helpers.py (minimal dependencies)
       │    └─> embedding_functions.py
       ├─> vector_db.py
       │    ├─> helpers.py
       │    └─> embedding_utils.py
       ├─> analytics.py
       │    └─> helpers.py
       ├─> video_processing.py
       │    └─> embedding_utils.py
       ├─> zotero_integration.py
       │    ├─> document_processing.py
       │    └─> helpers.py
       ├─> dataset_management.py
       │    ├─> document_processing.py
       │    ├─> helpers.py
       │    ├─> embedding_utils.py
       │    └─> analytics.py
       └─> bm25_utils.py (keyword search, hybrid retrieval)
	   
```

## Additional Utility Modules

### `bm25_utils.py` - BM25 Keyword Search Engine
**Purpose**: Provides keyword-based search using BM25 algorithm, complementing vector similarity search.

**Key Features**:
- Document indexing with stemming
- Fast keyword retrieval
- Hybrid search combining BM25 and vector results
- Document-specific filtering

**Use Cases**:
- Keyword-based document retrieval
- Hybrid search (combining with vector search)
- Exact term matching
- Fallback when vector search has low confidence

### `embedding_functions.py` - Custom Embedding Implementations
**Purpose**: Custom ChromaDB-compatible embedding functions for various providers.

**Supported Providers**:
1. **HuggingFace** - API-based embeddings from HuggingFace models
2. **Ollama** - Local/self-hosted Ollama server embeddings
3. **Ray** - Distributed Ray server embeddings

**Use Cases**:
- Using custom embedding models
- Self-hosted embedding servers
- Alternative embedding providers
- Enterprise/private deployments
```