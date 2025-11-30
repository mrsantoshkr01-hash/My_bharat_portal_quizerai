'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from './useAuth'

export const useWebSocket = (url, options = {}) => {
  const {
    onOpen,
    onMessage,
    onError,
    onClose,
    shouldReconnect = true,
    reconnectAttempts = 5,
    reconnectInterval = 3000
  } = options

  const [socket, setSocket] = useState(null)
  const [lastMessage, setLastMessage] = useState(null)
  const [readyState, setReadyState] = useState(WebSocket.CONNECTING)
  const [connectionStatus, setConnectionStatus] = useState('Connecting')
  
  const { user } = useAuth()
  const reconnectTimeoutRef = useRef(null)
  const reconnectAttemptsRef = useRef(0)
  const shouldReconnectRef = useRef(shouldReconnect)

  const getWebSocketUrl = useCallback(() => {
    if (!url) return null
    
    // Add auth token to WebSocket URL if user is authenticated
    const wsUrl = new URL(url)
    if (user?.token) {
      wsUrl.searchParams.set('token', user.token)
    }
    return wsUrl.toString()
  }, [url, user])

  const connect = useCallback(() => {
    try {
      const wsUrl = getWebSocketUrl()
      if (!wsUrl) return

      const ws = new WebSocket(wsUrl)
      
      ws.onopen = (event) => {
        setReadyState(WebSocket.OPEN)
        setConnectionStatus('Connected')
        reconnectAttemptsRef.current = 0
        onOpen?.(event)
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          setLastMessage(data)
          onMessage?.(data, event)
        } catch (error) {
          setLastMessage(event.data)
          onMessage?.(event.data, event)
        }
      }

      ws.onerror = (event) => {
        setConnectionStatus('Error')
        onError?.(event)
      }

      ws.onclose = (event) => {
        setReadyState(WebSocket.CLOSED)
        setConnectionStatus('Disconnected')
        onClose?.(event)

        // Attempt to reconnect
        if (
          shouldReconnectRef.current &&
          reconnectAttemptsRef.current < reconnectAttempts
        ) {
          const timeout = reconnectInterval * Math.pow(1.5, reconnectAttemptsRef.current)
          setConnectionStatus(`Reconnecting in ${Math.ceil(timeout / 1000)}s...`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current += 1
            connect()
          }, timeout)
        }
      }

      setSocket(ws)
    } catch (error) {
      console.error('WebSocket connection error:', error)
      setConnectionStatus('Error')
    }
  }, [getWebSocketUrl, onOpen, onMessage, onError, onClose, reconnectAttempts, reconnectInterval])

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    if (socket) {
      socket.close()
    }
  }, [socket])

  const sendMessage = useCallback((message) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(typeof message === 'string' ? message : JSON.stringify(message))
      return true
    }
    return false
  }, [socket])

  // Connect when component mounts or when dependencies change
  useEffect(() => {
    connect()
    return () => {
      shouldReconnectRef.current = false
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (socket) {
        socket.close()
      }
    }
  }, [connect])

  // Update shouldReconnect ref when prop changes
  useEffect(() => {
    shouldReconnectRef.current = shouldReconnect
  }, [shouldReconnect])

  return {
    socket,
    lastMessage,
    readyState,
    connectionStatus,
    sendMessage,
    disconnect,
    reconnect: connect
  }
}
