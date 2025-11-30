# app/celery_app.py
"""
Centralized Celery configuration for QuizerAI
Handles all background tasks for scalability
"""
import os
from celery import Celery
from kombu import Queue
from dotenv import load_dotenv

load_dotenv()

# Create Celery instance
celery_app = Celery(
    'quizerai',
    broker=os.getenv('REDIS_URL', 'redis://localhost:6379/3'),
    backend=os.getenv('REDIS_URL', 'redis://localhost:6379/4'),
    include=[
        'app.tasks.quiz_generation_tasks',
        'app.tasks.document_processing_tasks', 
        'app.tasks.youtube_tasks',
        'app.tasks.ai_tutor_tasks',
        'app.tasks.quiz_tasks'  # Your existing tasks
    ]
)

# Celery configuration
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    result_expires=7200,  # Results expire after 2 hours
    task_track_started=True,
    task_time_limit=300,  # 5 minutes hard limit
    task_soft_time_limit=240,  # 4 minutes soft limit
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=100,  # Restart worker after 100 tasks to prevent memory leaks
    
    # Task routing
    task_routes={
        'app.tasks.quiz_generation_tasks.*': {'queue': 'quiz_generation'},
        'app.tasks.document_processing_tasks.*': {'queue': 'document_processing'},
        'app.tasks.youtube_tasks.*': {'queue': 'youtube_processing'},
        'app.tasks.ai_tutor_tasks.*': {'queue': 'ai_tutor'},
        'app.tasks.quiz_tasks.*': {'queue': 'quiz_timers'}  # Your existing
    },
    
    # Queue configuration
    task_queues=(
        Queue('quiz_generation', routing_key='quiz.generate'),
        Queue('document_processing', routing_key='document.process'),
        Queue('youtube_processing', routing_key='youtube.process'),
        Queue('ai_tutor', routing_key='tutor.process'),
        Queue('quiz_timers', routing_key='timer.check'),
        Queue('default', routing_key='task.#'),
    ),
    
    # Beat schedule for periodic tasks
    beat_schedule={
        'cleanup-expired-tasks': {
            'task': 'app.tasks.cleanup_tasks.cleanup_expired_tasks',
            'schedule': 300.0,  # Every 5 minutes
        },
        'cache-warmup': {
            'task': 'app.tasks.cache_tasks.warmup_cache',
            'schedule': 3600.0,  # Every hour
        }
    }
)

# Optional: Configure task priorities
celery_app.conf.task_default_priority = 5
celery_app.conf.task_acks_late = True
celery_app.conf.worker_prefetch_multiplier = 1