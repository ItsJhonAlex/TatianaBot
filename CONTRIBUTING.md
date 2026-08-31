# Guía de contribución — TatianaBot

¡Gracias por tu interés en contribuir a TatianaBot!

[![Contribuciones bienvenidas](https://img.shields.io/badge/contribuciones-bienvenidas-brightgreen.svg?style=flat)](https://github.com/ItsJhonAlex/TatianaBot/issues)
[![Licencia MIT](https://img.shields.io/badge/licencia-MIT-blue.svg)](LICENSE.md)
[![Discord](https://img.shields.io/discord/1276749747339661332?color=7289DA&logo=discord&logoColor=white)](https://discord.gg/2xjXpztFnY)

---

## Tabla de contenidos

1. [Entorno de desarrollo](#entorno-de-desarrollo)
2. [Estructura del proyecto](#estructura-del-proyecto)
3. [Flujo de trabajo](#flujo-de-trabajo)
4. [Añadir un comando](#añadir-un-comando)
5. [Estilo de código](#estilo-de-código)
6. [Tests y calidad](#tests-y-calidad)
7. [Base de datos](#base-de-datos)
8. [Proceso de PR](#proceso-de-pr)
9. [Reportar problemas](#reportar-problemas)
10. [Contacto](#contacto)

---

## Entorno de desarrollo

### Requisitos

- [Bun](https://bun.sh/) **1.2+**
- Token de bot Discord
- API key de Groq

### Setup

```bash
git clone https://github.com/ItsJhonAlex/TatianaBot.git
cd TatianaBot
bun install
cp .env.example .env
```

Completa `.env` (ver [README.md](README.md)). Recomendado en dev:

```env
DEV_GUILD_ID=id_de_tu_servidor_de_pruebas
NODE_ENV=development
LOG_LEVEL=debug
```

### Arrancar

```bash
bun run dev
```

---

## Estructura del proyecto

```
src/
├── commands/           # Slash commands (Sapphire pieces)
├── listeners/          # Event listeners
├── preconditions/      # Guards (OwnerOnly, etc.)
├── config/             # Env (Zod), metadata del bot
├── domain/             # Services — lógica de negocio
├── infrastructure/     # DB, HTTP clients, LLM providers
└── index.ts            # Entry point
```

**Regla principal:** los commands no contienen lógica de negocio. Delegan a `domain/`.

Arquitectura completa: [docs/desarrollo.md](docs/desarrollo.md)  
Roadmap: [docs/roadmap.md](docs/roadmap.md)

---

## Flujo de trabajo

1. Revisa el [roadmap](docs/roadmap.md) — contribuye en la fase activa o abre un issue para discutir scope.
2. Crea una rama desde `main`:
   ```bash
   git checkout -b feature/nombre-descriptivo
   ```
3. Implementa con tests para lógica de negocio.
4. Verifica calidad:
   ```bash
   bun run lint
   bun run typecheck
   bun test
   ```
5. Abre un Pull Request con descripción clara del cambio y cómo probarlo.

---

## Añadir un comando

1. Crea un archivo en `src/commands/<categoria>/`:
   ```typescript
   import { Command } from '@sapphire/framework';
   import type { ChatInputCommandInteraction } from 'discord.js';

   export class MiComando extends Command {
     public constructor(context: Command.LoaderContext, options: Command.Options) {
       super(context, {
         ...options,
         name: 'mi_comando',
         description: 'Descripción del comando',
       });
     }

     public override registerApplicationCommands(registry: Command.Registry) {
       registry.registerChatInputCommand((builder) =>
         builder.setName(this.name).setDescription(this.description),
       );
     }

     public override async chatInputRun(interaction: ChatInputCommandInteraction) {
       // Delegar a un service del domain, no lógica aquí
       await interaction.reply({ content: 'Hola', ephemeral: true });
     }
   }
   ```

2. Sapphire lo carga automáticamente desde `src/commands/`.
3. En dev con `DEV_GUILD_ID`, el comando aparece al reiniciar el bot.

**No duplicar** comandos con prefijo. v2 es slash-only.

---

## Estilo de código

- **TypeScript strict** — evitar `any` innecesarios
- **ESLint + Prettier** — ejecutar antes del PR
- Nombres descriptivos en inglés para código, español para strings de usuario
- Imports con extensión `.js` (ESM + NodeNext)
- Comentarios solo para lógica no obvia

Convenciones detalladas: [docs/desarrollo.md §6](docs/desarrollo.md#6-sapphire-piezas-y-convenciones)

---

## Tests y calidad

| Qué testear | Dónde |
|---|---|
| Reglas de negocio | `domain/**/*.test.ts` |
| Validación config | `src/config/*.test.ts` |
| Repositories | Con SQLite in-memory |

```bash
bun test              # una vez
bun run test:watch    # modo watch
```

El CI rechaza PRs que fallen lint, typecheck o tests.

---

## Base de datos

1. Define el schema en `src/infrastructure/db/schema/`
2. Genera migración:
   ```bash
   bun run db:generate
   ```
3. Aplica:
   ```bash
   bun run db:migrate
   ```

No alteres la DB a mano en producción.

---

## Proceso de PR

1. Fork → rama feature → cambios
2. Commits claros (español o inglés, consistente en el PR)
3. PR contra `main` con:
   - Qué cambia y por qué
   - Cómo probarlo
   - Issue relacionado (si aplica)
4. Espera review; corrige feedback

Para cambios grandes (nueva fase del roadmap, breaking changes), **abre un issue primero**.

---

## Reportar problemas

1. Busca en [issues existentes](https://github.com/ItsJhonAlex/TatianaBot/issues)
2. Abre uno nuevo con:
   - Descripción del bug o feature
   - Pasos para reproducir
   - Comportamiento esperado vs actual
   - Versión de Node y commit (si aplica)

---

## Contacto

- Email: isenkidu@gmail.com
- Discord: [servidor de Tatiana](https://discord.gg/2xjXpztFnY)

---

¡Gracias por contribuir a TatianaBot!
