# Client Application

React 19 frontend application for the Project Management System.

## Tech Stack

- **React 19.2.0** - Latest React with improved performance
- **TypeScript 5.3.3** - Type safety
- **Vite 7.2.4** - Fast build tool and dev server
- **React Router DOM 7.1.3** - Client-side routing
- **Redux Toolkit 2.5.0** - State management
- **Axios 1.6.2** - HTTP client
- **Socket.io Client 4.6.1** - Real-time WebSocket connection
- **Vanilla CSS** - No CSS frameworks, pure CSS with custom properties

## Project Structure

```
src/
├── components/        # Reusable UI components
├── pages/            # Page components
├── layouts/          # Layout components (auth, main, etc.)
├── store/            # Redux store configuration
│   ├── slices/       # Redux slices
│   └── middleware/   # Custom middleware
├── services/         # API service modules
├── hooks/            # Custom React hooks
├── utils/            # Utility functions
├── types/            # TypeScript type definitions
├── styles/           # Global CSS files
│   ├── variables.css     # CSS custom properties
│   ├── reset.css         # CSS reset
│   ├── utilities.css     # Utility classes
│   └── animations.css    # CSS animations
├── context/          # React context providers
├── config/           # Configuration files
├── App.tsx           # Main App component
├── main.tsx          # Application entry point
└── index.css         # Main CSS import file
```

## Development

```bash
# Install dependencies
npm install

# Start development server (port 5173)
npm run dev

# Type checking
npm run typecheck

# Lint code
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

## CSS Architecture

This project uses **vanilla CSS only** with:
- CSS Custom Properties for theming
- Utility classes for common patterns
- Pure CSS animations
- No CSS-in-JS libraries

## Path Aliases

```typescript
import Button from '@components/Button';
import { useAuth } from '@hooks/useAuth';
import { api } from '@services/api';
```

## Environment Variables

See `.env.example` for required environment variables.
