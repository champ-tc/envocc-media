# Project Context: Envocc Media

## Overview
Envocc Media is a web-based management system for material requisition and borrowing. It is designed to manage media assets, track stock, handle user requests for items (either requisition/permanent or borrowing), and provide administrative dashboards for approval and reporting.

## Tech Stack
- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **ORM:** Prisma
- **Database:** MySQL
- **Authentication:** Next-Auth (JWT strategy)
- **Infrastructure:** Docker & Docker Compose
- **Proxy/Web Server:** Nginx (with SSL support)
- **Caching/Rate Limiting:** Redis (ioredis / @upstash/redis)
- **Notifications:** Line Notify (Flex messages) and Nodemailer (Email)
- **Reporting:** ExcelJS, Chart.js

## Core Features
1. **Media Management:** Catalog of available items with image uploads and stock tracking.
2. **Requisition System:** Allows users to request items permanently.
3. **Borrowing System:** Allows users to borrow items with due dates and return tracking.
4. **Role-Based Access Control (RBAC):**
   - **User:** Browse media, make requests, track personal history.
   - **Admin:** Manage media, approve/reject requests, manage users, view reports/dashboards.
5. **Notification System:** Automatic alerts to Line groups and emails for request status updates.
6. **Reporting:** Dashboard with visualizations and exportable Excel reports for requisitions and borrows.

## Directory Structure
- `/frontend`: Main Next.js application.
  - `/src/app`: Next.js App Router pages and API routes.
    - `/admins`: Admin-only interface.
    - `/users`: User-only interface.
    - `/api`: Backend API endpoints.
  - `/src/components`: Reusable UI components.
  - `/src/lib`: Shared utilities (Prisma client, notification helpers, auth guards).
  - `/prisma`: Database schema and migrations.
  - `/public`: Static assets and user uploads.
- `/nginx`: Configuration for Nginx and SSL certificates.
- `/docker-compose.yml`: Container orchestration for development and deployment.

## Key Configurations
- **Environment Variables:** Managed via `.env` files (DB credentials, SMTP, Line tokens, NextAuth secret).
- **Prisma Schema:** `frontend/prisma/schema.prisma` defines the data models for users, requisitions, borrows, logs, and evaluations.
- **Middleware:** `frontend/middleware.ts` handles path protection and role-based redirection.
