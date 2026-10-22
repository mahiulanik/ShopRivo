# ShopRivo

> A full-stack e-commerce platform with a modern customer storefront, role-based administration, PostgreSQL persistence, Stripe and cash-on-delivery checkout, Cloudinary media management, and AI-assisted product discovery.

## Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Frontend Routes](#frontend-routes)
- [REST API Reference](#rest-api-reference)
- [Database Schema](#database-schema)
- [Authentication and Authorization](#authentication-and-authorization)
- [Checkout and Payments](#checkout-and-payments)
- [Media and AI Search](#media-and-ai-search)
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)
- [Deployment Notes](#deployment-notes)
- [Implementation Notes and Limitations](#implementation-notes-and-limitations)
- [Author](#author)

## Overview

ShopRivo is a two-part application: a React/Vite storefront and administration interface backed by an Express REST API and PostgreSQL database. Customers can browse and search products, manage carts and wishlists, manage addresses, place orders, and track purchases. Privileged roles can manage the catalog and operational resources through protected administration routes.

The codebase separates Express route handlers, controllers, services, SQL table initialization, and configuration. The frontend separates API clients, context providers, reusable components, route guards, and customer/admin pages.

## Core Features

### Customer Storefront

- Product browsing, product details, category discovery, and search/filtering
- Product image and color media presentation
- Shopping cart and wishlist using dedicated React contexts
- Account registration, login, Google sign-in, and profile editing
- Password recovery, password change, and account management
- Saved shipping addresses
- Checkout with Stripe or cash on delivery (COD)
- Coupon validation and discount handling
- Order history, order detail, and order success views
- Product ratings and reviews
- AI-assisted product search via backend integration
- Responsive layouts, loading states, toast feedback, and route-level code splitting

### Administration

- Dashboard metrics and reporting visualizations
- Product creation, updates, deletion, and image uploads
- Category management
- Order listing, details, and status updates
- Customer listing, role changes, and user deletion
- Coupon management
- Review moderation
- Media library browsing and deletion
- Admin and Uploader permissions enforced by backend middleware

## Architecture

```text
                   Browser / Customer / Admin
                              |
                   React 18 + Vite + Tailwind
                              |
                 Axios client / React contexts
                              |
                        REST API /api
                              |
                      Express 5 backend
                              |
            Routes -> Controllers -> Services
                 |          |          |
                 |       JWT/Auth   SQL queries
                 |                     |
                 |                PostgreSQL
                 |
          External integrations
           |      |       |       |
         Stripe  Google Cloudinary Gemini
         payments OAuth   images    AI search
```

**Backend conventions:** `routes/` maps endpoints, `controllers/` handles HTTP requests, `services/` implements domain operations, `models/` defines SQL table setup, and `middlewares/` contains authentication, error handling, and upload middleware.

## Technology Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 18, Vite 5, JavaScript (JSX) |
| UI | Tailwind CSS 3, Lucide React |
| Routing | React Router DOM 6 |
| HTTP | Axios |
| Visualization | Recharts |
| Backend | Node.js, Express 5 (ES modules) |
| Database | PostgreSQL via `pg` (SQL queries, not an ORM) |
| Authentication | JWT, bcrypt, refresh-session persistence, Google OAuth |
| Payments | Stripe server SDK and Stripe.js / React Stripe.js |
| Media | Cloudinary, Multer |
| Email | Resend / Nodemailer dependencies and email utilities |
| Security | Helmet, HPP, CORS, cookie-parser |
| AI | Gemini-backed product search integration |

## Project Structure

```text
ShopRivo/
├── backend/
│   ├── app.js                  # Express configuration and API mounts
│   ├── server.js               # Database connection and HTTP listener
│   ├── config/                 # PostgreSQL, Cloudinary, Stripe, Google OAuth
│   ├── controllers/            # HTTP handlers by resource
│   ├── middlewares/            # Auth, errors, uploads
│   ├── models/                 # PostgreSQL CREATE TABLE definitions
│   ├── routes/                 # REST endpoints
│   ├── services/               # Business logic and SQL operations
│   ├── utils/                  # DB setup, email, JWT, AI, seed helpers
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── public/                 # Banners and favicon
│   ├── src/
│   │   ├── api/                # Axios and resource-specific clients
│   │   ├── components/
│   │   │   ├── admin/
│   │   │   ├── auth/
│   │   │   ├── client/
│   │   │   └── common/
│   │   ├── context/            # Auth, Cart, Wishlist, Toast
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   └── client/
│   │   ├── routes/             # Authorization guards
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   ├── vite.config.js
│   ├── vercel.json
│   └── package.json
└── .gitignore
```

## Frontend Routes

The following paths are declared in `frontend/src/App.jsx`. Dynamic segments are prefixed with `:`. Route guards protect checkout, orders, account, and administration pages.

| Path | Purpose / access |
| --- | --- |
| `/admin` | Administration (role-guarded) |
| `products` | Storefront / auth flow |
| `product/add` | Storefront / auth flow |
| `product/:productId/edit` | Storefront / auth flow |
| `orders` | Storefront / auth flow |
| `orders/:orderId` | Storefront / auth flow |
| `customers` | Storefront / auth flow |
| `admins` | Storefront / auth flow |
| `category` | Storefront / auth flow |
| `coupons` | Storefront / auth flow |
| `coupon/add` | Storefront / auth flow |
| `reviews` | Storefront / auth flow |
| `media` | Storefront / auth flow |
| `/` | Storefront / auth flow |
| `/shop` | Storefront / auth flow |
| `/product/:productId` | Storefront / auth flow |
| `/about` | Storefront / auth flow |
| `/contact` | Storefront / auth flow |
| `/password/forgot` | Storefront / auth flow |
| `/password/reset/:token` | Storefront / auth flow |
| `/oauth-success` | Storefront / auth flow |
| `/cart` | Storefront / auth flow |
| `/checkout` | Customer authentication required |
| `/order-success/:orderId` | Customer authentication required |
| `/orders` | Customer authentication required |
| `/wishlist` | Storefront / auth flow |
| `/account` | Customer authentication required |
| `/index.html` | Storefront / auth flow |
| `*` | Fallback / 404 |

## REST API Reference

All backend endpoints below are taken from the route definitions. The `Access` column indicates route-level middleware; individual services may apply additional checks. The Stripe webhook is a provider callback, not a general-purpose public API.

| Method | Endpoint | Access |
| --- | --- | --- |
| `GET` | `/api/address/` | Authenticated |
| `POST` | `/api/address/` | Authenticated |
| `PATCH` | `/api/address/:id` | Authenticated |
| `DELETE` | `/api/address/:id` | Authenticated |
| `GET` | `/api/admin/get-all-users` | Admin |
| `DELETE` | `/api/admin/delete/:id` | Admin |
| `PATCH` | `/api/admin/role/:id` | Admin |
| `GET` | `/api/admin/fetch/dashboard-stats` | Admin |
| `GET` | `/api/admin/category` | Admin / Uploader |
| `POST` | `/api/admin/category` | Admin / Uploader |
| `PATCH` | `/api/admin/category/:id` | Admin / Uploader |
| `DELETE` | `/api/admin/category/:id` | Admin / Uploader |
| `GET` | `/api/admin/media` | Admin / Uploader |
| `DELETE` | `/api/admin/media/:id` | Admin / Uploader |
| `GET` | `/api/admin/reviews` | Admin |
| `DELETE` | `/api/admin/reviews/:id` | Admin |
| `GET` | `/api/admin/coupons` | Admin |
| `POST` | `/api/admin/coupons` | Admin |
| `DELETE` | `/api/admin/coupons/:id` | Admin |
| `POST` | `/api/auth/register` | Public / callback |
| `POST` | `/api/auth/login` | Public / callback |
| `POST` | `/api/auth/refresh-token` | Authenticated |
| `POST` | `/api/auth/logout` | Public / callback |
| `POST` | `/api/auth/forgot-password` | Public / callback |
| `PUT` | `/api/auth/password/reset/:token` | Public / callback |
| `PUT` | `/api/auth/password/change` | Authenticated |
| `PATCH` | `/api/auth/profile/update` | Authenticated |
| `GET` | `/api/auth/google` | Public / callback |
| `GET` | `/api/auth/google/callback` | Public / callback |
| `GET` | `/api/category/` | Public / callback |
| `POST` | `/api/coupon/validate` | Public / callback |
| `POST` | `/api/order/new` | Authenticated |
| `GET` | `/api/order/my-orders` | Authenticated |
| `GET` | `/api/order/admin/all` | Admin |
| `POST` | `/api/order/:orderId/confirm` | Authenticated |
| `DELETE` | `/api/order/:orderId` | Authenticated |
| `GET` | `/api/order/:orderId` | Authenticated |
| `PUT` | `/api/order/admin/update/:orderId` | Admin |
| `POST` | `/api/payment/webhook` | Public / callback |
| `PUT` | `/api/product/post-new/review/:productId` | Authenticated |
| `DELETE` | `/api/product/delete/review/:productId` | Authenticated |
| `POST` | `/api/product/admin/create` | Admin / Uploader |
| `GET` | `/api/product/` | Public / callback |
| `GET` | `/api/product/:productId` | Public / callback |
| `PATCH` | `/api/product/admin/update/:productId` | Admin / Uploader |
| `DELETE` | `/api/product/admin/delete/:productId` | Admin / Uploader |
| `POST` | `/api/product/ai-search` | Public / callback |

### Additional Endpoint

- `GET /health` — simple backend health/uptime response.

**Important:** The route inventory documents registered HTTP paths, not a complete OpenAPI specification. Consult controllers and services for request bodies, pagination, filters, response schemas, and error codes.

## Database Schema

ShopRivo uses PostgreSQL tables created by JavaScript modules under `backend/models/` and coordinated by `backend/utils/createTables.js`.

| SQL table | Schema module |
| --- | --- |
| `categories` | `categoryTable.js` |
| `coupons` | `couponTable.js` |
| `media` | `mediaTable.js` |
| `order_items` | `orderItemsTable.js` |
| `orders` | `ordersTable.js` |
| `payments` | `paymentsTable.js` |
| `reviews` | `productReviewsTable.js` |
| `products` | `productTable.js` |
| `refresh_sessions` | `refreshSessionsTable.js` |
| `shipping_info` | `shippingInfoTable.js` |
| `users` | `userTable.js` |

The schema covers users and refresh sessions, catalog products/categories/media, reviews, coupons, orders and line items, payment records, and shipping addresses. Review the SQL definitions for exact columns, constraints, indexes, and relationships before changing production data.

## Authentication and Authorization

- User registration and login use the backend authentication service.
- JWT access tokens and refresh-session handling support authenticated API access.
- Passwords are hashed with bcrypt.
- Password reset, password change, and profile updates have dedicated endpoints.
- Google OAuth endpoints handle login initiation and callback.
- Backend authorization distinguishes `Admin` and `Uploader` permissions on selected routes.
- Frontend route guards improve navigation UX; **backend authorization remains the security boundary**.

## Checkout and Payments

1. Customer prepares cart, shipping information, and optional coupon.
2. Authenticated checkout calls `POST /api/order/new`.
3. Backend order/payment services coordinate Stripe payment intent or COD handling.
4. Stripe delivers events to `POST /api/payment/webhook`, registered **before** JSON body parsing so Stripe signature verification can use the raw request body.
5. Payment confirmation and order lifecycle actions are exposed through the order API.
6. Admins can update order status via a protected endpoint.

**Payment safety:** Stripe test keys should be used for development. Configure the webhook signing secret and test success, failure, cancellation, duplicate delivery, and delayed webhook scenarios before processing real payments. Do not treat a browser redirect alone as proof of successful payment.

## Media and AI Search

Product uploads use Multer and Cloudinary helpers. Media records are persisted in PostgreSQL and can be viewed/deleted through administration endpoints. Product routes accept `images` (up to 10) and `color_images` (up to 20) upload fields.

`POST /api/product/ai-search` invokes the AI-assisted filtering/search flow; configure the Gemini API key in the backend environment. Validate AI output against actual catalog data and do not rely on generated text as authoritative inventory or price information.

## Environment Variables

Copy the example files and fill in your own credentials. Never commit `.env` files, access tokens, API secrets, or database passwords.

### Backend (`backend/.env`)

```dotenv
# ==============================
# SERVER
# ==============================
PORT=4000
NODE_ENV=development

# ==============================
# FRONTEND
# ==============================
CLIENT_URL=http://localhost:5173
FRONTEND_URL=http://localhost:5173

# ==============================
# DATABASE
# ==============================
DB_URL=your_database_url

# ==============================
# JWT
# ==============================
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret

# ==============================
# EMAIL / RESEND
# ==============================
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=your_email@example.com

# ==============================
# CLOUDINARY
# ==============================
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# ==============================
# GEMINI AI
# ==============================
GEMINI_API_KEY=your_gemini_api_key

# ==============================
# STRIPE
# ==============================
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
STRIPE_FRONTEND_KEY=your_stripe_publishable_key

# ==============================
# GOOGLE OAUTH
# ==============================
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:4000/api/auth/google/callback
```

### Frontend (`frontend/.env`)

```dotenv
# Leave EMPTY in development: the Vite dev proxy forwards /api to the backend,
# which avoids CORS entirely (works on any port / hostname).
# Set an absolute URL only when deploying (e.g. https://api.yourdomain.com).
VITE_API_URL=
VITE_CURRENCY=৳
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

Only variables prefixed with `VITE_` are exposed to frontend code. **Never put secret keys in Vite variables.** The Stripe publishable key is public; the Stripe secret and webhook signing secret belong on the backend.

## Local Development

### Prerequisites

- Node.js and npm (use a current supported Node.js LTS release)
- A reachable PostgreSQL database and its connection URL
- Credentials for integrations you intend to test (Stripe, Cloudinary, Google OAuth, Gemini, email)

### 1. Clone the repository

```bash
git clone https://github.com/mahiulanik/ShopRivo.git
cd ShopRivo
```

### 2. Configure and run the backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your own configuration
node server.js
```

The backend uses port `4000` by default and initializes its SQL tables at startup. The backend `package.json` does **not** currently define a `start` or `dev` script, so run `node server.js` unless you add scripts yourself.

### 3. Configure and run the frontend

Open another terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Vite normally serves the frontend at `http://localhost:5173`. With `VITE_API_URL` empty, the Vite proxy forwards `/api` to the backend (default `http://localhost:4000`).

> On Windows Command Prompt, use `copy .env.example .env` instead of `cp`.

### 4. Production frontend build

```bash
cd frontend
npm run build
npm run preview
```

### 5. Stripe webhook testing

Use the Stripe CLI or Stripe dashboard to forward Stripe webhook events to `http://localhost:4000/api/payment/webhook`, and set the matching `STRIPE_WEBHOOK_SECRET`. Confirm actual event types and order state transitions against the payment service.

## Deployment Notes

### Frontend

- Deploy the `frontend/` directory to a Vite-compatible static host (e.g. Vercel).
- Set `VITE_API_URL` to the backend base URL expected by `frontend/src/api/client.js`.
- Configure `VITE_STRIPE_PUBLISHABLE_KEY` and other public frontend settings.
- Preserve SPA rewrite behavior for client-side routes (`frontend/vercel.json`).

### Backend

- Deploy `backend/` as a persistent Node.js service with `node server.js` as the start command.
- Provide PostgreSQL and all required server-side environment variables.
- Configure `GOOGLE_REDIRECT_URI`, frontend callback URLs, and Stripe webhook destination for the deployed domain.
- Update `allowedOrigins` in `backend/app.js` to include the **actual** frontend deployment origin. The current hard-coded allowlist includes `http://localhost:5173` and `https://shoprivo.vercel.app`.
- Ensure HTTPS proxy headers are correctly set, as production middleware redirects non-HTTPS requests.
- Check `GET /health` for uptime monitoring.
- Prefer versioned database migrations over schema creation at every app startup as the project matures.

## Implementation Notes and Limitations

This documentation was prepared from the supplied repository archive, not from a completed end-to-end production penetration test. Features listed here are present in the source, but operational correctness depends on runtime configuration and third-party services.

**Items worth reviewing before production use:**

- Verify that the deployed frontend domain matches backend CORS settings.
- Confirm checkout authorization, order ownership, stock consistency, coupon reuse rules, and payment/webhook idempotency under concurrent requests.
- Review upload size/type validation, Cloudinary asset cleanup, and authorization on media deletion.
- Review API rate limiting, request validation, error disclosure, and OAuth callback configuration.
- Ensure DB constraints and indexes match high-traffic product, order, and review queries.
- Add automated unit/integration tests and CI; the backend currently has only a placeholder `npm test` script.
- Avoid claiming formal production/security certification without deployment testing.

## Author

**Mahiul Hasan Anik**  
GitHub: [@mahiulanik](https://github.com/mahiulanik)

---

Built as a full-stack e-commerce portfolio project. See repository source for the latest implementation details.
