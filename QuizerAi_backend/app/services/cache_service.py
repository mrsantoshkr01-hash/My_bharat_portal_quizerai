# app/services/cache_service.py
"""
Enhanced caching service for QuizerAI
Handles all caching operations with Redis
"""
import json
import logging
import hashlib
from typing import Any, Optional, Dict
from datetime import datetime, timedelta
import pickle

from app.config.redis_config import redis_service

logger = logging.getLogger(__name__)

class CacheService:
    """Enhanced cache service with multiple strategies"""
    
    def __init__(self):
        self.default_ttl = 3600  # 1 hour default
        
    async def initialize(self):
        """Initialize Redis connections"""
        await redis_service.initialize()
    
    # Task Status Management
    def set_task_status(self, task_id: str, status_data: Dict, ttl: int = 7200):
        """Set task status for async operations"""
        try:
            key = f"task:status:{task_id}"
            status_data['updated_at'] = datetime.utcnow().isoformat()
            
            # Use sync Redis client for Celery tasks
            import redis
            r = redis.Redis.from_url(
                redis_service.redis_url or f"redis://{redis_service.redis_host}:{redis_service.redis_port}/1"
            )
            r.setex(key, ttl, json.dumps(status_data, default=str))
            
        except Exception as e:
            logger.error(f"Failed to set task status: {e}")
    
    async def get_task_status(self, task_id: str) -> Optional[Dict]:
        """Get task status"""
        try:
            key = f"task:status:{task_id}"
            data = await redis_service.cache_client.get(key)
            return json.loads(data) if data else None
        except Exception as e:
            logger.error(f"Failed to get task status: {e}")
            return None
    
    # Content Caching
    def set(self, key: str, value: Any, ttl: int = None):
        """Set cache value (sync for Celery)"""
        try:
            import redis
            r = redis.Redis.from_url(
                redis_service.redis_url or f"redis://{redis_service.redis_host}:{redis_service.redis_port}/1"
            )
            
            ttl = ttl or self.default_ttl
            if isinstance(value, (dict, list)):
                value = json.dumps(value, default=str)
            elif not isinstance(value, str):
                value = pickle.dumps(value)
            
            r.setex(key, ttl, value)
            
        except Exception as e:
            logger.error(f"Cache set failed: {e}")
    
    def get(self, key: str) -> Optional[Any]:
        """Get cache value (sync for Celery)"""
        try:
            import redis
            r = redis.Redis.from_url(
                redis_service.redis_url or f"redis://{redis_service.redis_host}:{redis_service.redis_port}/1"
            )
            
            data = r.get(key)
            if not data:
                return None
            
            # Try to decode as JSON first
            try:
                return json.loads(data)
            except:
                # Try pickle
                try:
                    return pickle.loads(data)
                except:
                    return data.decode('utf-8') if isinstance(data, bytes) else data
                    
        except Exception as e:
            logger.error(f"Cache get failed: {e}")
            return None
    
    async def set_async(self, key: str, value: Any, ttl: int = None):
        """Async cache set for FastAPI endpoints"""
        try:
            ttl = ttl or self.default_ttl
            await redis_service.cache_set(key, value, ttl)
        except Exception as e:
            logger.error(f"Async cache set failed: {e}")
    
    async def get_async(self, key: str) -> Optional[Any]:
        """Async cache get for FastAPI endpoints"""
        try:
            return await redis_service.cache_get(key)
        except Exception as e:
            logger.error(f"Async cache get failed: {e}")
            return None
    
    # Quiz-specific caching
    async def cache_quiz_result(self, quiz_id: str, result: Dict, ttl: int = 3600):
        """Cache quiz generation result"""
        key = f"quiz:result:{quiz_id}"
        await self.set_async(key, result, ttl)
    
    async def get_cached_quiz(self, quiz_id: str) -> Optional[Dict]:
        """Get cached quiz result"""
        key = f"quiz:result:{quiz_id}"
        return await self.get_async(key)
    
    # Document caching
    async def cache_document(self, doc_hash: str, content: Any, ttl: int = 7200):
        """Cache processed document"""
        key = f"document:{doc_hash}"
        await self.set_async(key, content, ttl)
    
    async def get_cached_document(self, doc_hash: str) -> Optional[Any]:
        """Get cached document"""
        key = f"document:{doc_hash}"
        return await self.get_async(key)
    
    # Transcript caching
    async def cache_transcript(self, video_id: str, transcript: str, ttl: int = 86400):
        """Cache YouTube transcript (24 hours)"""
        key = f"transcript:{video_id}"
        await self.set_async(key, transcript, ttl)
    
    async def get_cached_transcript(self, video_id: str) -> Optional[str]:
        """Get cached transcript"""
        key = f"transcript:{video_id}"
        return await self.get_async(key)
    
    # Rate limiting
    async def check_rate_limit(self, user_id: int, action: str, limit: int = 10, window: int = 60) -> bool:
        """
        Check rate limit for user action
        Returns True if within limit, False if exceeded
        """
        key = f"rate_limit:{user_id}:{action}"
        
        try:
            current = await redis_service.cache_client.get(key)
            if not current:
                await redis_service.cache_client.setex(key, window, 1)
                return True
            
            count = int(current)
            if count >= limit:
                return False
            
            await redis_service.cache_client.incr(key)
            return True
            
        except Exception as e:
            logger.error(f"Rate limit check failed: {e}")
            return True  # Allow on error
    
    # Cache invalidation
    async def invalidate_pattern(self, pattern: str):
        """Invalidate all keys matching pattern"""
        try:
            async for key in redis_service.cache_client.scan_iter(match=pattern):
                await redis_service.cache_client.delete(key)
        except Exception as e:
            logger.error(f"Pattern invalidation failed: {e}")
    
    async def invalidate_user_cache(self, user_id: int):
        """Invalidate all user-specific cache"""
        await self.invalidate_pattern(f"user:{user_id}:*")
    
    # Cache warming
    async def warm_cache(self, key: str, generator_func, ttl: int = None):
        """
        Warm cache with result from generator function
        """
        try:
            result = await generator_func()
            await self.set_async(key, result, ttl or self.default_ttl)
            return result
        except Exception as e:
            logger.error(f"Cache warming failed: {e}")
            return None