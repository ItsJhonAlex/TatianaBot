import discord
import os
from src.config.settings import Settings
from src.utils.logger import Logger
from src.utils.database import get_status_message_id, save_status_message_id

async def update_status_embed(bot, status):
    channel = bot.get_channel(Settings.STATUS_CHANNEL_ID)
    if not channel:
        Logger.warning(f"No se pudo encontrar el canal con ID {Settings.STATUS_CHANNEL_ID}")
        return

    status_emoji = "🟢" if status == "despierta" else "🔴" if status == "durmiendo" else "🟠"
    status_color = discord.Color.green() if status == "despierta" else discord.Color.red() if status == "durmiendo" else discord.Color.orange()

    embed = discord.Embed(
        title=f"{status_emoji} Estado de {Settings.BOT_NAME}",
        description=f"¡Hola! Aquí tienes mi estado actual:",
        color=status_color
    )
    
    # Campos principales
    embed.add_field(name="🔋 Estado", value=f"{Settings.BOT_NAME} está **{status}**", inline=False)
    embed.add_field(name="🌐 Servidores", value=f"Estoy en **{len(bot.guilds)}** servidores", inline=True)
    embed.add_field(name="👥 Usuarios", value=f"Sirviendo a **{sum(guild.member_count for guild in bot.guilds)}** usuarios", inline=True)
    embed.add_field(name="📊 Versión", value=f"v{Settings.VERSION}", inline=True)
    
    # Separador
    embed.add_field(name="\u200b", value="─────────────────────", inline=False)
    
    # Información adicional
    embed.add_field(name="📝 Último cambio", value=Settings.CHANGELOG, inline=False)
    embed.add_field(name="💡 Consejo", value="Usa `/ayuda` para ver todos mis comandos", inline=False)

    files_to_send = []

    # Configurar la imagen de estado en el thumbnail
    status_image_path = os.path.join('src', 'assets', f'{status}.png')
    if os.path.exists(status_image_path):
        status_file = discord.File(status_image_path, filename=f"{status}.png")
        embed.set_thumbnail(url=f"attachment://{status}.png")
        files_to_send.append(status_file)

    # Configurar el banner
    banner_path = os.path.join('src', 'assets', 'banner.png')
    if os.path.exists(banner_path):
        banner_file = discord.File(banner_path, filename="banner.png")
        embed.set_image(url="attachment://banner.png")
        files_to_send.append(banner_file)
        
    # Configurar el icono en el footer
    icon_path = os.path.join('src', 'assets', 'icon.png')
    if os.path.exists(icon_path):
        icon_file = discord.File(icon_path, filename="icon.png")
        embed.set_footer(text=f"Última actualización: {discord.utils.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC", icon_url="attachment://icon.png")
        files_to_send.append(icon_file)
    else:
        embed.set_footer(text=f"Última actualización: {discord.utils.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC")

    message_id = get_status_message_id(Settings.STATUS_CHANNEL_ID)

    if message_id:
        try:
            message = await channel.fetch_message(message_id)
            await message.edit(embed=embed, attachments=files_to_send)
            Logger.success("Embed de estado actualizado.")
            return
        except discord.NotFound:
            Logger.info("Mensaje no encontrado. Creando uno nuevo.")
    
    message = await channel.send(embed=embed, files=files_to_send)
    
    save_status_message_id(Settings.STATUS_CHANNEL_ID, message.id)
    Logger.success(f"Nuevo embed de estado creado con ID: {message.id}")

async def set_bot_status(bot, status):
    activity = discord.Game(name=f"Estoy {status}")
    await bot.change_presence(status=discord.Status.online, activity=activity)
    
    # Intentar cambiar el avatar según el estado
    avatar_path = os.path.join('src', 'assets', f'{status}.png')
    try:
        with open(avatar_path, 'rb') as avatar_file:
            avatar_data = avatar_file.read()
        try:
            await bot.user.edit(avatar=avatar_data)
            Logger.success(f"Avatar cambiado a {status}.png")
        except discord.errors.HTTPException as e:
            if e.code == 50035:  # Error de cambio de avatar demasiado rápido
                Logger.warning("No se pudo cambiar el avatar debido a las limitaciones de Discord. Se mantendrá el avatar actual.")
            else:
                raise  # Re-lanzar la excepción si es un error diferente
    except FileNotFoundError:
        Logger.warning(f"No se encontró el archivo de avatar para el estado {status}")
    except Exception as e:
        Logger.error(f"Error inesperado al actualizar el avatar: {e}")
    
    await update_status_embed(bot, status)