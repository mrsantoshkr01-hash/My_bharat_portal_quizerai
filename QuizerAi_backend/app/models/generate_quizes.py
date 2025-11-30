from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_groq import ChatGroq
from langchain.chains.summarize import load_summarize_chain
from dotenv import load_dotenv
import pytesseract
from langchain.schema import Document
from PIL import Image
import requests
from bs4 import BeautifulSoup
from fastapi import UploadFile, HTTPException 
import logging
import os
import json
from langchain_community.document_loaders import SeleniumURLLoader
import re
from urllib.parse import urlparse, parse_qs    #this is for the cleaning the url of youtube 
from langchain_yt_dlp.youtube_loader import YoutubeLoaderDL
from typing import List



# importing for the execution of youtube 
from langchain_community.tools import YouTubeSearchTool

#fetching the data from the youtubetranscript tool 
from youtube_transcript_api import YouTubeTranscriptApi
import asyncio
import concurrent.futures

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Initialize LangSmith tracing
langchain_api_key = os.getenv("LANGCHAIN_API_KEY")
langchain_project = os.getenv("LANGCHAIN_PROJECT")

# Set environment variables for LangSmith
os.environ["LANGCHAIN_TRACING_V2"] = "true"  # Note: V2 and lowercase "true"
os.environ["LANGCHAIN_API_KEY"] = langchain_api_key
os.environ["LANGCHAIN_PROJECT"] = langchain_project


# Initialize LLM (your existing setup)
groq_api_key = os.getenv("GROQ_API_KEY")
if not groq_api_key:
    raise ValueError("GROQ_API_KEY not found in environment variables")

llm = ChatGroq(
    model="openai/gpt-oss-20b", 
    api_key=groq_api_key,
    max_tokens=3000,
    temperature=0.3,
    request_timeout=45
)

# LangChain setup for map-reduce (your existing setup)
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=3000,
    chunk_overlap=200,
    length_function=len
)



# This is to process the pdf in different chunks
def count_tokens(text: str) -> int:
    """Count tokens accurately using tiktoken"""
    try:
        encoding = tiktoken.encoding_for_model("gpt-3.5-turbo")
        return len(encoding.encode(text))
    except:
        return len(text) // 4  # Fallback estimation

def truncate_to_tokens(text: str, max_tokens: int = 700) -> str:
    """Truncate text to specific token count"""
    try:
        encoding = tiktoken.encoding_for_model("gpt-3.5-turbo")
        tokens = encoding.encode(text)
        if len(tokens) <= max_tokens:
            return text
        return encoding.decode(tokens[:max_tokens])
    except:
        max_chars = max_tokens * 3
        return text[:max_chars]

def split_text_safely(text: str, max_tokens: int = 700) -> List[str]:
    """Split text into token-safe chunks"""
    if count_tokens(text) <= max_tokens:
        return [text]
    
    paragraphs = text.split('\n\n')
    chunks = []
    current_chunk = ""
    
    for paragraph in paragraphs:
        test_chunk = current_chunk + "\n\n" + paragraph if current_chunk else paragraph
        
        if count_tokens(test_chunk) <= max_tokens:
            current_chunk = test_chunk
        else:
            if current_chunk:
                chunks.append(current_chunk.strip())
            
            if count_tokens(paragraph) > max_tokens:
                sentences = paragraph.split('. ')
                sent_chunk = ""
                for sentence in sentences:
                    test_sent = sent_chunk + ". " + sentence if sent_chunk else sentence
                    if count_tokens(test_sent) <= max_tokens:
                        sent_chunk = test_sent
                    else:
                        if sent_chunk:
                            chunks.append(sent_chunk.strip())
                        sent_chunk = truncate_to_tokens(sentence, max_tokens)
                if sent_chunk:
                    chunks.append(sent_chunk.strip())
            else:
                current_chunk = paragraph
    
    if current_chunk:
        chunks.append(current_chunk.strip())
    
    return chunks

