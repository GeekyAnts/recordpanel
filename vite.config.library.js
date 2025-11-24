import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Library build configuration
// Note: Install vite-plugin-dts for TypeScript declaration files:
// npm install -D vite-plugin-dts
// Then uncomment the dts import and plugin below

export default defineConfig({
  plugins: [
    react(),
    // Uncomment after installing vite-plugin-dts:
    // dts({
    //   insertTypesEntry: true,
    //   include: ['src/recordpanel/**/*'],
    //   exclude: ['src/recordpanel/**/*.test.*', 'src/recordpanel/**/*.spec.*']
    // })
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/recordpanel/index.ts'),
      name: 'RecordPanel',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'mjs' : 'cjs'}`
    },
    rollupOptions: {
      // Externalize dependencies that should be peer dependencies
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        // Option 1: Bundle these (simpler for users)
        // Option 2: Make peer deps (smaller bundle, more control)
        // 'lucide-react',
        // '@radix-ui/react-slot',
        // 'class-variance-authority',
        // 'clsx',
        // 'tailwind-merge'
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'react/jsx-runtime'
        },
        // Bundle CSS separately
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'styles.css'
          }
          return assetInfo.name || 'assets/[name][extname]'
        }
      }
    },
    // Bundle all CSS into one file
    cssCodeSplit: false,
    // Generate source maps for debugging
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
  },
})
