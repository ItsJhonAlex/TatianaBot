import discord
import psutil
import asyncio
from datetime import datetime
from src.config.settings import Settings
from src.utils.logger import Logger

class BotMonitor:
    def __init__(self, bot):
        self.bot = bot
        self.start_time = datetime.now()
        self.console_messages = []
        self.last_message_id = None

    def get_uptime(self):
        return str(datetime.now() - self.start_time).split('.')[0]

    def get_resource_usage(self):
        cpu_percent = psutil.cpu_percent()
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        return f"CPU: {cpu_percent}% | RAM: {memory.percent}% | Disco: {disk.percent}%"

    def add_console_message(self, message):
        self.console_messages.append(message)
        if len(self.console_messages) > 10:  # Mantener solo los últimos 10 mensajes
            self.console_messages.pop(0)

    async def update_monitor_channel(self):
        channel = self.bot.get_channel(Settings.MONITOR_CHANNEL_ID)
        if not channel:
            Logger.warning(f"Canal de monitoreo con ID {Settings.MONITOR_CHANNEL_ID} no encontrado.")
            return

        embed = discord.Embed(title="Estado del Bot", color=discord.Color.blue())
        embed.add_field(name="Tiempo de actividad", value=self.get_uptime(), inline=False)
        embed.add_field(name="Uso de recursos", value=self.get_resource_usage(), inline=False)

        await channel.edit(topic=f"Uptime: {self.get_uptime()} | {self.get_resource_usage()}")

        console_content = "\n".join(self.console_messages)
        
        if self.last_message_id:
            try:
                message = await channel.fetch_message(self.last_message_id)
                await message.edit(content=f"```\n{console_content}\n```", embed=embed)
            except discord.NotFound:
                # Si el mensaje no se encuentra, enviamos uno nuevo
                message = await channel.send(content=f"```\n{console_content}\n```", embed=embed)
                self.last_message_id = message.id
        else:
            # Si no hay mensaje previo, enviamos uno nuevo
            message = await channel.send(content=f"```\n{console_content}\n```", embed=embed)
            self.last_message_id = message.id

    async def monitor_loop(self):
        while True:
            try:
                await self.update_monitor_channel()
            except Exception as e:
                Logger.error(f"Error en el bucle de monitoreo: {str(e)}")
            await asyncio.sleep(60)  # Actualizar cada minuto

def setup(bot):
    monitor = BotMonitor(bot)
    
    # Sobrescribir los métodos de Logger para capturar los mensajes de consola
    original_info = Logger.info
    original_success = Logger.success
    original_warning = Logger.warning
    original_error = Logger.error
    original_debug = Logger.debug

    def new_logger(original_method):
        def wrapper(message):
            original_method(message)
            monitor.add_console_message(f"[{original_method.__name__.upper()}] {message}")
        return wrapper

    Logger.info = new_logger(original_info)
    Logger.success = new_logger(original_success)
    Logger.warning = new_logger(original_warning)
    Logger.error = new_logger(original_error)
    Logger.debug = new_logger(original_debug)

    return monitor