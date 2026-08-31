# Roadmap — TatianaBot v2

Plan de implementación incremental. Cada fase debe ser **desplegable por sí sola** antes de pasar a la siguiente.

---

## Resumen visual

```
Fase 0 ──► Fase 1 ──► Fase 2 ──► Fase 3 ──► Fase 4 ──► Fase 5
Esqueleto   MVP       Social    Catch       Mod/RPG     Música
  │           │          │         │           │           │
  └─ bot vivo └─ IA+$   └─ memes  └─ poke/ygo └─ embeds  └─ opcional
```

---

## Fase 0 — Esqueleto del proyecto

**Objetivo:** Bot arranca, responde a `/ping`, persiste datos básicos, CI verde.

**Duración estimada:** 2–4 días

### Entregables

- [x] Scaffold TypeScript + Sapphire (`package.json`, `tsconfig`, ESLint, Prettier)
- [x] Estructura de carpetas según [desarrollo.md](./desarrollo.md)
- [x] Config con Zod + `.env.example` actualizado
- [x] Drizzle ORM + SQLite + primera migración
- [x] Comando `/ping` con latencia
- [x] Logger estructurado (pino)
- [x] Scripts: `dev`, `build`, `start`, `lint`, `test`, `db:migrate`
- [x] GitHub Actions: lint + typecheck + test

### Criterios de aceptación

- `bun run dev` conecta el bot a Discord sin errores
- `/ping` responde con latencia en ms
- Variables faltantes muestran error claro al arrancar
- Tests mínimos pasan en CI

### Fuera de alcance

- IA, economía, plugins sociales, música

---

## Fase 1 — MVP funcional

**Objetivo:** Tatiana conversa con personalidad; economía básica; ayuda; ops de owner.

**Duración estimada:** 1–2 semanas

### Entregables

- [x] Content pack: `persona.toml` + migración de lore desde legacy
- [x] `LLMProvider` + `GroqProvider` con streaming
- [x] Memoria por `(guildId, userId)` con límite de tokens
- [x] Listener: mención y reply → respuesta IA
- [x] `/help` dynamic (Sapphire help or custom)
- [x] Economy: `/balance`, `/daily`, `/transfer`
- [x] Status embed in configured channel (optional)
- [x] Owner: `/shutdown`, `/restart` with `OwnerOnly` precondition
- [x] Tests: economy, LLM mock, memory

### Criterios de aceptación

- Tatiana responde con tono Aethoria al ser mencionada
- Cada usuario tiene historial independiente
- Economía persiste entre reinicios
- Solo `AUTHORIZED_USER_ID` puede apagar/reiniciar
- IA no bloquea el event loop (async/stream)

### Comandos MVP

| Comando | Descripción |
|---|---|
| `/ping` | Latency |
| `/help` | Help menu |
| `/balance` | Coin balance |
| `/daily` | Daily reward |
| `/transfer` | Transfer coins |
| `/shutdown` | Shut down bot (owner) |
| `/restart` | Restart bot (owner) |

---

## Fase 2 — Social y engagement

**Objetivo:** Comandos ligeros de diversión sin duplicar lógica.

**Duración estimada:** 1 semana

### Entregables

- [x] `/8ball`
- [x] `/meme` (meme-api.com)
- [x] Interacciones anime vía tabla de endpoints (nekos.best) — mínimo 5, extensible
- [x] `/poll`
- [x] Abstracción `HttpClient` con timeout/retry
- [x] Rate limit por usuario en comandos costosos

### Criterios de aceptación

- Nuevos endpoints anime se añaden editando config, no copiando métodos
- APIs caídas muestran mensaje amigable, no crash
- Sin duplicación slash/prefijo

---

## Fase 3 — Catch games

**Objetivo:** Pokémon y Yu-Gi-Oh! con economía integrada.

**Duración estimada:** 1–2 semanas

### Entregables

- [x] Abstracción `CatchGameService` (intentos, cooldown, coste)
- [x] `/pokemon`, `/pokedex` (PokeAPI)
- [x] `/yugioh`, `/deck` (YGOProDeck)
- [x] Modelos DB: `pokemon`, `yugioh_cards`, `attempts`
- [x] Embeds consistentes con el resto del bot

