from discord.ext import commands
import discord
import random
import time

class EconomyCommands(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.economy_plugin = bot.get_cog('EconomiaPlugin')

    @commands.command(name="balance", description="Muestra tu balance actual")
    async def balance(self, ctx):
        balance = self.economy_plugin.get_balance(ctx.author.id)
        
        embed = discord.Embed(title="💰 Tu Balance", color=discord.Color.gold())
        embed.add_field(name="Monedas", value=f"{balance} {self.economy_plugin.currency_name}", inline=False)
        
        embed.set_footer(text="Usa !daily para obtener tu recompensa diaria")
        embed.set_author(name=ctx.author.display_name, icon_url=ctx.author.avatar.url if ctx.author.avatar else None)
        
        await ctx.send(embed=embed)

    @commands.command(name="daily", description="Reclama tu recompensa diaria")
    async def daily(self, ctx):
        current_time = int(time.time())
        last_daily = self.economy_plugin.get_last_daily(ctx.author.id)
        
        if last_daily is not None and current_time - last_daily < 86400:  # 86400 segundos = 24 horas
            time_left = 86400 - (current_time - last_daily)
            hours, remainder = divmod(time_left, 3600)
            minutes, seconds = divmod(remainder, 60)
            await ctx.send(f"Aún no puedes reclamar tu recompensa diaria. Tiempo restante: {int(hours)}h {int(minutes)}m {int(seconds)}s")
            return

        amount = random.randint(10, 100)
        self.economy_plugin.update_balance(ctx.author.id, amount)
        self.economy_plugin.set_last_daily(ctx.author.id, current_time)
        await ctx.send(f"¡Has reclamado {amount} {self.economy_plugin.currency_name}!")

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

        if cantidad <= 0:
            await ctx.send("La cantidad debe ser mayor que 0.")
            return

        sender_balance = self.economy_plugin.get_balance(ctx.author.id)
        if sender_balance < cantidad:
            await ctx.send("No tienes suficientes monedas para esta transferencia.")
            return

        self.economy_plugin.update_balance(ctx.author.id, -cantidad)
        self.economy_plugin.update_balance(usuario.id, cantidad)
        await ctx.send(f"Has transferido {cantidad} {self.economy_plugin.currency_name} a {usuario.mention}.")

async def setup(bot):
    await bot.add_cog(EconomyCommands(bot))