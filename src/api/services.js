import client from './client'

export const ingestRepo = (repoUrl) => {
  return client.get('/api/ingest/', {
    params: { q: repoUrl },
  })
}

export const askQuestion = (question, namespace = 'default') => {
  return client.post('/api/chat/', {
    question,
    namespace,
  })
}
