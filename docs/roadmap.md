# Roadmap — TatianaBot v2

Plan de implementación incremental. Cada fase debe ser **desplegable por sí sola** antes de pasar a la siguiente.

---

## Resumen visual

```
Fase 0 ──► Fase 1 ──► Fase 2 ──► Fase 3 ──► Fase 4 ──► Fase 4b ──► Fase 5 ──► Fase 6
Esqueleto   MVP       Social    Catch       Mod/RPG     Gameplay    Música     Pulido
  │           │          │         │           │           │           │          │
  └─ bot vivo └─ IA+$   └─ memes  └─ poke/ygo └─ embeds  └─ XP/quests └─ opcional └─ deploy
                                                         combate
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
- [x] Preferir Discord AutoMod nativo donde aplique
- [x] Custom: log channel, reglas words/spam/links, acciones auditables
- [x] Comandos admin con precondiciones de rol

#### Embeds
- [x] CRUD embeds: crear, listar, editar, publicar, preview
- [x] Persistencia en DB

#### RPG (shell)
- [x] `/adventure` — creación con modals/selects (port UX legacy)
- [x] `/character` — perfil
- [x] `/character-delete`
- [x] Razas conectadas a stats reales (bonus aplicados)
- [x] `/lore` — consulta lore de Aethoria

### Criterios de aceptación

- Automod no bloquea el event loop en guilds grandes
- RPG: bonuses de raza visibles en stats finales
- Embeds publicables por moderadores autorizados

### Decisión (cerrada 2026-09-11)

**Sí hay gameplay.** El shell de Fase 4 se mantiene; el progreso activo se diseña e implementa en **Fase 4b** (abajo).

El legacy Python **no** tenía combate, quests ni inventario RPG: solo ficha + lore. 4b es diseño nuevo, no un port mecánico.

---

## Fase 4b — RPG gameplay (Aethoria)

**Objetivo:** Convertir la ficha cosmética en un loop jugable ligero en Discord: progresión (XP/nivel), exploración, quests y combate por turnos — alimentado por el lore de Aethoria.

**Duración estimada:** 3–5 semanas (4 subfases desplegables)

**Dependencias:** Fase 4 (shell) ✅ · economía (`coins`) para recompensas · content packs JSON

### Pilares de diseño

1. **Async / Discord-native** — combate y quests por embeds + botones/selects; sin realtime ni minijuegos de timing
2. **Content-driven** — enemigos, lugares, quests y loot en `src/content/rpg/*.json`; código genérico en `domain/rpg/`
3. **Un personaje por usuario** — reutilizar tabla `characters` (ya unique por `discordId`)
4. **PvE primero** — sin PvP en 4b
5. **Cada subfase desplegable** — el bot queda usable tras 4b.1, 4b.2, etc.
6. **Economía puente** — recompensas pueden dar `coins` además de XP/loot (no duplicar un segundo currency)

### Fuera de alcance (4b)

- PvP / arenas / guild wars
- Mundo abierto persistente en tiempo real
- Crafting profundo o economía de mercado entre jugadores
- Generación de quests vía LLM (demasiado no-determinista; lore sí, mecánicas no)
- Múltiples personajes por usuario
- Housing / gremios

### Estado de partida (ya existe)

| Pieza | Estado |
|---|---|
| Creación `/adventure` + selects | ✅ |
| Perfil `/character` + delete | ✅ |
| Stats + race bonuses | ✅ |
| `level` / `experience` en DB | ✅ columnas stub (siempre 1 / 0) |
| `/lore` + `aethoria.json` | ✅ |
| Primordial combos ricos (legacy ~45) | ❌ solo `primordialDefaults` |
| Combate / quests / inventario / travel | ❌ |

### Content a crear

| Pack | Path propuesto | Contenido |
|---|---|---|
| Lugares jugables | `src/content/rpg/locations.json` | Lumina, Ironhold, Bosque Susurrante, Aetherpolis, Abismo (+ viajes) |
| Enemigos | `src/content/rpg/enemies.json` | Criaturas del lore + genericos por zona |
| Quests | `src/content/rpg/quests.json` | Cadenas cortas atadas a lugares/facciones |
| Loot / ítems | `src/content/rpg/items.json` | Consumibles, equipo simple, artefactos lore |
| Primordiales | ampliar `catalog.json` | Portar mapa legacy de combos clase×clase |

### Modelo de datos (nuevo / ampliar)

Ampliar `characters` o tablas satélite (preferir satélite para no inflar la ficha):

| Tabla | Uso |
|---|---|
| `characters` | + `location_id`, `hp_current`, `mana_current` (level/xp ya existen) |
| `character_inventory` | `discord_id`, `item_id`, `qty`, `equipped_slot?` |
| `character_quests` | quest activa/completada, step actual |
| `combat_sessions` | opcional en DB o registry TTL (como adventure); preferir **registry + snapshot** si es corto |

Migraciones Drizzle por subfase.

### Comandos previstos

| Comando | Subfase | Descripción |
|---|---|---|
| `/character` (ampliado) | 4b.1 | Barra XP, nivel, ubicación, HP/mana actuales |
| `/explore` | 4b.2 | Viajar / encontrar evento en la ubicación actual |
| `/quest` | 4b.2 | Listar / aceptar / avanzar / abandonar |
| `/fight` o combate vía botones de `/explore` | 4b.3 | Turnos: atacar / habilidad / huir / ítem |
| `/inventory` | 4b.4 | Ver / usar / equipar |
| `/rest` | 4b.1 o 4b.3 | Recuperar HP/mana (cooldown) |

Handlers en `interaction-handlers/` (patrón adventure). Lógica en `domain/rpg/*`.

---

### 4b.1 — Progresión y cimientos

**Objetivo:** XP/nivel reales + catálogo primordial completo + HP/mana actuales.

**Duración:** ~1 semana

#### Entregables

- [ ] Curva XP (tabla o fórmula documentada; p. ej. `xpToNext = 50 * level^1.5`)
- [ ] `ProgressionService`: `grantXp`, level-up (sube stats base o puntos), caps
- [ ] `/character` muestra nivel, XP actual/siguiente, HP/mana
- [ ] `/rest` con cooldown (p. ej. 1 h) → restaura HP/mana
- [ ] Ampliar `catalog.json` con combos primordiales legacy
- [ ] Migración: `location_id` (default Lumina), `hp_current`, `mana_current`
- [ ] Tests: grantXp, level-up, rest cooldown

#### Criterios de aceptación

- Matar/completar nada aún, pero un comando de test interno o seed de owner puede otorgar XP
- Level-up persiste y se refleja en `/character`
- Primordial en creación respeta combos válidos clase primaria×secundaria

#### Fuera de 4b.1

Combate, quests, inventario

---

### 4b.2 — Exploración y quests

**Objetivo:** Moverse por Aethoria y completar misiones narrativas cortas.

**Duración:** ~1–1.5 semanas

#### Entregables

- [ ] `locations.json` (mín. 5 lugares del lore) + adyacencias
- [ ] `QuestService` + `quests.json` (mín. 5 quests; al menos 1 cadena de 2–3 pasos)
- [ ] `/explore` — opciones: viajar a adyacente / buscar (evento aleatorio ponderado por zona)
- [ ] `/quest list|accept|status|abandon`
- [ ] Eventos de exploración: flavor text, hallazgo menor (coins/XP), o enganche a quest
- [ ] Recompensas: XP + coins vía `EconomyService`
- [ ] Tests: aceptar quest, avanzar paso, completar, viajar inválido

#### Criterios de aceptación

- Un jugador nuevo puede: crear ficha → viajar a otro lugar → aceptar quest → completar paso/es → ver XP/coins
- Quests y lugares se añaden editando JSON, sin tocar el command handler
- Rate limit en `/explore` (anti-spam)

#### Hooks de lore (ejemplos)

| Lugar | Idea de quest |
|---|---|
| Lumina | Encargo del Archivo Arcano |
| Ironhold | Escolta de caravana enana |
| Bosque Susurrante | Rastro de una criatura del lore |
| Aetherpolis | Encargo de facción tecnológica |
| Abismo | Investigación peligrosa (mayor XP, mayor riesgo en 4b.3) |

---

### 4b.3 — Combate por turnos (PvE)

**Objetivo:** Encuentros PvE resolubles en Discord sin bloquear el bot.

**Duración:** ~1–1.5 semanas

#### Entregables

- [ ] `enemies.json` (mín. 8 enemigos; tiers por ubicación)
- [ ] `CombatService`: iniciativa simple, turnos jugador/enemigo, daño basado en stats de clase
- [ ] UI: embed de combate + botones `Atacar` / `Habilidad` / `Ítem` (stub hasta 4b.4) / `Huir`
- [ ] Sesión de combate con TTL (registry; cleanup al ganar/perder/huir/timeout)
- [ ] Derrota: HP → 1, sin wipe de inventario; cooldown corto antes de reintentar
- [ ] Victoriaoria: XP + coins + chance de loot (tabla por enemigo)
- [ ] Integrar encuentros hostiles en `/explore` (probabilidad por zona)
- [ ] Tests: daño, huida, victoria, timeout de sesión

#### Criterios de aceptación

- Combate completo en < 10 turnos típicos
- No hay race conditions graves si el usuario spamea botones (idempotencia por turno)
- Stats de raza/clase influyen de forma observable (Warrior pega más; Mage gasta mana)

#### Fuera de 4b.3

Estado alterados complejos, combos, multi-enemigo (1v1 suficiente)

---

### 4b.4 — Inventario y pulido

**Objetivo:** Ítems usables/equipables y cierre del loop.

**Duración:** ~1 semana

#### Entregables

- [ ] `items.json` + tabla `character_inventory`
- [ ] `/inventory` — listar, usar consumible, equipar arma/armadura simple (1 slot arma, 1 armadura)
- [ ] Modificadores de equipo en combate
- [ ] Botón `Ítem` en combate funcional
- [ ] `/character` muestra equipo + ubicación
- [ ] 2–3 artefactos del lore como loot raro
- [ ] Tests: equipar, usar poción en combate, stack de consumibles
- [ ] ADR-009 documentado en `desarrollo.md`

#### Criterios de aceptación

- Loop cerrado: explorar → pelear → loot → equipar/usar → quest → level up
- Content packs documentados en `docs/` (sección corta en desarrollo o README rpg)

#### Stretch (solo si sobra tiempo)

- Reputación con 1–2 facciones
- Segunda habilidad por clase
- `/party` cosmético (sin combate cooperativo)

---

### Definition of Done — Fase 4b

Además del DoD global:

1. Las 4 subfases mergeadas o claramente versionadas (changelog)
2. Content packs versionados; cero enemigos/quests hardcodeados en commands
3. Tests de progresión, quests y combate
4. `/lore` sigue coherente con lugares/criaturas jugables
5. Sin PvP ni crafting profundo

### Orden de implementación recomendado

```
4b.1 progresión ──► 4b.2 explore/quests ──► 4b.3 combate ──► 4b.4 inventario
```

No empezar combate antes de tener XP y al menos un lugar/quest, para poder probar recompensas de punta a punta.

---

## Fase 5 — Música (opcional)

**Objetivo:** Reproducción estable vía Lavalink.

**Duración estimada:** 2 semanas + infra Lavalink

### Entregables

- [x] Lavalink v4 (Docker o servicio externo)
- [x] Shoukaku integrado
- [x] `/join`, `/play`, `/pause`, `/skip`, `/queue`, `/leave` (+ `/resume`)
- [x] Cola en memoria con persistencia opcional

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
- [x] Panel de changelog vía `/changelog` (reemplaza `!update` falso)
- [x] Documentación de deploy (Docker, VPS, Railway, etc.)
- [x] Métricas básicas (uptime, comandos/min) — `/stats` + status embed
- [x] Privacy policy / ToS actualizados

---

## Priorización recomendada

| Prioridad | Fase | Razón |
|---|---|---|
| P0 | 0, 1 | Bot vivo con IA + economía |
| P1 | 2, 3 | Engagement de comunidad |
| P2 | 4 | Mod + RPG shell |
| P2b | **4b** | Gameplay Aethoria (tras shell; incremental) |
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
| Scope creep en RPG | Shell en Fase 4; gameplay solo vía **4b** con subfases y fuera-de-alcance explícito |
| Combate spameable / race conditions | Turnos idempotentes + TTL de sesión + rate limit explore |
| Content explosion | Mínimos por subfase (5 lugares, 5 quests, 8 enemigos); JSON antes que features |
| Lavalink ops complejas | Fase 5 opcional; documentar hosting |
| Rate limits Discord/Groq | Colas, backoff, límites por usuario |
| Migración datos legacy | Script solo si hay usuarios activos; si no, empezar limpio |

---

## Próximo paso inmediato

**Fase 4b.1** — progresión XP/nivel, `/rest`, primordiales legacy y campos `location_id` / HP-mana actuales.

Opcional en paralelo: script de migración legacy → v2 (Fase 6) si hay usuarios del bot Python.