class IntelligentSummarizer:
    """Token-safe summarizer for any document size"""
    
    def __init__(self, llm):
        self.llm = llm
        
    def classify_document_size(self, total_chars: int) -> str:
        """Classify document size for processing strategy"""
        if total_chars < 5000:
            return "small"
        elif total_chars < 15000:
            return "medium"
        else:
            return "large"
    
    async def process_by_size(self, documents: list, language: str, no_of_words: str):
        """Process documents based on size with token safety"""
        
        total_chars = sum(len(doc.page_content) for doc in documents)
        doc_type = self.classify_document_size(total_chars)
        
        logger.info(f"Document classified as '{doc_type}': {total_chars} chars, {len(documents)} chunks")
        
        if doc_type == "small":
            return await self._process_small(documents, language, no_of_words)
        elif doc_type == "medium":
            return await self._process_medium(documents, language, no_of_words)
        else:
            return await self._process_large(documents, language, no_of_words)
    
    async def _process_small(self, documents: list, language: str, no_of_words: str):
        """Small docs: Single token-safe call"""
        combined_text = '\n\n'.join([doc.page_content for doc in documents])
        
        # Ensure token safety
        safe_text = truncate_to_tokens(combined_text, 700)
        
        prompt = PromptTemplate(
            input_variables=['text', 'language', 'no_of_words'],
            template="Create a comprehensive {no_of_words}-word summary in {language}:\n\n{text}\n\nSummary:"
        )
        
        chain = prompt | self.llm | StrOutputParser()
        
        return await asyncio.wait_for(
            chain.ainvoke({
                "text": safe_text,
                "language": language,
                "no_of_words": no_of_words
            }),
            timeout=30
        )
    
    async def _process_medium(self, documents: list, language: str, no_of_words: str):
        """Medium docs: Token-safe batch processing"""
        
        # Split all documents into token-safe chunks
        all_safe_chunks = []
        for doc in documents:
            safe_chunks = split_text_safely(doc.page_content, 650)
            all_safe_chunks.extend(safe_chunks)
        
        # Limit to prevent timeout (max 8 chunks)
        limited_chunks = all_safe_chunks[:8]
        logger.info(f"Processing {len(limited_chunks)} token-safe chunks")
        
        # Process chunks in parallel with semaphore
        semaphore = asyncio.Semaphore(3)
        chunk_summaries = []
        
        async def summarize_chunk(chunk_text, chunk_num):
            async with semaphore:
                try:
                    prompt = PromptTemplate(
                        input_variables=['text', 'language'],
                        template="Summarize key points from this content in {language}:\n\n{text}\n\nKey Points:"
                    )
                    
                    chain = prompt | self.llm | StrOutputParser()
                    
                    result = await asyncio.wait_for(
                        chain.ainvoke({
                            "text": chunk_text,
                            "language": language
                        }),
                        timeout=25
                    )
                    
                    logger.info(f"Completed chunk {chunk_num + 1}/{len(limited_chunks)}")
                    return result
                    
                except Exception as e:
                    logger.error(f"Chunk {chunk_num + 1} failed: {e}")
                    return f"[Section {chunk_num + 1} summary unavailable]"
        
        # Process all chunks
        tasks = [summarize_chunk(chunk, i) for i, chunk in enumerate(limited_chunks)]
        chunk_results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Collect valid summaries
        for result in chunk_results:
            if isinstance(result, str) and len(result) > 10:
                chunk_summaries.append(result)
        
        if not chunk_summaries:
            raise Exception("All chunk processing failed")
        
        # Combine and create final summary
        combined_summaries = '\n\n'.join(chunk_summaries)
        final_text = truncate_to_tokens(combined_summaries, 700)
        
        final_prompt = PromptTemplate(
            input_variables=['summaries', 'language', 'no_of_words'],
            template="Create a comprehensive {no_of_words}-word summary in {language} from these key points:\n\n{summaries}\n\nFinal Summary:"
        )
        
        final_chain = final_prompt | self.llm | StrOutputParser()
        
        return await asyncio.wait_for(
            final_chain.ainvoke({
                "summaries": final_text,
                "language": language,
                "no_of_words": no_of_words
            }),
            timeout=45
        )
    
    async def _process_large(self, documents: list, language: str, no_of_words: str):
        """Large docs: Hierarchical token-safe processing"""
        
        # Split all documents into token-safe chunks
        all_safe_chunks = []
        for doc in documents:
            safe_chunks = split_text_safely(doc.page_content, 600)
            all_safe_chunks.extend(safe_chunks)
        
        # Create batches (4 chunks per batch)
        batch_size = 4
        batches = [all_safe_chunks[i:i + batch_size] for i in range(0, len(all_safe_chunks), batch_size)]
        
        # Limit total batches (max 12 batches = 48 chunks max)
        batches = batches[:12]
        logger.info(f"Processing {len(batches)} batches for large document")
        
        # Process batches with controlled concurrency
        semaphore = asyncio.Semaphore(2)
        batch_summaries = []
        
        async def process_batch(batch_chunks, batch_num):
            async with semaphore:
                try:
                    # Combine batch content safely
                    batch_text = '\n\n'.join(batch_chunks)
                    safe_batch_text = truncate_to_tokens(batch_text, 650)
                    
                    prompt = PromptTemplate(
                        input_variables=['text', 'language'],
                        template="Summarize the main concepts and important details in {language}:\n\n{text}\n\nSummary:"
                    )
                    
                    chain = prompt | self.llm | StrOutputParser()
                    
                    result = await asyncio.wait_for(
                        chain.ainvoke({
                            "text": safe_batch_text,
                            "language": language
                        }),
                        timeout=40
                    )
                    
                    logger.info(f"Completed batch {batch_num + 1}/{len(batches)}")
                    return result
                    
                except Exception as e:
                    logger.error(f"Batch {batch_num + 1} failed: {e}")
                    return f"[Batch {batch_num + 1} summary unavailable]"
        
        # Process batches with delay between groups
        for i in range(0, len(batches), 3):  # Process 3 batches at a time
            batch_group = batches[i:i + 3]
            tasks = [process_batch(batch, i + j) for j, batch in enumerate(batch_group)]
            group_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for result in group_results:
                if isinstance(result, str) and len(result) > 15:
                    batch_summaries.append(result)
            
            # Small delay between groups
            if i + 3 < len(batches):
                await asyncio.sleep(1)
        
        if not batch_summaries:
            raise Exception("All batch processing failed")
        
        # Final synthesis
        combined_summaries = '\n\n'.join(batch_summaries)
        final_text = truncate_to_tokens(combined_summaries, 700)
        
        synthesis_prompt = PromptTemplate(
            input_variables=['summaries', 'language', 'no_of_words'],
            template="Synthesize these summaries into a comprehensive {no_of_words}-word summary in {language}:\n\n{summaries}\n\nComprehensive Summary:"
        )
        
        synthesis_chain = synthesis_prompt | self.llm | StrOutputParser()
        
        return await asyncio.wait_for(
            synthesis_chain.ainvoke({
                "summaries": final_text,
                "language": language,
                "no_of_words": no_of_words
            }),
            timeout=60
        )

# Create global instance
intelligent_summarizer = IntelligentSummarizer(llm)

