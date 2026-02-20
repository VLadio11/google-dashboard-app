# Google Analytics Dashboard

A React + Vite dashboard that brings together **Google Analytics 4** and **Google Search Console** data into a single view.

## Features

- **GA4**: Sessions, Active Users, New Users, Key Events & Conversions
- **GA4**: Top 10 pages by pageviews with session duration
- **GA4**: Sessions & users trend chart (line chart)
- **Search Console**: Clicks, Impressions, CTR, Average Position
- **Search Console**: Top 10 search queries
- **Date ranges**: Last 7, 28, or 90 days
- Auto-discovers your GA4 properties and Search Console sites via API
- OAuth 2.0 — sign in with any Google account, no backend required

---

## Setup

### 1. Create a Google Cloud project & OAuth credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (or select an existing one).
3. Enable these APIs (**APIs & Services → Library**):
   - **Google Analytics Data API**
   - **Google Analytics Admin API**
   - **Google Search Console API**
4. Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
5. Choose **Web application**.
6. Add your dev origin to **Authorized JavaScript origins**:
   - `http://localhost:5173`
7. Copy the **Client ID**.

### 2. Configure the app

```bash
cp .env.example .env
```

Edit `.env` and paste your Client ID:

```
VITE_GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
```

### 3. Install & run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### 4. Sign in & explore

1. Click **Sign in with Google** and grant read-only access.
2. Select your GA4 property and Search Console site from the dropdowns.
3. Click **Open Dashboard**.

---

## Project structure

```
src/
├── components/
│   ├── Dashboard.tsx        # Main dashboard with GA + SC sections
│   ├── Login.tsx            # Google sign-in page
│   ├── PropertySelector.tsx # Property / site picker
│   ├── MetricCard.tsx       # Single metric display card
│   ├── TrendChart.tsx       # Sessions/users line chart (recharts)
│   ├── TopPagesTable.tsx    # GA4 top pages table
│   ├── TopQueriesTable.tsx  # SC top queries table
│   └── LoadingSpinner.tsx   # Loading state
├── hooks/
│   ├── useAnalytics.ts      # GA4 data fetching
│   └── useSearchConsole.ts  # Search Console data fetching
├── services/
│   ├── analyticsApi.ts      # GA4 REST API calls
│   └── searchConsoleApi.ts  # Search Console REST API calls
├── types/index.ts           # TypeScript interfaces
├── utils/dates.ts           # Date formatting helpers
├── App.tsx                  # Root — manages auth & view state
├── main.tsx                 # Entry point with GoogleOAuthProvider
└── index.css                # Global styles
```

## Build for production

```bash
npm run build
```

Output goes to `dist/`. Deploy to any static host (Vercel, Netlify, GitHub Pages, etc.).

> **Note:** For production, add your production domain to **Authorized JavaScript origins** in Google Cloud Console.

## Notes

- All API calls are made directly from the browser using the OAuth access token — no backend server needed.
- Tokens expire after ~1 hour. If you see an auth error, just sign in again.
- Search Console data has a ~3-day delay by Google's design.
