"""Extensões compartilhadas, em arquivo próprio para evitar import circular."""

from __future__ import annotations

from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Limite de tentativas. O armazenamento em memória basta para uma instância
# só no Render; se um dia houver mais de uma, aponte RATELIMIT_STORAGE_URI
# para um Redis.
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[],
    storage_uri="memory://",
    strategy="fixed-window",
)
