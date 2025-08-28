import React, { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import { listen } from '@tauri-apps/api/event'

type OverlayState = 'idle' | 'listening' | 'processing' | 'ready'

export const App: React.FC = () => {
  const [state, setState] = useState<OverlayState>('idle')
  const [model, setModel] = useState<string>('tiny')
  const [insertNewline, setInsertNewline] = useState<boolean>(false)

  useEffect(() => {
    const unlistenPromise = listen<string>('overlay://state', (e) => {
      const next = e.payload as OverlayState
      setState(next)
    })
    return () => { unlistenPromise.then((un) => un()) }
  }, [])

  const handleStart = async () => {
    try {
      await invoke('start_recording')
      setState('listening')
    } catch (e) {
      console.error(e)
    }
  }

  const handleStop = async () => {
    try {
      setState('processing')
      await invoke<string>('stop_and_transcribe', { model, insertNewline })
      setState('ready')
      setTimeout(() => setState('idle'), 800)
    } catch (e) {
      console.error(e)
      setState('idle')
    }
  }

  return (
    <div className="overlay">
      <div className="badge">
        <div style={{ fontSize: 14, marginBottom: 6 }}>
          {state === 'idle' && 'Press and hold hotkey to speak'}
          {state === 'listening' && 'Listening…'}
          {state === 'processing' && 'Processing…'}
          {state === 'ready' && 'Inserted'}
        </div>
        <div className="sub">
          Model:
          <select value={model} onChange={(e) => setModel(e.target.value)} style={{ marginLeft: 8 }}>
            <option value="tiny">tiny</option>
            <option value="base">base</option>
            <option value="small">small</option>
            <option value="medium">medium</option>
          </select>
          <label style={{ marginLeft: 12 }}>
            <input type="checkbox" checked={insertNewline} onChange={(e) => setInsertNewline(e.target.checked)} />
            <span style={{ marginLeft: 6 }}>Enter</span>
          </label>
        </div>
        <div style={{ marginTop: 10, display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button onMouseDown={handleStart} onMouseUp={handleStop} onMouseLeave={handleStop} disabled={state === 'processing'}>
            Hold to talk
          </button>
        </div>
      </div>
    </div>
  )
}

