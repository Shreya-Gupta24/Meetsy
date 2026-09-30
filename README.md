<div align="center">

# 🤝 Meetsy

### AI-Powered Learning Partner Matching Platform

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
[![Clerk](https://img.shields.io/badge/Clerk-Auth-6C47FF?style=for-the-badge&logo=clerk)](https://clerk.com/)
[![Hono](https://img.shields.io/badge/Hono-E36002?style=for-the-badge&logo=hono&logoColor=white)](https://hono.dev/)

**Meetsy** connects learners with compatible study partners using AI-driven matching. Create or join learning communities, set personalized learning goals, and let our AI engine analyze goal compatibility to match you with the ideal learning partner — then chat in real time with AI-generated conversation summaries.

[🌐 Live Demo](https://meetsy-app.vercel.app/) ·  [🐛 Report Bug](https://github.com/Shreya-Gupta24/Meetsy/issues)

</div>

---

## 📋 Table of Contents

- [About the Project](#about-the-project)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)

---

## 📖 About the Project

Meetsy is a full-stack web application that solves a common problem in online learning: **finding the right study partner**. Instead of browsing profiles manually, Meetsy uses an AI matching engine powered by Groq LLMs to semantically analyze learning goals and automatically pair learners whose objectives complement each other.

### The Problem

Online learners often struggle in isolation. Finding a partner with aligned learning goals, compatible skill levels, and complementary expertise across a community of hundreds is nearly impossible manually.

### The Solution

Meetsy automates the entire process:

1. **Users join communities** around shared topics (e.g., "Full-Stack Web Dev", "Machine Learning").
2. **Users define learning goals** with descriptive titles, descriptions, and tags.
3. **AI analyzes compatibility** — using semantic similarity (not just keyword matching) to find the top 3 most compatible partners.
4. **Matched partners chat** directly on the platform with real-time messaging.
5. **AI summarizes conversations** — extracting key points, action items, and next steps.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🔐 **Authentication** | Secure sign-up/sign-in via Clerk with subscription tier support (Free / Pro) |
| 🏘️ **Communities** | Create, join, search, leave, and delete learning communities |
| 🎯 **Learning Goals** | Define goals with titles, descriptions, and searchable tags per community |
| 🤖 **AI Matching** | Groq-powered LLM analyzes goals semantically and matches top 3 partners |
| 💬 **Real-Time Chat** | Persistent 1-on-1 messaging between matched partners (polling-based) |
| 📝 **AI Summaries** | One-click AI conversation summaries with key points, action items, and next steps |
| 🔍 **Ranked Search** | Multi-field search across communities and chats — name matches first, then tag matches |
| 🗑️ **Full CRUD** | Delete goals, clear chats, delete individual messages, remove matches — all with confirmation dialogs |
| 🌙 **Dark Mode** | System-aware theme switching via `next-themes` |
| 📱 **Responsive** | Mobile-first design with collapsible navigation |
| 💳 **Pro Tier** | Clerk-integrated subscription gating for advanced features |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **Next.js 16** | React framework (App Router) |
| **React 19** | UI rendering |
| **TypeScript** | Type safety |
| **Tailwind CSS 4** | Utility-first styling |
| **shadcn/ui** | Component library (Radix primitives) |
| **TanStack Query** | Server state management, caching, and polling |
| **Motion** | Animations and transitions |
| **Lucide React** | Icon library |
| **Sonner** | Toast notifications |

### Backend
| Technology | Purpose |
|---|---|
| **Hono** | Lightweight, type-safe API framework (mounted on Next.js catch-all route) |
| **Drizzle ORM** | Type-safe SQL query builder and schema management |
| **PostgreSQL** | Relational database |
| **Clerk** | Authentication, session management, and subscription billing |
| **Zod** | Runtime request validation |

### AI / ML
| Technology | Purpose |
|---|---|
| **Vercel AI SDK** | Unified LLM abstraction layer |
| **Groq** | High-speed inference provider (GPT-oss-20B model) |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                     Client (React)                   │
│  Pages: Dashboard │ Communities │ Chat │ Landing      │
│  State: TanStack Query (cache + polling)             │
└──────────────────────┬──────────────────────────────┘
                       │ fetch / hono RPC client
                       ▼
┌─────────────────────────────────────────────────────┐
│              API Layer (Hono on Next.js)              │
│  /api/communities  │  /api/matches  │  /api/user     │
│  /api/conversations │  Auth Middleware (Clerk)        │
└──────────────────────┬──────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
   ┌────────────┐ ┌─────────┐ ┌─────────┐
   │ PostgreSQL │ │  Clerk  │ │  Groq   │
   │ (Drizzle)  │ │  Auth   │ │   AI    │
   └────────────┘ └─────────┘ └─────────┘
```

---

## 🗄️ Database Schema

```mermaid
erDiagram
    users {
        uuid id PK
        text clerk_id UK
        text email
        text name
        text image_url
        text subscription_tier
        timestamp created_at
    }
    communities {
        uuid id PK
        text name
        text description
        text image_url
        uuid created_by_id FK
        timestamp created_at
    }
    community_members {
        uuid id PK
        uuid user_id FK
        uuid community_id FK
        timestamp joined_at
    }
    learning_goals {
        uuid id PK
        uuid user_id FK
        uuid community_id FK
        text title
        text description
        jsonb tags
        timestamp created_at
    }
    matches {
        uuid id PK
        uuid user1_id FK
        uuid user2_id FK
        uuid community_id FK
        text status
        timestamp created_at
    }
    conversations {
        uuid id PK
        uuid match_id FK
        timestamp last_message_at
        timestamp created_at
    }
    messages {
        uuid id PK
        uuid conversation_id FK
        uuid sender_id FK
        text content
        timestamp created_at
    }
    conversation_summaries {
        uuid id PK
        uuid conversation_id FK
        text summary
        jsonb action_items
        jsonb key_points
        jsonb next_steps
        timestamp generated_at
    }

    users ||--o{ community_members : "joins"
    users ||--o{ learning_goals : "sets"
    users ||--o{ messages : "sends"
    communities ||--o{ community_members : "has"
    communities ||--o{ learning_goals : "contains"
    communities ||--o{ matches : "generates"
    users ||--o{ matches : "participates"
    matches ||--o{ conversations : "creates"
    conversations ||--o{ messages : "contains"
    conversations ||--o{ conversation_summaries : "summarized_by"
```

---

## 📡 API Reference

All endpoints are prefixed with `/api` and require authentication (Clerk session) unless noted otherwise.

### 👤 Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/user` | Get current user profile with Pro status |

### 🏘️ Communities

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/communities` | List user's joined communities (supports `?search=`) |
| `GET` | `/api/communities/all` | Browse all communities with ranked search (name → tags) |
| `POST` | `/api/communities` | Create a new community (creator auto-joins) |
| `POST` | `/api/communities/:id/join` | Join a community |
| `POST` | `/api/communities/:id/leave` | Leave a community (membership removal only) |
| `DELETE` | `/api/communities/:id` | Delete community (creator) or leave (member) |

### 🎯 Learning Goals

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/communities/:communityId/goals` | Get user's goals in a community |
| `GET` | `/api/communities/goals` | Get all user's goals across communities |
| `POST` | `/api/communities/goals` | Create a new learning goal |
| `DELETE` | `/api/communities/goals/:goalId` | Delete a learning goal (owner only) |

### 🤖 AI Matching

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/matches/:communityId/aimatch` | Trigger AI matching for a community |
| `GET` | `/api/matches/:communityId/matches` | Get potential matches in a community |
| `GET` | `/api/matches/allmatches` | Get all user's matches (enriched with partner info, goals, community) |
| `PUT` | `/api/matches/:matchId/accept` | Accept a match and create a conversation |
| `DELETE` | `/api/matches/:matchId` | Remove a match and its conversation |

### 💬 Conversations & Messages

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/matches/:matchId/conversation` | Get or create a conversation for a match |
| `GET` | `/api/conversations/:id/messages` | Get all messages in a conversation |
| `POST` | `/api/conversations/:id/messages` | Send a message |
| `DELETE` | `/api/conversations/:id/messages` | Clear all messages (participants only) |
| `DELETE` | `/api/conversations/:id/messages/:msgId` | Delete a single message (sender only) |
| `POST` | `/api/conversations/:id/summarize` | Generate AI summary of conversation |
| `GET` | `/api/conversations/:id/summary` | Get latest conversation summary |

---

## 📁 Project Structure

```
meetsy/
├── app/
│   ├── (main)/                    # Authenticated layout group
│   │   ├── chat/
│   │   │   ├── [matchId]/         # Individual chat conversation page
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx           # Chat list (pending matches + active chats)
│   │   ├── communities/
│   │   │   ├── all/               # Browse & join communities
│   │   │   │   └── page.tsx
│   │   │   ├── layout.tsx         # Community layout with "Create" dialog
│   │   │   └── page.tsx           # User's communities + goals + AI matching
│   │   ├── dashboard/
│   │   │   └── page.tsx           # Stats overview, recent chats, communities
│   │   └── layout.tsx             # Main app shell (navbar, sidebar)
│   ├── api/
│   │   └── [[...route]]/
│   │       └── route.ts           # Hono catch-all API handler
│   ├── server/                    # Backend route modules (Hono apps)
│   │   ├── middleware/
│   │   │   └── auth-middleware.ts  # Clerk auth → user resolution
│   │   ├── communities.ts         # Community CRUD + search
│   │   ├── conversations.ts       # Messages + clear chat + delete
│   │   ├── learning-goals.ts      # Goals CRUD
│   │   ├── matches.ts             # AI matching + match lifecycle
│   │   └── users.ts               # User profile + Pro status
│   ├── sign-in/                   # Clerk sign-in page
│   ├── sign-up/                   # Clerk sign-up page
│   ├── layout.tsx                 # Root layout (providers, fonts)
│   ├── page.tsx                   # Landing page
│   └── globals.css                # Tailwind + custom styles
├── components/
│   ├── chat/
│   │   └── chat-interface.tsx     # Chat UI with clear/delete/summary
│   ├── communities/
│   │   ├── AddLearningGoal.tsx    # Goal creation form
│   │   └── AIMatching.tsx         # AI match trigger button
│   ├── dashboard/
│   │   └── StatsCard.tsx          # Reusable stats card
│   ├── landing/                   # Landing page sections
│   │   ├── HeroSection.tsx
│   │   ├── FeatureSection.tsx
│   │   ├── HowItWorks.tsx
│   │   ├── PricingSection.tsx
│   │   ├── CTASection.tsx
│   │   └── BackgroundGradient.tsx
│   ├── layout/
│   │   └── Navbar.tsx             # App navigation bar
│   ├── providers/
│   │   └── QueryProvider.tsx      # TanStack Query provider
│   └── ui/                        # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── confirm-dialog.tsx     # Reusable confirmation dialog
│       ├── input.tsx
│       ├── textarea.tsx
│       ├── badge.tsx
│       ├── avatar.tsx
│       ├── user-avatar.tsx
│       └── MotionDiv.tsx
├── db/
│   ├── index.ts                   # Database connection (pg + drizzle)
│   ├── schema.ts                  # Drizzle schema definitions + relations
│   └── seed.ts                    # Seed script for development data
├── hooks/                         # Custom React hooks
│   ├── useAIPartners.ts           # AI matching + match mutations
│   ├── useCommunities.ts          # Community queries + mutations
│   ├── useConversations.ts        # Messages + clear chat + delete message
│   ├── useGoals.ts                # Goal creation + deletion
│   └── useUser.ts                 # Current user query
├── lib/                           # Shared utilities
│   ├── ai.ts                      # AI matching + summary generation (Groq)
│   ├── api-client.ts              # Hono RPC client
│   ├── db-helper.ts               # Database utility functions
│   ├── user-utils.ts              # Clerk → DB user resolution
│   └── utils.ts                   # cn() utility
├── drizzle.config.ts              # Drizzle Kit configuration
├── next.config.ts                 # Next.js configuration
├── package.json
├── tsconfig.json
└── tailwind / postcss configs
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **PostgreSQL** database (local or hosted — e.g., Neon, Supabase)
- **Clerk** account (for authentication)
- **Groq** API key (for AI features)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Shreya-Gupta24/Meetsy.git
cd Meetsy

# 2. Install dependencies
npm install

# 3. Set up environment variables (see below)
cp .env.example .env.local

# 4. Push the database schema
npm run db:push

# 5. (Optional) Seed the database with sample data
npm run db:seed

# 6. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🔑 Environment Variables

Create a `.env.local` file in the project root:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/meetsy

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Groq AI
GROQ_API_KEY=gsk_...
```

---

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:push` | Push schema directly to database |
| `npm run db:seed` | Seed database with sample data |

---


<div align="center">

**Built with ❤️ by [Shreya Gupta](https://github.com/Shreya-Gupta24)**

⭐ Star this repo if you found it useful!

</div>