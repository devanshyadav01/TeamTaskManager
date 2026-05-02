# TaskFlow Pro — Enterprise Edition

A real-time team collaboration and task management platform built with modern web technologies.

## ✨ Features

- **Role-Based Access** — Separate Admin and Member dashboards with tailored experiences
- **Real-Time Task Sync** — Tasks update across team members instantly via Supabase
- **Smart Assignment** — Assign tasks by role or designation
- **Built-In Chat & Notifications** — In-app comments and real-time notifications
- **Analytics Dashboard** — Track team productivity with interactive charts

## 🛠 Tech Stack

| Layer        | Technology                          |
|--------------|-------------------------------------|
| Framework    | React 18 + TypeScript               |
| Build Tool   | Vite 5                              |
| Styling      | Tailwind CSS + shadcn/ui            |
| State/Data   | TanStack React Query                |
| Backend      | Supabase (Auth, Database, Realtime) |
| Animations   | Framer Motion                       |
| Charts       | Recharts                            |
| Routing      | React Router v6                     |

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- npm or bun

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd teamflow-pro-main

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at **http://localhost:8080**.

### Environment Variables

Create a `.env` file in the project root with your Supabase credentials:

```env
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

## 📜 Available Scripts

| Command           | Description                        |
|--------------------|------------------------------------|
| `npm run dev`      | Start development server           |
| `npm run build`    | Production build                   |
| `npm run preview`  | Preview production build locally   |
| `npm run lint`     | Run ESLint                         |
| `npm run test`     | Run tests                          |
| `npm run test:watch` | Run tests in watch mode          |

## 📂 Project Structure

```
src/
├── components/     # Reusable UI components (shadcn/ui based)
├── hooks/          # Custom React hooks
├── integrations/   # Supabase client & API integrations
├── lib/            # Utility functions
├── pages/
│   ├── admin/      # Admin dashboard
│   ├── member/     # Member dashboard
│   ├── Auth.tsx    # Authentication page
│   └── Index.tsx   # Landing / entry page
└── test/           # Test files
```

## 📄 License

This project is private and proprietary.
