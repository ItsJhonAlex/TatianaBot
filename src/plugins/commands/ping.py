from discord.ext import commands
import discord

@commands.command(name="ping", description="Muestra la latencia del bot")
async def ping(ctx):
    latency = round(ctx.bot.latency * 1000)  # Convertir a milisegundos
    
    embed = discord.Embed(
        title="🏓 Pong!",
        description=f"Latencia: **{latency}ms**",
        color=discord.Color.green()
    )
    embed.set_footer(text=f"Solicitado por {ctx.author.name}", icon_url=ctx.author.avatar.url if ctx.author.avatar else None)
    
    await ctx.send(embed=embed)

async def setup(bot):
    bot.add_command(ping)