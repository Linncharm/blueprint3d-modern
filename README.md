# Blueprint3D

A modernized 3D interior design application built on Three.js that allows users to create floor plans and design interior spaces.

**[🚀 Live Demo](https://blueprint3d-modern.vercel.app/)**

This project is a comprehensive modernization of [furnishup/blueprint3d](https://github.com/furnishup/blueprint3d), originally created 9 years ago.

## Features

- **2D Floor Planning**: Create and edit floor plans with walls, doors, and windows
- **3D Visualization**: Real-time 3D rendering of interior spaces
- **Item Placement**: Add and arrange furniture and decorative items
- **Interactive Design**: Modify layouts and items in both 2D and 3D views

## Screenshots

<p align="center">
  <img src="docs/1.png" alt="Floor Plan Editor" width="100%">
  <br><em>2D Floor Plan Editor</em>
</p>

<p align="center">
  <img src="docs/2.png" alt="3D Design View" width="100%">
  <br><em>3D Design View</em>
</p>

<p align="center">
  <img src="docs/3.png" alt="Item Selection" width="100%">
  <br><em>Item Selection and Placement</em>
</p>

## Modernization Updates

This fork includes significant modernization from the original project:

- **Three.js**: Upgraded from r69 to r181
- **Modern JavaScript**: Migrated to ES6+ syntax with TypeScript support
- **Build System**: Replaced Grunt with Vite for faster development
- **Dependencies**: Removed jQuery dependency from core
- **Code Quality**: Refactored with modern patterns and conventions

## Demos

This project includes two demo applications:

### Vite Demo (Original)

- **Location**: `example/` directory
- **Tech Stack**: Vanilla JavaScript/TypeScript + Vite
- **Features**: Lightweight, fast development with HMR
- **Use Case**: Simple integration example

### Next.js Demo (Modern)

- **Location**: `app/` directory
- **Tech Stack**:
  - **Framework**: Next.js 16 with App Router
  - **React**: React 19 with Server/Client Components
  - **Styling**: Tailwind CSS 4 with PostCSS
  - **Build Tool**: Turbopack (Next.js built-in)
  - **3D Engine**: Three.js 0.181
  - **UI Components**: Shadcn/ui with Radix UI primitives
  - **Icons**: Lucide React
  - **Internationalization**: next-intl with English and Chinese support
  - **Storage**: IndexedDB for local floorplan persistence
  - **TypeScript**: Full type safety
- **Features**:
  - Modern React architecture with hooks
  - Component-based UI (Sidebar, Controls, Context Menu, Dialogs)
  - Responsive design with Tailwind CSS
  - Multi-language support (English/Chinese)
  - Local floorplan storage with IndexedDB
  - Top-down thumbnail generation for saved floorplans
  - Dimension unit switching (Imperial/Metric)
  - Server-side rendering ready
  - Hot module replacement with Turbopack
- **Use Case**: Production-ready application template

## Getting Started

### Prerequisites

- Node.js >= 20
- pnpm

### Installation

```bash
pnpm install
```

### Development

#### Option 1: Vite Demo (Original)

Start the Vite development server:

```bash
pnpm dev
```

The application will open at `http://localhost:5173`

#### Option 2: Next.js Demo (Modern)

Start the Next.js development server with Turbopack:

```bash
pnpm dev:nextjs
```

The application will open at `http://localhost:3000`

### Build

#### Build Vite Demo

Build for production:

```bash
pnpm build:modern
```

The output will be in the `dist` directory.

Preview the build:

```bash
pnpm preview
```

#### Build Next.js Demo

Build Next.js for production:

```bash
pnpm build:nextjs
```

Start the production server:

```bash
pnpm start:nextjs
```

## Project Structure

```
blueprint3d/
├── src/              # Core library source code
│   ├── core/         # Utilities and configuration
│   ├── floorplanner/ # 2D floor plan editor
│   ├── items/        # Furniture and item types
│   ├── model/        # Data models for floorplan and items
│   └── three/        # 3D rendering and controls
├── example/          # Vite demo application
│   ├── index.html    # Entry point
│   ├── js/           # Application scripts
│   ├── models/       # 3D model assets
│   └── textures/     # Texture assets
├── app/              # Next.js demo application
│   ├── app/          # Next.js app directory
│   │   ├── [locale]/     # Locale-based routing
│   │   │   ├── layout.tsx    # Locale layout
│   │   │   └── page.tsx      # Home page
│   │   ├── layout.tsx    # Root layout
│   │   └── globals.css   # Global styles
│   ├── components/   # React components
│   │   ├── ui/           # UI components (Button, Input, Dialog, Tabs)
│   │   ├── Blueprint3DApp.tsx      # Main app component
│   │   ├── Sidebar.tsx             # Sidebar with controls
│   │   ├── MainControls.tsx        # Main toolbar
│   │   ├── FloorplannerControls.tsx # 2D editor controls
│   │   ├── CameraControls.tsx      # 3D view controls
│   │   ├── ItemsList.tsx           # Furniture items list
│   │   ├── TextureSelector.tsx     # Wall/floor texture picker
│   │   ├── ContextMenu.tsx         # Item context menu
│   │   ├── Settings.tsx            # Settings panel
│   │   ├── MyFloorplans.tsx        # Saved floorplans list
│   │   ├── SaveFloorplanDialog.tsx # Save dialog
│   │   └── ViewToggle.tsx          # 2D/3D view toggle
│   ├── i18n/         # Internationalization
│   │   ├── routing.ts    # i18n routing config
│   │   └── request.ts    # i18n request handler
│   ├── messages/     # Translation files
│   │   ├── en.json       # English translations
│   │   └── zh.json       # Chinese translations
│   ├── services/     # Service layer
│   │   └── storage.ts    # IndexedDB storage service
│   ├── lib/          # Utilities
│   ├── public/       # Static assets
│   │   ├── models/       # 3D models and thumbnails
│   │   ├── rooms/        # Room textures
│   │   └── constants/    # Configuration files
│   ├── middleware.ts # i18n middleware
│   └── next.config.ts    # Next.js configuration
├── dist/             # Vite production build output
└── legacy/           # Original blueprint3d code
```

## TODO

- [ ] **Support GLB/GLTF Import** - Allow users to import their own 3D models into the scene - Support scaling, rotation, and material adjustments

- [x] **Unit Conversion & Display** - ✅ Implemented dimension unit switching (Imperial ft/in, Metric m/cm/mm) - ✅ Settings panel with unit selector - ✅ Global unit conversion throughout the app

- [x] **Local Storage & Floorplan Management** - ✅ Save and load floorplans with IndexedDB - ✅ Auto-generated top-down thumbnails for saved floorplans - ✅ My Floorplans panel with preview, load, download, and delete

- [x] **Internationalization (i18n)** - ✅ Multi-language support with next-intl - ✅ English and Chinese translations - ✅ Language switcher in settings - ✅ Locale-based routing

- [ ] **Undo/Redo System for 3D Mode** - Implement history tracking for 3D scene modifications - Support undo/redo for item placement, movement, rotation, and deletion - Keyboard shortcuts (Ctrl+Z / Ctrl+Y)

## Development Workflow

1. **Install dependencies**: `pnpm install`
2. **Start dev server**: `pnpm dev`
3. **Make changes**: Edit files in `src/` or `example/`
4. **Test changes**: Changes will hot-reload in the browser
5. **Build for production**: `pnpm build:modern`

## Deploy to GitHub Pages

### Automatic Deployment

This project is configured to automatically deploy to GitHub Pages when you push to the `main` branch.

**Setup Steps:**

1. Go to your GitHub repository settings
2. Navigate to **Pages** section (Settings → Pages)
3. Under **Build and deployment**, select:
   - **Source**: GitHub Actions
4. Push your changes to the `main` branch
5. The site will be available at: `https://yourusername.github.io/repository-name/`

The GitHub Actions workflow (`.github/workflows/deploy.yml`) will automatically:

- Install dependencies with pnpm
- Build the project
- Deploy to GitHub Pages

### Manual Deployment

If you prefer to deploy manually:

```bash
# Build the project
pnpm build:modern

# Deploy the dist folder to gh-pages branch
# (requires gh-pages package: pnpm add -D gh-pages)
npx gh-pages -d dist
```

## Legacy Build

The project still includes the original Grunt build system for compatibility:

```bash
pnpm build:old
```

## License

This project is open-source! See LICENSE.txt for more information.
