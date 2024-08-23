import discord
from discord import app_commands
from discord.ext import commands
import aiohttp
import random
import os
import json

class PokemonPlugin(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.pokemon_api_url = "https://pokeapi.co/api/v2/pokemon/"
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

    @app_commands.command(name="cazar_pokemon", description="Caza un Pokémon y gana monedas")
    async def cazar_pokemon(self, interaction: discord.Interaction):
        async with aiohttp.ClientSession() as session:
            pokemon_id = random.randint(1, 151)  # Limitar a los primeros 151 Pokémon
            async with session.get(f"{self.pokemon_api_url}{pokemon_id}") as response:
                if response.status == 200:
                    data = await response.json()
                    pokemon_name = data['name'].capitalize()
                    pokemon_image = data['sprites']['front_default']
                    
                    embed = discord.Embed(title=f"¡Has cazado un {pokemon_name}!", color=discord.Color.green())
                    embed.set_image(url=pokemon_image)
                    embed.set_footer(text=f"Solicitado por {interaction.user.name}", icon_url=interaction.user.avatar.url if interaction.user.avatar else None)
                    
                    self.update_balance(interaction.user.id, 10)  # Recompensa de 10 monedas
                    self.add_pokemon(interaction.user.id, pokemon_name)  # Agregar Pokémon al inventario
                    await interaction.response.send_message(embed=embed)
                else:
                    await interaction.response.send_message("No se pudo cazar un Pokémon. Intenta de nuevo más tarde.", ephemeral=True)

async def setup(bot):
    await bot.add_cog(PokemonPlugin(bot))