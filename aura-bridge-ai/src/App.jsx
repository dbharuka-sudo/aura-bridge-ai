import React, { useEffect, useMemo, useState } from 'react'
import PathViewer from './components/PathViewer.jsx'

const API_BASE = import.meta.env.VITE_API_BASE || ""
function usePolling(url, intervalMs = 2000) {
  const [data, setData] = useState(null)
  useEffect(() => {
    let mounted = true
    const fetcher = async () => {
      try {
        const res = await fetch(`${url}${url.includes('?') ? '&' : '?'}_ts=${Date.now()}`, { cache: 'no-store' })
        const json = await res.json()
        if (mounted) setData(json)
      } catch (e) {
        // ignore
      }
    }
    fetcher()
    const id = setInterval(fetcher, intervalMs)
    return () => { mounted = false; clearInterval(id) }
  }, [url, intervalMs])
  return data
}

export default function App() {
  const status = usePolling(`${API_BASE}/latest/status`, 3000)
  const codes = usePolling(`${API_BASE}/latest/code`, 5000)
  const path = usePolling(`${API_BASE}/latest/path`, 5000)

  const valid = status?.valid
  const message = status?.message || 'Loading status...'

  const [tab, setTab] = useState('karel')
  const codeText = useMemo(() => (tab === 'krl' ? codes?.krl : codes?.karel) || 'Awaiting code...', [tab, codes])
  const isLoading = !codes || !path || !status

  // Download function for robot code
  const downloadCode = () => {
    if (!codeText || codeText === 'Awaiting code...') {
      alert('No code available to download')
      return
    }

    const extension = tab === 'karel' ? 'ls' : 'src'
    const filename = `aura_bridge_path.${extension}`
    const mimeType = tab === 'karel' ? 'text/plain' : 'text/plain'
    
    const blob = new Blob([codeText], { type: mimeType })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="app">
      <div className="header">
        <div className="title">Aura Bridge AI — The AI-Powered Universal Robot Translator</div>
        <div className="right">
          <span className="status">
            <span className="small">🔍 Validation Status</span>
            <span className={`badge ${valid ? '' : 'pending'}`}>
              {valid ? '✅ Valid' : '⏳ Pending'}
            </span>
          </span>
          <button className="btn" onClick={() => window.location.reload()}>
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="main-content">
        <div className="panel viewer">
          <h3>🎯 3D Path Visualization</h3>
          <PathViewer path={path?.path} />
        </div>

        <div className="split">
          <div className="panel">
            <h3>📊 System Status</h3>
            <div className={`small ${isLoading ? 'loading' : ''}`}>
              {isLoading ? '🔄 Loading system status...' : message}
            </div>
          </div>

          <div className="panel">
            <h3>🤖 Robot Code Generator</h3>
            <div className="tabs">
              <button className={`tab ${tab === 'karel' ? 'active' : ''}`} onClick={() => setTab('karel')}>
                🏭 FANUC KAREL
              </button>
              <button className={`tab ${tab === 'krl' ? 'active' : ''}`} onClick={() => setTab('krl')}>
                ⚙️ KUKA KRL
              </button>
            </div>
            <div className="code-container">
              <div className="code-header">
                <span className="code-label">
                  {tab === 'karel' ? '🏭 FANUC KAREL Code' : '⚙️ KUKA KRL Code'}
                </span>
                <button 
                  className="download-btn" 
                  onClick={downloadCode}
                  disabled={!codeText || codeText === 'Awaiting code...'}
                  title={`Download ${tab === 'karel' ? 'KAREL' : 'KRL'} code`}
                >
                  📥 Download Code
                </button>
              </div>
              <pre className={`code ${isLoading ? 'loading' : ''}`}>
                {isLoading ? '🔄 Generating robot code...' : codeText}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
