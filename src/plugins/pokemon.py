import discord
from discord import app_commands
from discord.ext import commands
import aiohttp
import random
import os
import json

class PokemonPlugin(commands.Cog):
    """
    Este plugin ofrece comandos relacionados con Pokémon, incluyendo
    la captura de Pokémon aleatorios y la gestión del inventario de Pokémon.
    """
    name = "🐾 Pokémon"

    def __init__(self, bot):
        self.bot = bot
        self.pokemon_api_url = "https://pokeapi.co/api/v2/pokemon/"
        self.currency_name = "monedas"
        self.data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
        self.data_file = os.path.join(self.data_dir, 'user_data.json')

    def load_data(self):
        if os.path.exists(self.data_file):
            with open(self.data_file, 'r') as f:
                return json.load(f)
        return {}

    def save_data(self, data):
        with open(self.data_file, 'w') as f:
            json.dump(data, f)

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

    def get_commands(self):
        return [command for command in self.bot.tree.walk_commands() if command.binding == self]

    @app_commands.command(name="inventario", description="Muestra tu inventario de Pokémon")
    async def inventario(self, interaction: discord.Interaction):
        data = self.load_data()
        pokemons = data.get(str(interaction.user.id), {}).get("pokemons", [])
        if not pokemons:
            await interaction.response.send_message("No tienes ningún Pokémon en tu inventario.")
        else:
            embed = discord.Embed(title="🐾 Tu inventario de Pokémon", color=discord.Color.red())
            
            # Agrupar Pokémon por nombre y contar
            pokemon_counts = {}
            for pokemon in pokemons:
                pokemon_counts[pokemon] = pokemon_counts.get(pokemon, 0) + 1
            
            # Añadir Pokémon al embed
            for pokemon, count in pokemon_counts.items():
                embed.add_field(name=pokemon, value=f"Cantidad: {count}", inline=True)
            
            embed.set_footer(text=f"Total de Pokémon: {len(pokemons)}")
            embed.set_author(name=interaction.user.display_name, icon_url=interaction.user.avatar.url if interaction.user.avatar else None)
            
            await interaction.response.send_message(embed=embed)

    @app_commands.command(name="pokemon", description="Muestra un Pokémon aleatorio")
    async def mostrar_pokemon(self, interaction: discord.Interaction):
        await interaction.response.defer()  

        async with aiohttp.ClientSession() as session:
            pokemon_id = random.randint(1, 151)  # Limitar a los primeros 151 Pokémon
            async with session.get(f"{self.pokemon_api_url}{pokemon_id}") as response:
                if response.status == 200:
                    data = await response.json()
                    pokemon_name = data['name'].capitalize()
                    pokemon_image = data['sprites']['front_default']
                    pokemon_stats = data['stats']
                    pokemon_description = f"HP: {pokemon_stats[0]['base_stat']}, Ataque: {pokemon_stats[1]['base_stat']}, Defensa: {pokemon_stats[2]['base_stat']}, Velocidad: {pokemon_stats[5]['base_stat']}"
                    pokemon_rarity = random.choice(["común", "raro", "muy raro"])
                    catch_rate = {"común": 0.8, "raro": 0.5, "muy raro": 0.2}[pokemon_rarity]
                    
                    embed = discord.Embed(title=f"¡Apareció un {pokemon_name}!", description=pokemon_description, color=discord.Color.green())
                    embed.set_image(url=pokemon_image)
                    embed.add_field(name="Rareza", value=pokemon_rarity.capitalize())
                    embed.set_footer(text=f"Solicitado por {interaction.user.name}", icon_url=interaction.user.avatar.url if interaction.user.avatar else None)
                    
                    await interaction.followup.send(embed=embed, view=PokemonCatchView(self, pokemon_name, catch_rate))
                else:
                    await interaction.followup.send("No se pudo obtener un Pokémon. Intenta de nuevo más tarde.", ephemeral=True)

class PokemonCatchView(discord.ui.View):
    def __init__(self, plugin, pokemon_name, catch_rate):
        super().__init__(timeout=60)
        self.plugin = plugin
        self.pokemon_name = pokemon_name
        self.catch_rate = catch_rate
        self.users_attempted = set()

    @discord.ui.button(label="Cazar Pokémon", style=discord.ButtonStyle.primary)
    async def catch_pokemon(self, interaction: discord.Interaction, button: discord.ui.Button):
        if interaction.user.id in self.users_attempted:
            await interaction.response.send_message("Ya has intentado cazar este Pokémon.", ephemeral=True)
            return

        self.users_attempted.add(interaction.user.id)

        if random.random() <= self.catch_rate:
            self.plugin.add_pokemon(interaction.user.id, self.pokemon_name)
            self.plugin.update_balance(interaction.user.id, 10)  # Recompensa de 10 monedas
            self.captured = True

            embed = interaction.message.embeds[0]
            embed.color = discord.Color.gold()
            embed.set_footer(text=f"Capturado por {interaction.user.name}", icon_url=interaction.user.avatar.url if interaction.user.avatar else None)
            await interaction.message.edit(embed=embed, view=None)
            await interaction.response.send_message(f"¡Felicidades! Has cazado un {self.pokemon_name} y ganado 10 {self.plugin.currency_name}.", ephemeral=True)
        else:
            await interaction.response.send_message(f"¡Oh no! El {self.pokemon_name} escapó.", ephemeral=True)

        if len(self.users_attempted) >= len(interaction.channel.members):
            await interaction.message.edit(view=None)
            self.stop()

async def setup(bot):
    await bot.add_cog(PokemonPlugin(bot))