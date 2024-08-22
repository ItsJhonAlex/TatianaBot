import os
import importlib
import asyncio

async def load_plugins(bot):
    plugin_dir = os.path.dirname(__file__)
    for filename in os.listdir(plugin_dir):
        if filename.endswith('.py') and filename != '__init__.py':
            module_name = f'src.plugins.{filename[:-3]}'
            module = importlib.import_module(module_name)
            if hasattr(module, 'setup'):
                await module.setup(bot)