# IMPROVED MAP PROMPT (for individual chunks)
# This creates structured summaries that combine well later
chunks_prompt = """
TASK: Create a structured summary of the text chunk below for later combination.
LANGUAGE: {language}
TARGET: {no_of_words} words
FORMAT: Use clear sections that can be merged effectively.

=== CHUNK SUMMARY STRUCTURE ===
**Key Topics:** [2-3 main topics covered in this section]

**Core Concepts:** [Important definitions, principles, or ideas]

**Methods/Processes:** [Any techniques, algorithms, or step-by-step processes described]

**Applications/Examples:** [Real-world uses, case studies, or practical implementations]

**Important Details:** [Critical facts, numbers, findings, or technical specifications]

**Context/Relationships:** [How this connects to broader topics or other concepts]

REQUIREMENTS:
✓ Write in professional, clear {language}
✓ Focus on factual content over opinions
✓ Include specific details and examples
✓ Maintain technical accuracy
✓ Use structured format above for easy combination

TEXT CHUNK: {text}

STRUCTURED SUMMARY:"""

# IMPROVED REDUCE PROMPT (for final comprehensive summary)
# Optimized for combining multiple chunk summaries
final_summary_prompt = """
ROLE: Expert Content Synthesizer
TASK: Create a comprehensive final summary by combining the chunk summaries below
TARGET: {no_of_words} words in {language}

=== REQUIRED OUTPUT STRUCTURE ===

# [Compelling Main Title Based on Content]

## Executive Overview
- Core purpose and significance in 2-3 sentences
- Primary value proposition
- Target audience relevance

## Introduction & Background
Context and importance of the topic. Why this matters and what problem/opportunity it addresses. Set the foundation for understanding the content.

## Fundamental Concepts
Essential definitions, principles, and theoretical frameworks. Core building blocks that readers need to understand. Organize by importance and logical flow.

## Key Methods & Approaches
Important processes, algorithms, techniques, or methodologies covered. Include step-by-step explanations where applicable. Focus on practical understanding.

## Real-World Applications
Concrete examples, use cases, implementations, and case studies. Show how concepts translate to practice. Include tools, platforms, and technologies mentioned.

## Critical Insights & Analysis
Most important findings, patterns, or conclusions. Technical specifications and quantitative data. Advanced concepts that provide deeper understanding.

## Implementation Considerations
Practical aspects: deployment, best practices, challenges, requirements. Resource needs and success factors. How to apply this knowledge effectively.

## Key Takeaways
- [5-7 essential bullet points]
- [Most critical facts to remember]
- [Actionable insights and recommendations]

## Future Implications
Impact on industries, emerging trends, potential developments. Strategic considerations and opportunities ahead.

=== SYNTHESIS GUIDELINES ===
✓ Eliminate redundancy across chunk summaries
✓ Organize information logically, not chronologically
✓ Prioritize most important concepts and insights
✓ Maintain technical accuracy while ensuring accessibility
✓ Create smooth transitions between sections
✓ Include specific examples and quantitative data
✓ Balance comprehensiveness with readability

CHUNK SUMMARIES TO COMBINE:
{text}

FINAL COMPREHENSIVE SUMMARY:"""

# Alternative shorter reduce prompt for faster processing
concise_final_prompt = """
Synthesize the chunk summaries below into a comprehensive {no_of_words}-word summary in {language}.

STRUCTURE:
# [Main Title]
## Overview (what, why, importance)
## Core Concepts (key ideas, definitions)  
## Methods & Applications (how it works, real uses)
## Key Insights (critical findings, takeaways)
## Future Impact (implications, significance)

REQUIREMENTS:
✓ Professional tone, clear language
✓ Logical organization, smooth flow
✓ Include specific examples and data
✓ Eliminate redundancy from chunks
✓ Focus on most important information

CHUNK SUMMARIES: {text}

SYNTHESIZED SUMMARY:"""

# PROMPT TEMPLATE SETUP
map_prompt_template = PromptTemplate(
    input_variables=['text', 'language', 'no_of_words'],
    template=chunks_prompt
)

# Choose your reduce prompt version
reduce_prompt_template = PromptTemplate(
    input_variables=['text', 'language', 'no_of_words'],
    template=final_summary_prompt  # or concise_final_prompt for faster processing
)

# ENHANCED SUMMARY CHAIN with improved prompts
summary_chain = load_summarize_chain(
    llm=llm,
    chain_type="map_reduce",
    map_prompt=map_prompt_template,
    combine_prompt=reduce_prompt_template,
    verbose=False,
    return_intermediate_steps=False
)

# USAGE FUNCTION with validation
def generate_optimized_summary(docs, language="English", no_of_words=800):
    """
    Generate summary using optimized map-reduce prompts
    """
    try:
        # Run the improved summary chain
        result = summary_chain.invoke({
            "input_documents": docs,
            "language": language,
            "no_of_words": no_of_words
        })
        
        summary = result["output_text"]
        
        # Basic quality validation
        word_count = len(summary.split())
        has_structure = "##" in summary and "#" in summary
        has_sections = any(section in summary.lower() for section in 
                          ["overview", "concepts", "applications", "insights"])
        
        print(f"✅ Summary generated: {word_count} words")
        print(f"✅ Structured format: {has_structure}")
        print(f"✅ Key sections present: {has_sections}")
        
        if abs(word_count - no_of_words) > no_of_words * 0.3:
            print(f"⚠️  Word count deviation: target {no_of_words}, actual {word_count}")
        
        return summary
        
    except Exception as e:
        print(f"❌ Error generating summary: {e}")
        return None

# EXAMPLE USAGE
"""
# Split your document
documents = text_splitter.create_documents([your_text])

# Generate optimized summary
summary = generate_optimized_summary(
    docs=documents,
    language="English", 
    no_of_words=800
)

print(summary)
"""

# DEBUGGING HELPER - to see intermediate chunk summaries
def debug_map_reduce_process(docs, language="English", no_of_words=800):
    """
    Debug version that shows intermediate chunk summaries
    """
    summary_chain_debug = load_summarize_chain(
        llm=llm,
        chain_type="map_reduce",
        map_prompt=map_prompt_template,
        combine_prompt=reduce_prompt_template,
        verbose=True,
        return_intermediate_steps=True
    )
    
    result = summary_chain_debug.invoke({
        "input_documents": docs,
        "language": language, 
        "no_of_words": no_of_words
    })
    
    print("=== CHUNK SUMMARIES ===")
    for i, chunk_summary in enumerate(result["intermediate_steps"]):
        print(f"\nChunk {i+1}:")
        print(chunk_summary)
    
    print("\n=== FINAL SUMMARY ===")
    print(result["output_text"])
    
    return result
