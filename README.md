# Chatterbox – Messaging App

A full-stack messaging app built for The Odin Project's Node.js messaging app assignment.

**Features**
- Sign up / log in (JWT, bcrypt, validation)
- Direct messages and group chats
- Editable profile (display name, bio, profile picture)
- Image messages (extra credit)
- Online status via `lastSeen` (extra credit)
- Near-real-time updates through polling (chat list every 5s, open chat every 3s)

**Stack:** Express, PostgreSQL, Prisma, JWT, multer + Cloudinary · React, React Router, Vite

## Project structure

```
messaging-app/
├── backend/
│   ├── prisma/schema.prisma
│   └── src/
│       ├── app.js              server entry
│       ├── db.js               Prisma client
│       ├── upload.js           multer + Cloudinary helper
│       ├── middleware/auth.js  JWT check + lastSeen update
│       └── routes/             auth.js, users.js, chats.js
└── frontend/
    └── src/
        ├── api.js, auth.jsx, App.jsx, main.jsx, index.css
        ├── pages/              Login, Signup, Chat, Profile
        └── components/         Avatar, MessagePane, NewChatModal
```

## Run it locally

You need Node 18+ and a PostgreSQL database.

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env        # then edit DATABASE_URL and JWT_SECRET
npx prisma migrate dev --name init
npm run dev                 # http://localhost:3000
```

Image uploads and avatars need a free [Cloudinary](https://cloudinary.com) account.
Put its `CLOUDINARY_URL` in `.env`. Without it, everything works except images
(the API answers with a clear "not configured" error).

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env        # VITE_API_URL=http://localhost:3000
npm run dev                 # http://localhost:5173
```

Create two accounts in two browsers (or one normal and one private window) to try it out.

## API

| Method | Route | Description |
|---|---|---|
| POST | `/auth/signup` | Create account |
| POST | `/auth/login` | Log in, returns token |
| GET / PATCH | `/me` | Read / update my profile (PATCH accepts multipart with `avatar`) |
| GET | `/users?search=` | Find users |
| GET | `/users/:id` | One user's profile |
| GET | `/chats` | My chats with last message |
| POST | `/chats` | `{ userIds: [..], name? }` – DM if one id, group if several |
| GET | `/chats/:id/messages?after=` | Messages (use `after` to fetch only new ones) |
| POST | `/chats/:id/messages` | Multipart: `content` and/or `image` |

All routes except `/auth/*` need `Authorization: Bearer <token>`. Chat routes also check
that you are a member of the chat.

## Deploying

1. **Database:** create a hosted PostgreSQL database (Neon, Supabase, Railway, etc.).
2. **Backend:** deploy the `backend` folder to a Node host (Render, Railway, Fly.io, etc.).
   - Build command: `npm install && npx prisma migrate deploy`
   - Start command: `npm start`
   - Env vars: `DATABASE_URL`, `JWT_SECRET`, `CLIENT_URL` (your frontend URL, no trailing slash), `CLOUDINARY_URL`
3. **Frontend:** deploy the `frontend` folder to Netlify, Vercel or Cloudflare Pages.
   - Build command: `npm run build`, publish directory: `dist`
   - Env var: `VITE_API_URL` set to your backend URL
   - `public/_redirects` already handles React Router refreshes on Netlify. On Vercel add a rewrite of all paths to `/index.html`.

Check each host's current free-tier limits before choosing; they change often.

## Ideas for next steps
- Friends list with a `Friendship` table (requester, addressee, status)
- Real-time updates with WebSockets (Socket.IO) instead of polling
- Unread counts, message deletion, typing indicators
