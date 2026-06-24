import client from './client'

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
  return client.post('/api/chat/stream', {
    question,
    namespace,
  })
}
