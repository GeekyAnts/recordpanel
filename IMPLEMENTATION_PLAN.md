# Implementation Plan: SDK Packaging

## Summary of Recommendations

### 1. CSS Strategy: **Scoped CSS with Fallbacks** ✅

**Current State:**
- Using Tailwind utility classes (`h-8`, `bg-primary`, etc.) that may conflict
- Using CSS variables (`hsl(var(--primary))`) that may not exist in host app
- Custom CSS already scoped with `.recordpanel-*` prefix ✅

**Recommended Approach:**
1. **Keep custom CSS** (already scoped) ✅
2. **Convert Tailwind classes to CSS classes** or inline styles
3. **Add CSS variable fallbacks** for customization
4. **Bundle CSS separately** as `styles.css`

### 2. Dependencies Strategy

**Lucide React:**
- ✅ **Bundle it** - It's tree-shakeable, only imports what you use
- ✅ No assets required, pure JS components
- ✅ Small impact on bundle size

**Other Dependencies:**
- `@radix-ui/react-slot` - Bundle (small, no conflicts)
- `class-variance-authority` - Bundle (small utility)
- `clsx` + `tailwind-merge` - Bundle (small utilities)

**Peer Dependencies:**
- `react` ✅ (required)
- `react-dom` ✅ (required)

### 3. Build Setup

**Files Created:**
- ✅ `vite.config.library.js` - Library build config
- ✅ `PACKAGING_STRATEGY.md` - Detailed strategy doc

**Next Steps:**

1. **Install build dependency:**
   ```bash
   npm install -D vite-plugin-dts
   ```

2. **Add build script:**
   ```json
   {
     "scripts": {
       "build:lib": "vite build --config vite.config.library.js"
     }
   }
   ```

3. **Update package.json for publishing:**
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
     "files": ["dist"],
     "peerDependencies": {
       "react": "^18.0.0 || ^19.0.0",
       "react-dom": "^18.0.0 || ^19.0.0"
     },
     "dependencies": {
       "@radix-ui/react-slot": "^1.2.4",
       "class-variance-authority": "^0.7.1",
       "clsx": "^2.1.1",
       "lucide-react": "^0.400.0",
       "tailwind-merge": "^3.4.0"
     }
   }
   ```

## Immediate Actions

### Phase 1: Quick Fix (Ship Now)

1. ✅ Document CSS import requirement
2. ✅ Bundle lucide-react (it's tree-shakeable)
3. ✅ Use library build config
4. ✅ Export CSS separately

**Usage for consumers:**
```jsx
import { RecordPanelHost, useRecordPanel } from 'recordpanel'
import 'recordpanel/styles'
```

### Phase 2: CSS Isolation (Next Sprint)

1. Convert Tailwind classes to CSS classes:
   ```tsx
   // Before
   <Button className="h-8 w-8 bg-primary" />
   
   // After
   <Button className="recordpanel-button-icon recordpanel-button-primary" />
   ```

2. Add CSS variable fallbacks:
   ```css
   .recordpanel-button-primary {
     background: hsl(var(--recordpanel-primary, 221 83 53));
   }
   ```

3. Create CSS class mappings for common utilities

### Phase 3: Full Isolation (Future)

1. Consider CSS-in-JS if conflicts persist
2. Add theme prop for full customization
3. Provide unstyled version

## CSS Conflict Mitigation

**Current Protection:**
- ✅ All custom CSS uses `.recordpanel-*` prefix
- ✅ CSS variables use `--recordpanel-*` prefix

**Remaining Risk:**
- ⚠️ Tailwind utility classes (`h-8`, `bg-primary`) may conflict

**Solutions:**
1. **Short term**: Document that host app should use Tailwind v4+ (better isolation)
2. **Medium term**: Convert utilities to CSS classes
3. **Long term**: CSS-in-JS or unstyled components

## Testing Checklist

Before publishing:

- [ ] Build library: `npm run build:lib`
- [ ] Test in a fresh React app (no Tailwind)
- [ ] Test in React app with Tailwind
- [ ] Test CSS import works
- [ ] Verify tree-shaking works (check bundle size)
- [ ] Test TypeScript types export correctly
- [ ] Verify all icons work (lucide-react bundled correctly)

## Example Consumer Setup

```bash
npm install recordpanel
```

```jsx
// App.jsx
import { RecordPanelHost, useRecordPanel } from 'recordpanel'
import 'recordpanel/styles'

function App() {
  return (
    <RecordPanelHost>
      <YourApp />
    </RecordPanelHost>
  )
}
```

**Optional CSS customization:**
```css
:root {
  --recordpanel-primary: 221 83 53;
  --recordpanel-primary-foreground: 0 0 100;
}
```
