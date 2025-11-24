import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { ThemeProvider } from 'next-themes'
import './index.css'
import App from './App.tsx'

const rootElement = document.getElementById('app')!

if (rootElement.hasChildNodes()) {
  // Hydrate if HTML was pre-rendered
  hydrateRoot(
    rootElement,
    <StrictMode>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <App />
      </ThemeProvider>
    </StrictMode>
  )
} else {
  // Normal client-side render
  createRoot(rootElement).render(
    <StrictMode>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <App />
      </ThemeProvider>
    </StrictMode>
  )
}
