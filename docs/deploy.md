# Deploy — TatianaBot v2

Guía para poner el bot en producción. Lavalink (música) está documentado aparte en [lavalink.md](./lavalink.md).

---

## Checklist de arranque

Antes de invitar el bot a un servidor real:

1. [ ] Crear aplicación en [Discord Developer Portal](https://discord.com/developers/applications)
2. [ ] Copiar **Bot Token** → `DISCORD_TOKEN`
3. [ ] Activar intents: **Server Members** (si lo usas), **Message Content**, **Presence** no obligatorio
4. [ ] Generar invite con scopes `bot` + `applications.commands` y permisos mínimos (Send Messages, Embed Links, Connect/Speak si hay música)
5. [ ] Crear API key en [Groq Console](https://console.groq.com/) → `GROQ_API_KEY`
6. [ ] Poner tu Discord user ID en `AUTHORIZED_USER_ID` (owner de `/shutdown` y `/restart`)
7. [ ] `cp .env.example .env` y completar variables
8. [ ] `bun install`
9. [ ] `bun run lint && bun test && bun run typecheck`
10. [ ] Arrancar con `bun run start` (o Docker / Railway / systemd abajo)
11. [ ] Verificar `/ping`, `/help`, mención a Tatiana, `/changelog`
12. [ ] (Opcional) `STATUS_CHANNEL_ID` para embed de estado
13. [ ] (Opcional) Lavalink + `LAVALINK_*` + yt-dlp — ver [lavalink.md](./lavalink.md)
14. [ ] Revisar [Privacy](./privacy-policy.md) y [ToS](./terms-of-service.md) si el bot es público

---

## Variables mínimas

```env
DISCORD_TOKEN=
GROQ_API_KEY=
AUTHORIZED_USER_ID=
```

Recomendadas en producción:

```env
NODE_ENV=production
LOG_LEVEL=info
DATABASE_URL=file:./data/tatiana.sqlite
# STATUS_CHANNEL_ID=
```

En desarrollo (registro instantáneo de slash commands):

```env
DEV_GUILD_ID=id_de_tu_servidor_de_pruebas
```

Sin `DEV_GUILD_ID`, Discord propaga los slash commands globalmente (puede tardar hasta ~1 h).

---

## Opción A — VPS / bare metal (recomendado)

### Requisitos

- Linux (Debian/Ubuntu/Arch) o similar
- [Bun](https://bun.sh) 1.2+
- (Opcional) Docker solo para Lavalink

### Arranque manual

```bash
git clone https://github.com/ItsJhonAlex/TatianaBot.git
cd TatianaBot
bun install
cp .env.example .env
# editar .env
bun run start
```

### systemd

`/etc/systemd/system/tatiana.service`:

```ini
[Unit]
Description=Tatiana Discord Bot
After=network.target

[Service]
Type=simple
User=tatiana
WorkingDirectory=/opt/TatianaBot
EnvironmentFile=/opt/TatianaBot/.env
ExecStart=/home/tatiana/.bun/bin/bun src/index.ts
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now tatiana
sudo journalctl -u tatiana -f
```

Persiste `./data/` (SQLite). Haz backup periódico de ese directorio.

---

## Opción B — Docker

El repo incluye un `Dockerfile` del bot. Lavalink sigue en `docker-compose.yml`.

### Solo bot

```bash
docker build -t tatiana-bot .
docker run -d --name tatiana \
  --env-file .env \
  -v "$(pwd)/data:/app/data" \
  tatiana-bot
```

### Bot + Lavalink

1. Asegura que `LAVALINK_HOST` en `.env` del bot sea `lavalink` (nombre del servicio Compose) si ambos están en la misma red Docker, o `127.0.0.1` si el bot corre en el host y Lavalink publica el puerto `2333`.
2. Arranca Lavalink: `docker compose up -d lavalink`
3. Arranca el bot (host o contenedor como arriba).

Notas:

- El modo descarga (`MUSIC_USE_DOWNLOAD`) necesita `yt-dlp` en el **mismo host** donde corre el bot; la imagen Alpine del bot **no** incluye yt-dlp ni cookies del navegador. En Docker suele ser más simple el modo stream Lavalink, o montar un volumen de cookies exportadas.
- Monta `./data` para no perder la base SQLite al recrear el contenedor.

---

## Opción C — Railway

1. Nuevo proyecto → **Deploy from GitHub** (este repo)
2. Runtime: asegúrate de que Railway detecte Bun, o usa el Dockerfile del repo (Railway → Settings → Dockerfile path = `Dockerfile`)
3. Variables de entorno: las mismas del `.env` (nunca commits del `.env`)
4. Volume / persistent disk para `./data` si Railway lo ofrece en tu plan; si no, asume que la DB se pierde en redeploy y considera un volumen externo
5. Deploy → revisa logs hasta ver `conectado como …`
6. No hace falta exponer un puerto HTTP: el bot solo abre WebSocket a Discord

Lavalink en Railway requiere un segundo servicio (imagen `ghcr.io/lavalink-devs/lavalink:4`) con el `application.yml` montado y `LAVALINK_HOST` apuntando a la URL interna del servicio.

---

## Verificación post-deploy

| Comando | Esperado |
|---|---|
| `/ping` | Latencia + versión |
| `/help` | Lista de slash commands |
| `/changelog` | Notas de la última versión |
| `/stats` | Uptime y cmds/min |
| Mención a Tatiana | Respuesta IA |

Si los slash no aparecen: confirma `DEV_GUILD_ID` o espera propagación global; reinicia el bot tras cambios de comandos.

---

## Actualizar

```bash
git pull
bun install
bun run db:migrate   # si hay migraciones nuevas
# reiniciar proceso (systemctl restart tatiana / redeploy)
```

`/changelog` **no despliega código**: solo muestra el `CHANGELOG.md` ya presente en el proceso en ejecución. Despliega tú con git/systemd/Railway.

---

## Seguridad

- No subas `.env` ni tokens al repo
- Rota el token si se filtra
- `AUTHORIZED_USER_ID` debe ser solo tu cuenta
- Revisa [privacy-policy.md](./privacy-policy.md) y [terms-of-service.md](./terms-of-service.md) antes de invitar el bot a servidores ajenos
