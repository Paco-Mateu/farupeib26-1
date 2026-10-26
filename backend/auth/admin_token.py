"""Admin token gate for destructive or quota-spending endpoints.

Set ADMIN_API_TOKEN in the environment and pass it as the ``X-Admin-Token``
header. When no token is configured, the gate is open in development and
closed in production so a deployed demo never exposes destructive routes.
"""

import secrets

from fastapi import Header, HTTPException, status

from backend.config import settings


def require_admin_token(
    x_admin_token: str | None = Header(default=None),
) -> None:
    expected = settings.admin_api_token

    if not expected:
        if settings.app_env == "production":
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=(
                    "Endpoint deshabilitado: configura ADMIN_API_TOKEN y envía la "
                    "cabecera X-Admin-Token para usarlo en producción."
                ),
            )
        return

    if not x_admin_token or not secrets.compare_digest(x_admin_token, expected):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Cabecera X-Admin-Token ausente o inválida.",
        )
