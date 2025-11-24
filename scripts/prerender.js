import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const distPath = join(__dirname, '../dist')
const indexPath = join(distPath, 'index.html')

try {
  // Read the built HTML
  let html = readFileSync(indexPath, 'utf-8')
  
  // Add semantic HTML structure for SEO
  // This provides search engines with content structure even before JS loads
  const semanticContent = `
    <div id="app">
      <noscript>
        <div style="padding: 2rem; text-align: center;">
          <h1>RecordPanel - React Screen Recording SDK</h1>
          <p>A powerful React SDK for screen recording with camera and audio support. Beautiful, draggable UI with real-time audio feedback.</p>
          <p>Please enable JavaScript to view the full documentation and interactive demo.</p>
        </div>
      </noscript>
      <!-- React app will hydrate here -->
    </div>
  `
  
  // Replace placeholder with semantic content (handle various formats)
  html = html.replace(/<div id="app"[^>]*>.*?<\/div>/s, semanticContent)
  html = html.replace(/<div id="app"[^>]*\/>/, semanticContent)
  
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
  
  // Insert structured data before closing head tag
  html = html.replace('</head>', `${structuredData}</head>`)
  
  // Write the updated HTML
  writeFileSync(indexPath, html, 'utf-8')
  console.log('✓ Pre-rendered HTML with SEO enhancements')
} catch (error) {
  console.error('Error during pre-rendering:', error)
  process.exit(1)
}
