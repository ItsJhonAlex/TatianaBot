from src.utils.logger import info, success
from .character import setup as setup_character

async def setup(bot):
    info("Cargando módulos del juego RPG...")
    await setup_character(bot)
    success("Módulos del juego RPG cargados.")