# Query Analyzer Frontend

React + TypeScript + Vite dashboard for the Query Analyzer performance monitoring system.

## Overview

The frontend provides a modern, real-time dashboard for:
- Viewing query logs and detected performance issues
- Managing applications and SDK keys
- Configuring alert rules
- Real-time data streaming via WebSockets
- AI-powered query optimization suggestions

## Tech Stack

- React 18
- TypeScript
- Vite
- TailwindCSS
- Lucide Icons
- Sonner (toast notifications)
- React Router
- STOMP WebSocket client

## Prerequisites

- Node.js 18+
- Backend API running on port 8080

## Installation

```bash
npm install
```

## Running the Development Server

```bash
npm run dev
```

The dashboard will be available at `http://localhost:5173`

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Pages

- `/login` - User login
- `/register` - User registration
- `/` - Dashboard home (query overview)
- `/queries` - Query explorer with filtering
- `/alerts` - Alert rules management
- `/apps` - Application management

## Features

### Real-time Updates

Uses WebSocket (STOMP) to receive real-time query events and updates from the backend.

### Authentication

Uses HttpOnly JWT cookies for secure authentication. Login/registration endpoints communicate with the backend API.

### Query Explorer

- Filter queries by status (SLOW, FAST, N+1)
- View execution plans
- Get AI-powered explanations
- Search by SQL text

### Alert Rules

- Create custom alert rules based on metrics
- Configure thresholds for critical issues, slow queries, average duration
- Set email notification channels
- Enable/disable rules

## API Configuration

The API base URL is configured in `src/api/axiosClient.ts`:

```typescript
const API_BASE_URL = 'http://localhost:8080/api/v1';
```

Update this if your backend is running on a different host or port.

## Port

- Frontend dev server: 5173
