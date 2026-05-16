# Auth Seam

This folder is intentionally reserved for lightweight authentication wiring.

Current expectation:

- keep the prototype kit public by default
- add a minimal current-user resolver later if a demo needs sign-in
- avoid pulling in full OAuth, invite, or access-policy logic unless the prototype truly needs it

Likely future files:

- `current_user.py`
- `dependencies.py`
- `providers/`
