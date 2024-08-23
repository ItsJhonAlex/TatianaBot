import discord
from discord import app_commands
from discord.ext import commands
import json
import os
import random

class EconomiaPlugin(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.currency_name = "monedas"
        self.data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
        self.data_file = os.path.join(self.data_dir, 'economia_data.json')
        self.users = self.load_data()

    def load_data(self):
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir)
        if os.path.exists(self.data_file):
            with open(self.data_file, 'r') as f:
                return json.load(f)
        return {}

    def save_data(self):
        with open(self.data_file, 'w') as f:
            json.dump(self.users, f)

    def get_balance(self, user_id):
        return self.users.get(str(user_id), {}).get("balance", 0)

    def update_balance(self, user_id, amount):
        user_id = str(user_id)
        if user_id not in self.users:
            self.users[user_id] = {"balance": 0, "pokemons": []}
        self.users[user_id]["balance"] += amount
        self.save_data()

    def add_pokemon(self, user_id, pokemon):
        user_id = str(user_id)
        if user_id not in self.users:
            self.users[user_id] = {"balance": 0, "pokemons": []}
        self.users[user_id]["pokemons"].append(pokemon)
        self.save_data()

    def get_pokemons(self, user_id):
        return self.users.get(str(user_id), {}).get("pokemons", [])

    @app_commands.command(name="balance", description="Muestra tu balance actual")
    async def balance(self, interaction: discord.Interaction):
        balance = self.get_balance(interaction.user.id)
        await interaction.response.send_message(f"Tienes {balance} {self.currency_name}.")

    @app_commands.command(name="daily", description="Reclama tu recompensa diaria")
    async def daily(self, interaction: discord.Interaction):
        amount = random.randint(10, 100)
        self.update_balance(interaction.user.id, amount)
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

    @app_commands.command(name="inventario", description="Muestra tu inventario de Pokémon")
    async def inventario(self, interaction: discord.Interaction):
        pokemons = self.get_pokemons(interaction.user.id)
        if not pokemons:
            await interaction.response.send_message("No tienes ningún Pokémon en tu inventario.")
        else:
            pokemon_list = "\n".join(pokemons)
            await interaction.response.send_message(f"Tu inventario de Pokémon:\n{pokemon_list}")

async def setup(bot):
    await bot.add_cog(EconomiaPlugin(bot))