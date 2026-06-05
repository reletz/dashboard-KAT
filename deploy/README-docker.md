# Docker — quick notes

1. Copy your env file to `deploy/api.env` (example provided in repo):

```bash
cp /etc/kat-portal/api.env deploy/api.env
```

2. Build and run:

```bash
docker compose -f deploy/docker-compose.yml up -d --build
```

3. View logs:

```bash
docker compose -f deploy/docker-compose.yml logs -f
```

4. Backups:

```bash
# run backup script inside the running container
docker exec -it kat-portal-api sh -c "DB_PATH=/var/lib/kat-portal/portal.db /app/deploy/backup.sh"
```

Or bind the DB to a host path for easier backups (edit compose):

```yaml
services:
  kat-portal-api:
    volumes:
      - ./data/portal:/var/lib/kat-portal
```

5. Notes:
- Image runs with `npm start` (uses `tsx` runtime). Ensure `deploy/api.env` has required env vars.
- Compose binds `127.0.0.1:8787` so Traefik on the host can proxy it.
