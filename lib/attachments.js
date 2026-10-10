function database() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('educore-files', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('files')
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}
export async function saveAttachment(file) {
  if (!file || file.size > 10 * 1024 * 1024) throw new Error('Choose a file smaller than 10 MB.')
  const db = await database()
  const id = crypto.randomUUID()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readwrite')
    tx.objectStore('files').put(file, id)
    tx.oncomplete = () => { db.close(); resolve(id) }
    tx.onerror = () => { db.close(); reject(new Error('The file could not be saved. Browser storage may be full.')) }
  })
}
export async function downloadAttachment(document) {
  if (!document?.attachmentId) { window.alert('This older record contains file metadata only. Upload the original file to enable download.'); return }
  try {
    const db = await database()
    const file = await new Promise((resolve, reject) => {
      const request = db.transaction('files').objectStore('files').get(document.attachmentId)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    db.close()
    if (!file) throw new Error('This file is no longer in browser storage. Upload it again.')
    const url = URL.createObjectURL(file)
    const link = window.document.createElement('a')
    link.href = url; link.download = document.name || file.name; link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  } catch (error) { window.alert(error.message || 'Could not open the stored file.') }
}
