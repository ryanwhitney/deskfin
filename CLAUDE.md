# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Context

This is a **personal fork** of Jellyfin Web, a custom frontend implementation with personalized preferences. The strategy is:

- **All custom/new code lives in** `/src/apps/experimental/`
- **Upstream code remains untouched** (dashboard, stable, wizard apps) to allow pulling changes from upstream
- The experimental app is a complete rewrite following modern React patterns and a custom design system

## Development Commands

### Starting Development
```bash
npm install              # Install dependencies
npm start                # Start dev server (http://localhost:8080)
```

### Building
```bash
npm run build            # Production build
npm run build:check      # Type check without emitting files
npm run preview          # Preview production build
```

### Code Quality
```bash
npm run lint             # Run ESLint
npm run stylelint        # Run stylelint on CSS/SCSS
npm run test             # Run tests (single run)
npm run test:watch       # Run tests in watch mode
```

## Experimental App Architecture

### Core Principles

The experimental app follows **[Bulletproof React](https://github.com/alan2207/bulletproof-react)** architecture:

1. **Feature-based organization** - Code organized by feature, not by file type
2. **CSS Modules** - All styles are scoped modules (`.module.scss`), no global styles
3. **React Aria** - Accessible UI primitives using `react-aria-components`
4. **Single source of truth** - Shared components in `/components`, no duplication
5. **Colocated styles** - Each component has its own `.module.scss` file

### Directory Structure

```
src/apps/experimental/
├── app/
│   ├── layout/              # App shell (drawer, topbar)
│   │   ├── drawer/
│   │   └── toolbar/
│   ├── navigation/          # Navigation configuration
│   ├── routes/              # Route configuration
│   └── styles/
│
├── components/              # Shared UI components (SINGLE SOURCE)
│   ├── button/              # Button, IconButton, LinkButton
│   ├── icons/               # Icon components
│   ├── itemCard/            # Legacy card wrapper
│   ├── library/             # Library view components (menus, pagination)
│   ├── media/               # Media components (MediaCard, ItemGrid, Section)
│   ├── menu/                # Menu primitives and styles
│   ├── toolbar/             # Toolbar components
│   └── index.ts             # Barrel exports
│
├── features/                # Feature modules
│   ├── home/
│   │   ├── components/      # Home-specific components
│   │   ├── routes/          # HomeRoute.tsx + HomeRoute.module.scss
│   │   └── utils/
│   ├── details/
│   │   ├── components/
│   │   │   ├── buttons/
│   │   │   └── ui/          # DetailsCast, DetailsHero, EpisodesSection, etc.
│   │   ├── routes/          # DetailsRoute.tsx + DetailsRoute.module.scss
│   │   └── utils/
│   ├── libraries/           # Library browsing (movies, shows, music)
│   ├── preferences/         # User preferences
│   ├── genres/              # Genre views
│   ├── people/              # Person/actor views
│   ├── video/               # Video playback
│   └── userData/            # User data management
│
├── constants/               # Feature constants
├── styles/
│   └── theme.scss           # Design tokens (spacing, colors, sizes)
└── utils/                   # Feature utilities
```

### Design System (`src/apps/experimental/styles/theme.scss`)

**Spacing** (8px scale):
- `$space-1` (4px) to `$space-8` (32px)

**Border Radius**:
- `$radius-sm` (8px), `$radius-md` (10px), `$radius-lg` (12px), `$radius-pill` (999px)

**Layout Sizes**:
- `$topbar-height` (52px)
- `$toolbar-link-height` (34px)
- `$toolbar-icon-size` (38px)

**Colors**:
- `$surface-topbar`, `$surface-menu`, `$surface-raised`
- `$border-subtle`, `$border-muted`, `$border-control`
- `$text-muted`
- `$hover-bg`, `$hover-bg-strong`, `$hover-bg-stronger`
- `$focus-ring`

**Effects**:
- `$blur-strong` (blur(14px))
- `$menu-shadow`

### Component Patterns

#### CSS Modules Pattern
```tsx
// Component.tsx
import styles from './Component.module.scss';

export const Component = () => (
    <div className={styles.root}>
        <div className={styles.content} />
    </div>
);
```

```scss
// Component.module.scss
@import '../../styles/theme';

.root {
    padding: $space-4;
    border-radius: $radius-md;
}

.content {
    color: $text-muted;
}
```

#### React Aria Components Pattern
```tsx
import { Button as RacButton, type ButtonProps as RacButtonProps } from 'react-aria-components';

export const CustomButton: FC<RacButtonProps> = (props) => (
    <RacButton {...props} className={styles.button} />
);
```

Common React Aria components in use:
- `Button`, `Link`
- `Menu`, `MenuItem`, `MenuTrigger`, `Popover`
- `DialogTrigger`, `Separator`

#### FocusRing Pattern
All React Aria interactive components should use `FocusRing` for keyboard focus indicators:

```tsx
import { Button as RacButton } from 'react-aria-components';
import { FocusRing } from '@react-aria/focus';

export const CustomButton = (props) => (
    <FocusRing focusRingClass="focus-ring">
        <RacButton {...props} />
    </FocusRing>
);
```

**Benefits**:
- Only shows focus ring for keyboard navigation (not mouse/touch)
- Cross-browser consistent behavior
- Shared `.focus-ring` global class defined in `theme.scss`

**Important**: Don't use `:focus-visible` in CSS for React Aria components - let FocusRing handle it

#### Barrel Exports Pattern
```ts
// components/index.ts
export * from './button';
export * from './icons';
export * from './media';
// ...
```

Use imports like:
```ts
import { Button, MediaCard, ItemGrid } from 'apps/experimental/components';
```

### Rules for Experimental App Development

1. **ALL new styles must use CSS Modules** - No global SCSS files

2. **CRITICAL: Use direct imports for components with CSS modules** - Barrel exports break HMR
   ```ts
   // ✅ Good - Direct import (enables CSS HMR)
   import { ToolbarLink } from 'apps/experimental/components/toolbar/ToolbarLink';
   import { MediaCard } from 'apps/experimental/components/media/MediaCard';

   // ❌ Bad - Barrel export (causes full page reload on CSS change)
   import { ToolbarLink, MediaCard } from 'apps/experimental/components';
   ```
   **Why?** When CSS modules change, Vite's HMR can't update through barrel exports (`export *`), causing full app reloads instead of instant style updates.

3. **Shared components go in `/components`** - Never duplicate
4. **Feature-specific components stay in feature** - Don't prematurely extract to shared
5. **Use design tokens** from `styles/theme.scss` - Don't hardcode values
6. **Use React Aria** for new interactive components
7. **Export styles for composition** when needed:
   ```ts
   export const MediaCardStyles = styles;  // Allow external styling
   ```

### Refactoring Status

See `/src/apps/experimental/REFACTOR_PLAN.md` for completed refactoring work:
- ✅ Consolidated component directories (deleted `shared/ui/`, `components/shared/`)
- ✅ Migrated to CSS Modules (DetailsRoute, HomeRoute)
- ✅ Component decomposition (extracted smaller components from large routes)
- ✅ Fixed all import paths to use barrel exports

## API Client Architecture

**Dual API system** - Transitioning from legacy to modern:

### Modern SDK (PREFERRED for new code)
```ts
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';

const { api, user } = useApi();
const userApi = getUserApi(api);
```

### Legacy API Client (avoid in new code)
```ts
const { __legacyApiClient__ } = useApi();
```

### API Context Hook
```ts
const { api, user, __legacyApiClient__ } = useApi();
```

**Important**: Use direct file imports for tree-shaking:
```ts
// ✅ Good
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';

// ❌ Bad (lint error)
import { getItemsApi } from '@jellyfin/sdk/lib/generated-client/api';
```

## Multi-App Structure

The codebase has 4 apps in `/src/apps/`:

1. **experimental** - Your custom frontend (ACTIVELY DEVELOPED)
2. **stable** - Upstream stable app (DO NOT MODIFY - allows upstream pulls)
3. **dashboard** - Admin dashboard (DO NOT MODIFY - allows upstream pulls)
4. **wizard** - Setup wizard (DO NOT MODIFY - allows upstream pulls)

### Shared Code (Outside `/apps`)

These directories are shared across all apps:
- `/src/components/` - Shared legacy components
- `/src/hooks/` - Custom React hooks (e.g., `useApi`, `useFetchItems`)
- `/src/utils/` - Utility functions
- `/src/types/` - TypeScript types
- `/src/themes/` - Theme definitions
- `/src/lib/` - Libraries (globalize, jellyfin-apiclient, navdrawer, scroller)

## TypeScript & Linting

### Key Settings
- **Base URL**: `src/` (allows absolute imports)
- **Indentation**: 4 spaces (enforced)
- **Quotes**: Single quotes (double for JSX via `jsx-quotes`)
- **Strict mode**: Enabled

### Import Rules
Must use direct imports for tree-shaking:
- `@jellyfin/sdk/lib/generated-client/*` → Use direct file imports
- `@mui/icons-material` → `@mui/icons-material/IconName`
- `@mui/material` → `@mui/material/ComponentName`

### React Rules
- ❌ No JSX bind (performance)
- ❌ No array index keys
- ✅ Hooks rules enforced
- ✅ Exhaustive deps warnings

## Styling

### CSS Modules (Experimental App)
- **4-space indentation**
- **Import theme tokens**: `@import '../../styles/theme';`
- **Colocate with components**: `Component.tsx` + `Component.module.scss`
- **BEM-style naming**: `.root`, `.content`, `.header`, etc.

### Stylelint
Run `npm run stylelint` to check styles. Key rules:
- 4-space indentation
- Lowercase property names
- No vendor prefixes
- No browser hacks (except in legacy code)

### Global Styles (Legacy Only)
Located in `/src/styles/` - **Do not add to these**. Use CSS Modules in experimental app.

## Testing

- **Framework**: Vitest with jsdom
- **Test files**: `*.test.ts` or `*.spec.*`
- **Coverage**: Run `npm run test` for reports
- **Examples**: See `/src/utils/*.test.ts`

## Build System (Vite)

### Key Info
- **Entry**: `src/index.html`
- **Dev Port**: 8080
- **Output**: `dist/`
- **Source Maps**: Enabled

### Build Constants
Available globally:
- `__COMMIT_SHA__`
- `__JF_BUILD_VERSION__`
- `__PACKAGE_JSON_VERSION__`
- `__USE_SYSTEM_FONTS__` (default: true for macOS/iOS focus)

## Browser Support

Wide compatibility (see `package.json` browserslist):
- Modern browsers (last 2 versions)
- Legacy Chrome (27, 38, 47, 53, 56, 63)
- iOS > 10
- Edge 18+

Polyfills configured for Promise, fetch, ResizeObserver, IntersectionObserver, etc.

## Platform-Specific Globals

Supports multiple platforms:
- **Tizen**: `tizen`, `webapis`
- **WebOS**: `webOS`
- **Jellyfin**: `ApiClient`, `Events`, `Hls`, `LibraryMenu`

## Important Notes

### Version Requirements
- Node.js: >=20.0.0
- npm: >=9.6.4 <11.0.0
- ❌ Yarn is no longer used

### Translation Files
- Only commit changes to `src/strings/en-us.json`
- Other languages managed via Weblate

### Deprecated Areas (DO NOT ADD)
- ❌ `src/controllers/` - Legacy controllers
- ❌ `src/scripts/` - Legacy scripts ("Here be dragons" 🐉)
- 🧹 `src/elements/` - Needs cleanup, avoid adding

### Design Philosophy

Keep it **clean and minimal**:
- Only add design tokens when actually used
- Prefer composition over duplication
- Extract shared components only when needed in 2+ places
- Keep components focused and small
