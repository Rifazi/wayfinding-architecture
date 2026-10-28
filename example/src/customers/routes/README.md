# routes

Kind: adapter
Parent: customers
Owns: HTTP endpoints for customers
Does not own: a customer's profile or loyalty tier (see customers)
Interface: GET /customers/:id, GET /customers/:id/loyalty-tier
Checkpoint: npm test
