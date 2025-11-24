import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useTheme } from 'next-themes'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

// Lazy load syntax highlighter styles to avoid SSR issues
let oneDarkStyle: any = null
let oneLightStyle: any = null

const loadStyles = async () => {
  if (!oneDarkStyle || !oneLightStyle) {
    const styles = await import('react-syntax-highlighter/dist/esm/styles/prism')
    oneDarkStyle = styles.oneDark
    oneLightStyle = styles.oneLight
  }
  return { oneDarkStyle, oneLightStyle }
}

interface CodeBlockProps {
  code: string
  language?: string
  id?: string
}

export function CodeBlock({ code, language = 'typescript', id }: CodeBlockProps) {
  const { theme, resolvedTheme } = useTheme()
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [stylesLoaded, setStylesLoaded] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Load styles on client side only
    if (typeof window !== 'undefined') {
      loadStyles().then(() => {
        setStylesLoaded(true)
      })
    }
  }, [])

  const copyToClipboard = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code)
      setCopied(true)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const isDark = mounted && (resolvedTheme === 'dark' || (resolvedTheme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches))

  // Render plain code block during SSR or before styles load
  if (!mounted || !stylesLoaded) {
    return (
      <div className="relative group">
        <Button
          size="sm"
          variant="ghost"
          className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={copyToClipboard}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
        <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
          <code>{code}</code>
        </pre>
      </div>
    )
  }

  return (
    <div className="relative group">
      <Button
        size="sm"
        variant="ghost"
        className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={copyToClipboard}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
      <SyntaxHighlighter
        language={language}
        style={isDark ? oneDarkStyle : oneLightStyle}
        customStyle={{
          margin: 0,
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          padding: '1rem',
        }}
        showLineNumbers={false}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}
