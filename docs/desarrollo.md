# Guía de desarrollo — TatianaBot v2

Documento maestro de arquitectura, convenciones y stack para el rewrite de TatianaBot.

**Stack:** TypeScript · Node.js 22 LTS · discord.js 14 · Sapphire · Drizzle · Groq

---

## Tabla de contenidos

1. [Visión del producto](#1-visión-del-producto)
2. [Stack tecnológico](#2-stack-tecnológico)
3. [Principios de arquitectura](#3-principios-de-arquitectura)
4. [Estructura del proyecto](#4-estructura-del-proyecto)
5. [Capas y responsabilidades](#5-capas-y-responsabilidades)
6. [Sapphire: piezas y convenciones](#6-sapphire-piezas-y-convenciones)
7. [Configuración y entorno](#7-configuración-y-entorno)
8. [Base de datos](#8-base-de-datos)
9. [Sistema de IA](#9-sistema-de-ia)
10. [HTTP y APIs externas](#10-http-y-apis-externas)
11. [Logging y observabilidad](#11-logging-y-observabilidad)
12. [Testing](#12-testing)
13. [Seguridad](#13-seguridad)
14. [Errores y UX en Discord](#14-errores-y-ux-en-discord)
15. [Migración desde legacy](#15-migración-desde-legacy)
16. [Scripts y comandos npm](#16-scripts-y-comandos-npm)
17. [Decisiones arquitectónicas (ADR)](#17-decisiones-arquitectónicas-adr)
18. [Anti-patrones del legacy (no repetir)](#18-anti-patrones-del-legacy-no-repetir)

Ver también: [roadmap.md](./roadmap.md)

---

## 1. Visión del producto

TatianaBot v2 es un bot de Discord con tres pilares:

| Pilar | Descripción |
|---|---|
| **IA con personalidad** | Tatiana, entidad de Aethoria; conversación contextual vía Groq |
| **Engagement** | Economía, catch games, comandos sociales |
| **Utilidades de servidor** | Ayuda, status, moderación, embeds, RPG cosmético (fase inicial) |

### Objetivos técnicos del rewrite

- Slash commands como **única** superficie pública (prefijo solo owner si hace falta)
- Async correcto en todo el stack
- Tipado estricto TypeScript
- Separación clara: Discord UI ↔ dominio ↔ infraestructura
- Dependencias mínimas y justificadas
- Desplegable y testeable desde la Fase 0

---

## 2. Stack tecnológico

### Core

| Componente | Elección | Versión orientativa |
|---|---|---|
| Runtime | Node.js | 22 LTS |
| Lenguaje | TypeScript | 5.x, `strict: true` |
| Discord API | discord.js | 14.x |
| Framework bot | @sapphire/framework | latest estable |
| Validación config | Zod | 3.x |
| ORM | Drizzle ORM | latest |
| DB dev | better-sqlite3 | — |
| DB prod (opcional) | PostgreSQL + pg | cuando escale |
| Migraciones | drizzle-kit | — |
| IA | groq-sdk | official |
| HTTP | fetch nativo / undici | — |
| Logging | pino | — |
| Tests | Vitest | — |
| Lint | ESLint + typescript-eslint | — |
| Format | Prettier | — |

### Dependencias Sapphire recomendadas

```bash
npm install @sapphire/framework discord.js
npm install @sapphire/plugin-logger @sapphire/plugin-editable-commands
npm install @sapphire/utilities @sapphire/discord.js-utilities
```

Plugins opcionales según necesidad:

- `@sapphire/plugin-hmr` — hot reload en dev
- `@sapphire/plugin-subcommands` — agrupar comandos (economía, admin)

### Dependencias explícitamente excluidas (del legacy)

| Excluido | Motivo |
|---|---|
| FastAPI / Redis / Spotipy | No usados; ruido |
| yt-dlp in-process | Bloquea event loop; usar Lavalink en Fase 5 |
| Gemini como default | Groq es el provider activo; Gemini como plugin futuro |
| Prefijos duplicados | Una superficie slash |

### Música (Fase 5, opcional)

```
Bot (Shoukaku) → Lavalink v4 (Java 17+) → Discord Voice
```

No implementar audio in-process.

---

## 3. Principios de arquitectura

### 3.1 Reglas de oro

1. **Los commands no contienen lógica de negocio.** Delegan a services del dominio.
2. **La infraestructura no conoce Discord.** Repositories y HTTP clients son agnósticos de embeds.
3. **Una feature = un módulo cohesivo.** Command + service + repository + tests juntos.
4. **Fail fast en config.** Si falta `DISCORD_TOKEN`, el proceso no arranca con mensaje claro.
5. **Degradación graceful.** Canales opcionales ausentes no tumban el bot.
6. **Sin estado global mutable.** No singletons de DB session ni memoria IA global.

### 3.2 Flujo de dependencias

```
commands / listeners (Sapphire pieces)
        ↓
    services (domain)
        ↓
  repositories + providers (infrastructure)
        ↓
    DB / HTTP / Groq
```

**Prohibido:** `commands → drizzle directamente` (excepto casos triviales de lectura en Fase 0).

### 3.3 Inversión de dependencias

Los services dependen de **interfaces** (ports), no de implementaciones:

```typescript
// domain/ports/llm-provider.ts
export interface LLMProvider {
  complete(messages: ChatMessage[], options?: CompleteOptions): Promise<string>;
  stream?(messages: ChatMessage[], options?: CompleteOptions): AsyncIterable<string>;
}
```

```typescript
// infrastructure/llm/groq-provider.ts
export class GroqProvider implements LLMProvider { /* ... */ }
```

Registro en un contenedor DI simple (Sapphire `container` o factory en bootstrap).

---

## 4. Estructura del proyecto

```
TatianaBot/
├── docs/                          # Documentación (este archivo)
├── legacy/                        # Referencia Python — NO modificar
├── src/
│   ├── index.ts                   # Entry: login + bootstrap
│   ├── lib/
│   │   ├── client.ts              # SapphireClient config
│   │   ├── container.ts           # DI: services, repos, providers
│   │   └── constants.ts
│   ├── config/
│   │   ├── env.ts                 # Zod schema + parse
│   │   └── bot.ts                 # Metadata bot (nombre, versión)
│   ├── content/                   # Datos de producto (no código)
│   │   ├── persona.toml
│   │   ├── lore/
│   │   │   └── aethoria.json
│   │   └── anime-actions.json     # Tabla endpoints nekos.best
│   ├── commands/                  # Sapphire Application Commands
│   │   ├── general/
│   │   │   └── ping.ts
│   │   ├── economy/
│   │   │   ├── balance.ts
│   │   │   ├── daily.ts
│   │   │   └── transfer.ts
│   │   ├── admin/
│   │   │   ├── shutdown.ts
│   │   │   └── restart.ts
│   │   └── ...
│   ├── listeners/                 # Sapphire event listeners
│   │   ├── ready.ts
│   │   └── chat-mention.ts
│   ├── preconditions/             # Guards (OwnerOnly, Moderator, etc.)
│   │   └── OwnerOnly.ts
│   ├── domain/
│   │   ├── economy/
│   │   │   ├── economy.service.ts
│   │   │   └── economy.types.ts
│   │   ├── chat/
│   │   │   ├── chat.service.ts
│   │   │   └── memory.service.ts
│   │   ├── characters/
│   │   └── catch-games/
│   └── infrastructure/
│       ├── db/
│       │   ├── schema/            # Drizzle tables
│       │   ├── migrations/
│       │   ├── client.ts
│       │   └── repositories/
│       ├── llm/
│       │   └── groq-provider.ts
│       └── http/
│           ├── poke-api.client.ts
│           └── meme-api.client.ts
├── assets/                        # Imágenes (port desde legacy)
├── drizzle.config.ts
├── package.json
├── tsconfig.json
├── eslint.config.js
├── vitest.config.ts
├── .env.example
└── .gitignore
```

### Convención de nombres de archivos

| Tipo | Patrón | Ejemplo |
|---|---|---|
| Command | `{nombre}.ts` en carpeta temática | `commands/economy/daily.ts` |
| Listener | `{evento}.ts` | `listeners/chat-mention.ts` |
| Service | `{feature}.service.ts` | `economy.service.ts` |
| Repository | `{entity}.repository.ts` | `user.repository.ts` |
| Schema Drizzle | `{entity}.ts` | `schema/users.ts` |
| Test | `{archivo}.test.ts` junto o en `__tests__/` | `economy.service.test.ts` |

---

## 5. Capas y responsabilidades

### 5.1 Commands (presentación Discord)

Responsabilidades **sí**:

- Parsear opciones de slash command
- Validar permisos vía preconditions
- Llamar al service
- Formatear respuesta (embed, ephemeral, etc.)
- Manejar errores de UX (`ApplicationCommandRegistry`)

Responsabilidades **no**:

- SQL queries
- Llamadas HTTP directas
- Prompts de IA
- Reglas de negocio (cooldowns, balances)

```typescript
// commands/economy/daily.ts — ejemplo orientativo
import { Command } from '@sapphire/framework';
import type { ChatInputCommandInteraction } from 'discord.js';

export class DailyCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, { ...options, name: 'diario', description: 'Reclama tu recompensa diaria' });
  }

  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const economy = this.container.economyService;
    const result = await economy.claimDaily(interaction.user.id);

    if (result.isErr()) {
      return interaction.reply({ content: result.error.message, ephemeral: true });
    }

    return interaction.reply({
      content: `¡Has reclamado **${result.value.amount}** monedas!`,
    });
  }
}
```

### 5.2 Domain (services)

- Reglas de negocio puras
- Retornan `Result<T, E>` o lanzan errores de dominio tipados
- Sin imports de `discord.js`

```typescript
// domain/economy/economy.service.ts
export class EconomyService {
  constructor(private readonly users: UserRepository) {}

  async claimDaily(userId: string): Promise<Result<DailyReward, DailyError>> {
    // cooldown check, random amount, persist
  }
}
```

### 5.3 Infrastructure

- Drizzle queries encapsuladas en repositories
- Clients HTTP con timeout
- Providers LLM
- Mapeo DB row ↔ domain types

### 5.4 Content

- TOML/JSON de personalidad, lore, endpoints
- Versionados con el repo
- Cargados al bootstrap, inyectados en services

---

## 6. Sapphire: piezas y convenciones

### 6.1 Tipos de piezas

| Pieza | Uso en Tatiana |
|---|---|
| `commands/` | Slash commands |
| `listeners/` | `ready`, menciones IA, automod |
| `preconditions/` | Owner, moderator, guild-only |
| `interaction-handlers/` | Botones/modals del RPG (Fase 4) |

### 6.2 Registro de comandos

- Desarrollo: registrar en guild de test (`registerApplicationCommands: { guildIds: [DEV_GUILD_ID] }`)
- Producción: registro global tras validar en guild test

### 6.3 Preconditions

```typescript
// preconditions/OwnerOnly.ts
import { Precondition } from '@sapphire/framework';
import type { CommandInteraction } from 'discord.js';
import { env } from '../config/env';

export class OwnerOnlyPrecondition extends Precondition {
  public override async chatInputRun(interaction: CommandInteraction) {
    return interaction.user.id === env.AUTHORIZED_USER_ID
      ? this.ok()
      : this.error({ message: 'No tienes permiso para este comando.' });
  }
}
```

Uso: `@ApplyPreconditions(OwnerOnlyPrecondition)` en commands admin.

### 6.4 Container extendido

Extender el container de Sapphire para services:

```typescript
// lib/container.ts
import { container } from '@sapphire/framework';
import type { EconomyService } from '../domain/economy/economy.service';

declare module '@sapphire/pieces' {
  interface Container {
    economyService: EconomyService;
    chatService: ChatService;
  }
}

export function registerContainer(services: ContainerServices) {
  container.economyService = services.economy;
  container.chatService = services.chat;
}
```

### 6.5 Organización de comandos

Preferir **carpetas por dominio**, no un archivo gigante:

```
commands/
  economy/
    balance.ts    → /saldo
    daily.ts      → /diario
    transfer.ts   → /transferir
```

Para grupos slash, usar `@sapphire/plugin-subcommands`:

```
/economia saldo
/economia diario
/economia transferir
```

Decisión pendiente Fase 1: comandos planos (`/saldo`) vs grupo (`/economia saldo`). **Recomendación:** planos al inicio (paridad con legacy), migrar a grupos si crece.

---

## 7. Configuración y entorno

### 7.1 Schema Zod

```typescript
// config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  DISCORD_TOKEN: z.string().min(1),
  GROQ_API_KEY: z.string().min(1),
  AUTHORIZED_USER_ID: z.string().regex(/^\d+$/),

  // Opcionales
  DEV_GUILD_ID: z.string().regex(/^\d+$/).optional(),
  STATUS_CHANNEL_ID: z.string().regex(/^\d+$/).optional(),
  DATABASE_URL: z.string().default('file:./data/tatiana.db'),

  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);
```

### 7.2 Variables de entorno

Ver `.env.example` en la raíz. Reglas:

- **Requeridas:** `DISCORD_TOKEN`, `GROQ_API_KEY`, `AUTHORIZED_USER_ID`
- **Opcionales:** canales de status, guild de dev
- **Eliminadas del legacy:** `GEMINI_*`, `SPOTIFY_*`, `GITHUB_*` (hasta Fase 6 si se necesitan)

### 7.3 Intents

Mínimos necesarios:

```typescript
import { GatewayIntentBits } from 'discord.js';

const intents = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent, // IA por mención
];
```

Habilitar `Message Content Intent` en Discord Developer Portal.

---

## 8. Base de datos

### 8.1 Drizzle + SQLite (dev/prod inicial)

```typescript
// infrastructure/db/schema/users.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  discordId: text('discord_id').notNull().unique(),
  balance: integer('balance').notNull().default(0),
  lastDailyAt: integer('last_daily_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
```

### 8.2 Repositories

Un repository por agregado:

```typescript
// infrastructure/db/repositories/user.repository.ts
export class UserRepository {
  constructor(private readonly db: Database) {}

  async findByDiscordId(discordId: string): Promise<User | null> { /* ... */ }
  async upsert(user: NewUser): Promise<User> { /* ... */ }
}
```

### 8.3 Migraciones

- Toda modificación de schema → migración Drizzle
- Nunca alterar DB a mano en producción
- Script: `npm run db:generate` → `npm run db:migrate`

### 8.4 Modelo inicial (Fase 0–1)

```
users
conversation_messages (guild_id, user_id, role, content, created_at)
status_messages (channel_id, message_id)
```

Modelos posteriores según [roadmap.md](./roadmap.md).

---

## 9. Sistema de IA

### 9.1 Arquitectura

```
chat-mention listener
    → ChatService.handleMessage(userId, guildId, content)
        → MemoryService.getHistory(guildId, userId)
        → PromptBuilder.build(persona, lore, history)
        → GroqProvider.complete/stream
        → MemoryService.append(...)
        → respuesta chunked (≤2000 chars)
```

### 9.2 Memoria

| Regla | Valor orientativo |
|---|---|
| Scope | `(guildId, userId)` |
| Ventana | Últimos 20 mensajes o ~8k tokens |
| System prompt | Siempre presente, no duplicar al cargar |
| Persistencia | DB (`conversation_messages`) |

### 9.3 Persona

Migrar contenido de `legacy/src/tatiana/tatiana_config.toml` a `src/content/persona.toml`.

Variables interpolables: `{botName}`, `{creatorName}`, `{version}`.

### 9.4 Streaming

Preferir streaming a Discord (editar mensaje progresivamente) para UX:

```typescript
const stream = await groq.chat.completions.create({ ..., stream: true });
// Acumular chunks, editar reply cada ~500ms (respetar rate limits)
```

### 9.5 Power control

**No** usar tokens mágicos (`&shutdown`) en respuestas del LLM.

Apagar/reiniciar **solo** vía commands admin con precondition `OwnerOnly`.

---

## 10. HTTP y APIs externas

### 10.1 Client base

```typescript
export class HttpClient {
  constructor(
    private readonly baseUrl: string,
    private readonly timeoutMs = 10_000,
  ) {}

  async get<T>(path: string): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(`${this.baseUrl}${path}`, { signal: controller.signal });
      if (!res.ok) throw new HttpError(res.status, path);
      return res.json() as Promise<T>;
    } finally {
      clearTimeout(timeout);
    }
  }
}
```

### 10.2 APIs del proyecto

| API | Uso | Fase |
|---|---|---|
| Groq | IA | 1 |
| PokeAPI | Pokémon | 3 |
| YGOProDeck | Yu-Gi-Oh! | 3 |
| nekos.best | Anime GIFs | 2 |
| meme-api.com | Memes | 2 |

### 10.3 Rate limiting

Implementar cooldown por `(userId, commandName)` en memoria o DB para comandos costosos.

---

## 11. Logging y observabilidad

### 11.1 Pino

```typescript
import pino from 'pino';

export const logger = pino({
  level: env.LOG_LEVEL,
  transport: env.NODE_ENV === 'development'
    ? { target: 'pino-pretty' }
    : undefined,
});
```

### 11.2 Qué loguear

| Nivel | Ejemplos |
|---|---|
| `info` | Bot ready, comandos registrados, migraciones |
| `warn` | Canal status no encontrado, API lenta |
| `error` | Fallo Groq, DB error, unhandled rejection |
| `debug` | Payloads IA (sin secrets), queries |

### 11.3 No repetir del legacy

- No monkey-patchear logger para monitor Discord
- Monitor opcional en Fase 6; métricas > editar topic de canal

---

## 12. Testing

### 12.1 Pirámide

```
        /  E2E manual Discord  \
       /   Integration (DB)    \
      /     Unit (services)      \
```

### 12.2 Qué testear (obligatorio)

| Capa | Ejemplos |
|---|---|
| Services | Cooldown daily, transfer insuficiente balance, trim memoria |
| Repositories | CRUD users (DB in-memory SQLite) |
| Providers | GroqProvider con mock fetch |
| Commands | Opcional; preferir testear service |

### 12.3 Vitest

```typescript
// domain/economy/economy.service.test.ts
describe('EconomyService.claimDaily', () => {
  it('rechaza si el cooldown no expiró', async () => {
    // ...
  });
});
```

### 12.4 CI mínima

```yaml
# .github/workflows/ci.yml
- run: npm ci
- run: npm run lint
- run: npm run typecheck
- run: npm test
```

---

## 13. Seguridad

1. **Secrets solo en `.env`** — nunca en repo
2. **Validar IDs** de Discord como strings numéricos
3. **Preconditions** para todo comando admin/mod
4. **Sanitizar input** antes de enviar a LLM (no confiar ciegamente)
5. **No ejecutar** código/arbitrary commands desde respuestas IA
6. **Rate limit** comandos sensibles (transfer, catch)
7. **Dependabot** activo para npm audit

---

## 14. Errores y UX en Discord

### 14.1 Patrón Result

```typescript
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

function ok<T>(value: T): Result<T, never> { return { ok: true, value }; }
function err<E>(error: E): Result<never, E> { return { ok: false, error }; }
```

### 14.2 Mensajes al usuario

- Errores esperados → `ephemeral: true`, mensaje claro en español
- Errores inesperados → log + "Algo salió mal, inténtalo más tarde"
- Nunca stack traces en Discord

### 14.3 Chunking de mensajes largos

Utilidad compartida para respuestas IA >2000 caracteres:

```typescript
export function chunkMessage(text: string, max = 2000): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += max) {
    chunks.push(text.slice(i, i + max));
  }
  return chunks;
}
```

---

## 15. Migración desde legacy

### 15.1 Qué portar (contenido)

| Asset legacy | Destino v2 |
|---|---|
| `legacy/src/tatiana/tatiana_config.toml` | `src/content/persona.toml` |
| `legacy/src/game/json/lore.json` | `src/content/lore/aethoria.json` |
| `legacy/src/assets/*` | `assets/` |
| Lista de comandos slash | Paridad en roadmap |

### 15.2 Qué NO portar (código)

- `plugins/` + `plugins/commands/` duplicados
- `gemini_interface.py`
- `music.py` con yt-dlp
- Session SQLAlchemy global
- Monitor con monkey-patch

### 15.3 Script de datos (Fase 6)

Si hay usuarios activos en `legacy/src/data/bot_database.sqlite`:

```
scripts/migrate-legacy-data.ts
  → leer SQLite legacy
  → mapear users, balance, pokemon, yugioh
  → insertar en Drizzle DB v2
```

Si no hay usuarios reales → empezar DB limpia.

---

## 16. Scripts y comandos npm

Definir en `package.json` desde Fase 0:

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "lint": "eslint src --max-warnings 0",
    "lint:fix": "eslint src --fix",
    "format": "prettier --write .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio"
  }
}
```

---

## 17. Decisiones arquitectónicas (ADR)

| ID | Decisión | Razón | Fecha |
|---|---|---|---|
| ADR-001 | TypeScript + Sapphire | Tipado, plugins modulares, ecosistema Discord | 2026-08 |
| ADR-002 | Slash-only público | Eliminar duplicación legacy | 2026-08 |
| ADR-003 | Groq como LLM default | Ya usado, SDK oficial, bajo latency | 2026-08 |
| ADR-004 | Drizzle + SQLite | Ligero, migraciones, async path a Postgres | 2026-08 |
| ADR-005 | Lavalink para música | Estándar industria; no audio in-process | 2026-08 |
| ADR-006 | Memoria IA por user+guild | Fix memoria global legacy | 2026-08 |
| ADR-007 | No power control vía LLM | Seguridad; solo commands owner | 2026-08 |

Nuevas decisiones significativas → añadir fila aquí antes de implementar.

---

## 18. Anti-patrones del legacy (no repetir)

| Anti-patrón legacy | Solución v2 |
|---|---|
| Slash + prefijo duplicados | Solo slash |
| `session` SQLAlchemy global | Repository + query por operación |
| `generate_text()` sync | async/await + stream |
| Memoria IA global | Scope por guild+user en DB |
| `int(os.getenv())` sin default | Zod con required/optional claro |
| 80 deps, mitad muertas | deps auditadas, `package.json` mínimo |
| Avatar edit en cada `onReady` | Avatar fijo; status en embed |
| Plugins autoload sin tipos | Sapphire pieces explícitas |
| Lógica de negocio en cog | Services en domain |
| `!update` que no despliega | `/changelog` honesto o deploy real |

---

## Referencias

- [Sapphire Documentation](https://www.sapphirejs.dev/docs)
- [discord.js Guide](https://discordjs.guide/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Groq SDK](https://console.groq.com/docs/libraries)
- [Roadmap del proyecto](./roadmap.md)

---

**Siguiente paso:** implementar [Fase 0 del roadmap](./roadmap.md) — scaffold del proyecto.
