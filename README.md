# WildGuard Frontend

Next.js-based dashboard for the WildGuard wildlife early-warning system.

## Features

- Real-time animal tracking map (Leaflet + OpenStreetMap)
- Animal details panel
- Active alerts dashboard
- Risk level visualization
- Alert acknowledgment interface

## Quick Start

```bash
# Install dependencies
npm install

# Set environment variables
export NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Run development server
npm run dev
```

Visit http://localhost:3000

## Project Structure

```
app/
├── components/       # React components
├── services/         # API client
├── page.tsx         # Main dashboard
└── layout.tsx       # Layout template
```

## Components

- **Map**: Leaflet-based map with OpenStreetMap tiles
- **AnimalMarker**: Animal position marker with popup
- **AnimalDetails**: Side panel showing selected animal info
- **AlertPanel**: Active alerts list with severity indicators

## Dependencies

- Next.js 14.0.0
- React 18.2.0
- TypeScript 5.3.3
- Leaflet 1.9.4
- Axios 1.6.2

## License

MIT
