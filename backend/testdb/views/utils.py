"""
Refactored utils module - Re-exports all functions from specialized modules for backward compatibility.

This module maintains backward compatibility by importing and re-exporting all functions
that were previously defined here. The actual implementations are now in specialized modules:

- helpers.py: General utility functions
- document_processing.py: PDF and document handling
- embedding_utils.py: Embedding operations
- vector_db.py: ChromaDB operations
- analytics.py: PCA and scoring functions
- video_processing.py: YouTube/video functions
- zotero_integration.py: Zotero integration
- dataset_management.py: Dataset operations
"""

from django.apps import apps

# Import from specialized modules
from .helpers import (
    sanitize_filename,
    seconds_to_hhmmss,
    min_max_normalization,
    find_cutoff_distance
)

from .document_processing import (
    getPDFContent,
    convert_to_pdf,
    extractPDFImages,
    highlight_pdf,
    get_toc_from_grobid
)

from .embedding_utils import (
    get_embedding_model_ef,
    get_embedding_cutoff_distance,
    add_embeddings_to_chunks,
    add_embeddings_to_qna
)

from .vector_db import (
    add_to_chroma,
    nearestDataChroma,
    get_answer_distance,
    get_answer_distance_by_context
)

from .analytics import (
    add_pca_to_chunks,
    add_pca_to_qna_and_dataset,
    save_chunks_pca_to_file,
    get_relevance_score
)

from .video_processing import (
    get_youtube_transcript,
    add_video_to_chroma
)

from .zotero_integration import (
    get_zotero_chunks
)

from .dataset_management import (
    add_dataset_from_upload,
    add_demo_dataset,
    get_conversation_json,
    get_previous_qna_json
)

# Maintain app_config for backward compatibility
app_config = apps.get_app_config('testdb')

# Re-export all functions to maintain backward compatibility
__all__ = [
    # Helper functions
    'sanitize_filename',
    'seconds_to_hhmmss',
    'min_max_normalization',
    'find_cutoff_distance',
    
    # Document processing
    'getPDFContent',
    'convert_to_pdf',
    'extractPDFImages',
    'highlight_pdf',
    'get_toc_from_grobid',
    
    # Embedding utilities
    'get_embedding_model_ef',
    'get_embedding_cutoff_distance',
    'add_embeddings_to_chunks',
    'add_embeddings_to_qna',
    
    # Vector database
    'add_to_chroma',
    'nearestDataChroma',
    'get_answer_distance',
    'get_answer_distance_by_context',
    
    # Analytics
    'add_pca_to_chunks',
    'add_pca_to_qna_and_dataset',
    'save_chunks_pca_to_file',
    'get_relevance_score',
    
    # Video processing
    'get_youtube_transcript',
    'add_video_to_chroma',
    
    # Zotero integration
    'get_zotero_chunks',
    
    # Dataset management
    'add_dataset_from_upload',
    'add_demo_dataset',
    'get_conversation_json',
    'get_previous_qna_json',
]
