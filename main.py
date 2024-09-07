import discord
from discord.ext import commands
from src.config.settings import Settings
from src.core.status import set_bot_status
from src.bot.bot import DiscordBot
from src.utils.logger import Logger
from src.core.monitor import setup as setup_monitor

intents = discord.Intents.default()
intents.message_content = True
bot = DiscordBot(intents=intents)

@bot.event
async def on_ready():
    Logger.success(f'{bot.user} ha iniciado sesión!')
    await set_bot_status(bot, "despierta")
    
    # Configurar y iniciar el monitor
    try:
        monitor = setup_monitor(bot)
        bot.loop.create_task(monitor.monitor_loop())
        Logger.info("Monitor configurado y iniciado correctamente")
    except Exception as e:
        Logger.error(f"Error al configurar o iniciar el monitor: {str(e)}")

async def main():
    Logger.info("Iniciando el bot...")
    await bot.start(Settings.DISCORD_TOKEN)

import asyncio
asyncio.run(main())