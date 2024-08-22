import discord
from discord import app_commands
from discord.ext import commands

class PingPlugin(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @app_commands.command(name="ping", description="Muestra la latencia del bot")
    async def ping(self, interaction: discord.Interaction):
        latency = round(self.bot.latency * 1000)  # Convertir a milisegundos
        
        embed = discord.Embed(
            title="🏓 Pong!",
            description=f"Latencia: **{latency}ms**",
            color=discord.Color.green()
        )
        embed.set_footer(text=f"Solicitado por {interaction.user.name}", icon_url=interaction.user.avatar.url if interaction.user.avatar else None)
        
        await interaction.response.send_message(embed=embed, ephemeral=True)

async def setup(bot):
    await bot.add_cog(PingPlugin(bot))