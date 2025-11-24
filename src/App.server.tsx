// Server-side version of App that can be rendered without browser APIs
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Logo } from '@/components/Logo'
import { 
  Video,
  Mic,
  Camera,
  Zap,
  Palette,
  Download,
  Github,
  ExternalLink,
  CheckCircle
} from 'lucide-react'

// Simplified AppContent for SSR (without interactive features)
function AppContentSSR() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <Logo />
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <a 
              href="https://github.com/GeekyAnts/recordpanel" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium hover:bg-accent rounded-md"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
              RecordPanel
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              A powerful React SDK for screen recording with camera and audio support. 
              Beautiful, draggable UI with real-time audio feedback.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <a 
                href="#demo" 
                className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Try Demo
              </a>
              <a 
                href="https://github.com/GeekyAnts/recordpanel" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-3 border border-border rounded-lg font-medium hover:bg-accent transition-colors"
              >
                <Github className="h-4 w-4 mr-2" />
                View on GitHub
              </a>
            </div>
            
            {/* Demo Video */}
            <div className="max-w-4xl mx-auto mt-12">
              <div className="relative rounded-lg overflow-hidden border shadow-2xl bg-background aspect-video">
                <iframe
                  className="w-full h-full"
                  src="https://www.youtube.com/embed/Kz4beXoC32I"
                  title="RecordPanel Demo - React Screen Recording SDK"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
              <p className="text-sm text-muted-foreground text-center mt-4">
                Watch RecordPanel in action - screen recording with camera and audio support
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 border rounded-lg">
              <Video className="h-8 w-8 mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Screen Recording</h3>
              <p className="text-muted-foreground">Capture your entire screen or specific windows with ease.</p>
            </div>
            <div className="p-6 border rounded-lg">
              <Camera className="h-8 w-8 mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Camera Support</h3>
              <p className="text-muted-foreground">Include your webcam feed with circular preview (Loom-style).</p>
            </div>
            <div className="p-6 border rounded-lg">
              <Mic className="h-8 w-8 mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Audio Capture</h3>
              <p className="text-muted-foreground">Record microphone and system audio simultaneously.</p>
            </div>
            <div className="p-6 border rounded-lg">
              <Palette className="h-8 w-8 mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Beautiful UI</h3>
              <p className="text-muted-foreground">Modern, draggable floating panel with smooth animations.</p>
            </div>
            <div className="p-6 border rounded-lg">
              <Zap className="h-8 w-8 mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Audio Feedback</h3>
              <p className="text-muted-foreground">Real-time visual audio level indicators.</p>
            </div>
            <div className="p-6 border rounded-lg">
              <Download className="h-8 w-8 mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Easy Integration</h3>
              <p className="text-muted-foreground">Simple API with TypeScript support and comprehensive docs.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Installation Section */}
      <section className="container mx-auto px-4 py-16 bg-muted/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Installation</h2>
          <div className="bg-background border rounded-lg p-6">
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
              <code>npm install recordpanel</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Browser Support */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Browser Support</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-medium">Chrome 92+</span>
            </div>
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-medium">Firefox 90+</span>
            </div>
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-medium">Edge 92+</span>
            </div>
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-medium">Safari 15+</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <Logo />
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Built with ❤️ by GeekyAnts</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export function AppSSR() {
  return <AppContentSSR />
}