# Quiz prompt


quiz_prompt = PromptTemplate(
    template="""You are an expert question creator. Generate EXACTLY {num_questions} high-quality {quiz_type} questions from the provided text.

OUTPUT FORMAT: Respond with ONLY a valid JSON array. NO explanatory text, code blocks, or markdown.

QUESTION TYPE EXAMPLES:

If quiz_type is "MCQ" or "multiple choice":
EXAMPLE THEORETICAL:
{{"question": "What is the primary function of mitochondria in cells?", "options": ["Energy production", "Protein synthesis", "DNA storage", "Waste removal"], "answer": "Energy production", "explanation": "Mitochondria are known as powerhouses of the cell"}}

EXAMPLE NUMERICAL:
{{"question": "If a cell has 20 mitochondria and each produces 30 ATP molecules, what is the total ATP production?", "options": ["500 ATP", "600 ATP", "700 ATP", "800 ATP"], "answer": "600 ATP", "explanation": "20 × 30 = 600 ATP molecules"}}

If quiz_type is "short" or "short answer":
EXAMPLE THEORETICAL:
{{"question": "What organelle is called the powerhouse of the cell?", "answer": "Mitochondria", "explanation": "Mitochondria produce energy (ATP) for cellular functions"}}

EXAMPLE NUMERICAL:
{{"question": "Calculate: 15 mitochondria × 25 ATP each = ?", "answer": "375 ATP", "explanation": "15 × 25 = 375 ATP molecules total"}}

If quiz_type is "true/false":
EXAMPLE THEORETICAL:
{{"question": "Mitochondria have their own DNA separate from nuclear DNA", "answer": true, "explanation": "Mitochondria contain circular DNA similar to bacterial DNA"}}

EXAMPLE NUMERICAL:
{{"question": "If 10 cells each have 15 mitochondria, the total is 140 mitochondria", "answer": false, "explanation": "10 × 15 = 150, not 140"}}

CONTENT REQUIREMENTS:
- {difficulty_level} difficulty level
- Language: {language}
- Include BOTH theoretical concepts AND numerical/calculation questions when possible
- For numerical questions: show clear calculations in explanations
- Test different cognitive levels: recall, understanding, application, analysis
- Cover various aspects of the provided text
- Ensure mathematical accuracy

QUALITY STANDARDS:
✓ Clear, unambiguous wording
✓ Factually accurate based on text
✓ No trick questions
✓ Balanced theoretical + numerical coverage
✓ Proper calculations with working shown

TEXT TO ANALYZE:
{text}

Generate the JSON array following the examples above:""",
    input_variables=["text", "quiz_type", "difficulty_level", "num_questions", "language"]
)

# Enhanced version with more comprehensive examples
quiz_prompt_with_examples = PromptTemplate(
    template="""ROLE: Expert Question Creator
TASK: Generate {num_questions} {quiz_type} questions from text
DIFFICULTY: {difficulty_level} | LANGUAGE: {language}

CRITICAL: Output ONLY valid JSON array. No extra text, code blocks, or explanations outside JSON.

=== EXAMPLES BY QUESTION TYPE ===

MCQ/MULTIPLE CHOICE Examples:
[
  {{"question": "What is machine learning?", "options": ["A subset of AI", "A programming language", "A database system", "A web framework"], "answer": "A subset of AI", "explanation": "ML is a branch of artificial intelligence"}},
  {{"question": "If accuracy is 85% and total samples are 200, how many predictions were correct?", "options": ["160", "170", "180", "190"], "answer": "170", "explanation": "200 × 0.85 = 170 correct predictions"}}
]

SHORT ANSWER Examples:
[
  {{"question": "What algorithm is used for linear regression?", "answer": "Least squares", "explanation": "Ordinary least squares minimizes sum of squared residuals"}},
  {{"question": "Calculate precision: TP=80, FP=20, what is precision?", "answer": "0.8", "explanation": "Precision = TP/(TP+FP) = 80/(80+20) = 0.8"}}
]

TRUE/FALSE Examples:
[
  {{"question": "Deep learning requires large amounts of data", "answer": true, "explanation": "Deep learning models need extensive data to learn complex patterns"}},
  {{"question": "If learning rate is 0.01 and gradient is 5, weight update is 0.5", "answer": false, "explanation": "Weight update = 0.01 × 5 = 0.05, not 0.5"}}
]

=== CONTENT STRATEGY ===
✓ Mix 60% theoretical + 40% numerical questions
✓ Include calculations, formulas, statistics from text
✓ Show step-by-step math in explanations
✓ Test comprehension at multiple levels
✓ Ensure all numbers and calculations are accurate

TEXT CONTENT:
{text}

JSON OUTPUT:""",
    input_variables=["text", "quiz_type", "difficulty_level", "num_questions", "language"]
)

# Usage function with example validation
def generate_quiz_with_examples(llm, text, quiz_type="MCQ", difficulty="medium", num_questions=5, language="English"):
    """
    Generate quiz with example-enhanced prompt for better consistency
    """
    import json
    
    # Use examples-enhanced prompt
    formatted_prompt = quiz_prompt_with_examples.format(
        text=text,
        quiz_type=quiz_type,
        difficulty_level=difficulty,
        num_questions=num_questions,
        language=language
    )
    
    try:
        response = llm.invoke(formatted_prompt)
        content = response.content if hasattr(response, 'content') else response
        
        # Clean response (remove any potential markdown)
        content = content.strip()
        if content.startswith('```'):
            content = content.split('\n', 1)[1]
        if content.endswith('```'):
            content = content.rsplit('\n', 1)[0]
            
        questions = json.loads(content)
        
        print(f"✅ Successfully generated {len(questions)} questions")
        return questions
        
    except json.JSONDecodeError as e:
        print(f"❌ JSON Error: {e}")
        print(f"Raw response: {content}")
        return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

