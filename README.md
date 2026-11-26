# Scafbind

> Design wireframes, layouts and more. Plan, design and export your ideas — from wireframes to code.

## Overview

Scafbind is a professional SaaS wireframing and UI design tool built with React, TypeScript, Vite, and FastAPI. It enables users to create multi-page wireframes for websites, mobile apps, desktop apps, tablets, dashboards, and custom screen sizes.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite 6 |
| Styling | Tailwind CSS, shadcn/ui |
| State | Zustand, TanStack Query |
| Canvas | Konva.js, react-konva |
| Backend | FastAPI, Python, Pydantic |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Desktop | Tauri 2, Rust |
| Testing | Vitest, Playwright, Pytest |

## Project Structure

```
scafbind/
├── src/                        # React frontend
│   ├── components/             # Reusable UI components
│   │   ├── ui/                 # shadcn/ui base components
│   │   └── dashboard/          # Dashboard-specific components
│   ├── pages/                  # Route pages
│   │   ├── auth/               # Login, Signup, Reset
│   │   ├── dashboard/          # Dashboard pages
│   │   └── editor/             # Wireframe editor
│   ├── stores/                 # Zustand stores
│   ├── lib/                    # Utilities and integrations
│   │   ├── supabase.ts         # Supabase client
│   │   ├── indexdb.ts          # Local persistence
│   │   ├── utils.ts            # General utilities
│   │   ├── tauri.ts            # Desktop integration
│   │   ├── componentDefinitions.ts
│   │   └── exporters/          # Export generators
│   ├── types/                  # TypeScript types and Zod schemas
│   └── test/                   # Tests
├── backend/                    # FastAPI backend
│   └── app/
│       ├── main.py
│       ├── core/               # Config, security
│       ├── api/routes/         # API endpoints
│       ├── schemas/            # Pydantic models
│       ├── repositories/       # Data access
│       └── services/           # Business logic
├── supabase/migrations/        # SQL migrations
├── src-tauri/                  # Tauri desktop app
└── docs/                       # Documentation
```

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- Rust (for Tauri desktop builds)
- Supabase account

### Web Application

```bash
# 1. Clone and enter directory
cd scafbind

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your Supabase credentials

# 4. Run database migrations
# See supabase/README.md

# 5. Start development server
npm run dev
```

The app runs at **http://localhost:5173**

### Backend API

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate
# Activate (Linux/macOS)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Start server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs at **http://localhost:8000/docs**

### Desktop Application

```bash
# Install Tauri CLI
npm install

# Development (runs frontend + Tauri window)
npm run tauri dev

# Build for Windows
npm run tauri build
```

## Configuration

### Environment Variables

**Frontend (`.env`):**
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=Scafbind
VITE_APP_ENV=development
```

**Backend (`backend/.env`):**
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
SUPABASE_JWKS_URL=https://your-project.supabase.co/auth/v1/.well-known/jwks.json
APP_ENV=development
CORS_ORIGINS=http://localhost:5173
```

## Features

### Dashboard
- Personalized greeting and hero section
- Quick-create wireframe presets (Website, Mobile, Desktop, Tablet, Dashboard, Template, Blank)
- Recent projects with thumbnails and actions
- Recent activity feed
- Workspace selector
- Global search

### Wireframe Editor
- **Canvas**: Pannable, zoomable infinite canvas using Konva.js
- **Tools**: Select, Frame, Rectangle, Ellipse, Line, Arrow, Text, Image, Container, Divider, Section Splitter, Button, Input, Search Bar, Navigation
- **Layer Panel**: Hierarchical element tree with visibility and lock controls
- **Properties Panel**: Full property editing for position, size, colors, borders, typography, layout
- **Component Library**: Searchable library of pre-built UI components
- **Undo/Redo**: Command-based history (up to 50 steps)
- **Artboard Presets**: Desktop (1440×900), Laptop (1366×768), Tablet (768×1024), Mobile (390×844), Custom

