import discord
from discord.ext import commands
import aiohttp
import random

class AnimeInteractionsCommands(commands.Cog):
    """
    Este plugin proporciona comandos para realizar interacciones de anime, como abrazar, besar, y más.
    También incluye comandos para mostrar imágenes de personajes de anime.
    """
    name = "🎭 Interacciones Anime"
    
    def __init__(self, bot):
        self.bot = bot
        self.api_url = "https://nekos.best/api/v2/"
        self.descripciones = {
            "hug": "abrazó a",
            "kiss": "besó a",
            "pat": "dio una palmadita a",
            "punch": "golpeó a",
            "shoot": "disparó a",
            "poke": "picó a",
            "peck": "besó la mejilla de",
            "tickle": "hizo cosquillas a",
            "yeet": "lanzó a",
            "highfive": "chocó los cinco con",
            "feed": "alimentó a",
            "bite": "mordió a",
            "cuddle": "acarició a",
            "kick": "pateó a",
            "baka": "insultó a",
            "handshake": "dio la mano a",
            "slap": "abofeteó a",
            "handhold": "tomó de la mano a",
            "lurk": "está acechando",
            "sleep": "está durmiendo",
            "shrug": "se encogió de hombros",
            "stare": "está mirando fijamente",
            "wave": "está saludando",
            "smile": "está sonriendo",
            "wink": "guiñó un ojo",
            "blush": "se sonrojó",
            "smug": "está presumiendo",
            "think": "está pensando",
            "bored": "está aburrido",
            "nom": "está comiendo",
            "yawn": "está bostezando",
            "facepalm": "se agobia",
            "happy": "está feliz",
            "nod": "asintió",
            "nope": "negó con la cabeza",
            "dance": "está bailando",
            "cry": "está llorando",
            "pout": "está haciendo pucheros",
            "thumbsup": "dio un pulgar arriba",
            "laugh": "está riendo"
        }

    async def get_gif(self, interaction_type):
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{self.api_url}{interaction_type}") as response:
                if response.status == 200:
                    data = await response.json()
                    return data['results'][0]['url'], data['results'][0]['anime_name']
                else:
                    return None, None

    @commands.command(name="interaccion", description="Realiza una interacción de anime")
    async def interaccion(self, ctx, tipo: str):
        if tipo not in self.descripciones:
            await ctx.send("Tipo de interacción no válido. Intenta con uno de los siguientes: " + ", ".join(self.descripciones.keys()))
            return

        usuario = None
        if ctx.message.reference:
            referenced_message = await ctx.channel.fetch_message(ctx.message.reference.message_id)
            usuario = referenced_message.author

        gif_url, anime_name = await self.get_gif(tipo)
        if gif_url:
            embed = discord.Embed(color=discord.Color.random())
            
            if usuario and usuario != ctx.author:
                embed.description = f"{ctx.author.mention} {self.descripciones[tipo]} {usuario.mention}"
            else:
                embed.description = f"{ctx.author.mention} {self.descripciones[tipo]}"
            
            embed.set_image(url=gif_url)
            embed.set_footer(text=f"Anime: {anime_name}")
            await ctx.send(embed=embed)
        else:
            await ctx.send("No se pudo obtener un GIF. Intenta de nuevo más tarde.")

async def setup(bot):
    await bot.add_cog(AnimeInteractionsCommands(bot))