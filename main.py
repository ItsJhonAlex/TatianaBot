import discord
from discord.ext import commands
from src.config.settings import Settings
from src.core.status import set_bot_status
from src.bot.bot import DiscordBot
from src.utils.logger import Logger

intents = discord.Intents.default()
intents.message_content = True
bot = DiscordBot(intents=intents)

@bot.event
async def on_ready():
    Logger.success(f'{bot.user} ha iniciado sesión!')
    await set_bot_status(bot, "despierta")

async def main():
    Logger.info("Iniciando el bot...")
    await bot.start(Settings.DISCORD_TOKEN)

import asyncio
asyncio.run(main())