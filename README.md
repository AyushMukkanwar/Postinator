# 🚀 Postinator - Social Media Automation Tool

[![Build Status](https://img.shields.io/github/actions/workflow/status/your-repo/ci.yml?branch=main&style=for-the-badge)](https://github.com/your-repo/your-project/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)](http://makeapullrequest.com)

Uploader is a powerful, full-stack monorepo application designed to automate and schedule posts to your social media accounts. Built with a modern tech stack including Next.js, Nest.js, and Prisma, it provides a seamless experience for managing your social media presence.

<!--
***ADD A SCREENSHOT OR GIF OF YOUR RUNNING APPLICATION HERE!***
![App Screenshot](link-to-your-screenshot.png)
-->

---

## ✨ Features

- ✅ **Multi-Platform Support:** Easily connect and manage multiple social media accounts (starting with Twitter).
- schedule **Post Scheduling:** Create and schedule posts for any time in the future.
- 🕒 **Asynchronous Publishing:** A robust background worker handles the posting process reliably.
- 🔐 **Secure Authentication:** User authentication is handled securely via Supabase.
- 🗂️ **Post History:** View a complete history of all published content.
- 🌓 **Light & Dark Mode:** A sleek, modern UI with theme support.

---

## 🛠️ Tech Stack

This project is a monorepo managed with **pnpm** and **Turborepo**.

| Area              | Technology                                                                                                                                                             |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend**      | [**Next.js**](https://nextjs.org/), [**React**](https://reactjs.org/), [**TypeScript**](https://www.typescriptlang.org/), [**Tailwind CSS**](https://tailwindcss.com/) |
| **Backend API**   | [**Nest.js**](https://nestjs.com/), [**TypeScript**](https://www.typescriptlang.org/)                                                                                  |
| **Worker**        | [**Nest.js**](https://nestjs.com/) (for background jobs)                                                                                                               |
| **Database**      | [**Prisma**](https://www.prisma.io/) (ORM), [**PostgreSQL**](https://www.postgresql.org/)                                                                              |
| **Auth**          | [**Supabase**](https://supabase.io/)                                                                                                                                   |
| **Caching/Queue** | [**Redis**](https://redis.io/)                                                                                                                                         |
| **Tooling**       | [**Turborepo**](https.turbo.build/repo), [**Docker**](https://www.docker.com/), [**ESLint**](https://eslint.org/), [**Prettier**](https://prettier.io/)                |

---

## 🏗️ Project Structure

The monorepo is organized into `apps` and `packages`.

```
/
├── apps/
│   ├── api/          # Nest.js backend API (with its own Prisma schema)
│   ├── web/          # Next.js frontend
│   └── post-worker/  # Nest.js worker (with its own Prisma schema)
│
└── packages/
    ├── eslint-config/      # Shared ESLint configuration
    └── typescript-config/  # Shared TypeScript configuration
```

---

## 🚀 Getting Started

Follow these instructions to set up and run the project on your local machine.

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/en/) (v18 or later)
- [pnpm](https://pnpm.io/installation)
- [Docker](https://www.docker.com/get-started) and [Docker Compose](https://docs.docker.com/compose/install/)

### 1. Clone the Repository

```bash
git clone https://github.com/your-repo/your-project.git
cd your-project
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set Up Environment Variables

This project requires environment variables for the API, the worker, and the frontend. You will find `.env.sample` files in `apps/api` and `apps/post-worker`.

1.  **Create a Supabase Project:** Go to [Supabase](https://supabase.com/) and create a new project to get your API URL and keys.
2.  **Copy Sample Files:**
    ```bash
    cp apps/api/.env.sample apps/api/.env
    cp apps/post-worker/.env.sample apps/post-worker/.env
    ```
3.  **Fill in the Variables:** Open the new `.env` files and add your credentials. The most important ones are:
    - `DATABASE_URL`: Your PostgreSQL connection string (you can get this from Supabase or a local Postgres instance).
    - `SUPABASE_URL`: Your Supabase project URL.
    - `SUPABASE_ANON_KEY`: Your Supabase project `anon` key.
    - `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`: Connection details for Redis.

### 4. Set Up the Database

Run the Prisma migrations to set up your database schema. This command needs to be run for both the `api` and `post-worker` apps.

```bash
pnpm --filter api prisma migrate dev
pnpm --filter post-worker prisma migrate dev
```

### 5. Run the Application

You can run the entire stack (database, Redis, and all apps) using Docker Compose, or run the services manually.

#### Option 1: Local Development (Recommended)

1.  **Start Background Services (Redis):**

    ```bash
    docker-compose -f docker-compose.redis.yml up -d
    ```

    _(Ensure your `DATABASE_URL` points to your Supabase instance or another running Postgres database)._

2.  **Start All Applications:**
    This command uses Turborepo to run the `dev` script in all `apps/*` simultaneously.

    ```bash
    pnpm dev
    ```

3.  **Access the Apps:**
    - **Web Frontend:** [http://localhost:3000](http://localhost:3000)
    - **API Server:** [http://localhost:3001](http://localhost:3001)

#### Option 2: Full Dockerized Development

The `docker-compose.dev.yml` is configured to build and run the entire stack in containers.

1.  **Build and Start All Services:**
    ```bash
    docker-compose -f docker-compose.dev.yml up --build
    ```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/your-repo/your-project/issues).

## 📄 License

This project is [MIT](./LICENSE) licensed.
