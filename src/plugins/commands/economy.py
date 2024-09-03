from discord.ext import commands
import discord
from discord import app_commands
import random
from datetime import datetime, timedelta
from src.utils.database import session, User, get_user, update_balance, get_balance

class EconomyCommands(commands.Cog):
    """
    Este plugin proporciona comandos para gestionar la economía del servidor,
    incluyendo balance, recompensas diarias y transferencias de monedas entre usuarios.
    """
    name = "💰 Economía"

    def __init__(self, bot):
        self.bot = bot
        self.currency_name = "monedas"

    @commands.command(name="saldo", description="Muestra tu saldo actual")
    async def balance(self, ctx):
        balance = get_balance(ctx.author.id)
        
        embed = discord.Embed(title="💰 Tu Saldo", color=discord.Color.gold())
        embed.add_field(name="Monedas", value=f"{balance} {self.currency_name}", inline=False)
        
        embed.set_footer(text="Usa !daily para obtener tu recompensa diaria")
        embed.set_author(name=ctx.author.display_name, icon_url=ctx.author.avatar.url if ctx.author.avatar else None)
        
        await ctx.send(embed=embed)

    @commands.command(name="diario", description="Reclama tu recompensa diaria")
    async def daily(self, ctx):
        user = get_user(ctx.author.id)
        current_time = datetime.utcnow()
        
        if user.last_daily and current_time - user.last_daily < timedelta(days=1):
            time_left = timedelta(days=1) - (current_time - user.last_daily)
            hours, remainder = divmod(time_left.seconds, 3600)
            minutes, seconds = divmod(remainder, 60)
            await ctx.send(f"Aún no puedes reclamar tu recompensa diaria. Tiempo restante: {int(hours)}h {int(minutes)}m {int(seconds)}s")
            return

        amount = random.randint(10, 100)
        update_balance(ctx.author.id, amount)
        user.last_daily = current_time
        session.commit()
        await ctx.send(f"¡Has reclamado {amount} {self.currency_name}!")

    @commands.command(name="transferir", description="Transfiere monedas al usuario al que respondes")
    async def transferir(self, ctx, cantidad: int):
        if ctx.message.reference is None:
            await ctx.send("Debes responder al mensaje del usuario al que quieres transferir monedas.")
            return

        referenced_message = await ctx.channel.fetch_message(ctx.message.reference.message_id)
        usuario = referenced_message.author

        if usuario == ctx.author:
            await ctx.send("No puedes transferirte monedas a ti mismo.")
            return

        if usuario.bot:
            await ctx.send("No puedes transferir monedas a un bot.")
            return

        if cantidad <= 0:
            await ctx.send("La cantidad debe ser mayor que 0.")
            return

        sender_balance = get_balance(ctx.author.id)
        if sender_balance < cantidad:
            await ctx.send("No tienes suficientes monedas para esta transferencia.")
            return

        update_balance(ctx.author.id, -cantidad)
        update_balance(usuario.id, cantidad)
        await ctx.send(f"Has transferido {cantidad} {self.currency_name} a {usuario.mention}.")

async def setup(bot):
    await bot.add_cog(EconomyCommands(bot))