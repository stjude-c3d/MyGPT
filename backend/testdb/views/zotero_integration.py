"""
Zotero integration for importing papers
"""
import os
import re
import datetime
from pathlib import Path
from pyzotero import zotero
from django.core.files.base import File
from django.utils.timezone import make_aware

from ..models import Papers, Dataset
from .document_processing import getPDFContent
from .helpers import sanitize_filename

BASE_DATA_DIR = Path('data').resolve()


def _safe_dataset_name(name: str) -> str:
    """Strip path separators and allow only safe characters for use as a directory name."""
    name = os.path.basename(name.replace('/', '_').replace('\\', '_'))
    name = re.sub(r'[^a-zA-Z0-9_\-]', '_', name)
    if not name:
        raise ValueError("Dataset name is empty after sanitization.")
    return name


def _safe_path(base_dir: Path, *parts: str) -> Path:
    """Resolve path and ensure it stays within base_dir."""
    resolved = (base_dir / Path(*parts)).resolve()
    if not str(resolved).startswith(str(base_dir) + os.sep):
        raise ValueError(f"Path traversal detected: {resolved}")
    return resolved


def get_zotero_chunks(library_id, library_id_type, collection_id, users_api_key, user='', user_email='', user_group='', use_bm25='Yes', chunking_method='fixed_chunk_size'):
    """Collects chunks of text from PDFs stored in a Zotero collection."""
    types = ['journalArticle', 'preprint', 'blogPost', 'webpage']
    api_key = users_api_key
    if not api_key:
        api_key = os.environ.get('ZOTERO_API_KEY')

    # Initialize the Zotero API client
    zot = zotero.Zotero(library_id, library_id_type, api_key)
    # Get the collection name — sanitize immediately before any path use
    raw_name = zot.all_collections(collection_id)[0]['data']['name'].replace(' ', '_')
    dataset_name = _safe_dataset_name(raw_name)
    datasets = Dataset.objects.filter(dataset_name=dataset_name)
    if datasets.count() > 0:
        dataset = datasets[0]
    else:
        dataset = Dataset.objects.create(
            dataset_name=dataset_name,
            library_type='papers',
            dataset_size=0,
            zotero_id=collection_id,
            user = user if len(user) else '-',
            user_email = user_email if len(user_email) else '-',
            user_group = user_group if len(user_group) else '-',
            chunking_method=chunking_method,
            use_bm25= True if use_bm25 == 'Yes' else False,
            dataset_date_time=make_aware(datetime.datetime.now())
        )

    # Get items from the publication collection
    items = zot.everything(zot.collection_items(collection_id))
    articles_temp = [x for x in items if x['data']['itemType'] in types]
    # filter articles with attachments
    articles = []
    for article in articles_temp:
        if 'links' in article:
            if 'attachment' in article['links']:
                if article['links']['attachment']['attachmentType'] == 'application/pdf' and article['links']['attachment']['attachmentSize'] > 0:
                    articles.append(article)

    all_titles = [x['data']['title'] for x in articles]
    titles = []
    attachments = [zot.children(x['data']['key']) for x in articles]
    pdf_attachments = []
    for attachment_list, title in zip(attachments, all_titles):
        for attachment in attachment_list:
            if attachment['data']['itemType'] == 'attachment' and attachment['data']['contentType'] == 'application/pdf':
                pdf_attachments.append(attachment)
                titles.append(title)

    print('zotero files loaded')

    data = []
    # make directory for pdfs
    pdfs_dir = _safe_path(BASE_DATA_DIR, 'pdfs', dataset_name)
    pdfs_dir.mkdir(parents=True, exist_ok=True)
    
    # Loop through PDF attachments, extract content, and store it in 'data' list
    for idx, title, attachment in zip(range(1, len(titles)+1), titles, pdf_attachments):
        pdf_path = _safe_path(BASE_DATA_DIR, 'pdfs', dataset_name, f'paper{idx}.pdf')
        with open(pdf_path, 'wb') as f:
            write_success = False
            try:
                f.write(zot.file(attachment['data']['key']))
                write_success = True
            except:
                print('error writing pdf')
            if write_success:
                pages = getPDFContent(pdf_path)
                papers = Papers.objects.filter(paper_title=title, paper_dataset=dataset)
                if papers.count() > 0:
                    paper = papers[0]
                else:
                    paper = None
                if not paper:
                    paper = Papers.objects.create(
                        paper_title=title,
                        paper_dataset=dataset,
                        paper_date_time=make_aware(datetime.datetime.now())
                    )
                with open(pdf_path, 'rb') as f:
                    paper.paper_attachment.save(dataset_name + '/paper' + str(idx) + '.pdf', File(f), save=True)

                for page_num, page in enumerate(pages):
                    text = page.extract_text()
                    text = text.replace('-\n', '-').replace('\n', ' ')
                    text = ' '.join(text.split())
                    n = 1000
                    splits = []
                    remainder = ''
                    for i in range(0, len(text), n):
                        item = remainder + text[i : i + n]
                        if '. ' in item:
                            remainder = item[item.rindex('. ') + 2: ]
                            item = item.removesuffix(remainder)
                        if '(' in item and ')' not in item:
                            remainder = item[item.rindex('(') + 1: ]
                            item = item.removesuffix(remainder)
                        elif '(' in item and ')' in item and item.rindex('(') > item.rindex(')'):
                            remainder = item[item.rindex('(') + 1: ]
                            item = item.removesuffix(remainder)

                        if len(item) > 10:
                            splits.append(item)
                    for split in splits:
                        chunk = {'title': title, 'page': page_num+1, 'content': split, 'type': 'pagechunk'}
                        data.append(chunk)
    print('zotero chunks loaded')        

    chunks_path = _safe_path(BASE_DATA_DIR, 'data_chunks', f'{dataset_name}.txt')
    with open(chunks_path, 'w') as f:
        for chunk in data:
            # convert chunk to string and write to file
            f.write(str(chunk) + '\n')
    print('zotero chunks saved to file')
    return dataset_name
