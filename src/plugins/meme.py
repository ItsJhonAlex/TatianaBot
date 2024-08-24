import discord
from discord import app_commands
from discord.ext import commands
import aiohttp
import io

class MemePlugin(commands.Cog):
    """
    Este plugin proporciona comandos para generar y mostrar memes aleatorios.
    """
    name = "😂 Memes"

    def __init__(self, bot):
        self.bot = bot

    def get_commands(self):
        return [command for command in self.bot.tree.walk_commands() if command.binding == self]

    @app_commands.command(name="meme", description="Genera un meme aleatorio")
    async def meme(self, interaction: discord.Interaction):
        await interaction.response.defer()
        
        async with aiohttp.ClientSession() as session:
            async with session.get('https://meme-api.com/gimme') as response:
                if response.status == 200:
                    data = await response.json()
                    meme_url = data['url']
                    meme_title = data['title']
                    
                    async with session.get(meme_url) as img_response:
                        if img_response.status == 200:
                            img_data = await img_response.read()
                            file = discord.File(io.BytesIO(img_data), filename="meme.png")
                            
                            embed = discord.Embed(title=meme_title, color=discord.Color.random())
                            embed.set_image(url="attachment://meme.png")
                            embed.set_footer(text=f"Solicitado por {interaction.user.name}", icon_url=interaction.user.avatar.url if interaction.user.avatar else None)
                            
                            await interaction.followup.send(file=file, embed=embed)
                        else:
                            await interaction.followup.send("No se pudo cargar la imagen del meme. Intenta de nuevo.")
                else:
                    await interaction.followup.send("No se pudo obtener un meme. Intenta de nuevo más tarde.")

async def setup(bot):
    await bot.add_cog(MemePlugin(bot))