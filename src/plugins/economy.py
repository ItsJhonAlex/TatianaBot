from discord.ext import commands
import discord
from discord import app_commands
import random
from datetime import datetime, timedelta
from src.utils.database import session, User, get_user, update_balance, get_balance

class EconomiaPlugin(commands.Cog):
    """
    Este plugin proporciona comandos para gestionar la economía del servidor,
    incluyendo balance, recompensas diarias y transferencias de monedas entre usuarios.
    """
    name = "💰 Economía"

    def __init__(self, bot):
        self.bot = bot
        self.currency_name = "monedas"

    @app_commands.command(name="saldo", description="Muestra tu saldo actual")
    async def saldo(self, interaction: discord.Interaction):
        balance = get_balance(interaction.user.id)
        
        embed = discord.Embed(title="💰 Tu Saldo", color=discord.Color.gold())
        embed.add_field(name="Monedas", value=f"{balance} {self.currency_name}", inline=False)
        
        embed.set_footer(text="Usa /diario para obtener tu recompensa diaria")
        embed.set_author(name=interaction.user.display_name, icon_url=interaction.user.avatar.url if interaction.user.avatar else None)
        
        await interaction.response.send_message(embed=embed)

    @app_commands.command(name="diario", description="Reclama tu recompensa diaria")
    async def diario(self, interaction: discord.Interaction):
        user = get_user(interaction.user.id)
        current_time = datetime.utcnow()
        
        if user.last_daily and current_time - user.last_daily < timedelta(days=1):
            time_left = timedelta(days=1) - (current_time - user.last_daily)
            hours, remainder = divmod(time_left.seconds, 3600)
            minutes, seconds = divmod(remainder, 60)
            await interaction.response.send_message(f"Aún no puedes reclamar tu recompensa diaria. Tiempo restante: {int(hours)}h {int(minutes)}m {int(seconds)}s", ephemeral=True)
            return

        amount = random.randint(10, 100)
        update_balance(interaction.user.id, amount)
        user.last_daily = current_time
        session.commit()
        await interaction.response.send_message(f"¡Has reclamado {amount} {self.currency_name}!")

    @app_commands.command(name="transferir", description="Transfiere monedas a otro usuario")
    @app_commands.describe(
        usuario="El usuario al que quieres transferir monedas",
        cantidad="La cantidad de monedas a transferir"
    )
    async def transferir(self, interaction: discord.Interaction, usuario: discord.User, cantidad: int):
        if usuario == interaction.user:
            await interaction.response.send_message("No puedes transferirte monedas a ti mismo.", ephemeral=True)
            return

        if usuario.bot:
            await interaction.response.send_message("No puedes transferir monedas a un bot.", ephemeral=True)
            return

        if cantidad <= 0:
            await interaction.response.send_message("La cantidad debe ser mayor que 0.", ephemeral=True)
            return

        sender_balance = get_balance(interaction.user.id)
        if sender_balance < cantidad:
            await interaction.response.send_message("No tienes suficientes monedas para esta transferencia.", ephemeral=True)
            return

        update_balance(interaction.user.id, -cantidad)
        update_balance(usuario.id, cantidad)
        await interaction.response.send_message(f"Has transferido {cantidad} {self.currency_name} a {usuario.mention}.")

async def setup(bot):
    await bot.add_cog(EconomiaPlugin(bot))