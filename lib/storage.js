// All prototype persistence passes through this adapter. Never reseed an existing key.
const snapshots = new Map()
const conflicted = new Set()
export function storageNotice(message) {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('educore:storage-error', { detail: message }))
}
export function getRaw(key) {
  if (typeof window === 'undefined') return null
  try { return window.localStorage.getItem(key) } catch { storageNotice('Browser storage is unavailable. Changes cannot be saved.'); return null }
}
export function setRaw(key, value) {
  if (typeof window === 'undefined') return false
  try {
    if (conflicted.has(key)) { storageNotice('Saving is paused for a damaged or conflicting record. Reload before editing.'); return false }
    window.localStorage.setItem(key, String(value))
    return true
  } catch { storageNotice('Changes were not saved: browser storage is unavailable or full.'); return false }
}
export function readValue(key, fallback) {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    snapshots.set(key, raw)
    if (raw === null) return fallback
    return JSON.parse(raw)
  } catch {
    conflicted.add(key)
    storageNotice(`Unable to read ${key}. Export a backup before resetting damaged browser data.`)
    return fallback
  }
}
export function readList(key, fallback = []) {
  const value = readValue(key, fallback)
  return Array.isArray(value) ? value : fallback
}
export function readObject(key, fallback = {}) {
  const value = readValue(key, fallback)
  return value && typeof value === 'object' && !Array.isArray(value) ? value : fallback
}
export function writeValue(key, value) {
  if (typeof window === 'undefined') return false
  try {
    const raw = window.localStorage.getItem(key)
    const next = JSON.stringify(value)
    if (raw === next) { snapshots.set(key, raw); return true }
    if (['educore.students', 'educore.staff'].includes(key) && raw) {
      const logs = JSON.parse(window.localStorage.getItem('educore.dailyAudit') || '[]')
      const closed = new Set(logs.filter(log => log.status === 'closed').map(log => log.date))
      const historyKey = key === 'educore.students' ? 'payments' : 'salaryHistory'
      const dateKey = item => {
        const date = (item.paymentDate || '').split(' ')[0]
        const parts = date.split('/')
        return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : date
      }
      const locked = records => records.flatMap(record => (record[historyKey] || []).flatMap(item => historyKey === 'payments' && item.collections?.length ? item.collections.map(entry => ({...entry, invoiceNo:item.invoiceNo})) : [item]).filter(item => closed.has(dateKey(item))).map(item => ({ owner: record.id, ...item }))).sort((a,b) => String(a.owner).localeCompare(String(b.owner)) || String(a.id).localeCompare(String(b.id)))
      if (JSON.stringify(locked(JSON.parse(raw))) !== JSON.stringify(locked(value))) {
        storageNotice('This change affects a closed accounting day and was not saved. Reload to restore the saved records.')
        return false
      }
    }
    if (conflicted.has(key) || (snapshots.has(key) && snapshots.get(key) !== raw)) {
      conflicted.add(key)
      storageNotice('Another tab changed these records. Saving is paused. Reload to use the latest data; copy any unsaved work first.')
      return false
    }
    window.localStorage.setItem(key, next)
    snapshots.set(key, next)
    window.dispatchEvent(new CustomEvent('educore:data-changed', { detail: { key } }))
    return true
  } catch {
    storageNotice('Changes could not be saved in this browser. Storage may be full or unavailable. Export a backup and free space before trying again.')
    return false
  }
}
export function seedValue(key, value) {
  if (typeof window === 'undefined') return
  try { if (window.localStorage.getItem(key) === null) writeValue(key, value) } catch { storageNotice('Browser storage is unavailable. Changes cannot be saved.') }
}
export function exportBackup() {
  const data = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key.startsWith('educore.') || ['academicYear', 'academicYears', 'theme', 'accentColor'].includes(key)) data[key] = localStorage.getItem(key)
  }
  return { version: 1, createdAt: new Date().toISOString(), data }
}
