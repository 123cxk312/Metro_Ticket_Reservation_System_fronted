# Metro Ticket Reservation System - Frontend

Vue 3 and TypeScript frontend for the metro ticket reservation system.

## Technology

- Vue 3
- TypeScript
- Vite
- Pinia
- Vue Router
- Element Plus
- Axios
- Lucide Vue

## Setup

```bash
npm install
npm run dev
```

Frontend:

```text
http://localhost:8080
```

Backend proxy:

```text
/api -> http://localhost:8088
```

## Scripts

```text
npm run dev
npm run build
npm run test:unit
npm run lint
```

## Routes

```text
/login
/register
/tickets
/orders
/assistant
/admin/tickets
/admin/refunds
```

## Environment

The default API base URL is `/api`. To override it, create a local environment
file with:

```text
VITE_API_BASE_URL=/api
```
