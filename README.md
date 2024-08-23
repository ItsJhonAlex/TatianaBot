# 🤖 Tatiana Discord AI Bot

<div align="center">

![Discord Bot](https://img.shields.io/badge/Discord-Bot-7289DA?style=for-the-badge&logo=discord&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Gemini-AI-4285F4?style=for-the-badge&logo=google&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)

</div>

---

## 📌 Descripción

Este bot de Discord utiliza la API de Gemini AI para generar respuestas inteligentes y ofrece una estructura modular para fácil expansión. Ideal para comunidades que buscan una experiencia de chat mejorada con IA.

---

## ✨ Características principales

- 🔗 Integración perfecta con Discord usando `discord.py`
- 🧠 Generación de respuestas inteligentes con Gemini AI
- 🧩 Arquitectura modular con sistema de plugins automáticos
- ⚙️ Configuración centralizada y fácil de personalizar
- 🛠️ Robusto manejo de errores y sistema de logging

---

## 🚀 Guía de inicio rápido

### Requisitos previos

- Python 3.8+
- Cuenta de Discord con permisos para crear bots
- Clave API de Gemini AI

### Pasos de instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/tu-usuario/discord-ai-bot.git
   cd discord-ai-bot
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

## 🎮 Uso del bot

El bot responderá automáticamente a los mensajes en el canal configurado. Además, ofrece comandos específicos:

## 🎮 Uso del bot

El bot responderá automáticamente a los mensajes en el canal configurado. Además, ofrece comandos específicos:

- `/ping`: Muestra la latencia actual del bot
- `/meme`: Genera un meme aleatorio
- `/8ball`: La magica bola 8
- `/balance`: Muestra tu balance actual de monedas virtuales
- `/daily`: Reclama tu recompensa diaria de monedas
- `/transferir [usuario] [cantidad]`: Transfiere monedas a otro usuario
- `/cazar_pokemon`: Caza un Pokémon y gana monedas
- `/inventario`: Muestra tu inventario de Pokémon

---

## 💻 Guía de desarrollo

### 🔌 Creación de plugins

1. Crea un nuevo archivo Python en `src/plugins/`
2. Define tus comandos usando `@app_commands.command()`
3. El bot cargará automáticamente tu plugin al iniciar

Ejemplo de plugin:

```python
import discord
from discord import app_commands
from discord.ext import commands

class SaludoPlugin(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @app_commands.command(name="hola", description="Saluda al usuario")
    async def saludar(self, interaction: discord.Interaction):
        await interaction.response.send_message("¡Hola! Soy un plugin personalizado.")

async def setup(bot):
    await bot.add_cog(SaludoPlugin(bot))
```

### ⚙️ Personalización del bot

- **Configuración global**: Modifica `src/config/settings.py`
- **Integración con IA**: Ajusta `src/chat/gemini_interface.py`

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

## 📄 Licencia

Este proyecto está bajo la [Licencia MIT](https://opensource.org/licenses/MIT). Consulta el archivo `LICENSE` para más detalles.

---

<div align="center">
  <img src="https://img.shields.io/badge/Hecho%20con-❤️-ff69b4.svg" alt="Hecho con amor">
  <br>
  Desarrollado con pasión por ItsJhonAlex
</div>

