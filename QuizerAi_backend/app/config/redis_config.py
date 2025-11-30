import redis.asyncio as redis
import json
import logging
import os
import time
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

class RedisService:
    def __init__(self):
        self.session_client = None
        self.cache_client = None
        self.pubsub_client = None
        
        # Redis connection settings - Updated for Coolify
        self.redis_url = os.getenv("REDIS_URL")  # Full Redis URL if provided
        self.redis_host = os.getenv("REDIS_HOST", "localhost")
        self.redis_port = int(os.getenv("REDIS_PORT", 6379))
        self.redis_password = os.getenv("REDIS_PASSWORD", "Quizerai12")
        self.redis_username = os.getenv("REDIS_USERNAME", "Quizerai")
        
        # Database numbers
        self.db_session = int(os.getenv("REDIS_DB_SESSION", 0))
        self.db_cache = int(os.getenv("REDIS_DB_CACHE", 1))
        self.db_pubsub = int(os.getenv("REDIS_DB_PUBSUB", 2))
    
    async def initialize(self):
        """Initialize Redis connections with proper pooling"""
        try:
            if self.redis_url:
                # Use from_url for Redis URL format (Coolify)
                self.session_client = await redis.from_url(
                    self.redis_url,
                    db=self.db_session,
                    max_connections=500,
                    decode_responses=True,
                    socket_connect_timeout=5,
                    socket_timeout=5
                )
                
                self.cache_client = await redis.from_url(
                    self.redis_url,
                    db=self.db_cache,
                    max_connections=30,
                    decode_responses=True,
                    socket_connect_timeout=5,
                    socket_timeout=5
                )
                
                self.pubsub_client = await redis.from_url(
                    self.redis_url,
                    db=self.db_pubsub,
                    max_connections=500,
                    decode_responses=True,
                    socket_connect_timeout=5,
                    socket_timeout=5
                )
            else:
                # Use individual parameters (fallback for local development)
                connection_kwargs = {
                    "host": self.redis_host,
                    "port": self.redis_port,
                    "decode_responses": True,
                    "socket_connect_timeout": 5,
                    "socket_timeout": 5
                }
                
                if self.redis_password:
                    connection_kwargs["password"] = self.redis_password
                
                if self.redis_username:
                    connection_kwargs["username"] = self.redis_username
                
                self.session_client = redis.Redis(
                    **connection_kwargs,
                    db=self.db_session,
                    max_connections=500
                )
                
                self.cache_client = redis.Redis(
                    **connection_kwargs,
                    db=self.db_cache,
                    max_connections=30
                )
                
                self.pubsub_client = redis.Redis(
                    **connection_kwargs,
                    db=self.db_pubsub,
                    max_connections=20
                )
            
            # Test connections
            await self.session_client.ping()
            await self.cache_client.ping()
            await self.pubsub_client.ping()
            
            logger.info(f"Redis connections initialized successfully (using {'URL' if self.redis_url else 'host: ' + self.redis_host})")
            
        except Exception as e:
            logger.error(f"Redis initialization failed: {e}")
            raise
    
    # Session Management (Essential for your quiz app)
    async def save_session(self, session_id: str, data: Dict[str, Any], ttl: int = 7200):
        """Save quiz session data"""
        try:
            await self.session_client.setex(
                f"session:{session_id}",
                ttl,
                json.dumps(data, default=str)
            )
        except Exception as e:
            logger.error(f"Failed to save session {session_id}: {e}")
            raise
    
    async def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get quiz session data"""
        try:
            data = await self.session_client.get(f"session:{session_id}")
            return json.loads(data) if data else None
        except Exception as e:
            logger.error(f"Failed to get session {session_id}: {e}")
            return None
    
    async def delete_session(self, session_id: str):
        """Delete quiz session"""
        try:
            await self.session_client.delete(f"session:{session_id}")
        except Exception as e:
            logger.error(f"Failed to delete session {session_id}: {e}")
    
    # Timer Management (Critical for your quiz timeouts)
    async def set_timer(self, session_id: str, seconds: int):
        """Set quiz timer"""
        try:
            timer_data = {
                "total_seconds": seconds,
                "start_time": str(int(time.time())),
                "is_active": True
            }
            await self.session_client.setex(
                f"timer:{session_id}",
                seconds + 300,  # TTL with buffer
                json.dumps(timer_data)
            )
        except Exception as e:
            logger.error(f"Failed to set timer for {session_id}: {e}")
    
    async def get_remaining_time(self, session_id: str) -> Optional[int]:
        """Get remaining quiz time"""
        try:
            data = await self.session_client.get(f"timer:{session_id}")
            if not data:
                return None
            
            timer_data = json.loads(data)
            if not timer_data.get("is_active"):
                return 0
            
            elapsed = int(time.time()) - int(timer_data["start_time"])
            remaining = max(0, timer_data["total_seconds"] - elapsed)
            return remaining
        except Exception as e:
            logger.error(f"Failed to get remaining time for {session_id}: {e}")
            return None
    
    # Caching (Essential for performance)
    async def cache_set(self, key: str, value: Any, ttl: int = 3600):
        """Cache data with TTL"""
        try:
            await self.cache_client.setex(
                key,
                ttl,
                json.dumps(value, default=str)
            )
        except Exception as e:
            logger.error(f"Failed to cache {key}: {e}")
    
    async def cache_get(self, key: str) -> Optional[Any]:
        """Get cached data"""
        try:
            data = await self.cache_client.get(key)
            return json.loads(data) if data else None
        except Exception as e:
            logger.error(f"Failed to get cache {key}: {e}")
            return None
    
    async def cache_delete(self, key: str):
        """Delete cached data"""
        try:
            await self.cache_client.delete(key)
        except Exception as e:
            logger.error(f"Failed to delete cache {key}: {e}")
    
    # Pub/Sub for real-time updates
    async def publish(self, channel: str, message: Dict[str, Any]):
        """Publish message to channel"""
        try:
            await self.pubsub_client.publish(
                channel,
                json.dumps(message, default=str)
            )
        except Exception as e:
            logger.error(f"Failed to publish to {channel}: {e}")
    
    def get_pubsub_client(self):
        """Get pub/sub client for WebSocket connections"""
        return self.pubsub_client
    
    async def close(self):
        """Close all Redis connections"""
        try:
            if self.session_client:
                await self.session_client.close()
            if self.cache_client:
                await self.cache_client.close()
            if self.pubsub_client:
                await self.pubsub_client.close()
            logger.info("Redis connections closed")
        except Exception as e:
            logger.error(f"Error closing Redis connections: {e}")
            
    async def save_quiz_session(self, session_id: str, data: Dict[str, Any], ttl: int = 7200):
        """Save quiz session data - renamed from save_session for clarity"""
        try:
            await self.session_client.setex(
                f"quiz_session:{session_id}",
                ttl,
                json.dumps(data, default=str)
            )
        except Exception as e:
            logger.error(f"Failed to save quiz session {session_id}: {e}")
            raise

    async def get_quiz_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get quiz session data"""
        try:
            data = await self.session_client.get(f"quiz_session:{session_id}")
            return json.loads(data) if data else None
        except Exception as e:
            logger.error(f"Failed to get quiz session {session_id}: {e}")
            return None

    async def update_quiz_session(self, session_id: str, data: Dict[str, Any]):
        """Update existing quiz session"""
        try:
            # Get existing TTL
            ttl = await self.session_client.ttl(f"quiz_session:{session_id}")
            if ttl > 0:
                await self.save_quiz_session(session_id, data, ttl)
        except Exception as e:
            logger.error(f"Failed to update quiz session {session_id}: {e}")

    async def set_quiz_timer(self, session_id: str, seconds: int):
        """Set quiz timer - specific for quiz sessions"""
        await self.set_timer(session_id, seconds)

    async def expire_quiz_timer(self, session_id: str):
        """Expire quiz timer"""
        try:
            await self.session_client.delete(f"timer:{session_id}")
        except Exception as e:
            logger.error(f"Failed to expire timer for {session_id}: {e}")

    async def cache_quiz_data(self, quiz_id: int, data: Dict[str, Any], ttl: int = 3600):
        """Cache quiz data"""
        await self.cache_set(f"quiz:data:{quiz_id}", data, ttl)

    async def get_cached_quiz(self, quiz_id: int) -> Optional[Dict[str, Any]]:
        """Get cached quiz data"""
        return await self.cache_get(f"quiz:data:{quiz_id}")

    async def publish_quiz_update(self, quiz_id: int, message: Dict[str, Any]):
        """Publish quiz update to subscribers"""
        await self.publish(f"quiz_updates:{quiz_id}", message)

    async def cleanup_expired_sessions(self):
        """Clean up expired sessions"""
        try:
            pattern = "quiz_session:*"
            deleted_count = 0
            
            async for key in self.session_client.scan_iter(match=pattern):
                ttl = await self.session_client.ttl(key)
                if ttl == -2:  # Key doesn't exist
                    continue
                elif ttl == -1:  # Key exists but no TTL
                    await self.session_client.delete(key)
                    deleted_count += 1
            
            logger.info(f"Cleaned up {deleted_count} expired sessions")
            return deleted_count
            
        except Exception as e:
            logger.error(f"Failed to cleanup sessions: {e}")
            return 0

# Add this class for Redis key management
class RedisKeys:
    """Centralized Redis key patterns"""
    QUIZ_SESSION = "quiz_session:{session_id}"
    QUIZ_TIMER = "timer:{session_id}" 
    QUIZ_DATA = "quiz:data:{quiz_id}"
    QUIZ_ANALYTICS = "analytics:{quiz_id}"
    USER_SESSION = "user_sessions:{user_id}"
    TASK_STATUS = "task:status:{task_id}"
    CACHE_DOCUMENT = "document:{doc_hash}"
    CACHE_TRANSCRIPT = "transcript:{video_id}"
    RATE_LIMIT = "rate_limit:{user_id}:{action}"

# Global instance
redis_service = RedisService()