# 🤖 Tatiana Discord AI Bot

<div align="center">

<img src="src/assets/banner.png" alt="Tatiana Bot Banner" width="100%" height="100%" style="border-radius: 50%; box-shadow: 0 0 20px rgba(0, 123, 255, 0.5);">

![Discord Bot](https://img.shields.io/badge/Discord-Bot-7289DA?style=for-the-badge&logo=discord&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Gemini-AI-4285F4?style=for-the-badge&logo=google&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)

[![Únete a nuestra familia](https://img.shields.io/badge/¡Únete%20a%20nuestra%20familia!-FF69B4?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/2xjXpztFnY)

</div>

---

## 🏆 Patrocinadores

Agradecemos el apoyo de nuestros patrocinadores que hacen posible el desarrollo continuo de Tatiana:

### Encantia Network

<div align="center">

[![Encantia Network](https://img.shields.io/badge/Encantia-Network-brightgreen?style=for-the-badge&logo=minecraft&logoColor=white)](https://discord.gg/9fZfY2Ynvu)

**IP Java:** `encantia.lat`  
**IP Bedrock:** `bedrock.encantia.lat:26036`

[¡Únete a la comunidad de Encantia!](https://discord.gg/9fZfY2Ynvu)

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
- 🛡️ Sistema de automod avanzado con detección de spam y palabras prohibidas
- 🐾 Sistema de captura de Pokémon con inventario y estadísticas
- 🃏 Sistema de cartas Yu-Gi-Oh! con obtención aleatoria y deck
- 💰 Sistema de economía con monedas virtuales y recompensas

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
- 🔧 Embed Manager: Creación y gestión de embeds personalizados.
- 🛡️ Automod: Sistema de moderación automática configurable.

Para ver todos los comandos disponibles, usa `/ayuda` en Discord. 

---

## 🛡️ Sistema de Automod

Tatiana incluye un potente sistema de automod para ayudar a mantener tu servidor seguro y ordenado. Aquí te explicamos cómo configurarlo y usarlo:

### Configuración del Automod

1. **Activar el Automod**:
   ```
   /automod_enable
   ```

2. **Configurar el canal de logs**:
   ```
   /automod_setlogchannel #canal-de-logs
   ```

3. **Establecer roles de moderador**:
   ```
   /automod_setroles 123456789 987654321
   ```
   Reemplaza los números con los IDs de los roles de moderador.

4. **Añadir reglas de automod**:
   - Para palabras prohibidas:
     ```
     /automod_addrule banned_words {"words": ["palabra1", "palabra2"], "action": "delete"}
     ```
   - Para detección de spam:
     ```
     /automod_addrule spam {"action": "mute"}
     ```
   - Para bloquear enlaces:
     ```
     /automod_addrule links {"action": "warn"}
     ```

5. **Configurar la detección de spam**:
   ```
   /automod_spam_config 5 5
   ```
   Esto configura el automod para detectar spam si un usuario envía más de 5 mensajes en 5 segundos.

### Uso del Automod

Una vez configurado, el automod funcionará automáticamente. Algunas acciones que realizará:

- Eliminará mensajes que contengan palabras prohibidas.
- Silenciará temporalmente a usuarios que envíen spam.
- Advertirá a usuarios que envíen enlaces (si está configurado así).

### Comandos adicionales

- **Ver la configuración actual del automod**:
  ```
  /automod_config
  ```

- **Desactivar el automod**:
  ```
  /automod_disable
  ```

- **Ver el estado del automod**:
  ```
  /automod_status
  ```

El sistema de automod es altamente personalizable y puede adaptarse a las necesidades específicas de tu servidor. Experimenta con diferentes configuraciones para encontrar la que mejor se ajuste a tu comunidad.

---

## 🤝 Contribuciones

¡Tus contribuciones son bienvenidas! Para obtener instrucciones detalladas sobre cómo contribuir al proyecto, por favor consulta el archivo [CONTRIBUTING.md](CONTRIBUTING.md).

En resumen, los pasos básicos son:

1. 🍴 Haz un fork del repositorio
2. 🌿 Crea una nueva rama para tu característica
3. 💻 Realiza tus cambios
4. 📝 Haz commit de tus cambios
5. 🚀 Haz push a tu rama
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