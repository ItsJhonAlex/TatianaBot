# 🤝 Guía de Contribución para Tatiana Discord AI Bot

<div align="center">

[![Contribuciones bienvenidas](https://img.shields.io/badge/contribuciones-bienvenidas-brightgreen.svg?style=flat)](https://github.com/ItsJhonAlex/TatianaBot/issues)
[![Licencia](https://img.shields.io/badge/licencia-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Discord](https://img.shields.io/discord/1276749747339661332?color=7289DA&logo=discord&logoColor=white)](https://discord.gg/2xjXpztFnY)

</div>

¡Gracias por tu interés en contribuir a Tatiana Discord AI Bot! Esta guía te ayudará a entender cómo puedes aportar al proyecto de manera efectiva.

## 📋 Tabla de Contenidos

1. [Configuración del Entorno de Desarrollo](#-configuración-del-entorno-de-desarrollo)
2. [Estructura del Proyecto](#-estructura-del-proyecto)
3. [Guía de Desarrollo](#-guía-de-desarrollo)
   - [Creación de Plugins](#-creación-de-plugins)
   - [Personalización del Bot](#️-personalización-del-bot)
   - [Comandos con Prefijo](#-comandos-con-prefijo)
4. [Estilo de Código](#-estilo-de-código)
5. [Proceso de Contribución](#-proceso-de-contribución)
6. [Reporte de Problemas](#-reporte-de-problemas)
7. [Contacto](#-contacto)

## 🛠 Configuración del Entorno de Desarrollo

1. **Clona el repositorio:**
   ```bash
   git clone https://github.com/ItsJhonAlex/TatianaBot.git
   cd TatianaBot
   ```

2. **Crea un entorno virtual:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # En Windows: venv\Scripts\activate
   ```

3. **Instala las dependencias:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configura las variables de entorno:**
   Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:
   ```
   DISCORD_TOKEN=tu_token_de_discord
   GEMINI_API_KEY=tu_clave_api_de_gemini
   CHANNEL_ID=id_del_canal_principal
   AUTHORIZED_USER_ID=tu_id_de_usuario
   STATUS_CHANNEL_ID=id_del_canal_de_estado
   ```

5. **Inicia el bot:**
   ```bash
   python main.py
   ```

## 📁 Estructura del Proyecto

```
TatianaBot/
├── src/
│   ├── bot/
│   ├── chat/
│   ├── config/
│   ├── core/
│   ├── data/
│   ├── plugins/
│   │   └── commands/
│   └── utils/
├── docs/
├── tests/
├── .env
├── main.py
├── README.md
└── requirements.txt
```

## 💻 Guía de Desarrollo

### 🔌 Creación de Plugins

1. Crea un nuevo archivo Python en `src/plugins/`
2. Define tu clase de plugin heredando de `commands.Cog`
3. Implementa tus comandos usando `@app_commands.command()`
4. Asegúrate de incluir la propiedad `name` y el método `get_commands()`
5. El bot cargará automáticamente tu plugin al iniciar

<details>
<summary>Ver ejemplo de plugin</summary>

```python
import discord
from discord import app_commands
from discord.ext import commands

class EjemploPlugin(commands.Cog):
    """
    Este es un plugin de ejemplo que muestra cómo crear un nuevo comando.
    """
    name = "🔧 Ejemplo"

    def __init__(self, bot):
        self.bot = bot

    @app_commands.command(name="saludar", description="Saluda al usuario")
    async def saludar(self, interaction: discord.Interaction):
        await interaction.response.send_message(f"¡Hola, {interaction.user.name}!")

    def get_commands(self):
        return [command for command in self.bot.tree.walk_commands() if command.binding == self]

async def setup(bot):
    await bot.add_cog(EjemploPlugin(bot))
```

</details>

Este plugin se integrará automáticamente con el sistema de menú de ayuda, apareciendo como "🔧 Ejemplo" en la lista de categorías.

### ⚙️ Personalización del Bot

- **Configuración global**: Modifica `src/config/settings.py`
  ```python:src/config/settings.py
  startLine: 1
  endLine: 29
  ```

- **Integración con IA**: Ajusta `src/chat/gemini_interface.py`
  ```python:src/chat/gemini_interface.py
  startLine: 6
  endLine: 65
  ```

- **Sistema de ayuda**: Personaliza `src/plugins/help.py`
  ```python:src/plugins/help.py
  startLine: 1
  endLine: 124
  ```

### 📝 Comandos con Prefijo

Los comandos con prefijo se manejan en archivos separados dentro de `src/plugins/commands/`.

<details>
<summary>Ver ejemplo de comando con prefijo</summary>

```python
from discord.ext import commands
import discord
import random

class EjemploComandos(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @commands.command(name="saludo", description="Saluda al usuario")
    async def saludo(self, ctx):
        await ctx.send(f"¡Hola, {ctx.author.name}!")

    @commands.command(name="dado", description="Tira un dado")
    async def dado(self, ctx):
        resultado = random.randint(1, 6)
        await ctx.send(f"🎲 El dado cayó en: {resultado}")

async def setup(bot):
    await bot.add_cog(EjemploComandos(bot))
```

</details>

Guarda este archivo en `src/plugins/commands/ejemplo_comandos.py` y el bot lo cargará automáticamente.

## 🎨 Estilo de Código

- Sigue las convenciones de [PEP 8](https://www.python.org/dev/peps/pep-0008/) para el estilo de código Python.
- Utiliza nombres descriptivos para variables, funciones y clases.
- Comenta tu código cuando sea necesario, especialmente para lógica compleja.
- Utiliza docstrings para documentar clases y funciones.

## 🔄 Proceso de Contribución

1. Crea un fork del repositorio.
2. Crea una nueva rama para tu característica: `git checkout -b feature/nueva-caracteristica`
3. Realiza tus cambios y haz commit: `git commit -am 'Añade nueva característica'`
4. Sube tus cambios a tu fork: `git push origin feature/nueva-caracteristica`
5. Crea un Pull Request en GitHub.

## 🐛 Reporte de Problemas

Si encuentras un bug o tienes una sugerencia:

1. Verifica que el problema no haya sido reportado anteriormente.
2. Abre un nuevo [issue](https://github.com/ItsJhonAlex/TatianaBot/issues/new), proporcionando una descripción clara y pasos para reproducir el problema.

## 📞 Contacto

Si tienes preguntas o necesitas ayuda, puedes:
- Enviarnos un email a isenkidu@gmail.com
- Unirte a nuestro [servidor de Discord](https://discord.gg/2xjXpztFnY)

---

<div align="center">

[![Hecho con ❤️](https://img.shields.io/badge/Hecho%20con-❤️-ff69b4.svg)](https://github.com/ItsJhonAlex/TatianaBot)

¡Gracias por contribuir a Tatiana Discord AI Bot! Tu ayuda es muy apreciada.

</div>