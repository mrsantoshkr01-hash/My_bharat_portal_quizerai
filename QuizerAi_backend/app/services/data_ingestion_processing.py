# IN this we are writing the code to give process the data 
from langchain_community.document_loaders import PyPDFLoader  # Fixed deprecated import
from langchain.text_splitter import RecursiveCharacterTextSplitter
import pytesseract
from PIL import Image
import requests
from bs4 import BeautifulSoup
from fastapi import UploadFile, HTTPException
import logging
import os
import tempfile
import shutil
import re
from langchain_community.document_loaders import SeleniumURLLoader
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path
from langchain.schema import Document

import pytesseract
import os
# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Set tesseract path explicitly
tesseract_path = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

if os.path.exists(tesseract_path):
    pytesseract.pytesseract.tesseract_cmd = tesseract_path
    print(f"Tesseract found at: {tesseract_path}")
    logger.info(f"Tesseract found at: {tesseract_path}")
else:
    print("Tesseract not found at expected location")
    logger.info(f"Tesseract not found at expected location")
    # Try alternative paths
    alt_paths = [
        r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
        r'C:\Tesseract-OCR\tesseract.exe',
    ]
    
    for path in alt_paths:
        if os.path.exists(path):
            pytesseract.pytesseract.tesseract_cmd = path
            print(f"Tesseract found at: {path}")
            break



# LangChain setup for map-reduce
text_splitter = RecursiveCharacterTextSplitter(chunk_size=2000, chunk_overlap=200)

