# Checkout API

Base URL: `${API_BASE_URL}/api`

## Auth & roles
- Clerk middleware is expected. In dev, headers `x-user-id` + `x-user-role` (`admin|merchant|user`) and optional `x-merchant-id` are accepted.

## Addresses
- `GET /addresses` — current user's addresses.
- `POST /addresses` — create {name, city, area, street, building?, phone, whatsapp, notes?, isDefault}.
- `PUT /addresses/:id` — update (user scoped).
- `DELETE /addresses/:id` — remove (user scoped).

## Shipping
- `GET /shipping/rates` — list active rates.
- `GET /shipping/rates/:city` — rate by city.
- `POST /shipping/rates` — admin upsert rate.

## Checkout & orders
- `POST /checkout/quote` — body `{addressId, items:[{productId,name,price,quantity,merchantId,image?,attributes?}]}` → totals + per-merchant breakdown.
- `POST /orders` — body `{addressId, items:[], paymentMethod:"CASH"|"BANKAK"}` → creates parent + suborders (server recomputes totals).
- `GET /orders` — admin: all; user: own.
- `GET /orders/:id` — admin any; user own.
- `POST /orders/:id/payment-proof` — multipart `file`; sets parent + suborders paymentStatus `AWAITING_VERIFICATION`.
- `POST /orders/:id/verify-transfer` — admin; sets paymentStatus `VERIFIED/PAID`.
- `POST /orders/:id/reject-transfer` — admin; sets paymentStatus `REJECTED`.

## Suborders
- `GET /suborders` — merchant: only theirs (by `merchantId`); admin: filter all.
- `PATCH /suborders/:id/fulfillment-status` — merchant own or admin override; body `{status}`.

## Shipping allocation rule
`allocatedShippingFee = round(parentShippingFee * (subSubtotal / parentSubtotal))`, last suborder adjusted for rounding.