# Quick test function
def validate_question_structure(questions, quiz_type):
    """Validate generated questions match expected structure"""
    required_fields = {
        "MCQ": ["question", "options", "answer", "explanation"],
        "short": ["question", "answer", "explanation"],
        "true/false": ["question", "answer", "explanation"]
    }
    
    expected = required_fields.get(quiz_type.lower(), ["question", "answer"])
    
    for i, q in enumerate(questions):
        missing = [field for field in expected if field not in q]
        if missing:
            print(f"❌ Question {i+1} missing: {missing}")
            return False
    
    print(f"✅ All questions have required fields")
    return True

# initializing stroutput 
stringoutput=StrOutputParser()







# Ai tutor promtp and solving approch 

# AI Tutor prompt templates
tutor_system_prompt = """
You are an expert AI tutor designed to help students learn effectively. Your role is to:

1. Provide clear, comprehensive explanations tailored to the student's level
2. Break down complex concepts into digestible parts
3. Use examples, analogies, and real-world applications
4. Encourage critical thinking through guided questions
5. Adapt your teaching style based on the content and student needs
6. Maintain an encouraging and supportive tone

Always structure your responses with:
- Clear headings and subheadings
- Step-by-step breakdowns when appropriate
- Key takeaways and important points highlighted
- Interactive elements like questions for self-reflection

Respond in {language} language and keep explanations appropriate for {difficulty_level} level.
"""

tutor_explanation_prompt = PromptTemplate(
    template=(
        f"{tutor_system_prompt}\n\n"
        "Based on the following content, provide a comprehensive tutoring session that explains "
        "the key concepts, provides examples, and helps the student understand the material:\n\n"
        "Content: {text}\n\n"
        "Student's specific question or area of focus: {question}\n\n"
        "Please provide a detailed explanation that includes:\n"
        "1. Main concept overview\n"
        "2. Key points breakdown\n"
        "3. Practical examples or analogies\n"
        "4. Common misconceptions to avoid\n"
        "5. Self-assessment questions\n"
        "6. Next steps for deeper learning\n\n"
        "Make this engaging and educational for a {difficulty_level} level student."
    ),
    input_variables=["text", "question", "language", "difficulty_level"]
)

concept_explanation_prompt = PromptTemplate(
    template=(
        f"{tutor_system_prompt}\n\n"
        "Explain the following concept in detail: {concept}\n\n"
        "Based on this content: {text}\n\n"
        "Provide:\n"
        "1. Clear definition and explanation\n"
        "2. Why this concept is important\n"
        "3. How it relates to other concepts\n"
        "4. Real-world applications\n"
        "5. Common examples\n"
        "6. Potential areas of confusion\n"
        "7. Practice questions or exercises\n\n"
        "Tailor the explanation for {difficulty_level} level understanding."
    ),
    input_variables=["concept", "text", "language", "difficulty_level"]
)

problem_solving_prompt = PromptTemplate(
    template=(
        f"{tutor_system_prompt}\n\n"
        "Help the student solve this problem step-by-step: {problem}\n\n"
        "Reference material: {text}\n\n"
        "Provide:\n"
        "1. Problem analysis and what we need to find\n"
        "2. Relevant concepts and formulas\n"
        "3. Step-by-step solution approach\n"
        "4. Detailed solution with explanations for each step\n"
        "5. Answer verification\n"
        "6. Similar practice problems\n"
        "7. Common mistakes to avoid\n\n"
        "Guide the student through the solution process at {difficulty_level} level."
    ),
    input_variables=["problem", "text", "language", "difficulty_level"]
)

study_guide_prompt = PromptTemplate(
    template=(
        f"{tutor_system_prompt}\n\n"
        "Create a comprehensive study guide for the following topic: {topic}\n\n"
        "Based on this content: {text}\n\n"
        "Include:\n"
        "1. Learning objectives\n"
        "2. Key concepts and definitions\n"
        "3. Important formulas or principles\n"
        "4. Summary of main points\n"
        "5. Study tips and memory aids\n"
        "6. Practice questions and exercises\n"
        "7. Additional resources for further learning\n"
        "8. Self-assessment checklist\n\n"
        "Make this suitable for {difficulty_level} level students preparing for exams or assessments."
    ),
    input_variables=["topic", "text", "language", "difficulty_level"]
)

# AI Tutor chain setup
tutor_chain = tutor_explanation_prompt | llm | StrOutputParser()
concept_chain = concept_explanation_prompt | llm | StrOutputParser()
problem_chain = problem_solving_prompt | llm | StrOutputParser()
study_guide_chain = study_guide_prompt | llm | StrOutputParser()



