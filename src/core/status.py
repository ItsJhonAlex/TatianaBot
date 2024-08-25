import discord
import json
import os
from src.config.settings import Settings
from src.utils.logger import Logger

STATUS_DATA_FILE = 'src/data/status_data.json'

async def update_status_embed(bot, status):
    # Asegurarse de que el directorio existe
    os.makedirs(os.path.dirname(STATUS_DATA_FILE), exist_ok=True)

    channel = bot.get_channel(Settings.STATUS_CHANNEL_ID)
    if not channel:
        Logger.warning(f"No se pudo encontrar el canal con ID {Settings.STATUS_CHANNEL_ID}")
        return

    embed = discord.Embed(
        title=f"🤖 Estado de {Settings.BOT_NAME}",
        description=f"¡Hola! Aquí tienes mi estado actual:",
        color=discord.Color.green() if status == "despierta" else discord.Color.red()
    )
    embed.add_field(name="🔋 Estado", value=f"{Settings.BOT_NAME} está **{status}**", inline=False)
    embed.add_field(name="🌐 Servidores", value=f"Estoy en **{len(bot.guilds)}** servidores", inline=True)
    embed.add_field(name="👥 Usuarios", value=f"Sirviendo a **{sum(guild.member_count for guild in bot.guilds)}** usuarios", inline=True)
    embed.add_field(name="📊 Versión", value=f"v{Settings.VERSION}", inline=True)
    embed.add_field(name="📝 Último cambio", value=Settings.CHANGELOG, inline=False)
    embed.add_field(name="💡 Consejo", value="Usa `/ayuda` para ver todos mis comandos", inline=False)

    if bot.user.avatar:
        embed.set_thumbnail(url=bot.user.avatar.url)

    embed.set_footer(text=f"Última actualización: {discord.utils.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC")

    message_id = None
    if os.path.exists(STATUS_DATA_FILE):
        try:
            with open(STATUS_DATA_FILE, 'r') as f:
                data = json.load(f)
            message_id = data.get('message_id')
        except json.JSONDecodeError:
            Logger.error("Error al leer el archivo JSON. Creando uno nuevo.")
    
    if message_id:
        try:
            message = await channel.fetch_message(message_id)
            await message.edit(embed=embed)
            Logger.success("Embed de estado actualizado.")
            return
        except discord.NotFound:
            Logger.info("Mensaje no encontrado. Creando uno nuevo.")
    
    message = await channel.send(embed=embed)
    
    # Asegurarse de que el archivo se crea y se escribe correctamente
    try:
        with open(STATUS_DATA_FILE, 'w') as f:
            json.dump({'message_id': message.id}, f)
        print(f"Nuevo embed de estado creado con ID: {message.id}")
    except IOError as e:
        print(f"Error al escribir en el archivo {STATUS_DATA_FILE}: {e}")

async def set_bot_status(bot, status):
    activity = discord.Game(name=f"Estoy {status}")
    await bot.change_presence(status=discord.Status.online, activity=activity)
    await update_status_embed(bot, status)