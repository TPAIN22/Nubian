## Nubian Mobile (Expo) — Product-Driven Architecture

### Source of truth
- **Backend schema is law**: `nubian-auth/src/models/product.model.js`
- Frontend does **not** invent pricing/stock/variant availability.

### Canonical layers (only place product logic may live)

#### `domain/product`
- `domain/product/product.types.ts`: Backend-aligned `ProductDTO` / `ProductVariantDTO` / `ProductAttributeDefDTO`
- `domain/product/product.normalize.ts`: `normalizeProduct(raw: ProductDTO) -> NormalizedProduct`
- `domain/product/product.selectors.ts`: read-only derivations from backend data (e.g. `getAttributeOptions`)
- `domain/product/product.guards.ts`: runtime guards (active, selectable, etc.)

#### `domain/variant`
- `domain/variant/variant.match.ts`: `matchVariant(product, selectedAttributes)` (pure, strict match)
- `domain/variant/variant.stock.ts`: stock helpers (variant-only)

#### `domain/pricing`
- `domain/pricing/pricing.engine.ts`: `getSellingPriceFromBackend` / `getOriginalPriceFromBackend`

#### `domain/cart`
- `domain/cart/cart.types.ts`: cart lines store **productId + attributes** (backend-compatible). Variant linkage is derived, never invented.
- `domain/cart/cart.selectors.ts`: totals + validation against the latest product snapshot

### Runtime flow (high-level)
- API responses return **backend `ProductDTO`**
- Boundary converts to **`NormalizedProduct`** via `normalizeProduct`
- UI uses:
  - attribute defs + `getAttributeOptions(product)` for selection
  - `matchVariant(product, selectedAttributes)` for resolving the exact backend variant
  - pricing engine for display + checkout totals
- Cart add is only allowed when:
  - product is active
  - product has backend variants
  - selected attributes resolve to a selectable variant (stock > 0, active)

# Checkout architecture (2026-01-15)

## Components
- **Backend (`backend/`)**: Express + Mongo API, Clerk-auth guarded. Routes under `/api`:
  - `/addresses` CRUD (phone + WhatsApp required)
  - `/shipping/rates` list / by city
  - `/checkout/quote` compute server totals + shipping allocation
  - `/orders` create/list/get + payment proof upload + verify/reject transfer
  - `/suborders` list and `/suborders/:id/fulfillment-status` updates
- **Data model**
  - `Order` (parent): address snapshot, items, subtotal, shippingFee, total, paymentMethod, paymentStatus, proofUrl, `subOrders[]`, status (`PLACED|PAID|REJECTED`)
  - `SubOrder`: one per merchant with allocated shipping, paymentStatus mirroring parent, fulfillmentStatus (merchant-controlled)
  - `Address`: per-user, default flag, phone + WhatsApp required
  - `ShippingRate`: city -> fee (currency `SDG`)
- **Shipping allocation**
  - `allocatedShippingFee = round(parentShippingFee * (subSubtotal / parentSubtotal))`
  - Last suborder adjusted to fix rounding drift.

## Frontends
- **Expo app (`app/_components/checkOutModal.tsx`)**
  - Fetches addresses, requires phone + WhatsApp.
  - Pulls server quote via `/checkout/quote`, displays server totals.
  - Blocks place order without address/phone/WhatsApp/payment choice; BANKAK requires receipt upload.
  - Creates order via `/orders`; BANKAK auto-uploads proof.
  - Order tracking (`app/(screens)/order-tracking/[orderId].tsx`) shows suborders per merchant + statuses.
- **Dashboard (Next.js)**
  - Admin orders page now consumes `/orders`, shows proof link, verify/reject buttons (BANKAK).
  - Merchant orders page lists `/suborders` and allows fulfillment status updates.

## Shared contracts
- `types/checkout.types.ts` mirrors backend DTOs for Address, ShippingRate, Quote, Order, SubOrder, Payment/Fulfillment enums.

## Assumptions
- Clerk roles provided via `x-user-role`/`x-merchant-id` headers in development if Clerk secrets absent.
- Image proofs stored locally under `/uploads`; `API_BASE_URL` should be set to expose absolute URLs.
