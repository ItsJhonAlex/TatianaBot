import discord
from discord import app_commands
from discord.ext import commands
from src.config.settings import Settings
from src.chat.gemini_interface import GeminiInterface
from src.core.system import handle_power_control
from src.plugins import load_plugins
import os
import aiohttp
from src.utils.logger import Logger

class DiscordBot(commands.Bot):
    def __init__(self, intents):
        super().__init__(command_prefix='!', intents=intents)
        self.convo = GeminiInterface.create_conversation()

    async def setup_hook(self):
        Logger.info("Iniciando carga de plugins...")
        await load_plugins(self)
        await self.tree.sync()
        Logger.success("Comandos de prefijo y de barra cargados.")

    async def on_ready(self):
        Logger.info(f'Nos hemos conectado como {self.user}')
        
        # Configurar el avatar del bot
        avatar_path = os.path.join('src', 'assets', 'avatar.jpg')
        try:
            with open(avatar_path, 'rb') as avatar_file:
                avatar_data = avatar_file.read()
            await self.user.edit(avatar=avatar_data)
            Logger.success("Avatar del bot actualizado con éxito.")
        except FileNotFoundError:
            Logger.warning(f"No se encontró el archivo de avatar en {avatar_path}")
        except discord.errors.HTTPException as e:
            Logger.error(f"Error al actualizar el avatar: {e}")
        except Exception as e:
            Logger.error(f"Ocurrió un error inesperado al actualizar el avatar: {e}")

        await self.change_presence(activity=discord.Game(name="Siendo Tatiana"))
        try:
            channel = self.get_channel(Settings.CHANNEL_ID)
            if channel:
                if Settings.CLEAR_MESSAGES_ON_START:
                    await self.clear_channel_messages(channel)

                start_response = GeminiInterface.generate_text(self.convo, GeminiInterface.get_start_message())
                if start_response is not None:
                    chunks = self.split_message(start_response)
                    for chunk in chunks:
                        await channel.send(chunk)
                else:
                    Logger.error("No se pudo generar el mensaje de inicio debido a un error de IA.")
            else:
                Logger.warning(f"Canal con ID {Settings.CHANNEL_ID} no encontrado.")
        except Exception as e:
            Logger.error(f"Ocurrió un error al iniciar: {e}")

    async def on_message(self, message):
        if message.author == self.user:
            return
        
        if message.channel.id == Settings.CHANNEL_ID:
            if not message.content.startswith("//"):
                try:
                    formatted_message = f"{message.author.name}: {message.content}"
                    Logger.debug(formatted_message)

                    if Settings.SHOW_TYPING:
                        async with message.channel.typing():
                            if message.content:
                                response = GeminiInterface.generate_text(self.convo, formatted_message)
                                if response is not None:
                                    if Settings.POWER_CONTROL:
                                        await handle_power_control(message, response)
                                    chunks = self.split_message(response)
                                    for chunk in chunks:
                                        if len(chunk) > 2000:
                                            raise ValueError("El fragmento excede los 2000 caracteres.")
                                        await message.reply(chunk)
                                else:
                                    Logger.error("No se pudo generar una respuesta debido a un error de IA.")
                    else:
                        if message.content:
                            response = GeminiInterface.generate_text(self.convo, formatted_message)
                            if response is not None:
                                if Settings.POWER_CONTROL:
                                    await handle_power_control(message, response)
                                chunks = self.split_message(response)
                                for chunk in chunks:
                                    if len(chunk) > 2000:
                                        raise ValueError("El fragmento excede los 2000 caracteres.")
                                    await message.reply(chunk)
                            else:
                                Logger.error("No se pudo generar una respuesta debido a un error de IA.")
                except Exception as e:
                    Logger.error(f"Ocurrió un error al procesar el mensaje: {e}")
        
        await self.process_commands(message)

    @staticmethod
    def split_message(message, max_length=2000):
        return [message[i:i + max_length] for i in range(0, len(message), max_length)]

    async def clear_channel_messages(self, channel):
        await channel.purge(limit=999)