import discord
from discord import app_commands
from discord.ext import commands

class PollPlugin(commands.Cog):
    """
    Este plugin permite crear encuestas rápidas con múltiples opciones.
    """
    name = "📊 Encuestas"

    def __init__(self, bot):
        self.bot = bot
        self.emoji_options = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟']

    def get_commands(self):
        return [command for command in self.bot.tree.walk_commands() if command.binding == self]

    @app_commands.command(name="encuesta", description="Crea una encuesta rápida")
    @app_commands.describe(
        pregunta="La pregunta principal de la encuesta",
        opciones="Las opciones separadas por comas (máximo 10)"
    )
    async def crear_encuesta(self, interaction: discord.Interaction, pregunta: str, opciones: str):
        opciones_lista = [opcion.strip() for opcion in opciones.split(',')]
        
        if len(opciones_lista) < 2:
            await interaction.response.send_message("Debes proporcionar al menos dos opciones para la encuesta.", ephemeral=True)
            return
        
        if len(opciones_lista) > 10:
            await interaction.response.send_message("El máximo de opciones permitidas es 10.", ephemeral=True)
            return

        embed = discord.Embed(title="📊 Nueva Encuesta", description=pregunta, color=discord.Color.blue())
        for i, opcion in enumerate(opciones_lista):
            embed.add_field(name=f"Opción {i+1}", value=f"{self.emoji_options[i]} {opcion}", inline=False)

        embed.set_footer(text=f"Encuesta creada por {interaction.user.name}")

        await interaction.response.send_message(embed=embed)
        message = await interaction.original_response()

        for i in range(len(opciones_lista)):
            await message.add_reaction(self.emoji_options[i])

async def setup(bot):
    await bot.add_cog(PollPlugin(bot))