### Criterios de aceptación

- Misma lógica de intentos para ambos juegos
- Inventario persiste y se muestra correctamente
- Tests de reglas de negocio (cooldown, balance)

---

## Fase 4 — Moderación, embeds y RPG

**Objetivo:** Herramientas de servidor y ficha de personaje (sin gameplay profundo aún).

**Duración estimada:** 2–3 semanas

### Entregables

#### Moderación
- [ ] Preferir Discord AutoMod nativo donde aplique
- [ ] Custom: log channel, reglas words/spam/links, acciones auditables
- [ ] Comandos admin con precondiciones de rol

#### Embeds
- [ ] CRUD embeds: crear, listar, editar, publicar, preview
- [ ] Persistencia en DB

#### RPG (shell)
- [ ] `/aventura` — creación con modals/selects (port UX legacy)
- [ ] `/personaje` — perfil
- [ ] `/eliminar_personaje`
- [ ] Razas conectadas a stats reales (bonus aplicados)
- [ ] `/lore` — consulta lore de Aethoria

### Criterios de aceptación

- Automod no bloquea el event loop en guilds grandes
- RPG: bonuses de raza visibles en stats finales
- Embeds publicables por moderadores autorizados

### Decisión pendiente (bloqueante para gameplay)

Antes de ir más allá del shell RPG, definir:

- ¿Habrá combate, quests, XP activo?
- Si no → RPG queda cosmético y se cierra la fase
- Si sí → abrir **Fase 4b** con diseño de gameplay

---

## Fase 5 — Música (opcional)

**Objetivo:** Reproducción estable vía Lavalink.

**Duración estimada:** 2 semanas + infra Lavalink

### Entregables

- [ ] Lavalink v4 (Docker o servicio externo)
- [ ] Shoukaku integrado
- [ ] `/unirse`, `/reproducir`, `/pausa`, `/saltar`, `/cola`, `/salir`
- [ ] Cola en DB o memoria con persistencia opcional

### Criterios de aceptación

- Audio estable en canal de voz
- Bot no procesa audio in-process (todo vía Lavalink)
- Documentación de deploy de Lavalink incluida

### Alternativa

**Omitir Fase 5** si la música no es prioridad. El bot es completo sin ella.

---

## Fase 6 — Pulido y migración (post-MVP)

**Objetivo:** Producción estable y migración de datos legacy si aplica.

### Entregables

- [ ] Script one-shot: migrar usuarios/balance/inventario SQLite legacy → v2
- [ ] Panel de changelog vía `/changelog` (reemplaza `!update` falso)
- [ ] Documentación de deploy (Docker, VPS, Railway, etc.)
- [ ] Métricas básicas (uptime, comandos/min) — opcional
- [ ] Privacy policy / ToS actualizados

---

## Priorización recomendada

| Prioridad | Fase | Razón |
|---|---|---|
| P0 | 0, 1 | Bot vivo con IA + economía |
| P1 | 2, 3 | Engagement de comunidad |
| P2 | 4 | Mod + RPG shell |
| P3 | 5 | Alto coste operativo |
| P4 | 6 | Cuando haya usuarios reales en prod |

---

## Definition of Done (global)

Una tarea/feature está **done** cuando:

1. Código en TypeScript strict, sin `any` innecesarios
2. Lógica de negocio en `domain/` o `services/`, no en el command handler
3. Tests para reglas de negocio críticas
4. Lint + typecheck pasan
5. Comportamiento documentado en el PR o en este doc si es feature nueva
6. Sin secrets en código; config vía env validada

---

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Scope creep en RPG | Fase 4 solo shell; gameplay requiere diseño explícito |
| Lavalink ops complejas | Fase 5 opcional; documentar hosting |
| Rate limits Discord/Groq | Colas, backoff, límites por usuario |
| Migración datos legacy | Script solo si hay usuarios activos; si no, empezar limpio |

---

## Próximo paso inmediato

**Ejecutar Fase 4:** moderación, embeds CRUD y shell RPG según [desarrollo.md](./desarrollo.md).
