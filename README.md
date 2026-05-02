# KHUB Platform

Your No. 1 Business Hub - Unified E-commerce, Jobs, Rentals, Ride-hailing Platform

## Features

- 🛒 **E-commerce** - Full online marketplace with cart, wishlist, flash sales
- 💼 **Jobs** - Job posting and application system
- 🏠 **Rentals** - Properties, cars, lands with map integration
- 🚗 **Ride-hailing** - Uber-like booking and real-time tracking
- 💰 **Wallet** - Secure wallet with Paystack integration and escrow
- 💬 **Real-time Chat** - Instant messaging with media sharing
- 🎨 **Dark/Light Mode** - Full theme switching
- 🌍 **Multi-language** - English, Hausa, Yoruba, Igbo
- 📱 **PWA** - Install as native app
- 🔐 **Security** - RLS, JWT, rate limiting, CAPTCHA

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Supabase (Auth, DB, Realtime)
- Paystack (Payments)
- Leaflet + OpenStreetMap
- Zustand (State Management)

## Quick Start

1. Clone the repo
2. Copy `.env.example` to `.env` and add your keys
3. Run `npm install`
4. Run `npm run dev`

## Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_PAYSTACK_PUBLIC_KEY=your_paystack_key
