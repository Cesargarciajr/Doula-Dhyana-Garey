# Doula Dhyana Garey - Birth Plan Generator

## Project Overview
A bilingual (Portuguese/English) landing page and birth plan generator for a doula service targeting Brazilian couples living in Ireland.

## User Personas
1. **Brazilian Couples in Ireland** - Expecting parents who need guidance navigating the Irish healthcare system
2. **Doula Dhyana Garey (Admin)** - Business owner who manages content, generates access tokens, and views submissions

## Core Requirements (Static)
- Bilingual website (Portuguese/English)
- Landing page with hero, about, services, testimonials, contact sections
- Birth plan generator with token-based access (one-time use)
- Admin CMS for managing categories and options
- Token generation for couples to access birth plan generator
- Toggle-based option selection with hover tooltips
- Progress bar showing birth plan completion percentage
- Mobile-responsive with info buttons instead of hover

## What's Been Implemented (2026-01-14)
- [x] Landing Page with all sections (Hero, About, Services, Testimonials, Contact)
- [x] Language toggle (PT/EN) with localStorage persistence
- [x] Contact form submission
- [x] Admin authentication via email/password only (no Google OAuth)
- [x] Admin dashboard with sidebar navigation
- [x] Categories CMS (CRUD operations)
- [x] Options CMS (CRUD operations) with category filter
- [x] Token generation system with max_uses and expiration date picker
- [x] Birth plan token validation - same token returns same birth plan
- [x] Birth plan builder with category-based progress (not toggles)
- [x] Review page at 100% to see all selections before generating PDF
- [x] PDF generation warning popup showing remaining token attempts
- [x] Progress bar showing completion based on categories visited
- [x] Hover tooltips (desktop) / Info dialogs (mobile)
- [x] Birth plans require admin approval before couple can access
- [x] Pending birth plans shown on admin dashboard
- [x] Email templates editable in admin (with rich text)
- [x] Email notifications: token generation, completion, approval (Resend)
- [x] Seed data with 6 categories and 19 options

## Tech Stack
- Frontend: React + Tailwind CSS + Shadcn/UI
- Backend: FastAPI + Motor (async MongoDB)
- Database: MongoDB
- Auth: Emergent Google OAuth
- Fonts: Playfair Display (headings), Lato (body)
- Colors: Rose Quartz (#E5D0CC), Terracotta (#A86A61), Warm Sand (#F5F2F0)

## Prioritized Backlog

### P0 (Critical) - COMPLETED
- [x] Landing page
- [x] Birth plan generator
- [x] Admin CMS
- [x] Token system

### P1 (Important)
- [ ] Email notifications when tokens are generated
- [ ] Email notification when contact form submitted
- [ ] Birth plan PDF with better styling/branding

### P2 (Nice to Have)
- [ ] Admin can view/edit individual birth plans
- [ ] Export birth plans to PDF from admin
- [ ] Analytics dashboard (views, conversions)
- [ ] Testimonials management in CMS
- [ ] Social media link management in CMS

## API Endpoints
- `GET /api/` - Root endpoint
- `GET /api/auth/session` - Process OAuth session
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout
- `GET /api/categories` - Get active categories
- `GET /api/options` - Get active options
- `POST /api/validate-token` - Validate access token
- `GET /api/birth-plan/{id}` - Get birth plan
- `PUT /api/birth-plan/{id}` - Update birth plan
- `POST /api/birth-plan/{id}/complete` - Complete birth plan
- `POST /api/contact` - Submit contact form
- Admin endpoints (require auth): categories CRUD, options CRUD, tokens CRUD, birth-plans list, contacts list, seed data

## Next Tasks
1. Test the full flow with Google OAuth login
2. Generate a token and test the birth plan flow end-to-end
3. Consider adding email notifications for token generation
