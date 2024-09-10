from discord.ext import commands
import discord
from src.config.settings import Settings

def is_authorized():
    async def predicate(ctx):
        return ctx.author.id == Settings.AUTHORIZED_USER_ID
    return commands.check(predicate)

class RulesCommands(commands.Cog):
    """
    Este plugin proporciona un comando para publicar las reglas del servidor en un embed.
    """
    name = "📜 Reglas"

    def __init__(self, bot):
        self.bot = bot

    @commands.command(name="publicar_reglas", description="Publica las reglas del servidor en un embed")
    @is_authorized()
    async def publicar_reglas(self, ctx):
        embed = discord.Embed(
            title="📜 Reglas del Servidor de Tatiana Bot",
            description="Por favor, lee y sigue estas reglas para mantener nuestra comunidad amigable y productiva.",
            color=discord.Color.blue()
        )
        
        rules = [
            "**Respeto Mutuo**: Trata a todos los miembros con respeto. No se tolerará el acoso, la discriminación o el comportamiento tóxico.",
            "**Contenido Apropiado**: Mantén las conversaciones y el contenido compartido apropiados para todos. Evita el lenguaje ofensivo, el contenido para adultos o temas controvertidos.",
            "**Spam y Autopromoción**: No hagas spam ni te autopromociones excesivamente. La publicidad solo está permitida en canales designados.",
            "**Uso Adecuado de Canales**: Utiliza los canales para su propósito previsto. Lee las descripciones de los canales antes de publicar.",
            "**Privacidad**: Respeta la privacidad de los demás. No compartas información personal sin consentimiento.",
            "**Moderación**: Sigue las instrucciones de los moderadores y administradores. Si tienes un problema, contacta al equipo de moderación.",
            "**Uso del Bot**: Usa los comandos del bot en los canales apropiados. No abuses de las funciones del bot.",
            "**Debates Constructivos**: Al sugerir ideas o discutir mejoras, mantén un tono constructivo y respetuoso.",
            "**Idioma**: El idioma principal del servidor es el español, pero se permite el uso respetuoso de otros idiomas.",
            "**Seguridad**: No compartas ni solicites información de cuentas, contraseñas o datos sensibles.",
            "**Derechos de Autor**: Respeta los derechos de autor. No compartas contenido protegido sin permiso.",
            "**Actualizaciones**: Estas reglas pueden actualizarse. Mantente informado revisando este canal regularmente."
        ]
        
        for i, rule in enumerate(rules, 1):
            embed.add_field(name=f"Regla {i}", value=rule, inline=False)
        
        embed.set_footer(text="El incumplimiento de estas reglas puede resultar en advertencias, silenciamientos temporales o expulsión del servidor.")
        
        await ctx.send(embed=embed)

async def setup(bot):
    await bot.add_cog(RulesCommands(bot))
