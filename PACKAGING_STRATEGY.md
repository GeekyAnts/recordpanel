# Packaging Strategy for RecordPanel SDK

## Current Issues

1. **CSS Conflicts**: Using Tailwind classes (`h-8`, `bg-primary`, etc.) that may conflict with host app
2. **CSS Variables**: Using shadcn CSS variables (`hsl(var(--primary))`) that may not exist in host app
3. **Dependencies**: Using `lucide-react`, `@radix-ui/react-slot`, `class-variance-authority`, etc.

## Recommended Approach

### Option 1: Fully Bundled CSS (Recommended for Simplicity)

**Strategy**: Bundle all CSS (including Tailwind utilities) with a namespace prefix to avoid conflicts.

#### Pros:
- ✅ Simple for consumers (just import JS + CSS)
- ✅ No CSS conflicts (scoped with prefix)
- ✅ Works out of the box

#### Cons:
- ⚠️ Larger bundle size (includes Tailwind utilities)
- ⚠️ Host app can't customize with their Tailwind config

#### Implementation:

1. **Use PostCSS to scope Tailwind classes**:
   ```js
   // postcss.config.js for SDK build
   module.exports = {
     plugins: {
       '@tailwindcss/postcss': {
         // Scope all Tailwind classes with prefix
       },
       'postcss-prefixwrap': {
         prefix: '.recordpanel-sdk',
       }
     }
   }
   ```

2. **Bundle CSS separately**:
   - Extract CSS into `dist/styles.css`
   - Document that users need to import it

3. **Build config** (Vite library mode):
   ```js
   // vite.config.library.js
   export default defineConfig({
     build: {
       lib: {
         entry: 'src/recordpanel/index.ts',
         formats: ['es', 'cjs'],
         fileName: (format) => `index.${format === 'es' ? 'mjs' : 'cjs'}`
       },
       rollupOptions: {
         external: ['react', 'react-dom'],
         output: {
           assetFileNames: 'styles.[ext]'
         }
       }
     }
   })
   ```

### Option 2: CSS-in-JS (Recommended for Maximum Isolation)

**Strategy**: Convert all styles to CSS-in-JS (styled-components, emotion, or vanilla-extract).

#### Pros:
- ✅ Zero CSS conflicts
- ✅ Styles are bundled with JS
- ✅ Can use host app's theme if needed

#### Cons:
- ⚠️ Requires refactoring
- ⚠️ Runtime CSS injection
- ⚠️ Additional dependency

### Option 3: Scoped CSS Modules + Inline Critical Styles

**Strategy**: Use CSS Modules for custom styles, inline critical Tailwind classes.

#### Pros:
- ✅ Good isolation
- ✅ Smaller bundle

#### Cons:
- ⚠️ More complex build setup
- ⚠️ Still need to handle Tailwind

## Recommended Solution: Hybrid Approach

### 1. CSS Strategy

**Use scoped CSS with CSS variables fallbacks:**

```css
/* styles.css - Already scoped with .recordpanel-* prefix */
.recordpanel-overlay {
  /* Use CSS variables with fallbacks */
  background: hsl(var(--recordpanel-bg, 255 255 255));
  color: hsl(var(--recordpanel-fg, 0 0 0));
}

/* For Tailwind classes, convert to inline styles or CSS */
```

**Convert Tailwind classes to CSS:**

Instead of using `className="h-8 w-8"`, use:
- CSS classes: `.recordpanel-button { height: 2rem; width: 2rem; }`
- Or inline styles for dynamic values
- Or CSS custom properties

### 2. Build Configuration

Create a library build config:

```js
// vite.config.library.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/recordpanel/index.ts'),
      name: 'RecordPanel',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'mjs' : 'cjs'}`
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        // Make these peer dependencies
        'lucide-react',
        '@radix-ui/react-slot',
        'class-variance-authority',
        'clsx',
        'tailwind-merge'
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') {
            return 'styles.css'
          }
          return assetInfo.name
        }
      }
    },
    cssCodeSplit: false, // Bundle all CSS in one file
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### 3. Package.json Configuration

```json
{
  "name": "recordpanel",
  "version": "1.0.0",
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./styles": "./dist/styles.css"
  },
  "files": [
    "dist"
  ],
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0",
    "lucide-react": "^0.400.0"
  },
  "dependencies": {
    "@radix-ui/react-slot": "^1.2.4",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.4.0"
  }
}
```

### 4. CSS Variables Strategy

**Option A: Use CSS variables with fallbacks** (Recommended):
```css
.recordpanel-button {
  background: hsl(var(--recordpanel-primary, 221 83 53));
  color: hsl(var(--recordpanel-primary-foreground, 0 0 100));
}
```

**Option B: Use fixed colors** (Simplest):
```css
.recordpanel-button {
  background: hsl(221 83 53);
  color: hsl(0 0 100);
}
```

**Option C: Accept theme prop** (Most flexible):
```tsx
// Allow host app to pass theme
<RecordPanelHost theme={customTheme}>
```

### 5. Lucide Icons Strategy

**Recommendation: Bundle icons** (they're tree-shakeable):

```js
// In your build, lucide-react will tree-shake unused icons
// Only icons you import will be included
import { Video, Mic } from 'lucide-react'
```

**Alternative: Peer dependency** if host app already uses lucide-react:
```json
{
  "peerDependencies": {
    "lucide-react": "^0.400.0"
  }
}
```

## Implementation Steps

### Step 1: Refactor CSS

1. Convert Tailwind classes to CSS classes or inline styles
2. Add CSS variable fallbacks
3. Ensure all styles are scoped with `.recordpanel-*`

### Step 2: Create Library Build

1. Create `vite.config.library.js`
2. Add build script: `"build:lib": "vite build --config vite.config.library.js"`
3. Configure externals/peerDeps

### Step 3: Update Package.json

1. Set up proper exports
2. Configure peerDependencies
3. Add files field

### Step 4: Documentation

```markdown
## Installation

```bash
npm install recordpanel
```

## Usage

```jsx
import { RecordPanelHost, useRecordPanel } from 'recordpanel'
import 'recordpanel/styles'
```

## CSS Variables (Optional)

If you want to customize colors, define these CSS variables:

```css
:root {
  --recordpanel-primary: 221 83 53;
  --recordpanel-primary-foreground: 0 0 100;
  /* ... */
}
```
```

## Quick Win: Current State Fix

For immediate shipping, you can:

1. **Keep current CSS** but document that users need to:
   - Import the CSS file
   - Have Tailwind CSS configured (or provide a standalone CSS build)

2. **Make lucide-react a peer dependency**:
   ```json
   {
     "peerDependencies": {
       "lucide-react": "^0.400.0"
     }
   }
   ```

3. **Document CSS requirements**:
   - Users need to import `styles.css`
   - If using Tailwind, ensure it's configured
   - Or provide a pre-built CSS bundle

## Recommended Next Steps

1. ✅ **Short term**: Document CSS import requirement, make lucide-react peer dep
2. 🔄 **Medium term**: Convert Tailwind classes to CSS, add CSS variable fallbacks
3. 🎯 **Long term**: Full library build with scoped CSS, proper bundling
