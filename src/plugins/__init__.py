import os
import importlib
import asyncio
from discord.ext import commands

async def load_cogs(bot):
    plugin_dir = os.path.dirname(__file__)
    for filename in os.listdir(plugin_dir):
        if filename.endswith('.py') and filename != '__init__.py':
            module_name = f'src.plugins.{filename[:-3]}'
            module = importlib.import_module(module_name)
            if hasattr(module, 'setup'):
                await module.setup(bot)

async def load_prefix_commands(bot):
    commands_dir = os.path.join(os.path.dirname(__file__), 'commands')
    for filename in os.listdir(commands_dir):
        if filename.endswith('.py'):
            module_name = f'src.plugins.commands.{filename[:-3]}'
            module = importlib.import_module(module_name)
            if hasattr(module, 'setup'):
                await module.setup(bot)

async def load_plugins(bot):
    await load_cogs(bot)
    await load_prefix_commands(bot)