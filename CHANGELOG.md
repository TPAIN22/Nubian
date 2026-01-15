## Unreleased

### Frontend schema realignment
- Added canonical domain layers:
  - `domain/product/*` (backend-aligned product contract + normalization + selectors + guards)
  - `domain/variant/*` (pure variant matching + stock)
  - `domain/pricing/*` (backend-driven pricing only)
  - `domain/cart/*` (cart references + validation/totals)
- Refactored **product details**, **product cards**, **explore/products lists**, and **cart item pricing** to use domain modules instead of legacy price/cart utils.

### Deletions / cleanups
- Removed duplicate/unused component: `app/_components/CartBadge.tsx` (was a copy of `ProductCard`)
- Removed unused “embedded backend” under `Nubian/backend/` (dead code; backend is `nubian-auth`)
- Removed legacy product schema helpers from `utils/productUtils.ts` (kept `cleanImages` only)

### Infra / stability
- Introduced device-safe API base URL resolver (`services/api/baseUrl.ts`) and wired it into:
  - `services/api/client.ts`
  - `utils/pushToken.ts`
  - `utils/notificationService.ts`

# Checkout & Orders overhaul

## 2026-01-15
- Added new Express + Mongo backend (`backend/`) with models for `Address`, `ShippingRate`, `Order`, and `SubOrder`, plus endpoints for address CRUD, shipping rates, checkout quoting, order creation, payment proof upload, transfer verification/rejection, order listing, and suborder fulfillment updates.
- Centralized shared contracts in `types/checkout.types.ts` and updated Expo checkout flow to require phone/WhatsApp, pull totals from `/checkout/quote`, and enforce BANKAK receipt upload.
- Updated mobile order tracking screen to surface per-merchant suborders and server-calculated totals.
- Wired admin dashboard orders page to new `/orders` feed with proof view + verify/reject actions; merchants now see their `/suborders` with fulfillment status updates.
