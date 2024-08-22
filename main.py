import discord
from src.config.settings import Settings
from src.bot.bot import DiscordBot

intents = discord.Intents.default()
intents.messages = True
intents.message_content = True

bot = DiscordBot(intents=intents)

bot.run(Settings.DISCORD_TOKEN)