def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to avoid path issues
    """
    # Remove problematic characters and replace spaces with underscores
    sanitized = re.sub(r'[^\w\s.-]', '', filename)
    sanitized = re.sub(r'\s+', '_', sanitized)
    return sanitized

def process_pdf(file: UploadFile):
    """
    Process PDF files using PyPDFLoader and split into chunks.
    Returns a list of LangChain Document objects.
    """
    temp_path = None
    try:
        # Reset file pointer to beginning
        file.file.seek(0)
        
        # Sanitize filename
        safe_filename = sanitize_filename(file.filename)
        
        # Create temporary file with proper extension
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf', prefix='upload_') as tmp_file:
            temp_path = tmp_file.name
            # Copy uploaded file content to temporary file
            shutil.copyfileobj(file.file, tmp_file)
        
        # Verify file was created and has content
        if not os.path.exists(temp_path):
            raise FileNotFoundError(f"Temporary file was not created: {temp_path}")
        
        file_size = os.path.getsize(temp_path)
        if file_size == 0:
            raise ValueError(f"Uploaded file is empty: {file.filename}")
        
        logger.info(f"Temporary file created: {temp_path} (size: {file_size} bytes)")
        
        # Load and split PDF
        loader = PyPDFLoader(temp_path)
        documents = loader.load()
        
        if not documents:
            raise ValueError(f"No content extracted from PDF: {file.filename}")
        
        documents = text_splitter.split_documents(documents)
        
        logger.info(f"Processed PDF: {file.filename}, {len(documents)} chunks")
        return documents
        
    except Exception as e:
        logger.error(f"Error processing PDF {file.filename}: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error processing PDF: {str(e)}")
    
    finally:
        # Clean up temporary file in finally block to ensure cleanup
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
                logger.info(f"Cleaned up temporary file: {temp_path}")
            except Exception as cleanup_error:
                logger.warning(f"Failed to cleanup temporary file {temp_path}: {cleanup_error}")

def process_image(file: UploadFile):
    """
    Process image files using OCR.
    Returns a single text string.
    """
    try:
        text = pytesseract.image_to_string(Image.open(file.file))
        logger.info(f"Processed image: {file.filename}, {len(text)} characters")
        return text
    except Exception as e:
        logger.error(f"Error processing image {file.filename}: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error processing image: {str(e)}")

def process_url_selenium(url:str):
    """
    Here we are extracting data from url in document form with the help of seleniumurlloader
    output = documents in the form of list
    """
    
    try:
        if not url:
            logger.info(f" Please provide url")
        url_loader=SeleniumURLLoader(urls=[url])
        url_document=url_loader.load()
        return url_document
    except Exception as e:
        logger.error(f"Error processing URL {url}: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error processing URL: {str(e)}")


# PowerPoint Processing Implementation
class PowerPointProcessor:
    """
    PowerPoint processor that follows Quizerai's existing patterns
    Integrates seamlessly with your current LangChain workflow
    """
    
    def __init__(self):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=2000, 
            chunk_overlap=200
        )
        
        # XML namespaces for PowerPoint
        self.namespaces = {
            'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
            'p': 'http://schemas.openxmlformats.org/presentationml/2006/main',
            'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
        }
    
    def process_pptx(self, file: UploadFile):
        """
        Process PPTX files following Quizerai's pattern.
        Returns a list of LangChain Document objects - same as PDF processing.
        """
        temp_path = None
        temp_dir = None
        
        try:
            # Reset file pointer to beginning (same as PDF processing)
            file.file.seek(0)
            
            # Sanitize filename (same function as PDF)
            safe_filename = sanitize_filename(file.filename)
            
            # Create temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pptx', prefix='upload_') as tmp_file:
                temp_path = tmp_file.name
                shutil.copyfileobj(file.file, tmp_file)
            
            # Verify file was created
            if not os.path.exists(temp_path):
                raise FileNotFoundError(f"Temporary file was not created: {temp_path}")
            
            file_size = os.path.getsize(temp_path)
            if file_size == 0:
                raise ValueError(f"Uploaded file is empty: {file.filename}")
            
            logger.info(f"Temporary PPTX file created: {temp_path} (size: {file_size} bytes)")
            
            # Extract PowerPoint content
            documents = self._extract_pptx_content(temp_path)
            
            if not documents:
                raise ValueError(f"No content extracted from PowerPoint: {file.filename}")
            
            # Split documents into chunks (same as PDF processing)
            documents = self.text_splitter.split_documents(documents)
            
            logger.info(f"Processed PowerPoint: {file.filename}, {len(documents)} chunks")
            return documents
            
        except Exception as e:
            logger.error(f"Error processing PowerPoint {file.filename}: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Error processing PowerPoint: {str(e)}")
        
        finally:
            # Clean up temporary files
            if temp_path and os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                    logger.info(f"Cleaned up temporary file: {temp_path}")
                except Exception as cleanup_error:
                    logger.warning(f"Failed to cleanup temporary file {temp_path}: {cleanup_error}")
            
            if temp_dir and os.path.exists(temp_dir):
                try:
                    shutil.rmtree(temp_dir)
                except Exception as cleanup_error:
                    logger.warning(f"Failed to cleanup temporary directory {temp_dir}: {cleanup_error}")
    
    def _extract_pptx_content(self, file_path: str):
        """
        Extract text content from PPTX file using ZIP extraction.
        Returns list of Document objects with slide content.
        """
        documents = []
        temp_dir = None
        
        try:
            # Create temporary directory for extraction
            temp_dir = tempfile.mkdtemp(prefix='pptx_extract_')
            
            # Extract PPTX file (it's a ZIP archive)
            with zipfile.ZipFile(file_path, 'r') as zip_ref:
                zip_ref.extractall(temp_dir)
            
            # Get slide files
            slides_dir = os.path.join(temp_dir, 'ppt', 'slides')
            if not os.path.exists(slides_dir):
                raise ValueError("No slides found in PowerPoint file")
            
            # Process each slide
            slide_files = sorted([f for f in os.listdir(slides_dir) if f.startswith('slide') and f.endswith('.xml')])
            
            for i, slide_file in enumerate(slide_files, 1):
                slide_path = os.path.join(slides_dir, slide_file)
                slide_text = self._extract_slide_text(slide_path)
                
                if slide_text.strip():  # Only add slides with content
                    doc = Document(
                        page_content=slide_text,
                        metadata={
                            "slide": i,
                            "source": file_path,
                            "file_type": "pptx",
                            "total_slides": len(slide_files)
                        }
                    )
                    documents.append(doc)
            
            # Extract speaker notes if they exist
            notes_dir = os.path.join(temp_dir, 'ppt', 'notesSlides')
            if os.path.exists(notes_dir):
                notes_files = sorted([f for f in os.listdir(notes_dir) if f.startswith('notesSlide') and f.endswith('.xml')])
                
                for i, notes_file in enumerate(notes_files, 1):
                    notes_path = os.path.join(notes_dir, notes_file)
                    notes_text = self._extract_slide_text(notes_path)
                    
                    if notes_text.strip():
                        # Add notes to existing slide document or create new one
                        if i <= len(documents):
                            documents[i-1].page_content += f"\n\nSpeaker Notes: {notes_text}"
                        else:
                            doc = Document(
                                page_content=f"Speaker Notes (Slide {i}): {notes_text}",
                                metadata={
                                    "slide": i,
                                    "source": file_path,
                                    "file_type": "pptx_notes",
                                    "content_type": "speaker_notes"
                                }
                            )
                            documents.append(doc)
            
            return documents
            
        except Exception as e:
            raise Exception(f"Error extracting PowerPoint content: {str(e)}")
        
        finally:
            # Cleanup temporary directory
            if temp_dir and os.path.exists(temp_dir):
                shutil.rmtree(temp_dir)
    
    def _extract_slide_text(self, slide_xml_path: str):
        """
        Extract text from a single slide XML file.
        """
        try:
            tree = ET.parse(slide_xml_path)
            root = tree.getroot()
            
            # Find all text elements
            text_elements = []
            
            # Look for text in various PowerPoint text containers
            for text_elem in root.findall('.//a:t', self.namespaces):
                if text_elem.text:
                    text_elements.append(text_elem.text.strip())
            
            # Join all text with spaces
            slide_text = ' '.join(text_elements)
            
            # Clean up text
            slide_text = self._clean_text(slide_text)
            
            return slide_text
            
        except Exception as e:
            logger.warning(f"Could not extract text from slide {slide_xml_path}: {e}")
            return ""
    
    def _clean_text(self, text: str):
        """
        Clean extracted text (same approach as PDF processing).
        """
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove special characters that might cause issues
        text = re.sub(r'[^\w\s\-.,!?;:()\[\]{}"\']', ' ', text)
        
        # Remove excessive punctuation
        text = re.sub(r'[.]{3,}', '...', text)
        text = re.sub(r'[-]{3,}', '---', text)
        
        return text.strip()

# Global processor instance
pptx_processor = PowerPointProcessor()

def process_pptx(file: UploadFile):
    """
    Process PowerPoint files using the same pattern as process_pdf.
    Returns a list of LangChain Document objects.
    """
    return pptx_processor.process_pptx(file)

# Alternative processing function for PPT files (older format)
def process_ppt(file: UploadFile):
    """
    Process older PPT files by attempting conversion or OCR extraction.
    For now, this is a placeholder that raises an informative error.
    """
    try:
        # PPT files are binary format and more complex to process
        # For production, you might want to:
        # 1. Use python-pptx library (requires installation)
        # 2. Convert PPT to PPTX using external tools
        # 3. Use OCR on converted images
        
        logger.warning(f"PPT file processing not fully implemented: {file.filename}")
        raise HTTPException(
            status_code=400, 
            detail="PPT files are not supported yet. Please convert to PPTX format and try again."
        )
        
    except Exception as e:
        logger.error(f"Error processing PPT {file.filename}: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error processing PPT: {str(e)}")

# Enhanced file type detection function
def detect_file_type(file: UploadFile):
    """
    Enhanced file type detection for all supported formats
    """
    filename_lower = file.filename.lower()
    
    if filename_lower.endswith('.pdf'):
        return 'pdf'
    elif filename_lower.endswith('.pptx'):
        return 'pptx'
    elif filename_lower.endswith('.ppt'):
        return 'ppt'
    elif filename_lower.endswith(('.png', '.jpg', '.jpeg')):
        return 'image'
    else:
        return 'unknown'

# Main processing dispatcher function
def process_uploaded_file(file: UploadFile):
    """
    Main dispatcher function that routes to appropriate processor based on file type.
    This can be used to simplify your API router logic.
    """
    file_type = detect_file_type(file)
    
    if file_type == 'pdf':
        return process_pdf(file)
    elif file_type == 'pptx':
        return process_pptx(file)
    elif file_type == 'ppt':
        return process_ppt(file)  # Will raise error for now
    elif file_type == 'image':
        text = process_image(file)
        return [Document(page_content=text, metadata={"source": file.filename, "file_type": "image"})]
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Supported formats: PDF, PPTX, PNG, JPG, JPEG"
        )

# Health check function for PowerPoint processing
def check_pptx_capabilities():
    """
    Check if PowerPoint processing capabilities are available
    """
    try:
        import zipfile
        import xml.etree.ElementTree as ET
        
        return {
            "status": "available",
            "modules": ["zipfile", "xml.etree.ElementTree"],
            "supported_formats": ["pptx"],
            "features": ["text_extraction", "slide_content", "speaker_notes"]
        }
    except ImportError as e:
        return {
            "status": "unavailable", 
            "error": str(e),
            "supported_formats": []
        }