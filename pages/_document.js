import { getRaw } from '../lib/storage'
import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en" data-theme="dark">
      <Head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" rel="stylesheet" />
      </Head>
      <body>
        <script dangerouslySetInnerHTML={{__html: `
          try {
            var t = getRaw('theme') || 'dark';
            document.documentElement.setAttribute('data-theme', t);
            var a = getRaw('accentColor');
            if (a) {
              document.documentElement.style.setProperty('--accent', a);
              document.documentElement.style.setProperty('--accent2', a + 'CC');
            }
          } catch(e) {}
        `}} />
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