async def generate_quiz(documents: list, quiz_type: str = "mcq", language: str = "English", num_questions: str = "10", difficulty_level: str = "medium"):
    """
    Generate quiz using LangChain map-reduce for large documents.
    Returns a list of quiz questions in JSON format.
    """
    try:
        # Convert num_questions to integer
        num_questions_int = int(num_questions)
        
        logger.info(f"the type of document is outside {type(documents)}")   

        # Handle different document formats
        if isinstance(documents, str):
            # Convert string to Document objects
            from langchain.schema import Document
            documents = [Document(page_content=documents)]
        elif isinstance(documents, list) and documents:
            # Check if list contains strings instead of Document objects
            logger.info(f"the type of document is {type(documents)}")
            logger.info(f"the type of first document item is {type(documents[0])}")
            
            if isinstance(documents[0], str):
                from langchain.schema import Document
                logger.info(f"Converting strings to Document objects")
                documents = [Document(page_content=doc) for doc in documents]

        # Safe way to combine document content for quiz generation
        try:
            if documents and hasattr(documents[0], 'page_content'):
                # Take only first 3 documents and limit size
                text = " ".join(doc.page_content for doc in documents[:3])
            elif documents and isinstance(documents[0], str):
                text = " ".join(documents[:3])
            else:
                text = " ".join(str(doc) for doc in documents[:3])
            
            # HARD LIMIT - prevents 214k token bug
            text = text[:6000]  # Much smaller limit
            
            logger.info(f"Quiz text prepared: {len(text)} characters")
        except Exception as e:
            logger.error(f"Error extracting text: {e}")
            text = str(documents)[:6000]
        
        # Create a simpler LLM chain to avoid complex callback issues
        quiz_chain = quiz_prompt | llm | StrOutputParser()
        
        # Generate quiz with timeout
        quiz_output = await asyncio.wait_for(
            quiz_chain.ainvoke({
                "text": text,
                "quiz_type": quiz_type,
                "difficulty_level": difficulty_level,
                "num_questions": num_questions_int,
                "language": language
            }),
            timeout=60  # 1 minute timeout for quiz generation
        )
        
        quiz_text = quiz_output
        
        logger.info(f"these are the contents {quiz_text}")
        
        # Parse output as JSON (assuming LLM returns valid JSON)
        try:
            questions = json.loads(quiz_text)
            logger.info(f"these are the questions generated and parsed by json loads {questions}")
            if not isinstance(questions, list):
                raise ValueError("Quiz output must be a JSON array")
        except json.JSONDecodeError:
            # Fallback: Parse text manually if JSON parsing fails
            questions = []
            for q in quiz_text.split("\\n\\n")[:num_questions_int]:
                lines = q.split("\\n")
                if quiz_type == "mcq":
                    question = {"question": lines[0], "options": lines[1:5], "answer": lines[5] if len(lines) > 5 else ""}
                else:
                    question = {"question": lines[0], "answer": lines[1] if len(lines) > 1 else ""}
                questions.append(question)
        
        logger.info(f"Generated quiz with {len(questions)} questions")
        logger.info(f"These are the questions {questions}")
        return questions
        
    except asyncio.TimeoutError:
        logger.error("Quiz generation timed out")
        raise HTTPException(status_code=408, detail="Quiz generation request timed out. Please try with smaller documents.")
    except Exception as e:
        logger.error(f"Error generating quiz: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating quiz: {str(e)}")


    
    
    
# ADD this new function before generate_summary
async def run_summary_with_timeout(summary_chain, documents, language, no_of_words, timeout=120):
    """Run summary chain with proper timeout handling"""
    try:
        # Use ainvoke instead of run for async operation
        result = await asyncio.wait_for(
            summary_chain.ainvoke({
                "input_documents": documents,
                "language": language,
                "no_of_words": no_of_words
            }),
            timeout=timeout
        )
        return result["output_text"]
    except asyncio.TimeoutError:
        logger.error("Summary generation timed out")
        raise HTTPException(status_code=408, detail="Summary generation request timed out. Please try with smaller documents.")

# REPLACE the existing generate_summary function with:
async def generate_summary(documents: list, language: str = "English", no_of_words: str = "400"):
    """
    INTELLIGENT summary generation - handles any document size
    """
    try:
        # Convert and prepare documents
        if isinstance(documents, str):
            chunks = text_splitter.split_text(documents)
            documents = [Document(page_content=chunk) for chunk in chunks]

        if isinstance(documents, list) and documents:
            if not hasattr(documents[0], 'page_content'):
                logger.info("Converting to Document objects")
                documents = [Document(page_content=str(doc)) for doc in documents]

        # Use intelligent processing based on document size
        result = await intelligent_summarizer.process_by_size(documents, language, no_of_words)
        
        logger.info(f"Generated summary: {len(result)} characters")
        return result
        
    except asyncio.TimeoutError:
        logger.error("Summary generation timed out")
        raise HTTPException(status_code=408, detail="Summary generation timed out")
    except Exception as e:
        logger.error(f"Error generating summary: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating summary: {str(e)}")
    
    
    
    

    
       
    

# function to get the top ranker url 
async def youtube_search(query: str):
    try:
        print(f"Reached YouTube search with query: {query}")
        
        # Validate query parameter
        if not query or query.strip() == "":
            raise ValueError("Query parameter cannot be None or empty")
        
        tool = YouTubeSearchTool()
        top_url_dict = tool.run(query.strip())  # Strip whitespace
        print(f"the type of result given by this function is {type(top_url_dict)}")  #it returns string 
        return top_url_dict
    
    except Exception as e:
        logger.error(f"Error in loading url from query: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error in loading url from query: {str(e)}")
        
        
        
    