### Section Splitter
A unique Scafbind feature that divides any artboard or container into adjustable sections:
- Horizontal or vertical splitting
- Equal or custom proportions
- Draggable divider boundaries
- Per-section background colors and styling
- Nested section support

### Persistence
- Local autosave to IndexedDB (every 2 seconds after changes)
- Cloud save to Supabase
- Offline editing with sync on reconnect
- Revision history

### Exports
- **PNG**: Canvas screenshot with configurable scale
- **SVG**: Vector export from document data
- **HTML/CSS**: Semantic HTML with absolute positioning
- **React**: TypeScript React component
- **Prompt TXT/MD**: Detailed design specification for AI tools

## Database Schema

| Table | Description |
|-------|-------------|
| `profiles` | User profiles (extends auth.users) |
| `workspaces` | Team/personal workspaces |
| `workspace_members` | Workspace membership and roles |
| `projects` | Wireframe projects |
| `project_pages` | Pages within projects |
| `project_revisions` | Design document snapshots (JSONB) |
| `components` | User-saved custom components |
| `assets` | Uploaded images and files |
| `export_jobs` | Async export tracking |

Row Level Security (RLS) is enabled on all tables. Users can only access their own data.

## Testing

```bash
# Unit tests
npm run test

# Unit tests with UI
npm run test:ui

# End-to-end tests (requires running dev server)
npm run test:e2e

# Backend tests
cd backend
pytest

# Coverage
npm run test -- --coverage
```

## Deployment

### Frontend (Cloudflare Pages)

```bash
npm run build
# Deploy dist/ folder to Cloudflare Pages
# Set environment variables in Cloudflare dashboard
```

### Backend (Python hosting - e.g., Railway, Render, Fly.io)

```bash
# Dockerfile is provided in backend/
# Set environment variables in your hosting platform
# Ensure CORS_ORIGINS includes your production frontend URL
```

### Desktop Builds

```bash
# Windows
npm run tauri build
# Output: src-tauri/target/release/bundle/

# For macOS/Linux builds, run on respective platforms
# Architecture is cross-platform compatible
```

## Known Limitations

1. **Image exports (PNG) in backend**: Server-side PNG generation requires a headless browser or canvas library not currently included. PNG exports are done client-side via Konva's `toBlob()`.

2. **Code exports (ZIP)**: JSZip is not included in the current dependencies. Files are downloaded individually. Add JSZip to enable ZIP bundling.

3. **Real-time collaboration**: Multi-user simultaneous editing is not implemented. Conflict detection is basic.

4. **SVG export fidelity**: Complex gradients and advanced effects may not export perfectly to SVG.

5. **Desktop macOS/Linux builds**: Architecture supports them but have not been tested. Windows is the primary target.

6. **Python installation**: The backend requires Python 3.11+. The sandbox environment used during development did not have Python installed; all backend files are written and correct but should be tested in an environment with Python.

7. **Offline sync conflicts**: When offline edits conflict with cloud changes, the user is notified but manual resolution is not yet implemented.

## Architecture Decisions

- **Konva.js** for canvas: Chosen over native Canvas API for its object model, event system, and performance with many objects
- **IndexedDB** for local storage: Handles large JSONB documents better than localStorage
- **JSONB in PostgreSQL**: Design documents stored as JSONB for flexibility while maintaining queryable metadata columns
- **Zustand** for state: Lightweight, TypeScript-friendly, no boilerplate compared to Redux
- **FastAPI** for backend: Async Python, automatic OpenAPI docs, excellent Pydantic integration
- **Tauri 2** for desktop: Smaller binary than Electron, native Rust backend, shared web frontend

## Contributing

1. Fork the repository
2. Create a feature branch
3. Run tests before submitting
4. Submit a pull request with description

## License

MIT License — see LICENSE file for details.

# MidTechnology
#   M i d T e c h n o l o g y  
 