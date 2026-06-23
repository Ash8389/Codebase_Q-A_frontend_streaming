import { useState } from 'react'
import {
  GitBranch,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

import { ingestRepo } from '../api/services'

export default function RepoIngest({ onRepoAdd }) {

  const [url, setUrl] = useState('')
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!url.trim()) return

    const namespace = url
      .substring(url.lastIndexOf('/') + 1)

    setStatus('loading')
    setMessage('Cloning and chunking repository...')

    try {

      await ingestRepo(url)

      onRepoAdd(namespace)

      setStatus('success')
      setMessage(
        'Repository ingested successfully!'
      )

      setUrl('')

    } catch (err) {

      setStatus('error')

      setMessage(
        err.response?.data?.message ||
        'Failed to ingest repository'
      )
    }
  }

  return (
    <div className="ingest-card">
      <div className="card-header">
        <GitBranch size={20} />
        <h2>Ingest Repository</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="url"
          placeholder="https://github.com/user/repo"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          className="input-field"
        />

        <button
          type="submit"
          disabled={status === 'loading'}
          className="btn-primary"
        >
          {status === 'loading' ? (
            <>
              <Loader2
                size={16}
                className="spin"
              />
              Processing...
            </>
          ) : (
            'Ingest Codebase'
          )}
        </button>
      </form>

      {status !== 'idle' &&
        status !== 'loading' && (
          <div className={`alert ${status}`}>
            {status === 'success'
              ? <CheckCircle size={16} />
              : <AlertCircle size={16} />
            }

            {message}
          </div>
      )}
    </div>
  )
}