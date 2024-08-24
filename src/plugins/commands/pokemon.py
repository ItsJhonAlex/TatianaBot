from discord.ext import commands
import discord
from discord.ui import View, Button
import aiohttp
import random
import os
import json
import asyncio

class PokemonCommands(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.pokemon_api_url = "https://pokeapi.co/api/v2/pokemon/"
        self.currency_name = "monedas"
        self.data_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'data')
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

    @commands.command(name="inventario", description="Muestra tu inventario de Pokémon")
    async def inventario(self, ctx):
        data = self.load_data()
        pokemons = data.get(str(ctx.author.id), {}).get("pokemons", [])
        if not pokemons:
            await ctx.send("No tienes ningún Pokémon en tu inventario.")
        else:
            embed = discord.Embed(title="🐾 Tu inventario de Pokémon", color=discord.Color.red())
            
            pokemon_counts = {}
            for pokemon in pokemons:
                pokemon_counts[pokemon] = pokemon_counts.get(pokemon, 0) + 1
            
            for pokemon, count in pokemon_counts.items():
                embed.add_field(name=pokemon, value=f"Cantidad: {count}", inline=True)
            
            embed.set_footer(text=f"Total de Pokémon: {len(pokemons)}")
            embed.set_author(name=ctx.author.display_name, icon_url=ctx.author.avatar.url if ctx.author.avatar else None)
            
            await ctx.send(embed=embed)

    @commands.command(name="pokemon", description="Muestra un Pokémon aleatorio")
    async def mostrar_pokemon(self, ctx):
        async with ctx.typing():
            async with aiohttp.ClientSession() as session:
                pokemon_id = random.randint(1, 151)
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
                        embed.set_footer(text=f"Solicitado por {ctx.author.name}", icon_url=ctx.author.avatar.url if ctx.author.avatar else None)
                        
                        view = View()
                        button = Button(label="Cazar Pokémon", style=discord.ButtonStyle.primary)
                        
                        users_attempted = set()
                        
                        async def button_callback(interaction):
                            if interaction.user.id in users_attempted:
                                await interaction.response.send_message("Ya has intentado cazar este Pokémon.", ephemeral=True)
                                return
                            
                            users_attempted.add(interaction.user.id)
                            
                            if random.random() <= catch_rate:
                                self.add_pokemon(interaction.user.id, pokemon_name)
                                self.update_balance(interaction.user.id, 10)
                                embed.color = discord.Color.gold()
                                embed.set_footer(text=f"Capturado por {interaction.user.name}", icon_url=interaction.user.avatar.url if interaction.user.avatar else None)
                                await interaction.message.edit(embed=embed, view=None)
                                await interaction.response.send_message(f"¡Felicidades! Has cazado un {pokemon_name} y ganado 10 {self.currency_name}.")
                                view.stop()
                            else:
                                await interaction.response.send_message(f"¡Oh no! El {pokemon_name} escapó.", ephemeral=True)
                            
                            if len(users_attempted) >= len(ctx.channel.members):
                                await interaction.message.edit(view=None)
                                view.stop()
                        
                        button.callback = button_callback
                        view.add_item(button)
                        
                        message = await ctx.send(embed=embed, view=view)
                        
                        await view.wait()
                        if not view.is_finished():
                            await message.edit(view=None)
                            await ctx.send("Tiempo agotado. El Pokémon escapó.")
                    else:
                        await ctx.send("No se pudo obtener un Pokémon. Intenta de nuevo más tarde.")

async def setup(bot):
    await bot.add_cog(PokemonCommands(bot))