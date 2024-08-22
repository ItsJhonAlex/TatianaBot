import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

class Settings:
    # Versión
    VERSION = "0.0.1"
    CHANGELOG = "Implementar variables de entorno y mejorar la seguridad"

    # Variables secretas
    DISCORD_TOKEN = os.getenv('DISCORD_TOKEN')
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
    CHANNEL_ID = int(os.getenv('CHANNEL_ID'))

    # Variables de configuración
    SHOW_TYPING = True
    CLEAR_MESSAGES_ON_START = True
    POWER_CONTROL = True

    # Propiedades del bot
    BOT_NAME = 'Tatiana'
    CREATOR_NAME = 'Enkidu'
    SERVER_NAME = ''
    SERVER_DESC = ''
