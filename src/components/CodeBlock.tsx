import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useTheme } from 'next-themes'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

interface CodeBlockProps {
  code: string
  language?: string
  id?: string
}

export function CodeBlock({ code, language = 'typescript', id }: CodeBlockProps) {
  const { theme, resolvedTheme } = useTheme()
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  const isDark = mounted && (resolvedTheme === 'dark' || (resolvedTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches))

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
        style={isDark ? oneDark : oneLight}
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
