# 🤖 Tatiana Discord AI Bot

<div align="center">

![Discord Bot](https://img.shields.io/badge/Discord-Bot-7289DA?style=for-the-badge&logo=discord&logoColor=white)
![Groq AI](https://img.shields.io/badge/Groq-AI-f55036?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)
![Sapphire](https://img.shields.io/badge/Sapphire-Framework-5865F2?style=for-the-badge)

[![Versión](https://img.shields.io/badge/versión-2.0.0-blue.svg)](CHANGELOG.md)
[![Licencia MIT](https://img.shields.io/badge/licencia-MIT-blue.svg)](LICENSE.md)
[![Únete a nuestra familia](https://img.shields.io/badge/¡Únete%20a%20nuestra%20familia!-FF69B4?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/2xjXpztFnY)

</div>

---

## 📌 Descripción

Tatiana es un bot de Discord con personalidad propia, ambientado en el mundo de **Aethoria**. Combina conversación con IA (Groq), utilidades de comunidad y minijuegos, con una arquitectura modular pensada para crecer sin deuda técnica.

**v2** es un rewrite completo en **TypeScript + Sapphire + Bun**. El código Python anterior permanece en `legacy/` solo como referencia.

---

## ✨ Características

### Disponibles (v2.5.0 — Fase 5)

- 🏓 `/ping` — latencia
- 💡 `/help` — lista de comandos
- 💰 `/balance`, `/daily`, `/transfer` — economía
- 🔌 `/shutdown`, `/restart` — admin (owner)
- 🧠 Chat IA por mención/reply (Groq + Aethoria)
- 🎱 `/8ball` — bola 8
- 😂 `/meme` — memes aleatorios
- 🎭 `/anime` — reacciones GIF (config en `anime-actions.json`)
- 📊 `/poll` — encuestas con reacciones
- 🐾 `/pokemon`, `/pokedex` — captura Gen 1 (PokeAPI)
- 🃏 `/yugioh`, `/deck` — cartas Yu-Gi-Oh! (YGOProDeck)
- 🔧 `/automod` — moderación custom (+ tip Discord AutoMod nativo)
- 🖼️ `/embed` — CRUD de embeds guardados
- 🗡️ `/adventure`, `/character`, `/character-delete` — ficha RPG
- 📚 `/lore` — lore de Aethoria
- 🎵 `/join`, `/play`, `/pause`, `/resume`, `/skip`, `/queue`, `/leave` — música (Lavalink)
- 🗄️ Persistencia SQLite (`bun:sqlite` + Drizzle)

### En roadmap

| Fase | Features |
|---|---|
| 4b | Gameplay RPG (si se decide) |
| 6 | Pulido / migración |

Ver [docs/roadmap.md](docs/roadmap.md) para el plan completo.

---

## 🏆 Patrocinadores

Agradecemos el apoyo de nuestros patrocinadores:

### Encantia Network

<div align="center">

[![Encantia Network](https://img.shields.io/badge/Encantia-Network-brightgreen?style=for-the-badge&logo=minecraft&logoColor=white)](https://discord.gg/9fZfY2Ynvu)

**IP Java:** `encantia.lat`  
**IP Bedrock:** `bedrock.encantia.lat:26036`

[¡Únete a la comunidad de Encantia!](https://discord.gg/9fZfY2Ynvu)

</div>

---

## 🚀 Inicio rápido

### Requisitos

- **[Bun](https://bun.sh/) 1.2+**
- Cuenta de Discord con permisos para crear bots
- Clave API de [Groq](https://console.groq.com/)

### Instalación

```bash
git clone https://github.com/ItsJhonAlex/TatianaBot.git
cd TatianaBot
bun install
cp .env.example .env
```

Completa `.env` con:

```env
DISCORD_TOKEN=tu_token
GROQ_API_KEY=tu_clave_groq
AUTHORIZED_USER_ID=tu_id_de_discord
```

Opcional en desarrollo (registro instantáneo de slash commands):

```env
DEV_GUILD_ID=id_de_tu_servidor_de_pruebas
```

### Arrancar

```bash
bun run dev      # desarrollo con hot reload
bun run start    # producción (Bun ejecuta TypeScript directo)
bun run typecheck
```

### Scripts útiles

| Comando | Descripción |
|---|---|
| `bun test` | Ejecutar tests |
| `bun run lint` | ESLint |
| `bun run typecheck` | Verificación TypeScript |
| `bun run db:migrate` | Aplicar migraciones |
| `bun run db:generate` | Generar migración tras cambiar schema |

---

## 📁 Estructura del proyecto

```
TatianaBot/
├── src/                    # Código fuente v2
│   ├── commands/           # Slash commands (Sapphire)
│   ├── listeners/          # Event listeners
│   ├── config/             # Env, metadata
│   ├── domain/             # Lógica de negocio (fases futuras)
│   └── infrastructure/     # DB, HTTP, LLM
├── docs/                   # Documentación técnica y legal
├── legacy/                 # Bot Python v1 (referencia)
├── .env.example
└── package.json
```

Documentación detallada: [docs/desarrollo.md](docs/desarrollo.md)

---

## 🤝 Contribuir

Las contribuciones son bienvenidas. Lee [CONTRIBUTING.md](CONTRIBUTING.md) antes de abrir un PR.

1. Fork del repositorio
2. Rama feature: `git checkout -b feature/mi-feature`
3. Cambios + tests
4. `bun run lint && bun test && bun run typecheck`
5. Pull Request

---

## 📜 Legal

- [Términos de Servicio](docs/terms-of-service.md)
- [Política de Privacidad](docs/privacy-policy.md)
- [Código de Conducta](CODE_OF_CONDUCT.md)
- [Licencia MIT](LICENSE.md)

---

## 📚 Documentación

| Documento | Contenido |
|---|---|
| [docs/desarrollo.md](docs/desarrollo.md) | Arquitectura, convenciones, stack |
| [docs/roadmap.md](docs/roadmap.md) | Plan de implementación por fases |
| [CHANGELOG.md](CHANGELOG.md) | Historial de versiones |

---

<div align="center">

![Hecho con amor](https://img.shields.io/badge/Hecho%20con-❤️-ff69b4.svg)

Desarrollado con pasión por [ItsJhonAlex](https://github.com/ItsJhonAlex)

</div>
