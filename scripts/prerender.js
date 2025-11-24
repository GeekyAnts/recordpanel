import { renderToString } from 'react-dom/server'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import React from 'react'
import { AppSSR } from '../src/App.server.tsx'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const distPath = join(__dirname, '../dist')
const indexPath = join(distPath, 'index.html')

try {
  console.log('Rendering React app to HTML...')
  
  // Render the React app to HTML string
  const appHtml = renderToString(React.createElement(AppSSR))
  
  // Read the built HTML template
  let html = readFileSync(indexPath, 'utf-8')
  
  // Replace the app div placeholder with rendered HTML
  html = html.replace(/<div id="app"[^>]*>.*?<\/div>/s, `<div id="app">${appHtml}</div>`)
  html = html.replace(/<div id="app"[^>]*\/>/, `<div id="app">${appHtml}</div>`)
  
  // Add structured data (JSON-LD) for better SEO
  const structuredData = `
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "RecordPanel",
      "description": "A powerful React SDK for screen recording with camera and audio support. Beautiful, draggable UI with real-time audio feedback.",
      "applicationCategory": "DeveloperApplication",
      "operatingSystem": "Web Browser",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "author": {
        "@type": "Organization",
        "name": "GeekyAnts"
      },
      "codeRepository": "https://github.com/GeekyAnts/recordpanel"
    }
    </script>
  `
  
  // Insert structured data before closing head tag (if not already present)
  if (!html.includes('application/ld+json')) {
    html = html.replace('</head>', `${structuredData}</head>`)
  }
  
  // Write the updated HTML with pre-rendered content
  writeFileSync(indexPath, html, 'utf-8')
  console.log('✓ Successfully pre-rendered React app to HTML')
} catch (error) {
  console.error('Error during SSR pre-rendering:', error)
  console.error(error.stack)
  process.exit(1)
}