# function to load the content 
async def youtube_loader(url_results):
    try:
        print(f"Raw url_results: {url_results}")
        print(f"Type of url_results: {type(url_results)}")
        
        # Handle if url_results is a string representation of a list
        if isinstance(url_results, str):
            try:
                import ast
                url_results = ast.literal_eval(url_results)
            except:
                url_results = url_results.strip('[]').split(', ')
                url_results = [url.strip("'\"") for url in url_results]
        
        print(f"Processed url_results: {url_results}")
        
        content = []
        successful_loads = 0
        
        for i, url in enumerate(url_results):
            print(f"Processing URL {i}: {url}")
            
            # Clean and validate the URL
            cleaned_url = clean_youtube_url(url.strip())
            if not cleaned_url:
                print(f"Skipping invalid URL: {url}")
                continue
            
            print(f"Cleaned URL: {cleaned_url}")
            
            try:
                # Try with minimal parameters first
                loader = YoutubeLoaderDL.from_youtube_url(
                    cleaned_url,
                    add_video_info=True,
                )
                
                content_of_each = loader.load()
                if content_of_each:
                    content.append(content_of_each)
                    successful_loads += 1
                    print(f"Successfully loaded content for URL {i}")
                else:
                    print(f"No content returned for URL {i}")
                    
            except Exception as url_error:
                print(f"Error loading URL {cleaned_url}: {str(url_error)}")
                
                try:
                    print(f"Trying alternative loading method for URL {i}")
                    simple_loader = YoutubeLoaderDL.from_youtube_url(cleaned_url)
                    simple_content = simple_loader.load()
                    if simple_content:
                        content.append(simple_content)
                        successful_loads += 1
                        print(f"Successfully loaded content with simple loader for URL {i}")
                except Exception as simple_error:
                    print(f"Simple loader also failed for URL {cleaned_url}: {str(simple_error)}")
                    continue
        
        print(f"Successfully loaded content from {successful_loads} out of {len(url_results)} URLs")
        
        # ASYNC TRANSCRIPT FETCHING WITH TIMEOUT
        video_ids = []
        for group in content:
            for doc in group:
                video_id = doc.metadata.get("source")
                if video_id and video_id not in video_ids:
                    video_ids.append(video_id)
        
        print(f"Video IDs to process: {video_ids}")
        
        # Fetch transcripts asynchronously with timeout
        try:
            # Set timeout based on number of videos (30 seconds per video max)
            timeout_seconds = min(len(video_ids) * 30, 120)  # Max 2 minutes total
            print(f"Setting timeout to {timeout_seconds} seconds for transcript fetching")
            
            transcripts = await asyncio.wait_for(
                fetch_transcripts_async(video_ids), 
                timeout=timeout_seconds
            )
            
            # Update documents with transcript content
            video_index = 0
            for group in content:
                for doc in group:
                    video_id = doc.metadata.get("source")
                    if video_id in transcripts and transcripts[video_id]:
                        doc.page_content = transcripts[video_id]
                        print(f"Updated content for video {video_id}")
                    else:
                        doc.page_content = "Transcript not available"
                        print(f"No transcript available for video {video_id}")
                        
        except asyncio.TimeoutError:
            print(f"Transcript fetching timed out after {timeout_seconds} seconds")
            # Return content with metadata only, no transcripts
            for group in content:
                for doc in group:
                    doc.page_content = "Transcript fetching timed out - metadata only"
        
        if not content:
            error_msg = f"Could not load any content from the {len(url_results)} YouTube URLs."
            raise Exception(error_msg)
            
        logger.info(f"Successfully processed {successful_loads} videos")
        return content
        
    except Exception as e:
        logger.error(f"Error in youtube content loading: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error in youtube content loading: {str(e)}")


async def fetch_transcripts_async(video_ids):
    """
    Fetch transcripts for multiple videos asynchronously
    """
    loop = asyncio.get_event_loop()
    
    # Use ThreadPoolExecutor to run sync transcript fetching in parallel
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        # Create tasks for each video
        tasks = []
        for video_id in video_ids:
            task = loop.run_in_executor(
                executor, 
                you_tube_transcript_from_video_id_sync, 
                video_id
            )
            tasks.append((video_id, task))
        
        # Wait for all tasks to complete
        transcripts = {}
        for video_id, task in tasks:
            try:
                transcript = await task
                transcripts[video_id] = transcript
                print(f"Completed transcript fetch for {video_id}")
            except Exception as e:
                print(f"Failed to fetch transcript for {video_id}: {e}")
                transcripts[video_id] = None
        
        return transcripts


def you_tube_transcript_from_video_id_sync(video_id: str):
    """
    Synchronous version for use with ThreadPoolExecutor
    """
    try:
        print(f"Fetching transcript for video ID: {video_id}")
        
        ytt_api = YouTubeTranscriptApi()
        
        try:
            # Try to fetch transcript with timeout per video
            fetched_transcript = ytt_api.fetch(video_id, languages=['en', 'hi'])
            
            # Extract text from transcript snippets
            transcript_texts = []
            for snippet in fetched_transcript:
                transcript_texts.append(snippet.text)
            
            # Join all transcript snippets into a single string
            full_transcript = " ".join(transcript_texts)
            print(f"Successfully fetched transcript for {video_id}, length: {len(full_transcript)} characters")
            
            return full_transcript
            
        except Exception as fetch_error:
            print(f"Error fetching transcript for {video_id}: {fetch_error}")
            return None
            
    except Exception as e:
        print(f"Error in transcript fetch for {video_id}: {str(e)}")
        return None


def clean_youtube_url(url: str) -> str:
    """
    Clean YouTube URL by removing unnecessary parameters
    """
    try:
        if not url or not any(domain in url for domain in ['youtube.com', 'youtu.be']):
            return None
            
        # Remove pp parameter and other unnecessary parameters
        if '&pp=' in url:
            url = url.split('&pp=')[0]
        if '?pp=' in url and '?v=' not in url:
            url = url.split('?pp=')[0]
            
        # Validate that we have a video ID
        if 'youtube.com/watch' in url and 'v=' in url:
            return url
        elif 'youtube.com/shorts' in url:
            video_id = url.split('/shorts/')[-1].split('?')[0].split('&')[0]
            return f"https://www.youtube.com/watch?v={video_id}"
        elif 'youtu.be' in url:
            video_id = url.split('youtu.be/')[-1].split('?')[0].split('&')[0]
            return f"https://www.youtube.com/watch?v={video_id}"
            
        return url if 'youtube.com/watch?v=' in url else None
        
    except Exception as e:
        print(f"Error cleaning URL {url}: {str(e)}")
        return None
    
    
    
    
    
    
    
    
    
    
    
    
    
    
# from here the code for the ai_tutor 
# Ai_Tutor

