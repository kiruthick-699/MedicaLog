# MedicaLog

A Patient-Centered Chronic Care Monitoring System

## Overview

MedicaLog is a Next.js application designed to help patients manage their chronic care routines. It provides medication scheduling, adherence tracking, and condition awareness without medical advice or diagnosis.

## Features

- **Medication Management** - Set up and track medication routines with time-based reminders
- **Onboarding Flow** - Step-by-step setup for new users
- **Condition Tracking** - Optional reference tracking of diagnosed conditions
- **Server-First Architecture** - Built with Next.js App Router and Server Components

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Available Routes

- `/` - Welcome screen
- `/onboarding` - Onboarding flow (step-based)
- `/dashboard` - Dashboard (placeholder)

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Welcome page
│   ├── onboarding/        # Onboarding flow
│   └── dashboard/         # Dashboard pages
├── components/
│   ├── ui/                # Stateless UI components
│   ├── client/            # Client-only interactive components
│   ├── server/            # Server-only helpers
│   └── dashboard/         # Dashboard-specific components
└── lib/
    ├── data/              # Data preparation functions
    ├── logic/             # Domain logic and models
    └── validation/        # Type guards and validation schemas
```

## Development

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

## Technology Stack

- **Framework** - Next.js 16 with App Router
- **Language** - TypeScript (strict mode)
- **Styling** - Tailwind CSS v4
- **Linting** - ESLint

## Architecture Principles

- **Server-First** - Default to Server Components
- **No State Libraries** - Simple React state management only
- **Type-Safe** - Full TypeScript coverage
- **Modular** - Clear separation of concerns
- **No Barrel Exports** - Direct imports from files

## Important Disclaimer

This application is for informational purposes only and does not provide medical advice, diagnosis, or treatment recommendations. Always consult with healthcare professionals for medical decisions.

## License

MIT
