# app/tasks/quiz_generation_tasks.py
"""
Async quiz generation tasks using Celery
Moves heavy LLM operations to background workers
"""
import asyncio
import json
import logging
from typing import Dict, Any, List
from celery import Task
from celery.exceptions import SoftTimeLimitExceeded
import hashlib

from app.celery_app import celery_app
from app.models.generate_quizes import (
    llm, generate_quiz, generate_summary, 
    ai_tutor_explanation, intelligent_summarizer
)
from app.config.redis_config import redis_service
from app.services.cache_service import CacheService

logger = logging.getLogger(__name__)
cache_service = CacheService()

class QuizGenerationTask(Task):
    """Base task with rate limiting and error handling"""
    autoretry_for = (Exception,)
    retry_kwargs = {'max_retries': 3, 'countdown': 5}
    rate_limit = '10/m'  # 10 tasks per minute per worker

@celery_app.task(bind=True, base=QuizGenerationTask, name='generate_quiz_async')
def generate_quiz_async(self, 
                        task_id: str,
                        content: str, 
                        quiz_type: str = "mcq",
                        language: str = "English",
                        num_questions: str = "10",
                        difficulty_level: str = "medium",
                        user_id: int = None,
                        source_metadata: Dict = None):
    """
    Async quiz generation task
    Returns task_id for status checking
    """
    try:
        # Update task status
        cache_service.set_task_status(task_id, {
            'status': 'processing',
            'progress': 10,
            'message': 'Starting quiz generation...'
        })
        
        # Check cache first
        cache_key = f"quiz:{hashlib.md5(f'{content[:500]}:{quiz_type}:{num_questions}'.encode()).hexdigest()}"
        cached_quiz = cache_service.get(cache_key)
        
        if cached_quiz:
            logger.info(f"Returning cached quiz for task {task_id}")
            cache_service.set_task_status(task_id, {
                'status': 'completed',
                'progress': 100,
                'result': cached_quiz
            })
            return {'task_id': task_id, 'from_cache': True}
        
        # Update progress
        cache_service.set_task_status(task_id, {
            'status': 'processing',
            'progress': 30,
            'message': 'Processing content with AI...'
        })
        
        # Run async generation in sync context
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            # Split content into manageable chunks
            content_chunks = content[:8000]  # Limit content size
            
            # Generate quiz
            questions = loop.run_until_complete(
                generate_quiz(
                    documents=content_chunks,
                    quiz_type=quiz_type,
                    language=language,
                    num_questions=num_questions,
                    difficulty_level=difficulty_level
                )
            )
            
            # Update progress
            cache_service.set_task_status(task_id, {
                'status': 'processing',
                'progress': 80,
                'message': 'Finalizing quiz...'
            })
            
            # Prepare result
            result = {
                'quiz_id': task_id,
                'questions': questions,
                'metadata': {
                    'type': quiz_type,
                    'language': language,
                    'difficulty': difficulty_level,
                    'source': source_metadata
                }
            }
            
            # Cache result
            cache_service.set(cache_key, result, ttl=3600)
            
            # Store final result
            cache_service.set_task_status(task_id, {
                'status': 'completed',
                'progress': 100,
                'result': result
            })
            
            logger.info(f"Quiz generation completed for task {task_id}")
            return {'task_id': task_id, 'success': True}
            
        except SoftTimeLimitExceeded:
            logger.error(f"Task {task_id} timed out")
            cache_service.set_task_status(task_id, {
                'status': 'failed',
                'error': 'Task timed out. Please try with smaller content.'
            })
            raise
            
        finally:
            loop.close()
            
    except Exception as e:
        logger.error(f"Error in quiz generation task {task_id}: {str(e)}")
        cache_service.set_task_status(task_id, {
            'status': 'failed',
            'error': str(e)
        })
        raise

@celery_app.task(bind=True, name='generate_summary_async')
def generate_summary_async(self,
                           task_id: str,
                           content: str,
                           language: str = "English",
                           word_count: str = "400",
                           user_id: int = None):
    """Async summary generation task"""
    try:
        cache_service.set_task_status(task_id, {
            'status': 'processing',
            'progress': 10,
            'message': 'Starting summary generation...'
        })
        
        # Check cache
        cache_key = f"summary:{hashlib.md5(f'{content[:500]}:{language}:{word_count}'.encode()).hexdigest()}"
        cached_summary = cache_service.get(cache_key)
        
        if cached_summary:
            cache_service.set_task_status(task_id, {
                'status': 'completed',
                'result': cached_summary
            })
            return {'task_id': task_id, 'from_cache': True}
        
        # Generate summary
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            summary = loop.run_until_complete(
                generate_summary(
                    documents=content,
                    language=language,
                    no_of_words=word_count
                )
            )
            
            result = {
                'summary': summary,
                'metadata': {
                    'language': language,
                    'word_count': word_count
                }
            }
            
            # Cache and store result
            cache_service.set(cache_key, result, ttl=3600)
            cache_service.set_task_status(task_id, {
                'status': 'completed',
                'result': result
            })
            
            return {'task_id': task_id, 'success': True}
            
        finally:
            loop.close()
            
    except Exception as e:
        logger.error(f"Error in summary task {task_id}: {str(e)}")
        cache_service.set_task_status(task_id, {
            'status': 'failed',
            'error': str(e)
        })
        raise

@celery_app.task(bind=True, name='batch_quiz_generation')
def batch_quiz_generation(self, 
                          task_id: str,
                          batch_requests: List[Dict],
                          user_id: int = None):
    """
    Process multiple quiz generation requests in batch
    Useful for generating quizzes from multiple chapters/topics
    """
    try:
        results = []
        total_requests = len(batch_requests)
        
        for idx, request in enumerate(batch_requests):
            progress = int((idx / total_requests) * 100)
            cache_service.set_task_status(task_id, {
                'status': 'processing',
                'progress': progress,
                'message': f'Processing quiz {idx + 1} of {total_requests}'
            })
            
            # Generate individual quiz
            sub_task_id = f"{task_id}_{idx}"
            generate_quiz_async.apply_async(
                args=[sub_task_id, request['content']],
                kwargs={
                    'quiz_type': request.get('quiz_type', 'mcq'),
                    'language': request.get('language', 'English'),
                    'num_questions': request.get('num_questions', '10'),
                    'difficulty_level': request.get('difficulty_level', 'medium')
                }
            )
            results.append(sub_task_id)
        
        cache_service.set_task_status(task_id, {
            'status': 'completed',
            'result': {'sub_tasks': results}
        })
        
        return {'task_id': task_id, 'sub_tasks': results}
        
    except Exception as e:
        logger.error(f"Batch generation error: {str(e)}")
        cache_service.set_task_status(task_id, {
            'status': 'failed',
            'error': str(e)
        })
        raise