# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Orange Shrine is a Next.js application that creates a photo gallery dedicated to "Orange the cat" using the Are.na API. The app fetches images from the "orange-space" Are.na channel and displays them in a gallery format with a retro, monospace aesthetic.

## Development Commands

- `npm run dev` - Start development server (localhost:3000)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint checks

## Architecture

The application uses Next.js App Router with server-side rendering. Key components:

- **Data Source**: Are.na API via the `are.na` npm package
- **Main Page** (`src/app/page.tsx`): Server component that fetches and displays images
- **API Integration**: Uses Are.na channel "orange-space" to fetch image blocks
- **Styling**: Tailwind CSS with a retro aesthetic (monospace fonts, black borders, yellow backgrounds)
- **Deployment**: Configured for Vercel with ISR (revalidation every hour)

## Key Technical Details

- Uses TypeScript with strict mode enabled
- Path aliases configured: `@/*` maps to `./src/*`
- Server-side data fetching with error handling
- Image filtering (only displays blocks with `class === 'Image'`)
- ISR enabled with 3600 second revalidation
- Vercel function timeout set to 10 seconds for the main page