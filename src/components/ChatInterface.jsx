import { useState, useRef, useEffect } from 'react'
import {
  Send,
  Bot,
  User,
  Loader2,
  FileCode,
  Zap,
  Database
} from 'lucide-react'

import { askQuestion } from '../api/services'

export default function ChatInterface({ repositories }) {

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [namespace, setNamespace] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (
      repositories.length > 0 &&
      !namespace
    ) {
      setNamespace(repositories[0])
    }
  }, [repositories, namespace])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    })
  }, [messages])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (
      !input.trim() ||
      isLoading ||
      !namespace
    ) {
      return
    }

    const userMsg = input.trim()

    setInput('')
    setMessages(prev => [
      ...prev,
      {
        type: 'user',
        content: userMsg
      }
    ])

    setIsLoading(true)

    try {

      const { data } =
        await askQuestion(
          userMsg,
          namespace
        )

      setMessages(prev => [
        ...prev,
        {
          type: 'bot',
          content: data.answer,
          citations:
            data.citations || [],
          fromCache:
            data.fromCache,
          latencyMs:
            data.latencyMs
        }
      ])

    } catch (err) {

      setMessages(prev => [
        ...prev,
        {
          type: 'error',
          content:
            err.response?.data?.message ||
            'Failed to get response'
        }
      ])

    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div className="namespace-bar">
        <Database size={14} />

        <label>Namespace:</label>

        <select
          value={namespace}
          onChange={(e) =>
            setNamespace(
              e.target.value
            )
          }
        >
          {repositories.length === 0 ? (
            <option value="">
              No repositories
            </option>
          ) : (
            repositories.map(repo => (
              <option
                key={repo}
                value={repo}
              >
                {repo}
              </option>
            ))
          )}
        </select>
      </div>

      <div className="messages-area">
        {/* ... rest of your messages rendering stays the same ... */}
        {messages.length === 0 && (
          <div className="empty-state">
            <Bot size={48} opacity={0.3} />
            <p>Ask me anything about your codebase</p>
            <span className="hint">Namespace: {namespace}</span>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.type}`}>
            <div className="message-avatar">
              {msg.type === 'user' ? <User size={18} /> : <Bot size={18} />}
            </div>
            <div className="message-content">
              <div className="message-text">{msg.content}</div>

              {msg.citations?.length > 0 && (
                <div className="citations">
                  <h4>Sources</h4>
                  {msg.citations.map((cite, cidx) => (
                    <div key={cidx} className="citation">
                      <FileCode size={14} />
                      <span className="cite-path">{cite.path}</span>
                      <span className="cite-lines">
                        L{cite.startLine}-{cite.endLine}
                      </span>
                      <span className="cite-score">
                        {(cite.score * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {msg.fromCache !== undefined && (
                <div className="meta">
                  {msg.fromCache && <Zap size={12} />}
                  <span>{msg.fromCache ? 'Cached' : `${msg.latencyMs}ms`}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="message bot loading">
            <div className="message-avatar"><Bot size={18} /></div>
            <div className="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="chat-input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your codebase..."
          disabled={isLoading}
          className="chat-input"
        />
        <button type="submit" disabled={isLoading} className="btn-send">
          {isLoading ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
        </button>
      </form>
    </div>
  )
}