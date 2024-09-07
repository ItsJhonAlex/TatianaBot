import os
import importlib
import asyncio
from discord.ext import commands
from src.utils.logger import Logger

async def load_cogs(bot):
    plugin_dir = os.path.dirname(__file__)
    for filename in os.listdir(plugin_dir):
        if filename.endswith('.py') and filename != '__init__.py':
            module_name = f'src.plugins.{filename[:-3]}'
            try:
                module = importlib.import_module(module_name)
                if hasattr(module, 'setup'):
                    await module.setup(bot)
                    Logger.success(f"Cargado: {module_name}")
            except commands.errors.ExtensionAlreadyLoaded:
                Logger.warning(f"El plugin {module_name} ya está cargado")
            except Exception as e:
                Logger.error(f"Error al cargar {str(module_name)}: {str(e)}")

async def load_prefix_commands(bot):
    commands_dir = os.path.join(os.path.dirname(__file__), 'commands')
    for filename in os.listdir(commands_dir):
        if filename.endswith('.py'):
            module_name = f'src.plugins.commands.{filename[:-3]}'
            try:
                module = importlib.import_module(module_name)
                if hasattr(module, 'setup'):
                    await module.setup(bot)
                    Logger.success(f"Cargado: {module_name}")
            except commands.errors.CommandRegistrationError:
                Logger.warning(f"El comando de {module_name} ya está registrado")
            except Exception as e:
                Logger.error(f"Error al cargar {str(module_name)}: {str(e)}")

async def load_plugins(bot):
    Logger.info("Cargando cogs...")
    await load_cogs(bot)
    Logger.info("Cargando comandos de prefijo...")
    await load_prefix_commands(bot)
    Logger.success("Plugins cargados.")