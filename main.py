import discord
from discord.ext import commands
from src.config.settings import Settings
from src.core.status import set_bot_status
from src.bot.bot import DiscordBot
from src.utils.logger import bot_logger, debug, info, success, warning, error, critical
from src.core.monitor import setup as setup_monitor
from src.tatiana.groq_interface import TatianaInterface

intents = discord.Intents.default()
intents.message_content = True
intents.members = True
bot = DiscordBot(intents=intents)

@bot.event
async def on_ready():
    success(f'{bot.user} ha iniciado sesión!')
    await set_bot_status(bot, "despierta")
    
    # Configurar y iniciar el monitor
    try:
        monitor = setup_monitor(bot)
        bot.loop.create_task(monitor.monitor_loop())
        info("Monitor configurado y iniciado correctamente")
    except Exception as e:
        error(f"Error al configurar o iniciar el monitor: {str(e)}")

async def main():
    info("Iniciando el bot...")
    await bot.start(Settings.DISCORD_TOKEN)

import asyncio
asyncio.run(main())