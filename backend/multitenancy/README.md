# Multi-Tenancy Seam

This folder is intentionally reserved for lightweight tenant and workspace wiring.

Current expectation:

- stay single-tenant by default
- introduce a simple `tenantId` resolver only if a prototype needs shared workspaces
- avoid copying a full environment-access or team-policy system into the sprint kit

Likely future files:

- `current_tenant.py`
- `dependencies.py`
- `models.py`
