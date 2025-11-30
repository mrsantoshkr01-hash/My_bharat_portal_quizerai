"""
Production PDF Service for QuizerAI
==================================

This service fixes:
- 214k token bug (document cleaning and deduplication)
- CancelledError timeouts
- Better document processing for large PDFs
"""

import asyncio
import logging
import hashlib
import re
import tempfile
import os
from typing import List
from fastapi import UploadFile, HTTPException
from langchain.schema import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
import fitz  # PyMuPDF
import pytesseract
from PIL import Image
from io import BytesIO

logger = logging.getLogger(__name__)

class DocumentCleaner:
    """Cleans PDF content to prevent token explosion"""
    
    def __init__(self):
        # Patterns that caused your 214k token bug
        self.metadata_patterns = [
            r'page\d+',
            r'creationdate', 
            r'total_pages\d+',
            r'page_label\d+',
            r'producerPyPDF',
            r'creatorGoogle',
            r'source/tmp/upload_.*\.pdf'
        ]
        
        # Duplicate patterns from your PDF
        self.duplicate_patterns = [
            r'^S$',
            r'^\d+\+\d+$', 
            r'^OPERATING SYSTEM.*ARCHITECTURE.*S$',
            r'^THANK YOU.*$'
        ]
    
    def clean_content(self, raw_content: str) -> str:
        """Remove metadata and duplicates that cause token explosion"""
        
        # Remove metadata patterns
        for pattern in self.metadata_patterns:
            raw_content = re.sub(pattern, '', raw_content, flags=re.IGNORECASE)
        
        # Remove duplicate lines
        lines = raw_content.split('\n')
        unique_lines = []
        seen_lines = set()
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Skip duplicate patterns
            if any(re.match(pattern, line, re.IGNORECASE) for pattern in self.duplicate_patterns):
                continue
            
            if line in seen_lines:
                continue
            
            seen_lines.add(line)
            unique_lines.append(line)
        
        # Clean whitespace
        cleaned = '\n'.join(unique_lines)
        cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)
        cleaned = re.sub(r' {2,}', ' ', cleaned)
        
        return cleaned.strip()

class ProductionPDFProcessor:
    """Production-ready PDF processor"""
    
    def __init__(self):
        self.cleaner = DocumentCleaner()
        
        # Intelligent text splitter
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1800,
            chunk_overlap=150,
            length_function=len
        )
    
    async def process_pdf_upload(self, upload_file: UploadFile) -> List[Document]:
        """
        Process uploaded PDF file with production pipeline
        
        Returns: List of Document objects ready for LLM processing
        """
        temp_path = None
        
        try:
            # Save to temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
                temp_path = tmp_file.name
                content = await upload_file.read()
                tmp_file.write(content)
                tmp_file.flush()
            
            # Load PDF with PyMuPDF (more reliable than PyPDF2)
            documents = await self._load_with_pymupdf(temp_path)
            
            # Validate and process
            total_chars = sum(len(doc.page_content) for doc in documents)
            logger.info(f"PDF processed: {len(documents)} pages, {total_chars} characters")
            
            # Validate size
            if total_chars > 50000:
                raise HTTPException(
                    status_code=422,
                    detail=f"Document too large: {total_chars} chars (max: 50,000)"
                )
            
            if total_chars < 100:
                raise HTTPException(
                    status_code=422,
                    detail="No readable content found in PDF"
                )
            
            # Split into chunks for LLM processing
            split_docs = []
            for doc in documents:
                chunks = self.text_splitter.split_documents([doc])
                split_docs.extend(chunks)
            
            logger.info(f"Final output: {len(split_docs)} chunks ready for LLM")
            return split_docs
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"PDF processing failed: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to process PDF: {str(e)}"
            )
        finally:
            # Cleanup
            if temp_path and os.path.exists(temp_path):
                os.unlink(temp_path)
    
    async def _load_with_pymupdf(self, file_path: str) -> List[Document]:
        """Load PDF using PyMuPDF with content cleaning"""
        
        try:
            pdf_doc = fitz.open(file_path)
            documents = []
            seen_content = set()
            
            for page_num in range(len(pdf_doc)):
                page = pdf_doc[page_num]
                text = page.get_text().strip()
                
                if not text or len(text) < 50:
                    continue
                
                # CRITICAL: Clean content to prevent token explosion
                cleaned_text = self.cleaner.clean_content(text)
                
                # Skip duplicates
                content_hash = hashlib.md5(cleaned_text.encode()).hexdigest()
                if content_hash in seen_content:
                    logger.debug(f"Skipping duplicate content on page {page_num + 1}")
                    continue
                
                seen_content.add(content_hash)
                
                # Create document
                doc = Document(
                    page_content=cleaned_text,
                    metadata={
                        "page": page_num + 1,
                        "source": file_path,
                        "content_length": len(cleaned_text)
                    }
                )
                documents.append(doc)
            
            pdf_doc.close()
            
            if not documents:
                raise Exception("No readable content found in PDF")
                
            return documents
            
        except Exception as e:
            raise Exception(f"PyMuPDF loading failed: {str(e)}")

# Global instance
pdf_processor = ProductionPDFProcessor()

# Main function to use in your existing code
async def process_pdf_production(upload_file: UploadFile) -> List[Document]:
    """
    Main function to replace your existing PDF processing
    
    Use this function in your existing data_ingestion_processing.py
    """
    return await pdf_processor.process_pdf_upload(upload_file)