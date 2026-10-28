# routes

Kind: adapter
Parent: pricing
Owns: HTTP endpoints for price quotes
Does not own: how a price is calculated (see pricing)
Interface: POST /prices/quote  { customerId, items, promoCodes?, at? }
Checkpoint: npm test
