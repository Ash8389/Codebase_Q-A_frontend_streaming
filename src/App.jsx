import RepoIngest from './components/RepoIngest'
import ChatInterface from './components/ChatInterface'
import './App.css'


function App() {

 const [repositories, setRepositories] = useState(() => {
    return JSON.parse(localStorage.getItem('repositories')) || []
  })

  const handleRepoAdd = (namespace) => {
    setRepositories(prev => {

      if (prev.includes(namespace)) {
        return prev
      }

      const updated = [...prev, namespace]

      localStorage.setItem(
        'repositories',
        JSON.stringify(updated)
      )

      return updated
    })
  }     

  return (
    <div className="app">
      <header className="app-header">
        <h1>🔍 Codebase Q&A</h1>
        <p>AI-powered repository understanding via RAG</p>
      </header>

      <main className="app-main">
        <aside className="sidebar">
          <RepoIngest onRepoAdded={handleRepoAdd}/>

          <div className="info-card">
            <h3>How it works</h3>
            <ol>
              <li>Paste a GitHub repo URL</li>
              <li>System chunks & embeds code</li>
              <li>Ask natural language questions</li>
              <li>Get answers with code citations</li>
            </ol>
          </div>
        </aside>

        <section className="chat-section">
          <ChatInterface repositories={repositories}/>
        </section>
      </main>
    </div>
  )
}

export default App
