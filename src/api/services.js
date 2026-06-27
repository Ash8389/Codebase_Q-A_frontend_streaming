import client, { API_BASE } from './client'

export const ingestRepo = (repoUrl) => {
  return client.post(
    '/api/ingest/uri',
    null,
    {
    params: { q: repoUrl },
    }
  )
}

export const askQuestion = (question, namespace = 'default') => {
  return client.post('/api/chat/query', {
    question,
    namespace,
  })
}

export const askQuestionStream = async (question, namespace = 'default', { onToken, onComplete, onError }) => {
  const sessionId = localStorage.getItem('sessionId') || crypto.randomUUID()
  localStorage.setItem('sessionId', sessionId)

  const url = `${API_BASE}/api/chat/stream?question=${encodeURIComponent(question)}&namespace=${encodeURIComponent(namespace)}`

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/event-stream',
        'X-Session-Id': sessionId,
      },
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      throw new Error(errText || `Failed to start stream (HTTP ${response.status})`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    let currentEventName = ''
    let currentDataValue = ''
    let isFinished = false

    const handleComplete = () => {
      if (!isFinished) {
        isFinished = true
        onComplete()
      }
    }

    while (true) {
      const { value, done } = await reader.read()
      if (done) {
        handleComplete()
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop()

      for (let line of lines) {
        line = line.trimEnd()
        if (line === '') {
          if (currentEventName && currentDataValue !== undefined) {
            if (currentEventName === 'token') {
              onToken(currentDataValue)
            } else if (currentEventName === 'done') {
              handleComplete()
            }
          }
          currentEventName = ''
          currentDataValue = ''
          continue
        }

        if (line.startsWith('event:')) {
          currentEventName = line.slice(6).trim()
        } else if (line.startsWith('data:')) {
          let data = line.slice(5)
          currentDataValue = currentDataValue ? currentDataValue + '\n' + data : data
        }
      }
    }
  } catch (err) {
    if (onError) {
      onError(err)
    } else {
      console.error('Streaming error:', err)
    }
  }
}

