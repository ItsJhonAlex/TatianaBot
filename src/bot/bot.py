import discord
from discord import app_commands
from discord.ext import commands
from src.config.settings import Settings
from src.chat.gemini_interface import GeminiInterface
from src.core.system import handle_power_control
from src.plugins import load_plugins

class DiscordBot(commands.Bot):
    def __init__(self, intents):
        super().__init__(command_prefix='!', intents=intents)
        self.convo = GeminiInterface.create_conversation()

    async def setup_hook(self):
        await load_plugins(self)
        await self.tree.sync()

    async def on_ready(self):
        print(f'Nos hemos conectado como {self.user}')
        await self.change_presence(activity=discord.Game(name="Siendo Tatiana"))
        try:
            channel = self.get_channel(Settings.CHANNEL_ID)
            if channel:
                if Settings.CLEAR_MESSAGES_ON_START:
                    await self.clear_channel_messages(channel)

                start_response = GeminiInterface.generate_text(self.convo, GeminiInterface.get_start_message())

                chunks = self.split_message(start_response)
                for chunk in chunks:
                    await channel.send(chunk)
            else:
                print(f"Canal con ID {Settings.CHANNEL_ID} no encontrado.")
        except Exception as e:
            channel = self.get_channel(Settings.CHANNEL_ID)
            await channel.send(f"Ocurrió un error. ```{e}```")

    async def on_message(self, message):
        if message.author == self.user:
            return
        
        if message.channel.id == Settings.CHANNEL_ID:
            if not message.content.startswith("//"):
                try:
                    formatted_message = f"{message.author.name}: {message.content}"
                    print(formatted_message)

                    if Settings.SHOW_TYPING:
                        async with message.channel.typing():
                            if message.content:
                                response = GeminiInterface.generate_text(self.convo, formatted_message)
                                if Settings.POWER_CONTROL:
                                    await handle_power_control(message, response)
                    else:
                        if message.content:
                            response = GeminiInterface.generate_text(self.convo, formatted_message)
                            if Settings.POWER_CONTROL:
                                await handle_power_control(message, response)
                        
                    chunks = self.split_message(response)
                    for chunk in chunks:
                        if len(chunk) > 2000:
                            raise ValueError("El fragmento excede los 2000 caracteres.")
                        await message.reply(chunk)
                except Exception as e:
                    channel = self.get_channel(Settings.CHANNEL_ID)
                    await channel.send(f"Ocurrió un error. ```{e}```")

    @staticmethod
    def split_message(message, max_length=2000):
        return [message[i:i + max_length] for i in range(0, len(message), max_length)]

    async def clear_channel_messages(self, channel):
        await channel.purge(limit=999)