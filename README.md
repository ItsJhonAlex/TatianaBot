# 🤖 Tatiana Discord AI Bot

<div align="center">

<img src="src/assets/avatar.jpg" alt="Tatiana Bot Avatar" width="200" height="200" style="border-radius: 50%; box-shadow: 0 0 20px rgba(0, 123, 255, 0.5);">

![Discord Bot](https://img.shields.io/badge/Discord-Bot-7289DA?style=for-the-badge&logo=discord&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Gemini-AI-4285F4?style=for-the-badge&logo=google&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)

[![Únete a nuestra familia](https://img.shields.io/badge/¡Únete%20a%20nuestra%20familia!-FF69B4?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/2xjXpztFnY)

</div>

---

## 📌 Descripción

Tatiana es un bot de Discord avanzado que utiliza la API de Gemini AI para generar respuestas inteligentes. Con una estructura modular y fácil de expandir, Tatiana ofrece una experiencia de chat mejorada con IA, ideal para comunidades que buscan interacciones más dinámicas y personalizadas.

---

## ✨ Características principales

- 🔗 Integración perfecta con Discord usando `discord.py`
- 🧠 Generación de respuestas inteligentes con Gemini AI
- 🧩 Arquitectura modular con sistema de plugins automáticos
- 📚 Sistema de ayuda interactivo con menú de categorías y paginación
- ⚙️ Configuración centralizada y fácil de personalizar
- 🛠️ Robusto manejo de errores y sistema de logging
- 🔢 Soporte para comandos con prefijo y comandos de barra (/)
- 📊 Panel de estado del bot actualizado y visualmente atractivo

---

## 🚀 Guía de inicio rápido

### Requisitos previos

- Python 3.12+
- Cuenta de Discord con permisos para crear bots
- Clave API de Gemini AI

### Pasos de instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/ItsJhonAlex/TatianaBot
   cd TatianaBot
   ```

2. **Instalar dependencias**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configurar variables de entorno**
   Crea un archivo `.env` en la raíz del proyecto:
   ```
   DISCORD_TOKEN=tu_token_de_discord
   GEMINI_API_KEY=tu_clave_api_de_gemini
   CHANNEL_ID=id_del_canal_principal
   ```

4. **Iniciar el bot**
   ```bash
   python main.py
   ```

---

## 🎮 Funcionalidades del bot

Tatiana ofrece una amplia gama de funcionalidades organizadas en diferentes categorías:

- 🎭 Interacciones Anime: Comandos para realizar acciones como abrazar, besar, etc.
- 💰 Economía: Sistema de monedas virtuales, balance, recompensas diarias y transferencias.
- 🃏 Yu-Gi-Oh!: Obtención de cartas aleatorias y gestión de inventario de cartas.
- 😂 Memes: Generación y visualización de memes aleatorios.
- 🐾 Pokémon: Captura de Pokémon aleatorios y gestión de inventario.
- 📊 Encuestas: Creación de encuestas rápidas con múltiples opciones.
- 🎱 Bola 8 Mágica: Respuestas aleatorias a preguntas de sí o no.
- 🏓 Ping: Verificación de la latencia del bot con un embed mejorado.
- 📈 Estado: Panel de estado del bot actualizado y visualmente atractivo.

Para ver todos los comandos disponibles, usa `/ayuda` en Discord. 

---

## 💻 Guía de desarrollo

### 🔌 Creación de plugins

1. Crea un nuevo archivo Python en `src/plugins/`
2. Define tu clase de plugin heredando de `commands.Cog`
3. Implementa tus comandos usando `@app_commands.command()`
4. Asegúrate de incluir la propiedad `name` y el método `get_commands()`
5. El bot cargará automáticamente tu plugin al iniciar

Ejemplo de plugin:

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

Este plugin se integrará automáticamente con el sistema de menú de ayuda, apareciendo como "🔧 Ejemplo" en la lista de categorías.

### ⚙️ Personalización del bot

- **Configuración global**: Modifica `src/config/settings.py`
- **Integración con IA**: Ajusta `src/chat/gemini_interface.py`
- **Sistema de ayuda**: Personaliza `src/plugins/help.py` 
- **Comandos con prefijo**: Añade nuevos comandos en `src/plugins/commands/`

### 📝 Ejemplo de plugin con comandos de prefijo

Aquí tienes un ejemplo de cómo crear un plugin que utiliza comandos con prefijo:

```python
from discord.ext import commands
import discord

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

Guarda este archivo en `src/plugins/commands/ejemplo_comandos.py` y el bot lo cargará automáticamente.

---

## 🤝 Contribuciones

¡Tus contribuciones son bienvenidas! Sigue estos pasos:

1. 🍴 Haz un fork del repositorio
2. 🌿 Crea una nueva rama (`git checkout -b feature/NuevaCaracteristica`)
3. 💻 Realiza tus cambios
4. 📝 Haz commit de tus cambios (`git commit -m 'Añadir NuevaCaracteristica'`)
5. 🚀 Haz push a la rama (`git push origin feature/NuevaCaracteristica`)
6. 🔃 Abre un Pull Request

Para cambios importantes, por favor abre primero un issue para discutirlos.

---

## 📜 Términos de Servicio y Política de Privacidad

Para garantizar la transparencia y el cumplimiento de las regulaciones, hemos establecido los siguientes documentos:

- [Términos de Servicio](https://itsjhonalex.github.io/TatianaBot/terms-of-service)
- [Política de Privacidad](https://itsjhonalex.github.io/TatianaBot/privacy-policy)

Por favor, lee estos documentos cuidadosamente antes de usar el bot.

---

## 📄 Licencia

Este proyecto está bajo la [Licencia MIT](https://opensource.org/licenses/MIT). Consulta el archivo `LICENSE` para más detalles.

---

<div align="center">
  <img src="https://img.shields.io/badge/Hecho%20con-❤️-ff69b4.svg" alt="Hecho con amor">
  <br>
  Desarrollado con pasión por ItsJhonAlex
</div>