# Timeout wrapper for AI tutor operations
async def run_tutor_with_timeout(chain, input_params, timeout=120):
    """Run tutor chain with proper timeout handling"""
    try:
        result = await asyncio.wait_for(
            chain.ainvoke(input_params),
            timeout=timeout
        )
        return result
    except asyncio.TimeoutError:
        logger.error("AI Tutor request timed out")
        raise HTTPException(
            status_code=408, 
            detail="AI Tutor request timed out. Please try with a shorter question or content."
        )
    except Exception as e:
        logger.error(f"Error in AI Tutor operation: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error in AI Tutor: {str(e)}"
        )

# Main AI Tutor functions
async def ai_tutor_explanation(
    text: str,
    question: str,
    language: str = "English",
    difficulty_level: str = "intermediate"
):
    """
    Provide detailed tutoring explanation based on content and student question.
    
    Args:
        text: The reference content/material
        question: Student's specific question or area of focus
        language: Language for the response
        difficulty_level: beginner, intermediate, or advanced
    
    Returns:
        Comprehensive tutoring explanation
    """
    try:
        # Prepare input parameters
        input_params = {
            "text": text,
            "question": question,
            "language": language,
            "difficulty_level": difficulty_level
        }
        
        # Generate tutoring response
        explanation = await run_tutor_with_timeout(
            tutor_chain,
            input_params,
            timeout=90
        )
        
        logger.info(f"Generated AI tutor explanation: {len(explanation)} characters")
        return explanation
        
    except Exception as e:
        logger.error(f"Error in AI tutor explanation: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error generating tutoring explanation: {str(e)}"
        )

async def explain_concept(
    concept: str,
    text: str,
    language: str = "English",
    difficulty_level: str = "intermediate"
):
    """
    Explain a specific concept in detail.
    
    Args:
        concept: The specific concept to explain
        text: Reference material containing the concept
        language: Language for the response
        difficulty_level: beginner, intermediate, or advanced
    
    Returns:
        Detailed concept explanation
    """
    try:
        input_params = {
            "concept": concept,
            "text": text,
            "language": language,
            "difficulty_level": difficulty_level
        }
        
        explanation = await run_tutor_with_timeout(
            concept_chain,
            input_params,
            timeout=90
        )
        
        logger.info(f"Generated concept explanation: {len(explanation)} characters")
        return explanation
        
    except Exception as e:
        logger.error(f"Error in concept explanation: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error explaining concept: {str(e)}"
        )

async def solve_problem_step_by_step(
    problem: str,
    text: str,
    language: str = "English",
    difficulty_level: str = "intermediate"
):
    """
    Help solve a problem with step-by-step guidance.
    
    Args:
        problem: The problem to solve
        text: Reference material for context
        language: Language for the response
        difficulty_level: beginner, intermediate, or advanced
    
    Returns:
        Step-by-step problem solution
    """
    try:
        input_params = {
            "problem": problem,
            "text": text,
            "language": language,
            "difficulty_level": difficulty_level
        }
        
        solution = await run_tutor_with_timeout(
            problem_chain,
            input_params,
            timeout=90
        )
        
        logger.info(f"Generated problem solution: {len(solution)} characters")
        return solution
        
    except Exception as e:
        logger.error(f"Error in problem solving: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error solving problem: {str(e)}"
        )

async def create_study_guide(
    topic: str,
    text: str,
    language: str = "English",
    difficulty_level: str = "intermediate"
):
    """
    Create a comprehensive study guide for a topic.
    
    Args:
        topic: The main topic for the study guide
        text: Reference material
        language: Language for the response
        difficulty_level: beginner, intermediate, or advanced
    
    Returns:
        Comprehensive study guide
    """
    try:
        input_params = {
            "topic": topic,
            "text": text,
            "language": language,
            "difficulty_level": difficulty_level
        }
        
        study_guide = await run_tutor_with_timeout(
            study_guide_chain,
            input_params,
            timeout=120  # Study guides might need more time
        )
        
        logger.info(f"Generated study guide: {len(study_guide)} characters")
        return study_guide
        
    except Exception as e:
        logger.error(f"Error creating study guide: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error creating study guide: {str(e)}"
        )

# Interactive learning function
async def interactive_learning_session(
    text: str,
    learning_goal: str,
    language: str = "English",
    difficulty_level: str = "intermediate"
):
    """
    Create an interactive learning session with questions and explanations.
    
    Args:
        text: The learning material
        learning_goal: What the student wants to achieve
        language: Language for the response
        difficulty_level: beginner, intermediate, or advanced
    
    Returns:
        Interactive learning session content
    """
    interactive_prompt = PromptTemplate(
        template=(
            f"{tutor_system_prompt}\n\n"
            "Create an interactive learning session based on this material: {text}\n\n"
            "Student's learning goal: {learning_goal}\n\n"
            "Design a session that includes:\n"
            "1. Learning objectives aligned with the student's goal\n"
            "2. Progressive concept introduction\n"
            "3. Interactive questions throughout\n"
            "4. Practical exercises or examples\n"
            "5. Knowledge checks and feedback points\n"
            "6. Reflection questions\n"
            "7. Next steps for continued learning\n\n"
            "Make this engaging and appropriate for {difficulty_level} level."
        ),
        input_variables=["text", "learning_goal", "language", "difficulty_level"]
    )
    
    interactive_chain = interactive_prompt | llm | StrOutputParser()
    
    try:
        input_params = {
            "text": text,
            "learning_goal": learning_goal,
            "language": language,
            "difficulty_level": difficulty_level
        }
        
        session = await run_tutor_with_timeout(
            interactive_chain,
            input_params,
            timeout=120
        )
        
        logger.info(f"Generated interactive learning session: {len(session)} characters")
        return session
        
    except Exception as e:
        logger.error(f"Error creating interactive learning session: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error creating interactive learning session: {str(e)}"
        )
        
        
        
