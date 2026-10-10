import { useEffect, useState } from 'react'
import { exportBackup } from '../lib/storage'

export default function StorageStatus() {
  const [message, setMessage] = useState('')
  useEffect(() => {
    const failure = e => setMessage(e.detail)
    const changed = e => { if (e.key?.startsWith('educore.')) setMessage('Records changed in another tab. Reload before editing to avoid overwriting newer work.') }
    window.addEventListener('educore:storage-error', failure)
    window.addEventListener('storage', changed)
    return () => { window.removeEventListener('educore:storage-error', failure); window.removeEventListener('storage', changed) }
  }, [])
  function backup() {
    try {
      const url = URL.createObjectURL(new Blob([JSON.stringify(exportBackup(), null, 2)], { type: 'application/json' }))
      const a = document.createElement('a'); a.href = url; a.download = 'educore-browser-backup.json'; a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch { setMessage('Browser storage is unavailable. Copy unsaved form values before reloading.') }
  }
  return message ? <div className="storage-status" role="alert"><strong>{message}</strong><button className="btn btn-ghost" onClick={backup}>Export backup</button><button className="btn btn-ghost" onClick={() => location.reload()}>Reload</button></div> : null
}
