# Deploy de Lavalink (Fase 5)

Tatiana **no** reproduce audio in-process. Todo el audio pasa por **Lavalink v4** vía **Shoukaku**.

## Requisitos

- Docker + Docker Compose
- Java no es necesario en el host (va dentro de la imagen)
- El bot necesita `GuildVoiceStates` (ya incluido al configurar música)

## Arranque rápido

**Requisito extra (modo descarga, recomendado):** [yt-dlp](https://github.com/yt-dlp/yt-dlp) en el PATH del host donde corre el bot.

```bash
# Arch Linux
sudo pacman -S yt-dlp ffmpeg

docker compose up -d
```

Desde la raíz del repo (sin el bloque de arriba si ya tienes yt-dlp):

```bash
docker compose up -d
```

Lavalink queda en `localhost:2333` con password por defecto `youshallnotpass` (cámbiala en producción).

Config del bot (`.env`):

```env
LAVALINK_HOST=127.0.0.1
LAVALINK_PORT=2333
LAVALINK_PASSWORD=youshallnotpass
# LAVALINK_SECURE=false
```

Si **no** defines esas variables, el bot arranca igual pero los comandos de música responden que no está configurada.

Reinicia el bot (`bun run dev`) y prueba:

- `/join` — unirse al canal de voz
- `/play query:` — búsqueda con autocompletado mientras escribes, o URL directa
- `/pause` / `/resume` / `/skip` / `/queue` / `/leave`

## Configuración

- `docker/lavalink/application.yml` — password, plugins, fuentes
- Plugin YouTube: `dev.lavalink.youtube:youtube-plugin` (el source nativo está desactivado)
- Password del YAML debe coincidir con `LAVALINK_PASSWORD`

## Producción

1. Cambia `lavalink.server.password` en el YAML y en `.env`
2. Expón Lavalink solo en red privada (no publiques `2333` a internet)
3. Usa un VPS o el mismo host del bot; baja latencia ayuda a la estabilidad de voz
4. Recursos orientativos: 512MB–1GB RAM para un nodo pequeño

## Troubleshooting

| Síntoma | Qué revisar |
|---|---|
| `/play` → music not configured | Variables `LAVALINK_*` en `.env` |
| No se conecta al nodo | `docker compose logs -f lavalink` |
| Búsqueda OK pero **sin audio** | Plugin YouTube desactualizado; recrea: `docker compose up -d --force-recreate` |
| Búsquedas YouTube vacías | Plugin youtube en `application.yml`; versión del plugin |
| Bot no oye el canal | Intents: Voice State; permisos Connect/Speak en el canal |
| Cola no avanza | Reinicia el bot tras actualizar `MusicService` |
| **`This video requires login`** | Usa búsqueda por texto (SoundCloud) o URL de SoundCloud; OAuth solo si necesitas YouTube oficial |
| **`All clients failed`** | Prueba otra canción, URL de SoundCloud, o configura OAuth (avanzado) |

## Fuentes de música (por defecto)

### Modo descarga (estilo Telegram) — default

Con `MUSIC_USE_DOWNLOAD=true` (default) y **yt-dlp** instalado:

1. `/play` descarga el audio a `./data/music-cache/`
2. Lavalink reproduce el archivo local (volumen compartido con Docker)
3. Al terminar, skip o `/leave` → el bot **borra** el MP3

Soporta YouTube, SoundCloud y muchas URLs que yt-dlp entienda.

**YouTube suele exigir cookies:** en `.env` añade un navegador **donde tengas sesión iniciada en YouTube**:

```env
YTDLP_COOKIES_FROM_BROWSER=firefox
```

yt-dlp busca el perfil en las rutas por defecto (`~/.mozilla/firefox`, `~/.config/chromium`). Si usas
un fork de Firefox (Zen, LibreWolf, Floorp) o tu perfil vive en otro sitio, indica la ruta explícita:

```env
YTDLP_COOKIES_FROM_BROWSER="firefox:/home/usuario/.config/zen/xxxxxxxx.Default (release)"
```

Para localizar tu perfil: `find ~ -maxdepth 5 -name cookies.sqlite`. Verifícalo antes de arrancar el bot con:

```bash
yt-dlp --cookies-from-browser "firefox:/ruta/al/perfil" --simulate --print "%(title)s" "URL_DE_YOUTUBE"
```

Si sigue apareciendo `Sign in to confirm you're not a bot`, las cookies se leyeron pero ese perfil no
tiene sesión de YouTube: inicia sesión en ese navegador y reintenta.

Si yt-dlp no está instalado, el bot cae automáticamente al modo stream Lavalink.

**Importante:** recrea Lavalink tras cambios de Docker para montar el cache:

```bash
docker compose up -d --force-recreate lavalink
```

### Modo stream (fallback)

Sin yt-dlp o con `MUSIC_USE_DOWNLOAD=false`: búsqueda/reproducción directa vía Lavalink (limitaciones YouTube/SoundCloud conocidas).

### OAuth (opcional, solo YouTube oficial)

Muchos videos oficiales (Vevo, labels) exigen sesión de Google. **No hace falta** si te basta con SoundCloud.

Si lo necesitas:

```yaml
oauth:
  enabled: true
```

2. Recrea Lavalink:

```bash
docker compose up -d --force-recreate
docker compose logs -f lavalink
```

3. Lavalink imprimirá un enlace/código OAuth en los logs. Completa el flujo con una **cuenta burner** (no tu Google principal).

4. Copia el `refreshToken` que aparece en logs y pégalo en el YAML:

```yaml
oauth:
  enabled: true
  skipInitialization: true
  refreshToken: "tu-token-aqui"
```

5. Vuelve a recrear el contenedor. Ya no debería pedir login en cada arranque.

**Playback con OAuth:** solo el cliente `TV` usa la sesión OAuth para reproducir. El resto (`WEB`, etc.) deben tener `playback: false` en `clientOptions`.

Si TV falla con `The page needs to be reloaded`, la cuenta burner puede estar flaggeada: revoca acceso en Google, borra `refreshToken`, pon `skipInitialization: false` y repite el flujo OAuth con otra cuenta.

**Orden de arranque:** arranca Lavalink primero (`docker compose up -d`), luego el bot.

## Alternativa

Si la música no es prioridad, omite esta fase: el bot es completo sin Lavalink.
