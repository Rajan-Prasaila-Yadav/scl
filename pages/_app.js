import { getRaw } from '../lib/storage'
import '../styles/globals.css'
import Head from 'next/head'
import { useEffect, useState } from 'react'
import StorageStatus from '../components/StorageStatus'
import { seedDemoData } from '../lib/seed'

export default function App({ Component, pageProps }) {
  const [ready, setReady] = useState(false)
  // Restore saved accent color and theme on every page load
  useEffect(() => {
    seedDemoData()
    const savedAccent = getRaw('accentColor')
    if (savedAccent) {
      document.documentElement.style.setProperty('--accent', savedAccent)
      document.documentElement.style.setProperty('--accent2', savedAccent + 'CC')
    }
    const savedTheme = getRaw('theme') || 'dark'
    document.documentElement.setAttribute('data-theme', savedTheme)
    setReady(true)
  }, [])

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>EduCore</title>
      </Head>
      <StorageStatus />
      {ready ? <Component {...pageProps} /> : <p role="status">Loading school workspace…</p>}
    </>
  )
}
