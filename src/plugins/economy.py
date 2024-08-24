import discord
from discord import app_commands
from discord.ext import commands
import json
import os
import random
import time

class EconomiaPlugin(commands.Cog):
    """
    Este plugin proporciona comandos para gestionar la economía del servidor,
    incluyendo balance, recompensas diarias y transferencias de monedas entre usuarios.
    """
    name = "💰 Economía"

    def __init__(self, bot):
        self.bot = bot
        self.currency_name = "monedas"
        self.data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
        self.data_file = os.path.join(self.data_dir, 'user_data.json')

    def load_data(self):
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir)
        if os.path.exists(self.data_file):
            with open(self.data_file, 'r') as f:
                return json.load(f)
        return {}

    def save_data(self, data):
        with open(self.data_file, 'w') as f:
            json.dump(data, f)

    def get_balance(self, user_id):
        data = self.load_data()
        return data.get(str(user_id), {}).get("balance", 0)

    def update_balance(self, user_id, amount):
        data = self.load_data()
        user_id = str(user_id)
        if user_id not in data:
            data[user_id] = {"balance": 0, "pokemons": [], "yugioh_cards": []}
        data[user_id]["balance"] += amount
        self.save_data(data)

    def add_pokemon(self, user_id, pokemon):
        data = self.load_data()
        user_id = str(user_id)
        if user_id not in data:
            data[user_id] = {"balance": 0, "pokemons": [], "yugioh_cards": []}
        data[user_id]["pokemons"].append(pokemon)
        self.save_data(data)

    def get_pokemons(self, user_id):
        data = self.load_data()
        return data.get(str(user_id), {}).get("pokemons", [])

    def get_commands(self):
        return [command for command in self.bot.tree.walk_commands() if command.binding == self]

    def get_last_daily(self, user_id):
        data = self.load_data()
        return data.get(str(user_id), {}).get("last_daily")

    def set_last_daily(self, user_id, timestamp):
        data = self.load_data()
        user_id = str(user_id)
        if user_id not in data:
            data[user_id] = {"balance": 0, "pokemons": [], "yugioh_cards": [], "last_daily": timestamp}
        else:
            data[user_id]["last_daily"] = timestamp
        self.save_data(data)

    @app_commands.command(name="balance", description="Muestra tu balance actual")
    async def balance(self, interaction: discord.Interaction):
        balance = self.get_balance(interaction.user.id)
        
        embed = discord.Embed(title="💰 Tu Balance", color=discord.Color.gold())
        embed.add_field(name="Monedas", value=f"{balance} {self.currency_name}", inline=False)
        
        embed.set_footer(text="Usa /daily para obtener tu recompensa diaria")
        embed.set_author(name=interaction.user.display_name, icon_url=interaction.user.avatar.url if interaction.user.avatar else None)
        
        await interaction.response.send_message(embed=embed)

    @app_commands.command(name="daily", description="Reclama tu recompensa diaria")
    async def daily(self, interaction: discord.Interaction):
        current_time = int(time.time())
        last_daily = self.get_last_daily(interaction.user.id)
        
        if last_daily is not None and current_time - last_daily < 86400:  # 86400 segundos = 24 horas
            time_left = 86400 - (current_time - last_daily)
            hours, remainder = divmod(time_left, 3600)
            minutes, seconds = divmod(remainder, 60)
            await interaction.response.send_message(f"Aún no puedes reclamar tu recompensa diaria. Tiempo restante: {int(hours)}h {int(minutes)}m {int(seconds)}s", ephemeral=True)
            return

        amount = random.randint(10, 100)
        self.update_balance(interaction.user.id, amount)
        self.set_last_daily(interaction.user.id, current_time)
        await interaction.response.send_message(f"¡Has reclamado {amount} {self.currency_name}!")

    @app_commands.command(name="transferir", description="Transfiere monedas a otro usuario")
    @app_commands.describe(
        usuario="El usuario al que quieres transferir monedas",
        cantidad="La cantidad de monedas a transferir"
    )
    async def transferir(self, interaction: discord.Interaction, usuario: discord.User, cantidad: int):
        if cantidad <= 0:
            await interaction.response.send_message("La cantidad debe ser mayor que 0.", ephemeral=True)
            return

        sender_balance = self.get_balance(interaction.user.id)
        if sender_balance < cantidad:
            await interaction.response.send_message("No tienes suficientes monedas para esta transferencia.", ephemeral=True)
            return

        self.update_balance(interaction.user.id, -cantidad)
        self.update_balance(usuario.id, cantidad)
        await interaction.response.send_message(f"Has transferido {cantidad} {self.currency_name} a {usuario.mention}.")

async def setup(bot):
    await bot.add_cog(EconomiaPlugin(bot))