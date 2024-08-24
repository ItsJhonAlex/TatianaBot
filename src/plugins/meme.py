import discord
from discord import app_commands
from discord.ext import commands
import aiohttp
import io
import random

class MemePlugin(commands.Cog):
    """
    Este plugin proporciona comandos para generar y mostrar memes aleatorios, preferentemente en español.
    """
    name = "😂 Memes"

    def __init__(self, bot):
        self.bot = bot
        self.subreddits_es = [
            'SpanishMeme',
            'MemesEnEspanol',
            'memesenespanol',
            'spanishmemes',
            'MemesESP',
            'Memes_Esp',
        ]
        self.subreddits_en = [
            'memes',
            'dankmemes',
            'me_irl',
            'wholesomememes',
        ]

    def get_commands(self):
        return [command for command in self.bot.tree.walk_commands() if command.binding == self]

    async def get_meme(self, session, subreddits):
        subreddit = random.choice(subreddits)
        url = f'https://meme-api.com/gimme/{subreddit}'
        async with session.get(url) as response:
            if response.status == 200:
                data = await response.json()
                return data['url'], data['title'], subreddit
        return None, None, None

    @app_commands.command(name="meme", description="Genera un meme aleatorio")
    async def meme(self, interaction: discord.Interaction):
        await interaction.response.defer()
        
        async with aiohttp.ClientSession() as session:
            meme_url, meme_title, subreddit = await self.get_meme(session, self.subreddits_es)
            if not meme_url:
                meme_url, meme_title, subreddit = await self.get_meme(session, self.subreddits_en)
            
            if meme_url:
                async with session.get(meme_url) as img_response:
                    if img_response.status == 200:
                        img_data = await img_response.read()
                        file = discord.File(io.BytesIO(img_data), filename="meme.png")
                        
                        embed = discord.Embed(title=meme_title, color=discord.Color.random())
                        embed.set_image(url="attachment://meme.png")
                        embed.set_footer(text=f"Solicitado por {interaction.user.name} | Subreddit: r/{subreddit}", icon_url=interaction.user.avatar.url if interaction.user.avatar else None)
                        
                        await interaction.followup.send(file=file, embed=embed)
                    else:
                        await interaction.followup.send("No se pudo cargar la imagen del meme. Intenta de nuevo.")
            else:
                await interaction.followup.send("No se pudo obtener un meme. Intenta de nuevo más tarde.")

async def setup(bot):
    await bot.add_cog(MemePlugin(bot))