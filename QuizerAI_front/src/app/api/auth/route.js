import { NextRequest, NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.json()
    const { action, ...data } = body

    // This would typically connect to your FastAPI backend
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    
    let endpoint = ''
    switch (action) {
      case 'login':
        endpoint = '/auth/login'
        break
      case 'register':
        endpoint = '/auth/register'
        break
      case 'refresh':
        endpoint = '/auth/refresh'
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...request.headers
      },
      body: JSON.stringify(data)
    })

    const result = await response.json()

    if (!response.ok) {
      return NextResponse.json(result, { status: response.status })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Auth API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}