# 🛒 B2B Food & Grocery Wholesale Marketplace
### *Enterprise Multi-Vendor Turkish B2B Food Distribution Platform*

[![NestJS](https://img.shields.io/badge/NestJS-11.x-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16.x-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-7.x-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://supabase.com/)
[![Redis](https://img.shields.io/badge/Redis-BullMQ-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://bullmq.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Railway](https://img.shields.io/badge/Railway-Production-0B0D0E?style=for-the-badge&logo=railway&logoColor=white)](https://railway.app/)
[![Vercel](https://img.shields.io/badge/Vercel-Production-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
[![CI Checks](https://github.com/AbdullaWalidi11/B2B_Food_-_Grocery_WholeSale_App/actions/workflows/ci.yml/badge.svg)](https://github.com/AbdullaWalidi11/B2B_Food_-_Grocery_WholeSale_App/actions/workflows/ci.yml)
---

## 📌 Executive Summary

This platform is a production-ready, full-stack B2B Multi-Vendor Food & Grocery Wholesale Marketplace engineered specifically for the food service (HoReCa — Hotel, Restaurant, Café) industry and traditional Turkish B2B wholesale commerce.

Unlike consumer e-commerce platforms, it implements enterprise B2B purchasing workflows:
1. **Turkish *Cari Hesap* (Open-Account Credit Management):** Real-time credit limits, outstanding debt ledger tracking, Net payment terms (*Net 15/30/45*), and cash/transfer debt collection (*Tahsilat*).
2. **Dynamic Contract Pricing (*Özel Fiyat Listeleri*):** Custom price books per buyer overriding base catalog wholesale prices with automated margin & discount calculations.
3. **B2B Packaging & Logistics Metrics:** Unit of Measure (UOM: *Koli, Çuval, Kasa, Kg, Adet*) and Minimum Order Quantity (MOQ) validation.
4. **Atomic Transactions & Async Fulfillment:** PostgreSQL `$transaction` order execution, locked price purchase snapshots, and BullMQ background queue processing.

---

## 🏗 System Architecture

```mermaid
flowchart TD
    subgraph Client ["Client Layer (Next.js 16 + React 19)"]
        Landing["Landing & Smart Router\n(/)"]
        VendorPortal["Vendor Wholesale Portal\n(/vendor/*)\n• Catalog & MOQ Management\n• Cari Credit & Tahsilat\n• Dynamic Price Sheets\n• Order Fulfillment"]
        BuyerPortal["Buyer Restaurant Portal\n(/buyer/*)\n• Multi-Supplier Directory\n• Contract Pricing Catalog\n• Cari Limit Validation Cart\n• Live Order Tracker"]
    end

    subgraph HostingFrontend ["Vercel Edge Platform"]
        Client
    end

    subgraph HostingBackend ["Railway Cloud Environment"]
        API["NestJS 11 Core API Gateway\n(Express + Helmet + Throttler)"]
        Prisma["Prisma ORM 7\n(@prisma/adapter-pg)"]
        Producer["BullMQ Order Producer"]
        Consumer["BullMQ Order Processor\n(order.processor.ts)"]
        Redis[("Managed Redis 7\nBullMQ Queues")]
    end

    subgraph DatabaseLayer ["Supabase Cloud"]
        Postgres[("PostgreSQL 15+\nConnection Pooling\n& Direct Port 5432")]
    end

    Client -->|HTTPS / REST API| API
    API --> Prisma
    API --> Producer
    Producer -->|Job Dispatch| Redis
    Redis -->|Job Worker| Consumer
    Prisma --> Postgres
    Consumer --> Prisma
```

---

## 🌟 Core B2B Business Logic & Modules

### 1. Turkish *Cari Hesap* Ledger & Credit Management
- Each `BuyerCompany` (Restaurant) and `Vendor` (Wholesaler) share an isolated `VendorCustomerRelationship`.
- **Credit Limit Enforcement:** Before order placement, the system enforces:
  $$\text{Current Debt} + \text{Order Total} \le \text{Credit Limit}$$
- If credit is exhausted, checkout is blocked until payment (*Tahsilat*) is recorded.
- **Tahsilat (*Payment Collection*):** Wholesalers can record payments against buyer debt via `POST /company/relationship/:id/payment`, which atomically decrements `currentBalance` and restores available credit.
- **Payment Terms (*Vade*):** Supports Net 15, Net 30, Net 45, and Net 60 payment terms.

### 2. Dynamic Contract Pricing (*Özel Fiyat Listeleri*)
- Base wholesale prices are set at the catalog level (`Product.basePrice`).
- Vendors create custom `PriceSheet` records (e.g., *"VIP Cafes"*, *"Zincir Restoranlar"*).
- When a buyer views the catalog via `GET /catalog/buyer/vendor/:vendorId/products`:
  - If a contracted price exists in `PriceSheetItem`, it overrides `basePrice`.
  - The UI highlights the customized contract badge and shows the exact discount percentage relative to standard wholesale.

### 3. Packaging & Logistics Specifications
- Standard units of measure for bulk food logistics:
  - `BOX` (*Koli*)
  - `SACK` (*Çuval* — Un, Şeker, Pirinç)
  - `CASE` (*Kasa* — Domates, Meyve-Sebze)
  - `KILOGRAM` (*Kg* — Et, Peynir)
  - `PIECE` (*Adet*)
- Strict **Minimum Order Quantity (MOQ)** constraints verified both client-side and server-side.

### 4. Locked Price Snapshots & Atomic Orders
- `OrderItem.priceAtPurchase` permanently captures the exact contracted price at checkout, insulating historical financial records from future vendor price updates.
- Orders are submitted through a database transaction and immediately offloaded to a Redis BullMQ queue (`order-processing`), simulating asynchronous ERP/warehouse fulfillment.

---

## 💻 Tech Stack

| Domain | Technology | Description |
| :--- | :--- | :--- |
| **Backend Framework** | [NestJS 11](https://nestjs.com/) | Enterprise Node.js TypeScript architecture |
| **Database & ORM** | [Prisma 7](https://www.prisma.io/) + [PostgreSQL](https://supabase.com/) | Hosted on Supabase with `@prisma/adapter-pg` driver adapter |
| **Queue & Cache** | [BullMQ](https://bullmq.io/) + [Redis](https://redis.io/) | Managed background job execution on Railway |
| **Security & Auth** | Passport JWT + Bcrypt | Role-Based Access Control (`VENDOR_ADMIN`, `BUYER_ADMIN`, etc.) |
| **API Documentation**| [Swagger / OpenAPI 3.0](https://swagger.io/) | Interactive API documentation at `/api` |
| **Frontend Framework**| [Next.js 16 (App Router)](https://nextjs.org/) + [React 19](https://react.dev/) | Turbopack compilation and edge routing |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Modern CSS engine with custom utility design |
| **State Management** | [Zustand](https://zustand.docs.pmnd.rs/) | Lightweight persisted client stores (`useAuthStore`, `useCartStore`) |
| **Icons & Notifications**| Lucide React + Sonner | High-performance icons and notification toasts |
| **Deployment** | Railway (Backend/Redis) + Vercel (Frontend) | Production dual-cloud architecture |

---

## 📁 Repository Structure

```text
B2B_Food_Wholesale_Platform/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma              # Data models (Auth, Multi-tenant, Cari, Catalog, Orders)
│   │   └── seed.ts                    # Turkish B2B seed data (Distributors, Lokantas, PriceSheets)
│   ├── src/
│   │   ├── auth/                      # Authentication & JWT strategies
│   │   ├── catalog/                   # Products, Categories, Price Sheets & Contract Resolution
│   │   ├── company/                   # Vendors, Buyer Companies, Cari Relationships & Tahsilat
│   │   ├── order/                     # Order placement ($transaction) & BullMQ Producer
│   │   ├── queue/                     # BullMQ Consumer & Processor (order.processor.ts)
│   │   ├── app.module.ts              # Root NestJS module
│   │   └── main.ts                    # Bootstrap with CORS, Helmet, ValidationPipe & Swagger
│   ├── Dockerfile                     # Multi-stage production container build
│   ├── .dockerignore
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/                # /login and /register dual-tab authentication
│   │   │   ├── buyer/                 # Buyer Restaurant Portal
│   │   │   │   ├── suppliers/         # Approved Wholesale Suppliers directory
│   │   │   │   ├── catalog/[vendorId]/# Supplier-specific contract pricing catalog
│   │   │   │   ├── cart/              # Cart & Cari limit checkout gatekeeper
│   │   │   │   └── orders/            # Live order tracker & digital invoice view
│   │   │   ├── vendor/                # Vendor Wholesale Portal
│   │   │   │   ├── dashboard/         # Revenue metrics & active Cari balance totals
│   │   │   │   ├── products/          # Catalog CRUD with MOQ and UOM
│   │   │   │   ├── price-sheets/      # Custom contract price sheet matrix
│   │   │   │   ├── customers/         # Cari limits, debt ledgers & Tahsilat modal
│   │   │   │   └── orders/            # Order fulfillment lifecycle (Processing, Shipped, Cancelled)
│   │   │   ├── layout.tsx             # Root layout with SEO and metadata
│   │   │   └── page.tsx               # Production B2B landing page with smart auth detection
│   │   ├── lib/                       # Axios client & JWT interceptors
│   │   └── store/                     # Zustand stores (useAuthStore, useCartStore)
│   └── package.json
│
└── README.md
```

---

## 🔑 Environment Variables Setup

### 1. Backend (`backend/.env`)
```env
# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x"
DIRECT_URL="postgresql://postgres:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require"

# Authentication
JWT_SECRET="your-super-secure-production-jwt-secret-key"
JWT_EXPIRATION="7d"

# Redis (BullMQ Queue)
REDIS_HOST="127.0.0.1"
REDIS_PORT=6379
REDIS_PASSWORD=""

# Server Configuration
PORT=3001
FRONTEND_URL="http://localhost:3000"
```

### 2. Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

---

## 🚀 Local Development Guide

### Prerequisites
- Node.js `20.x` or higher
- `pnpm` (`npm install -g pnpm`)
- Docker & Docker Compose (for local Redis/Postgres if running locally)

### 1. Backend Setup
```bash
cd backend

# Install dependencies
pnpm install

# Push Prisma schema to database
npx prisma db push

# Seed Turkish demo data (Distributors, Restaurants, Contract Pricing)
npx prisma db seed

# Run NestJS in development mode
pnpm start:dev
```
The backend will be running at `http://localhost:3001`.  
Swagger documentation is available at `http://localhost:3001/api`.

### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
pnpm install

# Start Next.js development server
pnpm dev
```
The frontend will be running at `http://localhost:3000`.

---

## 🚢 Production Deployment

### 1. Backend (Railway)
1. Deploy from GitHub repository selecting root directory `/backend`.
2. Add a **Railway Managed Redis** service.
3. Configure the following environment variables in Railway:
   - `DATABASE_URL`: Your Supabase Transaction Pooler URL (port `6543`).
   - `DIRECT_URL`: Your Supabase Session/Direct URL (port `5432`).
   - `JWT_SECRET`: Production secret string.
   - `REDIS_HOST`: `${{Redis.REDISHOST}}`
   - `REDIS_PORT`: `${{Redis.REDISPORT}}`
   - `REDIS_PASSWORD`: `${{Redis.REDISPASSWORD}}`
   - `FRONTEND_URL`: `https://your-frontend-app.vercel.app`
4. The backend automatically builds using the optimized multi-stage `Dockerfile`.

### 2. Frontend (Vercel)
1. Import repository into Vercel and select Root Directory as `frontend`.
2. Add the environment variable:
   - `NEXT_PUBLIC_API_URL`: `https://your-backend-production.up.railway.app`
3. Click **Deploy**.

---

## 📡 Key API Endpoints

| Method | Endpoint | Description | Role / Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Register new Vendor or Buyer company & user | Public |
| `POST` | `/auth/login` | Authenticate user and receive JWT bearer token | Public |
| `GET` | `/company/vendors` | List all approved wholesale distributors | Authenticated |
| `GET` | `/company/relationships` | Get Cari account ledgers, credit limits & balances | Authenticated |
| `POST` | `/company/relationship/:id/payment` | Record payment (*Tahsilat Gir*) to restore buyer credit | Vendor Admin |
| `GET` | `/catalog/buyer/vendor/:id/products` | Retrieve catalog with customer-specific contracted prices | Buyer Admin |
| `POST` | `/catalog/price-sheets` | Create a customized price sheet | Vendor Admin |
| `PUT` | `/catalog/price-sheets/:id/items` | Set special contracted prices for products | Vendor Admin |
| `POST` | `/order` | Place order with atomic Cari credit balance deduction | Buyer Admin |
| `GET` | `/order` | List orders for current company or vendor | Authenticated |
| `PATCH` | `/order/:id/status` | Update order fulfillment status (Processing, Shipped, etc.) | Vendor Admin |

---

## 📄 License
This project is proprietary and developed for commercial B2B food wholesale operations.
