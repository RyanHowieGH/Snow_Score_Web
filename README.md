# Snow Score Web

Snow Score Web is a web application designed for ski and snowboard competition management. Built with [Next.js](https://nextjs.org) and TypeScript, it streamlines the process of organizing, scoring, and administering events for athletes, judges, and organizers.

## Features

- **Role-based access control:** Secure authentication and permissions via [Clerk](https://clerk.com) (supports roles like Executive Director, Administrator, Head Judge, etc.)
- **Event Management:** Create, schedule, and administer competitions, heats, and rounds.
- **Athlete & Judge Management:** Add and manage athletes and judges, assign roles, and handle registrations.
- **Admin Panel:** Easy-to-use dashboard for managing users and event data.
- **Database Integration:** Uses PostgreSQL for persistent storage of competition data.
- **Automation Scripts:** Utilities for batch creation and cleanup of test users.
- **Docker Support:** Deploy and run the app in any environment using Docker.
- **Modern UI:** Uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) for automatic font optimization and [Geist](https://vercel.com/font).

## Getting Started

First, install dependencies and run the development server:

```bash
npm install
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the app in action.

## Environment Variables

You will need the following environment variables for full functionality (see `.env.example` or project documentation):

- Database connection string(s) (e.g., `POSTGRES_URL`)
- Clerk API keys (for authentication)
- Other app-specific secrets

## Docker

To build the Docker image:

```bash
docker build -t snow_score .
```

To run the container in production mode:

```bash
docker run -p 3000:3000 snow_score
```

## Scripts

- `scripts/create-users.cts`: Batch-create test users for development or QA.
- `scripts/cleanup-users.cts`: Remove test users from the system.

## License

MIT

---