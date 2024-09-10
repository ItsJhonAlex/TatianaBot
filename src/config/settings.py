import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

class Settings:
    # Versión
    VERSION = "1.2.0"
    CHANGELOG = "Cambios en el almacenamiento de datos y mejoras de la base de datos"

    # Variables secretas
    DISCORD_TOKEN = os.getenv('DISCORD_TOKEN')
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
    CHANNEL_ID = int(os.getenv('CHANNEL_ID'))

    # Spotify API Credentials
    SPOTIFY_CLIENT_ID = os.getenv('SPOTIFY_CLIENT_ID')
    SPOTIFY_CLIENT_SECRET = os.getenv('SPOTIFY_CLIENT_SECRET')

    # Variables de configuración
    SHOW_TYPING = True
    CLEAR_MESSAGES_ON_START = True
    POWER_CONTROL = True

    # Propiedades del bot
    BOT_NAME = 'Tatiana'
    CREATOR_NAME = 'Enkidu'
    SERVER_NAME = ''
    SERVER_DESC = ''

    # ID del usuario autorizado para comandos de energía
    AUTHORIZED_USER_ID = int(os.getenv('AUTHORIZED_USER_ID'))

    # ID del canal para mostrar el estado del bot
    STATUS_CHANNEL_ID = int(os.getenv('STATUS_CHANNEL_ID'))
    
    # ID del canal para mostrar el monitor del bot
    MONITOR_CHANNEL_ID = int(os.getenv('MONITOR_CHANNEL_ID'))
    
    # Configuración de GitHub
    GITHUB_UPDATES_CHANNEL_ID = int(os.getenv('GITHUB_UPDATES_CHANNEL_ID'))
    GITHUB_ACCESS_TOKEN = os.getenv('GITHUB_ACCESS_TOKEN')
    GITHUB_REPO = os.getenv('GITHUB_REPO')