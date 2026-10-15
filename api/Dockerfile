# Imagem da API para o Render.
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY api/requirements.txt ./api/requirements.txt
RUN pip install --no-cache-dir -r api/requirements.txt

COPY api ./api

# O Render injeta PORT.
ENV PORT=8000
EXPOSE 8000

# Uma instância só: o limitador de tentativas guarda estado em memória.
# Para subir o número de workers, aponte RATELIMIT_STORAGE_URI para um Redis.
CMD gunicorn "api.aplicacao:app" --bind "0.0.0.0:${PORT}" --workers 1 --threads 4 --timeout 60
