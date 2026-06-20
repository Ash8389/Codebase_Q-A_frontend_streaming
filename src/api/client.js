import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080'

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add session ID
client.interceptors.request.use((config) => {
  const sessionId = localStorage.getItem('sessionId') || crypto.randomUUID()
  localStorage.setItem('sessionId', sessionId)
  config.headers['X-Session-Id'] = sessionId
  return config
})

export default client
