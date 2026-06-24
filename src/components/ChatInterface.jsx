import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, FileCode, Zap, Database, ChevronDown, Trash2 } from 'lucide-react'
import { askQuestion } from '../api/services'
import { getStoredNamespaces, NAMESPACES_KEY } from './RepoIngest'

const NS_SELECTED_KEY = 'selected_namespace'

function readSelected() {
  return localStorage.getItem(NS_SELECTED_KEY) || ''
}

export default function ChatInterface({ latestNamespace }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [namespaces, setNamespaces] = useState(() => getStoredNamespaces())
  const [namespace, setNamespace] = useState(() => {
    const saved = readSelected()
    const all = getStoredNamespaces()
    // Use saved if still valid, else fall back to first available
    return saved || all[0] || ''
  })
  const [customInput, setCustomInput] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const messagesEndRef = useRef(null)

  // Re-read localStorage whenever a new repo is ingested
  useEffect(() => {
    if (!latestNamespace) return
    const updated = getStoredNamespaces()
    setNamespaces(updated)
    // Auto-select the just-ingested namespace
    setNamespace(latestNamespace)
    localStorage.setItem(NS_SELECTED_KEY, latestNamespace)
  }, [latestNamespace])

  const handleSelectChange = (e) => {
    const val = e.target.value
    if (val === '__custom__') {
      setShowCustom(true)
      return
    }
    setShowCustom(false)
    setNamespace(val)
    localStorage.setItem(NS_SELECTED_KEY, val)
  }

  const handleCustomConfirm = () => {
    if (!customInput.trim()) return
    setNamespace(customInput.trim())
    localStorage.setItem(NS_SELECTED_KEY, customInput.trim())
    setShowCustom(false)
    setCustomInput('')
  }

  const handleClearNamespaces = () => {
    if (!confirm('Clear all saved namespaces?')) return
    localStorage.removeItem(NAMESPACES_KEY)
    localStorage.removeItem(NS_SELECTED_KEY)
    setNamespaces([])
    setNamespace('')
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMsg = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { type: 'user', content: userMsg }])
    setIsLoading(true)

    try {
      const { data } = await askQuestion(userMsg, namespace)
      setMessages((prev) => [
        ...prev,
        {
          type: 'bot',
          content: data.answer,
          citations: data.citations || [],
          fromCache: data.fromCache,
          latencyMs: data.latencyMs,
        },
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          type: 'error',
          content: err.response?.data?.message || 'Failed to get response',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <Bot size={24} />
        <div>
          <h2>Codebase Q&A</h2>
          <span className="subtitle">Ask questions about your ingested repositories</span>
        </div>
      </div>

      {/* Namespace selector */}
      <div className="namespace-bar">
        <Database size={14} />
        <label>Namespace:</label>

        {namespaces.length > 0 ? (
          <>
            <div className="namespace-select-wrapper">
              <select
                value={showCustom ? '__custom__' : namespace}
                onChange={handleSelectChange}
                className="namespace-select"
              >
                {namespaces.map((ns) => (
                  <option key={ns} value={ns}>{ns}</option>
                ))}
                <option value="__custom__">+ Custom…</option>
              </select>
              <ChevronDown size={12} className="select-chevron" />
            </div>
            <button
              onClick={handleClearNamespaces}
              className="btn-clear-ns"
              title="Clear saved namespaces"
            >
              <Trash2 size={13} />
            </button>
          </>
        ) : (
          <span className="ns-empty-hint">Ingest a repo to populate</span>
        )}

        {showCustom && (
          <div className="custom-ns-row">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCustomConfirm()}
              placeholder="e.g., my-org/my-repo"
              className="namespace-input"
              autoFocus
            />
            <button onClick={handleCustomConfirm} className="btn-ns-confirm">Use</button>
          </div>
        )}
      </div>

      <div className="messages-area">
        {messages.length === 0 && (
          <div className="empty-state">
            <Bot size={48} opacity={0.3} />
            <p>Ask me anything about your codebase</p>
            <span className="hint">
              {namespace ? `Namespace: ${namespace}` : 'Select a namespace above'}
            </span>
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
                      <span className="cite-lines">L{cite.startLine}-{cite.endLine}</span>
                      <span className="cite-score">{(cite.score * 100).toFixed(1)}%</span>
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
          placeholder={namespace ? `Ask about ${namespace}…` : 'Select a namespace first…'}
          disabled={isLoading || !namespace}
          className="chat-input"
        />
        <button type="submit" disabled={isLoading || !namespace} className="btn-send">
          {isLoading ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
        </button>
      </form>
    </div>
  )
}