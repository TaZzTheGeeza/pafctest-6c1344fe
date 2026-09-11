# Built-in Club Shop (replacing Shopify)

Replace the Shopify-powered shop with a built-in store paid via GoCardless Instant Bank Pay, keeping the existing Orders dashboard and its history.

## Database (migration)
- `shop_products`: id, name, description, price_cents, image_url, sizes (text[]), requires_initials (bool), active (bool), sort_order, created_at. Public read of active products; admin write.
- `shop_orders`: id, user_id, email, customer_name, items jsonb (product name, size, initials, qty, price), total_cents, status (`pending` → `paid` → `cancelled`), progress_status (`ordered`/`arrived`/`printed`/`delivered`), gocardless_payment_id, admin_overrides jsonb, created_at.
- RLS: anyone signed-in can insert their own order row (status pending), users read their own orders, admins full access; only the edge function (service role) can mark `paid`.

## Edge functions
- `create-shop-checkout` (auth required): validates items against live `shop_products` prices (never trusts client prices), creates pending `shop_orders` row, creates a GoCardless Instant Bank Pay (Billing Request) flow, returns redirect URL.
- `shop-gocardless-webhook`: on payment confirmed → mark order `paid`, notify admins/treasurer, send buyer a confirmation email. On failure → mark `cancelled`.
- `shop-order-return`: landing after bank payment; confirms status, shows success/pending page.

## Storefront (replaces Shopify pages)
- `/shop`: grid of products from `shop_products` (image, name, price, sizes). Keeps current black/gold design.
- Product detail modal/page: size picker, initials field where required, quantity.
- Simple basket (reuse existing cart UI pattern, but local — no Shopify cart).
- Checkout: name + email (prefilled if signed in) → redirects to GoCardless bank payment → return page confirms.

## Admin
- Dashboard → Shop tab: add/edit/remove products, upload product photo, set sizes/prices, mark inactive.
- Orders tab: extend existing `OrdersTab.tsx` to show both sources — existing Shopify orders stay visible/read-only (badged "Shopify"), new shop orders fully manageable with the same status tracking, initials, size editor and linked-children lookup.

## Migration of products
- Pull current products from the Shopify Storefront API (already in `src/lib/shopify.ts`) and insert into `shop_products` with images and prices.

## Out of scope (this phase)
- Stock levels/inventory counts, discount codes, card payments.
- Shopify code removal: shopify sync stays in place but storefront switches to the new tables; old Shopify cart code removed from shop pages.

## Verification
- End-to-end test with a GoCardless sandbox payment if available; otherwise create a test order via the function and confirm webhook path + Orders tab display.
