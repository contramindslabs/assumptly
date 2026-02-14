# Assumptly

## Overview
Assumptly is a web-based AI tool that analyzes early-stage pitch decks (PDF) to extract and stress-test strategic assumptions. It identifies fragile logic in market sizing, adoption expectations, defensibility, financial projections, and execution claims.

Tagline: "Because investors question everything."

## Current State
MVP complete with:
- PDF upload and text extraction
- AI-powered assumption extraction using OpenAI (gpt-5-mini)
- 6 assumption categories: Market, Customer, Product, Competition, Financial, Execution
- 3 risk levels: High, Medium, Low
- Stress-test questions for each assumption
- Dashboard to view past analyses
- Dark mode support

## Architecture
- **Frontend**: React + Vite, Tailwind CSS, shadcn/ui components, wouter routing, TanStack Query
- **Backend**: Express.js with multer for file uploads, pdf-parse for PDF text extraction
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: OpenAI via Replit AI Integrations (gpt-5-mini model)

## Key Files
- `shared/schema.ts` - Drizzle schema for decks and assumptions tables
- `server/routes.ts` - API endpoints (upload, CRUD for decks/assumptions)
- `server/analyze.ts` - OpenAI analysis logic
- `server/storage.ts` - Database storage interface
- `server/db.ts` - Database connection
- `client/src/pages/upload.tsx` - Main upload page
- `client/src/pages/analysis.tsx` - Analysis results page
- `client/src/pages/dashboard.tsx` - Deck history/management

## API Routes
- `POST /api/decks/upload` - Upload PDF (multipart form, field: "deck")
- `GET /api/decks` - List all decks
- `GET /api/decks/:id` - Get single deck
- `GET /api/decks/:id/assumptions` - Get assumptions for a deck
- `DELETE /api/decks/:id` - Delete deck and its assumptions

## User Preferences
- Inter font family for UI
- Clean, professional design with subtle card borders
- Dark/light mode toggle
