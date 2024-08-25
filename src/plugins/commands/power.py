from discord.ext import commands
import discord
from src.config.settings import Settings
from src.core.system import shutdown_program, restart_program
from src.core.status import set_bot_status

def is_authorized():
    async def predicate(ctx):
        return ctx.author.id == Settings.AUTHORIZED_USER_ID
    return commands.check(predicate)

@commands.command(name="apagar", description="Apaga el bot")
@is_authorized()
async def apagar(ctx):
    embed = discord.Embed(
        title="🔌 Apagando",
        description="El bot se está apagando...",
        color=discord.Color.red()
    )
    embed.set_footer(text=f"Solicitado por {ctx.author.name}", icon_url=ctx.author.avatar.url if ctx.author.avatar else None)
    
    await ctx.send(embed=embed)
    await set_bot_status(ctx.bot, "durmiendo")
    await shutdown_program()

@commands.command(name="reiniciar", description="Reinicia el bot")
@is_authorized()
async def reiniciar(ctx):
    embed = discord.Embed(
        title="🔄 Reiniciando",
        description="El bot se está reiniciando...",
        color=discord.Color.orange()
    )
    embed.set_footer(text=f"Solicitado por {ctx.author.name}", icon_url=ctx.author.avatar.url if ctx.author.avatar else None)
    
    await ctx.send(embed=embed)
    await set_bot_status(ctx.bot, "reiniciando")
    await restart_program()

async def setup(bot):
    bot.add_command(apagar)
    bot.add_command(reiniciar)