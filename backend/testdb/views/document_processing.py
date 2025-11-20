"""
Document processing functions for PDFs and other file formats
"""
import fitz
import base64
import subprocess
import requests
import xml.etree.ElementTree as ET
from pypdf import PdfReader
from langchain_community.llms import Ollama


def getPDFContent(path):
    """Extracts content from a given PDF file and returns it along with the number of pages."""
    try:
        reader = PdfReader(path, strict=False)
        # check if the PDF has a root/catalog
        if len(reader.pages) == 0:
            print(f"PDF structure error: Pages are not of type list in {path}")
            return []
        for i, page in enumerate(reader.pages):
            print(f"Page {i + 1}: {page.extract_text()}")
        return reader.pages
    except Exception as e:
        print(f"Error reading PDF {path}: {e}")
        return []


def convert_to_pdf(input_file, output_dir):
    """Convert files to PDF using LibreOffice"""
    # Construct the command to convert PPTX to PDF
    command = [
        "soffice",
        "--headless",
        "--convert-to", "pdf",
        "--outdir", output_dir,
        input_file
    ]
    
    # Run the command
    subprocess.run(command, check=True)


def extractPDFImages(path, title, data_list):
    """Extract images from PDF and describe them using LLaVA"""
    pdf_file = fitz.open(path)
    for page_index in range(len(pdf_file)):
        page = pdf_file[page_index]
        image_list = page.get_images()
        for image_index, img in enumerate(image_list, start=1):
            xref = img[0]
            base_image = pdf_file.extract_image(xref)
            image_bytes = base_image["image"]
            image_b64 = base64.b64encode(image_bytes).decode("utf-8")
            prompt = 'Describe this image and make sure to include anything notable about it (include text you see in the image): '
            ollama = Ollama(base_url="http://localhost:11434", model="llava")
            response = ollama.invoke(prompt, images=[image_b64])
            print(response, end='', flush=True)
            data_list.append({'title': title, 'page': page_index, 'content': response, 'type': 'image'})


def highlight_pdf(input_file, output_file, source_grp):
    """Highlight PDF based on source groups with color coding"""
    input_pdf = fitz.open(input_file)
    # iterate through source_grp
    for source in source_grp:
        page_idx = source['page'] - 1
        highlight_text = source['context']
        for idx in range(len(input_pdf)):
            if idx != page_idx:
                continue
            page = input_pdf[idx]
            hightlight_sentences = highlight_text.split('.')
            hightlight_sentences = [sentence for sentence in hightlight_sentences if len(sentence) > 10]
            for sentence in hightlight_sentences:
                if(len(sentence) == 0):
                    continue
                text_instances = page.search_for(sentence)

                for inst in text_instances:
                    highlight = page.add_highlight_annot(inst)
                    highlight.set_colors()
                    highlight.update()

                    if 'vector_score' in source and 'bm25_score' in source:
                        if source['vector_score'] > 0.5 or source['bm25_score'] > 0.5:
                           # highlight with green color rgb(120, 198, 121)
                            highlight.set_colors(stroke=[0.486, 0.988, 0])
                            highlight.update()
                        elif source['vector_score'] > 0.3 or source['bm25_score'] > 0.3:
                            # highlight with yellow color
                            highlight.set_colors(stroke=[1, 1, 0])
                            highlight.update()
                        elif source['vector_score'] > 0.15 or source['bm25_score'] > 0.15:
                            # highlight with light yellow color (247, 252, 185)
                            highlight.set_colors(stroke=[0.97, 0.98, 0.72])
                            highlight.update()
                        else:
                            # highlight gray (220,220,220)
                            highlight.set_colors(stroke=[0.863, 0.863, 0.863])
                            highlight.update()

                    # check if source has distance key
                    elif 'vector_score' in source:
                        if source['vector_score'] > 0.5:
                            # highlight with green color rgb(120, 198, 121)
                            highlight.set_colors(stroke=[0.486, 0.988, 0])
                            highlight.update()
                        elif source['vector_score'] > 0.3:
                            # highlight with yellow color
                            highlight.set_colors(stroke=[1, 1, 0])
                            highlight.update()
                        elif source['vector_score'] > 0.15:
                            # highlight with light yellow color (247, 252, 185)
                            highlight.set_colors(stroke=[0.97, 0.98, 0.72])
                            highlight.update()
                        else:
                            # highlight gray (220,220,220)
                            highlight.set_colors(stroke=[0.863, 0.863, 0.863])
                            highlight.update()

                    # check if source has score key
                    elif 'bm25_score' in source:
                        if source['bm25_score'] > 0.5:
                            # highlight with green color rgb(120, 198, 121)
                            highlight.set_colors(stroke=[0.486, 0.988, 0])
                            highlight.update()
                        elif source['bm25_score'] > 0.3:
                            # highlight with yellow color
                            highlight.set_colors(stroke=[1, 1, 0])
                            highlight.update()
                        elif source['bm25_score'] > 0.15:
                            # highlight with light yellow color (247, 252, 185)
                            highlight.set_colors(stroke=[0.97, 0.98, 0.72])
                            highlight.update()
                        else:
                            # highlight gray (220,220,220)
                            highlight.set_colors(stroke=[0.863, 0.863, 0.863])
                            highlight.update()
                    
                    else:
                        # highlight gray (220,220,220)
                        highlight.set_colors(stroke=[0.863, 0.863, 0.863])
                        highlight.update()

    input_pdf.save(output_file, garbage=4, deflate=True, clean=True)


def get_toc_from_grobid(pdf_path):
    """
    Extract the table of contents from a PDF file using GROBID.
    Grobid is available at http://localhost:8070 by default.
    """
    # Use GROBID to extract the table of contents
    url = 'http://host.docker.internal:8070/api/processFulltextDocument'
    files = {'input': open(pdf_path, 'rb')}
    data = {'consolidateHeader': '1', 'teiCoordinates': 'head'}
    response = requests.post(url, files=files, data=data)
    
    # Parse the response to get the table of contents
    toc = []
    if response.status_code == 200:
        xml_content = response.content
        # Parse the XML content and get <head> elements across entire XML
        root = ET.fromstring(xml_content)

        for head in root.findall('.//{http://www.tei-c.org/ns/1.0}head'):
            # Extract the text from the <head> element
            head_text = head.text.strip() if head.text else ''
            # get page number from coords attribute from head <head coords="1,72.02,292.61,212.67,11.99"> 
            coords = head.get('coords')
            page = coords.split(',')[0] if coords else '1'
            # add to toc if not empty as pymupdf format
            if head_text:
                toc.append([1, head_text, int(page) ])  # Assuming level 1 for all headings
            
    else:
        print(f"Error: {response.status_code} - {response.text}")

    # remove header and footer from toc by removing repetitive elements
    if len(toc) > 0:
        # find most common element in toc
        for i in range(len(toc)-1, 0, -1):
            if toc[i][1] == toc[i-1][1]:
                toc.pop(i)
    
    return toc
