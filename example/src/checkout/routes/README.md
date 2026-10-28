# routes

Kind: adapter
Parent: checkout
Owns: HTTP endpoint for placing an order
Does not own: whether an order can be placed (see checkout)
Interface: POST /checkout  { customerId, region, items, promoCodes?, at? }
Checkpoint: npm test
