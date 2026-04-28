import { useState, useRef, useEffect } from 'react'
import './App.css'

const ChatIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)

const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
)

const SparkIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L9.5 9.5L2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5L12 2z" />
  </svg>
)

const BrainIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 4.5a2.5 2.5 0 0 0-4.5 3v1.5a3 3 0 0 0 3 3h1.5a2.5 2.5 0 0 0 0-5H9v-.5a2.5 2.5 0 0 0-5 0v5a2.5 2.5 0 0 0 5 5h.5a3 3 0 0 0 3-3v-1.5a2.5 2.5 0 0 0 4.5-3M12 5.5a2 2 0 0 1 2 2v1a2 2 0 0 1-4 0v-1a2 2 0 0 1 2-2m-2.5 12a2.5 2.5 0 0 0 0 5h.5a3 3 0 0 0 3-3v-1.5a2.5 2.5 0 0 0-3.5-3.5v1.5a2.5 2.5 0 0 0-5 0v-1.5a2.5 2.5 0 0 0 5 1.5" />
  </svg>
)

const CodeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
)

const LightbulbIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 18h6M10 22h4M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
  </svg>
)

const suggestions = [
  { icon: <BrainIcon />, text: 'Explain quantum computing' },
  { icon: <CodeIcon />, text: 'Write a Python function' },
  { icon: <LightbulbIcon />, text: 'Brainstorm ideas' },
]

function parseMarkdown(text) {
  if (!text) return text

  const lines = text.split('\n')
  const elements = []
  let inCodeBlock = false
  let codeContent = ''
  let codeLang = ''

  const processInline = (str) => {
    str = str.replace(/`([^`]+)`/g, '<code>$1</code>')
    str = str.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    str = str.replace(/\*([^*]+)\*/g, '<em>$1</em>')
    return str
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${i}`} className="code-block">
            <code className={codeLang ? `language-${codeLang}` : ''}>{codeContent}</code>
          </pre>
        )
        codeContent = ''
        codeLang = ''
        inCodeBlock = false
      } else {
        if (codeContent.trim()) {
          elements.push(<p key={`text-${i}`} dangerouslySetInnerHTML={{ __html: processInline(codeContent.trim()) }} />)
          codeContent = ''
        }
        inCodeBlock = true
        codeLang = line.slice(3).trim()
      }
    } else if (inCodeBlock) {
      codeContent += (codeContent ? '\n' : '') + line
    } else if (line.match(/^#{1,6}\s/)) {
      const match = line.match(/^(#{1,6})\s+(.+)/)
      if (match) {
        const level = match[1].length
        elements.push(<h3 key={i} className={`heading-${level}`} dangerouslySetInnerHTML={{ __html: processInline(match[2]) }} />)
      }
    } else if (line.match(/^[-*]\s/)) {
      const items = []
      while (i < lines.length && lines[i].match(/^[-*]\s/)) {
        items.push(lines[i].replace(/^[-*]\s/, ''))
        i++
      }
      elements.push(<ul key={`ul-${i}`}>{items.map((item, idx) => <li key={idx} dangerouslySetInnerHTML={{ __html: processInline(item) }} />)}</ul>)
      i--
    } else if (line.match(/^\d+\.\s/)) {
      const items = []
      while (i < lines.length && lines[i].match(/^\d+\.\s/)) {
        items.push(lines[i].replace(/^\d+\.\s/, ''))
        i++
      }
      elements.push(<ol key={`ol-${i}`}>{items.map((item, idx) => <li key={idx} dangerouslySetInnerHTML={{ __html: processInline(item) }} />)}</ol>)
      i--
    } else if (line.startsWith('>')) {
      elements.push(<blockquote key={i} dangerouslySetInnerHTML={{ __html: processInline(line.slice(1).trim()) }} />)
    } else if (line.trim()) {
      elements.push(<p key={i} dangerouslySetInnerHTML={{ __html: processInline(line) }} />)
    } else {
      elements.push(<br key={i} />)
    }
  }

  return elements.length > 0 ? elements : text
}

function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const chatAreaRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      })

      if (!response.ok) throw new Error('Server error')

      const data = await response.json()
      setMessages(prev => [...prev, { role: 'ai', content: data.reply || 'Sorry, I could not process that.' }])
    } catch (error) {
      console.error('Error:', error)
      setMessages(prev => [...prev, { role: 'ai', content: 'Error: Could not connect to server. Make sure backend is running on port 3000.' }])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSuggestion = (text) => {
    setInput(text)
    inputRef.current?.focus()
  }

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-left">
          <div className="logo-icon"><ChatIcon /></div>
          <div className="header-title">
            <h1>AI Chat Assistant</h1>
            <p>NVIDIA Qwen AI Powered</p>
          </div>
        </div>
        <div className="status-badge">
          <span className="status-dot"></span>
          Online
        </div>
      </header>

      <div className="chat-area" ref={chatAreaRef}>
        {messages.length === 0 ? (
          <div className="welcome-container">
            <div className="welcome-icon"><SparkIcon /></div>
            <h2>Welcome to AI Chat</h2>
            <p>Your intelligent assistant powered by NVIDIA Qwen. Ask me anything!</p>
            <div className="suggestion-chips">
              {suggestions.map((s, i) => (
                <button key={i} className="chip" onClick={() => handleSuggestion(s.text)}>
                  {s.icon}
                  {s.text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={`message-wrapper ${msg.role === 'user' ? 'user' : 'ai'}`}>
              <div className="avatar">
                {msg.role === 'user' ? 'U' : 'AI'}
              </div>
              <div className="message-content">
                {msg.role === 'user' ? (
                  <p>{msg.content}</p>
                ) : (
                  parseMarkdown(msg.content)
                )}
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="typing-indicator">
            <div className="avatar">AI</div>
            <div className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
      </div>

      <div className="input-area">
        <div className="input-wrapper">
          <input
            ref={inputRef}
            type="text"
            className="chat-input"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          <button
            className={`send-button ${isLoading ? 'loading' : ''}`}
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  )
}

export default App