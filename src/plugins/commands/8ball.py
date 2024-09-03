from discord.ext import commands
import discord
import random

class Magic8BallCommands(commands.Cog):
    """
    Este plugin simula una bola 8 mágica, respondiendo preguntas de manera aleatoria.
    """
    name = "🎱 Bola 8 Mágica"
    
    def __init__(self, bot):
        self.bot = bot
        self.responses = [
            "Es cierto.",
            "Definitivamente es así.",
            "Sin duda.",
            "Sí, definitivamente.",
            "Puedes confiar en ello.",
            "Como yo lo veo, sí.",
            "Muy probablemente.",
            "Las perspectivas son buenas.",
            "Sí.",
            "Las señales apuntan a que sí.",
            "Respuesta confusa, intenta de nuevo.",
            "Pregunta de nuevo más tarde.",
            "Mejor no decirte ahora.",
            "No puedo predecirlo ahora.",
            "Concéntrate y pregunta de nuevo.",
            "No cuentes con ello.",
            "Mi respuesta es no.",
            "Mis fuentes dicen que no.",
            "Las perspectivas no son muy buenas.",
            "Muy dudoso."
        ]

    @commands.command(name="8ball", description="Haz una pregunta a la bola 8 mágica")
    async def magic_8ball(self, ctx, *, pregunta: str):
        respuesta = random.choice(self.responses)
        
        embed = discord.Embed(title="🎱 La Bola 8 Mágica", color=discord.Color.purple())
        embed.add_field(name="Pregunta", value=pregunta, inline=False)
        embed.add_field(name="Respuesta", value=respuesta, inline=False)
        embed.set_footer(text=f"Solicitado por {ctx.author.name}", icon_url=ctx.author.avatar.url if ctx.author.avatar else None)
        
        await ctx.send(embed=embed)

async def setup(bot):
    await bot.add_cog(Magic8BallCommands(bot))