import discord
import psutil
import asyncio
from datetime import datetime
from src.config.settings import Settings
from src.utils.logger import bot_logger, debug, info, success, warning, error, critical

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
            warning(f"Canal de monitoreo con ID {Settings.MONITOR_CHANNEL_ID} no encontrado.")
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
                error(f"Error en el bucle de monitoreo: {str(e)}")
            await asyncio.sleep(60)  # Actualizar cada minuto

def setup(bot):
    monitor = BotMonitor(bot)
    
    # Crear nuevas funciones de logging que también añaden mensajes a la consola del monitor
    def create_logger_with_monitor(original_func):
        def new_func(message):
            original_func(message)
            monitor.add_console_message(f"[{original_func.__name__.upper()}] {message}")
        return new_func

    # Reemplazar las funciones de logging originales con las nuevas
    bot_logger.debug = create_logger_with_monitor(bot_logger.debug)
    bot_logger.info = create_logger_with_monitor(bot_logger.info)
    bot_logger.success = create_logger_with_monitor(bot_logger.success)
    bot_logger.warning = create_logger_with_monitor(bot_logger.warning)
    bot_logger.error = create_logger_with_monitor(bot_logger.error)

    return monitor