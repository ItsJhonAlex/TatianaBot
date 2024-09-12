import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

class Settings:
    # Versión
    VERSION = "1.3.0"
    CHANGELOG = "Agregado personalizadad y cambio menores en la ia"

    # Variables secretas
    DISCORD_TOKEN = os.getenv('DISCORD_TOKEN')
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
    CHANNEL_ID = int(os.getenv('CHANNEL_ID'))
    GROQ_API_KEY = os.getenv('GROQ_API_KEY')
    
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