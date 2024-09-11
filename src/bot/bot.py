import discord
from discord import app_commands
from discord.ext import commands
from src.config.settings import Settings
from src.chat.gemini_interface import GeminiInterface
from src.core.system import handle_power_control
from src.plugins import load_plugins
import os
from src.utils.logger import bot_logger, debug, info, success, warning, error, critical

class DiscordBot(commands.Bot):
    def __init__(self, intents):
        super().__init__(command_prefix='!', intents=intents)
        self.convo = GeminiInterface.create_conversation()

    async def setup_hook(self):
        info("Iniciando carga de plugins...")
        await load_plugins(self)
        await self.tree.sync()
        success("Comandos de prefijo y de barra cargados.")

    async def on_ready(self):
        info(f'Nos hemos conectado como {self.user}')
        
        # Configurar el avatar del bot
        avatar_path = os.path.join('src', 'assets', 'avatar.png')
        banner_path = os.path.join('src', 'assets', 'banner.png')
        try:
            with open(avatar_path, 'rb') as avatar_file:
                avatar_data = avatar_file.read()
            with open(banner_path, 'rb') as banner_file:
                banner_data = banner_file.read()
            
            await self.user.edit(avatar=avatar_data)
            await self.user.edit(banner=banner_data)
            
            success("Avatar y banner del bot actualizados con éxito.")
        except FileNotFoundError as e:
            warning(f"No se encontró el archivo: {e.filename}")
        except discord.errors.HTTPException as e:
            error(f"Error al actualizar el avatar o banner: {str(e)}")
        except Exception as e:
            error(f"Ocurrió un error inesperado al actualizar el avatar o banner: {str(e)}")

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
                    error("No se pudo generar el mensaje de inicio debido a un error de IA.")
            else:
                warning(f"Canal con ID {Settings.CHANNEL_ID} no encontrado.")
        except Exception as e:
            error(f"Ocurrió un error al iniciar: {str(e)}")

    async def on_message(self, message):
        if message.author == self.user:
            return
        
        if message.channel.id == Settings.CHANNEL_ID:
            if not message.content.startswith("//"):
                try:
                    formatted_message = f"{message.author.name}: {message.content}"
                    debug(formatted_message)

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
                                    error("No se pudo generar una respuesta debido a un error de IA.")
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
                                error("No se pudo generar una respuesta debido a un error de IA.")
                except Exception as e:
                    error(f"Ocurrió un error al procesar el mensaje: {str(e)}")
        
        await self.process_commands(message)

    @staticmethod
    def split_message(message, max_length=2000):
        return [message[i:i + max_length] for i in range(0, len(message), max_length)]

    async def clear_channel_messages(self, channel):
        await channel.purge(limit=999)