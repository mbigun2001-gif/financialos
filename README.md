# Financial OS

A premium, dark-themed Financial Operating System for high-performance entrepreneurs. Built with Next.js 14, featuring a Stripe Dashboard and Linear-inspired design.

## Features

- **Goal Engine**: Set monthly revenue goals with real-time gap calculation
- **Income Tracker**: Multi-source income tracking (Shopify, Mentoring, Ferrum Solid)
- **Expense Manager**: Categorize by Business and Personal with burn rate calculation
- **Visual Dashboards**: Revenue trends, income source breakdowns, and progress tracking
- **Personal Finance Integration**: Track savings goals and investment potential

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Components**: Radix UI / Shadcn
- **Icons**: Lucide React
- **Charts**: Recharts

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

The app will automatically redirect to `/dashboard`.

## Project Structure

```
financial-os/
├── app/
│   ├── dashboard/       # Dashboard page and layout
│   ├── globals.css      # Global styles with dark theme
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Home page (redirects to dashboard)
├── components/
│   ├── ui/              # Shadcn/UI components
│   ├── sidebar.tsx      # Navigation sidebar
│   └── metric-card.tsx  # Reusable metric card component
└── lib/
    └── utils.ts         # Utility functions
```

## Dashboard Features

The main dashboard displays 4 key metrics:

1. **Current Revenue**: Total revenue for the current month
2. **Monthly Goal Progress**: Progress bar showing completion percentage
3. **Burn Rate**: Fixed costs per month
4. **Gap to Goal**: Remaining amount needed with daily target calculation

## Next Steps

- [ ] Implement income tracking with multiple sources
- [ ] Add expense management functionality
- [ ] Create visual charts using Recharts
- [ ] Add goal setting interface
- [ ] Implement data persistence (localStorage or database)
# financialos
