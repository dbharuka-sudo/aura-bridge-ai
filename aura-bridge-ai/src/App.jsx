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

  return (
    <div className="app">
      <div className="header">
        <div className="title">Aura Bridge AI — The AI-Powered Universal Robot Translator</div>
        <div className="right">
          <span className="status">
            <span className="small">Validation</span>
            <span className="badge">{valid ? 'Valid' : 'Pending'}</span>
          </span>
          <button className="btn" onClick={() => window.location.reload()}>Refresh</button>
        </div>
      </div>

      <div className="panel viewer">
        <h3>3D Path</h3>
        <PathViewer path={path?.path} />
      </div>

      <div className="split">
        <div className="panel">
          <h3>Status</h3>
          <div className="small">{message}</div>
        </div>

        <div className="panel">
          <h3>Robot Code</h3>
          <div className="tabs">
            <button className={`tab ${tab === 'karel' ? 'active' : ''}`} onClick={() => setTab('karel')}>FANUC KAREL</button>
            <button className={`tab ${tab === 'krl' ? 'active' : ''}`} onClick={() => setTab('krl')}>KUKA KRL</button>
          </div>
          <pre className="code">{codeText}</pre>
        </div>

        {/* NICE DCV iframe removed per request */}
      </div>
    </div>
  )
}
