# Registro de cambios — TatianaBot

Todos los cambios notables se documentan aquí.

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).  
Versionado según [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.5.0] — 2026-08-31

### Añadido

- Música vía Lavalink v4 + Shoukaku (sin audio in-process)
- Comandos: `/join`, `/play`, `/pause`, `/resume`, `/skip`, `/queue`, `/leave`
- Cola en memoria por guild
- `docker-compose.yml` + `docs/lavalink.md`
- Variables opcionales `LAVALINK_*` (el bot arranca sin ellas)

---

## [2.4.0] — 2026-08-31

### Añadido

- Moderación: `/automod` (enable/disable/status/rules/log/roles/spam) + listener asíncrono
- Precondición `ModeratorOnly` (Manage Server o roles configurados)
- Embeds CRUD: `/embed create|list|preview|publish|edit|delete`
- RPG shell: `/adventure`, `/character`, `/character-delete`, `/lore`
- Stats con bonuses de raza aplicados y visibles
- Tablas DB: guild settings, automod rules, mod actions, saved embeds, characters

---

## [2.3.0] — 2026-08-31

### Añadido

- Catch games: `/pokemon`, `/pokedex`, `/yugioh`, `/deck`
- `CatchGameService` compartido (intentos + reset horario)
- Inventario Pokémon / Yu-Gi-Oh! en SQLite
- Botón de captura con recompensa de monedas
- Tests de intentos, captura y spawn registry

---

## [2.2.0] — 2026-08-31

### Añadido

- `/8ball`, `/meme`, `/anime`, `/poll`
- `HttpClient` con timeout y reintentos
- Rate limit en memoria para `/meme` y `/anime`
- Content pack: `anime-actions.json`, `eightball-responses.json`
- Tests de HttpClient, RateLimiter, EightBall y AnimeService

---

## [2.1.0] — 2026-08-31

### Añadido

- Chat IA con Groq (`GroqProvider`) y personalidad desde `src/content/persona.toml`
- Memoria de conversación por `(guildId, userId)` en SQLite
- Listener de mención/reply para hablar con Tatiana
- Economía: `/balance`, `/daily`, `/transfer`
- `/help` dinámico
- Admin owner: `/shutdown`, `/restart` (precondición `OwnerOnly`)
- Status embed opcional (`STATUS_CHANNEL_ID`)
- Lore de Aethoria en `src/content/lore/aethoria.json`
- Tests de economía, chat/memoria

### Cambiado

- Intents: `GuildMessages` + `MessageContent` para el chat por mención

---

## [2.0.0] — 2026-08-24

Rewrite completo del bot en **TypeScript + Sapphire**. El código Python v1 se archiva en `legacy/`.

### Añadido

- Scaffold del proyecto v2 (Bun, TypeScript strict, ESM)
- Framework Discord: `@sapphire/framework` + `discord.js` 14
- Runtime y package manager: **Bun** (tests con `bun:test`, SQLite nativo)
- Configuración validada con Zod (`.env`; Bun lo carga automáticamente)
- Logger estructurado con pino
- Drizzle ORM + **bun:sqlite** con migraciones automáticas
- Comando `/ping` con embed de latencia
- Listener `ready` con logging de conexión
- Tests con bun:test (validación de env)
- CI con GitHub Actions + setup-bun (lint, typecheck, test)
- Documentación: arquitectura, roadmap, README, legal y contribución

### Cambiado

- Stack: Python/discord.py → TypeScript/Sapphire/**Bun**
- IA planificada: Gemini → Groq (implementación en Fase 1)
- Superficie de comandos: slash-only (sin duplicar prefijos)
- Persistencia: SQLAlchemy sync → Drizzle + bun:sqlite

### Eliminado (respecto a v1 en runtime)

- Comandos con prefijo duplicados
- Dependencias no usadas (FastAPI, Redis, Spotipy, yt-dlp in-process)
- Código muerto (Gemini interface, monitor con monkey-patch de logger)

---

## Historial v1.x (legacy)

El bot Python original (v1.0.0 – v1.3.0) permanece en `legacy/`. Resumen:

### [1.3.0] — 2024

- Personalidad Tatiana ampliada (TOML + lore Aethoria)
- Migración de IA a Groq (Llama 3.1)
- Sistema RPG: creación de personaje (shell)
- Mejoras en música, automod y plugins

### [1.0.0] — 2023-08-24

- Bot inicial con plugins, Gemini, economía, Pokémon, Yu-Gi-Oh!, encuestas, ayuda dinámica
- Variables de entorno para secrets
- Sistema de estado y power control

### [0.5.0] — 2023-07-15

- Beta con comandos de prefijo e integración Discord

### [0.1.0] — 2023-06-01

- Estructura inicial y primeros comandos de prueba

Para el changelog detallado de v1, ver [`legacy/CHANGELOG.md`](legacy/CHANGELOG.md).

---

[2.0.0]: https://github.com/ItsJhonAlex/TatianaBot/compare/v1.3.0...v2.0.0
