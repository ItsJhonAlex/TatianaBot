import discord
from discord import app_commands
from discord.ext import commands
import aiohttp

class AnimeInteractionsPlugin(commands.Cog):
    """
    Este plugin proporciona comandos para realizar interacciones de anime, como abrazar, besar, y más.
    También incluye comandos para mostrar imágenes de personajes de anime.
    """
    name = "🎭 Interacciones Anime"

    def __init__(self, bot):
        self.bot = bot
        self.api_url = "https://nekos.best/api/v2/"

    async def get_gif(self, interaction_type):
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{self.api_url}{interaction_type}") as response:
                if response.status == 200:
                    data = await response.json()
                    return data['results'][0]['url'], data['results'][0]['anime_name']
                else:
                    return None, None

    async def get_image(self, image_type):
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{self.api_url}{image_type}") as response:
                if response.status == 200:
                    data = await response.json()
                    result = data['results'][0]
                    return result['url'], result['artist_name'], result['artist_href'], result['source_url']
                else:
                    return None, None, None, None

    # Comandos que requieren interacción con otro usuario
    @app_commands.command(name="abrazar", description="Abraza a alguien")
    async def hug(self, interaction: discord.Interaction, usuario: discord.User):
        await interaction.response.defer()
        await self.send_interaction(interaction, "hug", usuario)

    @app_commands.command(name="besar", description="Besa a alguien")
    async def kiss(self, interaction: discord.Interaction, usuario: discord.User):
        await interaction.response.defer()
        await self.send_interaction(interaction, "kiss", usuario)

    @app_commands.command(name="palmada", description="Da una palmada a alguien")
    async def pat(self, interaction: discord.Interaction, usuario: discord.User):
        await interaction.response.defer()
        await self.send_interaction(interaction, "pat", usuario)

    @app_commands.command(name="golpear", description="Golpea a alguien")
    async def punch(self, interaction: discord.Interaction, usuario: discord.User):
        await interaction.response.defer()
        await self.send_interaction(interaction, "punch", usuario)

    @app_commands.command(name="disparar", description="Dispara a alguien")
    async def shoot(self, interaction: discord.Interaction, usuario: discord.User):
        await interaction.response.defer()
        await self.send_interaction(interaction, "shoot", usuario)

    @app_commands.command(name="picar", description="Pica a alguien")
    async def poke(self, interaction: discord.Interaction, usuario: discord.User):
        await interaction.response.defer()
        await self.send_interaction(interaction, "poke", usuario)

    @app_commands.command(name="besar_mejilla", description="Besa la mejilla de alguien")
    async def peck(self, interaction: discord.Interaction, usuario: discord.User):
        await interaction.response.defer()
        await self.send_interaction(interaction, "peck", usuario)

    @app_commands.command(name="hacer_cosquillas", description="Hace cosquillas a alguien")
    async def tickle(self, interaction: discord.Interaction, usuario: discord.User):
        await interaction.response.defer()
        await self.send_interaction(interaction, "tickle", usuario)

    @app_commands.command(name="lanzar", description="Lanza a alguien")
    async def yeet(self, interaction: discord.Interaction, usuario: discord.User):
        await interaction.response.defer()
        await self.send_interaction(interaction, "yeet", usuario)

    @app_commands.command(name="chocar_cinco", description="Choca los cinco con alguien")
    async def highfive(self, interaction: discord.Interaction, usuario: discord.User):
        await interaction.response.defer()
        await self.send_interaction(interaction, "highfive", usuario)

    @app_commands.command(name="alimentar", description="Alimenta a alguien")
    async def feed(self, interaction: discord.Interaction, usuario: discord.User):
        await interaction.response.defer()
        await self.send_interaction(interaction, "feed", usuario)

    @app_commands.command(name="morder", description="Muerde a alguien")
    async def bite(self, interaction: discord.Interaction, usuario: discord.User):
        await interaction.response.defer()
        await self.send_interaction(interaction, "bite", usuario)

    @app_commands.command(name="acariciar", description="Acaricia a alguien")
    async def cuddle(self, interaction: discord.Interaction, usuario: discord.User):
        await interaction.response.defer()
        await self.send_interaction(interaction, "cuddle", usuario)

    @app_commands.command(name="patear", description="Patea a alguien")
    async def kick(self, interaction: discord.Interaction, usuario: discord.User):
        await interaction.response.defer()
        await self.send_interaction(interaction, "kick", usuario)

    @app_commands.command(name="insultar", description="Insulta a alguien")
    async def baka(self, interaction: discord.Interaction, usuario: discord.User):
        await interaction.response.defer()
        await self.send_interaction(interaction, "baka", usuario)

    @app_commands.command(name="dar_la_mano", description="Da la mano a alguien")
    async def handshake(self, interaction: discord.Interaction, usuario: discord.User):
        await interaction.response.defer()
        await self.send_interaction(interaction, "handshake", usuario)

    @app_commands.command(name="abofetear", description="Abofetea a alguien")
    async def slap(self, interaction: discord.Interaction, usuario: discord.User):
        await interaction.response.defer()
        await self.send_interaction(interaction, "slap", usuario)

    @app_commands.command(name="tomar_de_la_mano", description="Toma de la mano a alguien")
    async def handhold(self, interaction: discord.Interaction, usuario: discord.User):
        await interaction.response.defer()
        await self.send_interaction(interaction, "handhold", usuario)

    # Comandos que no requieren interacción con otro usuario
    @app_commands.command(name="acechar", description="Acecha a alguien")
    async def lurk(self, interaction: discord.Interaction):
        await interaction.response.defer()
        await self.send_interaction(interaction, "lurk")

    @app_commands.command(name="dormir", description="Muestra que estás durmiendo")
    async def sleep(self, interaction: discord.Interaction):
        await interaction.response.defer()
        await self.send_interaction(interaction, "sleep")

    @app_commands.command(name="encogerse_de_hombros", description="Encógete de hombros")
    async def shrug(self, interaction: discord.Interaction):
        await interaction.response.defer()
        await self.send_interaction(interaction, "shrug")

    @app_commands.command(name="mirar_fijamente", description="Mira fijamente")
    async def stare(self, interaction: discord.Interaction):
        await interaction.response.defer()
        await self.send_interaction(interaction, "stare")

    @app_commands.command(name="saludar", description="Saluda")
    async def wave(self, interaction: discord.Interaction):
        await interaction.response.defer()
        await self.send_interaction(interaction, "wave")

    @app_commands.command(name="sonreir", description="Sonríe")
    async def smile(self, interaction: discord.Interaction):
        await interaction.response.defer()
        await self.send_interaction(interaction, "smile")

    @app_commands.command(name="guiñar", description="Guiña un ojo")
    async def wink(self, interaction: discord.Interaction):
        await interaction.response.defer()
        await self.send_interaction(interaction, "wink")

    @app_commands.command(name="sonrojarse", description="Sonrójate")
    async def blush(self, interaction: discord.Interaction):
        await interaction.response.defer()
        await self.send_interaction(interaction, "blush")

    @app_commands.command(name="presumir", description="Presume")
    async def smug(self, interaction: discord.Interaction):
        await interaction.response.defer()
        await self.send_interaction(interaction, "smug")

    @app_commands.command(name="pensar", description="Piensa")
    async def think(self, interaction: discord.Interaction):
        await interaction.response.defer()
        await self.send_interaction(interaction, "think")

    @app_commands.command(name="aburrirse", description="Muestra que estás aburrido")
    async def bored(self, interaction: discord.Interaction):
        await interaction.response.defer()
        await self.send_interaction(interaction, "bored")

    @app_commands.command(name="comer", description="Come algo")
    async def nom(self, interaction: discord.Interaction):
        await interaction.response.defer()
        await self.send_interaction(interaction, "nom")

    @app_commands.command(name="bostezar", description="Bosteza")
    async def yawn(self, interaction: discord.Interaction):
        await interaction.response.defer()
        await self.send_interaction(interaction, "yawn")

    @app_commands.command(name="facepalm", description="Haz un facepalm")
    async def facepalm(self, interaction: discord.Interaction):
        await interaction.response.defer()
        await self.send_interaction(interaction, "facepalm")

    @app_commands.command(name="feliz", description="Muestra que estás feliz")
    async def happy(self, interaction: discord.Interaction):
        await interaction.response.defer()
        await self.send_interaction(interaction, "happy")

    @app_commands.command(name="asentir", description="Asiente")
    async def nod(self, interaction: discord.Interaction):
        await interaction.response.defer()
        await self.send_interaction(interaction, "nod")

    @app_commands.command(name="negar", description="Niega con la cabeza")
    async def nope(self, interaction: discord.Interaction):
        await interaction.response.defer()
        await self.send_interaction(interaction, "nope")

    @app_commands.command(name="bailar", description="Baila")
    async def dance(self, interaction: discord.Interaction):
        await interaction.response.defer()
        await self.send_interaction(interaction, "dance")

    @app_commands.command(name="llorar", description="Llora")
    async def cry(self, interaction: discord.Interaction):
        await interaction.response.defer()
        await self.send_interaction(interaction, "cry")

    @app_commands.command(name="hacer_pucheros", description="Haz pucheros")
    async def pout(self, interaction: discord.Interaction):
        await interaction.response.defer()
        await self.send_interaction(interaction, "pout")

    @app_commands.command(name="pulgar_arriba", description="Da un pulgar arriba")
    async def thumbsup(self, interaction: discord.Interaction):
        await interaction.response.defer()
        await self.send_interaction(interaction, "thumbsup")

    @app_commands.command(name="reir", description="Ríe")
    async def laugh(self, interaction: discord.Interaction):
        await interaction.response.defer()
        await self.send_interaction(interaction, "laugh")

    # Comandos de imágenes
    @app_commands.command(name="husbando", description="Muestra una imagen de un husbando")
    async def husbando(self, interaction: discord.Interaction):
        await interaction.response.defer()
        await self.send_image(interaction, "husbando")

    @app_commands.command(name="kitsune", description="Muestra una imagen de una kitsune")
    async def kitsune(self, interaction: discord.Interaction):
        await interaction.response.defer()
        await self.send_image(interaction, "kitsune")

    @app_commands.command(name="neko", description="Muestra una imagen de una neko")
    async def neko(self, interaction: discord.Interaction):
        await interaction.response.defer()
        await self.send_image(interaction, "neko")

    @app_commands.command(name="waifu", description="Muestra una imagen de una waifu")
    async def waifu(self, interaction: discord.Interaction):
        await interaction.response.defer()
        await self.send_image(interaction, "waifu")

    async def send_interaction(self, interaction: discord.Interaction, interaction_type: str, usuario: discord.User = None):
        gif_url, anime_name = await self.get_gif(interaction_type)
        if gif_url:
            embed = discord.Embed(color=discord.Color.random())
            if usuario:
                embed.description = f"{interaction.user.mention} {interaction_type} a {usuario.mention}"
            else:
                embed.description = f"{interaction.user.mention} {interaction_type}"
            embed.set_image(url=gif_url)
            embed.set_footer(text=f"Anime: {anime_name}")
            await interaction.followup.send(embed=embed)
        else:
            await interaction.followup.send("No se pudo obtener un GIF. Intenta de nuevo más tarde.", ephemeral=True)

    async def send_image(self, interaction: discord.Interaction, image_type: str):
        url, artist_name, artist_href, source_url = await self.get_image(image_type)
        if url:
            embed = discord.Embed(title=f"{image_type.capitalize()}", color=discord.Color.random())
            embed.set_image(url=url)
            embed.add_field(name="Artista", value=f"[{artist_name}]({artist_href})", inline=True)
            embed.add_field(name="Fuente", value=f"[Ver fuente]({source_url})", inline=True)
            embed.set_footer(text=f"Solicitado por {interaction.user.name}", icon_url=interaction.user.avatar.url if interaction.user.avatar else None)
            await interaction.followup.send(embed=embed)
        else:
            await interaction.followup.send(f"No se pudo obtener una imagen de {image_type}. Intenta de nuevo más tarde.", ephemeral=True)

    def get_commands(self):
        return [command for command in self.bot.tree.walk_commands() if command.binding == self]

async def setup(bot):
    await bot.add_cog(AnimeInteractionsPlugin(bot))