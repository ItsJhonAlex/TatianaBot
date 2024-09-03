import discord
from discord import app_commands
from discord.ext import commands
import aiohttp
import random
from datetime import datetime, timedelta
from src.utils.database import session, User, Pokemon, Attempt, get_user, update_balance, get_balance

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
        self.attempts_reset_time = 3600  # 1 hora en segundos
        self.max_attempts = 10

    def get_remaining_attempts(self, user_id):
        user = get_user(user_id)
        attempt = session.query(Attempt).filter_by(user_id=user.id, attempt_type='pokemon').first()
        if not attempt:
            attempt = Attempt(user_id=user.id, attempt_type='pokemon', attempts=self.max_attempts, last_reset=datetime.utcnow())
            session.add(attempt)
            session.commit()
        
        current_time = datetime.utcnow()
        if current_time - attempt.last_reset >= timedelta(seconds=self.attempts_reset_time):
            attempt.attempts = self.max_attempts
            attempt.last_reset = current_time
            session.commit()
        
        return attempt.attempts

    def update_attempts(self, user_id):
        user = get_user(user_id)
        attempt = session.query(Attempt).filter_by(user_id=user.id, attempt_type='pokemon').first()
        if not attempt:
            attempt = Attempt(user_id=user.id, attempt_type='pokemon', attempts=self.max_attempts, last_reset=datetime.utcnow())
            session.add(attempt)
        
        current_time = datetime.utcnow()
        if current_time - attempt.last_reset >= timedelta(seconds=self.attempts_reset_time):
            attempt.attempts = self.max_attempts
            attempt.last_reset = current_time
        
        if attempt.attempts > 0:
            attempt.attempts -= 1
            session.commit()
            return True
        return False

    def add_pokemon(self, user_id, pokemon_name, pokemon_id):
        user = get_user(user_id)
        new_pokemon = Pokemon(user_id=user.id, pokemon_name=pokemon_name, pokemon_id=pokemon_id)
        session.add(new_pokemon)
        session.commit()

    @app_commands.command(name="pokedex", description="Muestra tu Pokédex")
    async def pokedex(self, interaction: discord.Interaction):
        user = get_user(interaction.user.id)
        pokemons = session.query(Pokemon).filter_by(user_id=user.id).all()
        
        if not pokemons:
            await interaction.response.send_message("No tienes ningún Pokémon en tu Pokédex.")
        else:
            embed = discord.Embed(title="🐾 Tu Pokédex", color=discord.Color.red())
            
            pokemon_counts = {}
            for pokemon in pokemons:
                pokemon_counts[pokemon.pokemon_name] = pokemon_counts.get(pokemon.pokemon_name, 0) + 1
            
            for pokemon_name, count in pokemon_counts.items():
                embed.add_field(name=pokemon_name, value=f"Cantidad: {count}", inline=True)
            
            embed.set_footer(text=f"Total de Pokémon: {len(pokemons)}")
            embed.set_author(name=interaction.user.display_name, icon_url=interaction.user.avatar.url if interaction.user.avatar else None)
            
            await interaction.response.send_message(embed=embed)

    @app_commands.command(name="pokemon", description="Muestra un Pokémon aleatorio")
    async def mostrar_pokemon(self, interaction: discord.Interaction):
        if not self.update_attempts(interaction.user.id):
            attempt = session.query(Attempt).filter_by(user_id=get_user(interaction.user.id).id, attempt_type='pokemon').first()
            remaining_time = self.attempts_reset_time - (datetime.utcnow() - attempt.last_reset).total_seconds()
            await interaction.response.send_message(f"Has agotado tus intentos. Espera {int(remaining_time / 60)} minutos para obtener más intentos.", ephemeral=True)
            return

        await interaction.response.defer()  

        async with aiohttp.ClientSession() as session:
            pokemon_id = random.randint(1, 151)  # Limitar a los primeros 151 Pokémon
            async with session.get(f"{self.pokemon_api_url}{pokemon_id}") as response:
                if response.status == 200:
                    data = await response.json()
                    
                    pokemon_name = data['name'].capitalize()
                    pokemon_image = data['sprites']['front_default']
                    pokemon_stats = data['stats']
                    pokemon_types = [t['type']['name'].capitalize() for t in data['types']]
                    pokemon_weight = data['weight'] / 10  # Convertir a kg

                    stats_mapping = {
                        "hp": ("❤️ Salud", "HP"),
                        "attack": ("⚔️ Ataque", "ATK"),
                        "defense": ("🛡️ Defensa", "DEF"),
                        "special-attack": ("🔮 Ataque Especial", "SP.ATK"),
                        "special-defense": ("🔰 Defensa Especial", "SP.DEF"),
                        "speed": ("💨 Velocidad", "VEL")
                    }

                    stats_description = "\n".join([f"{stats_mapping[stat['stat']['name']][0]}: **{stat['base_stat']}** {stats_mapping[stat['stat']['name']][1]}" for stat in pokemon_stats])

                    pokemon_description = f"**Tipo**: {', '.join([f'`{t}`' for t in pokemon_types])}\n**Peso**: {pokemon_weight:.1f} kg\n\n**Estadísticas**:\n{stats_description}"

                    pokemon_rarity = random.choice(["común", "raro", "muy raro"])
                    rarity_emojis = {"común": "⚪", "raro": "🔵", "muy raro": "🟣"}
                    catch_rate = {"común": 0.8, "raro": 0.5, "muy raro": 0.2}[pokemon_rarity]

                    remaining_attempts = self.get_remaining_attempts(interaction.user.id)
                    embed = discord.Embed(title=f"¡Apareció un {pokemon_name}! {rarity_emojis[pokemon_rarity]}", description=pokemon_description, color=discord.Color.random())
                    embed.set_image(url=pokemon_image)
                    embed.add_field(name="📊 Rareza", value=f"**{pokemon_rarity.capitalize()}**")
                    
                    await interaction.followup.send(embed=embed, view=PokemonCatchView(self, pokemon_name, pokemon_id, catch_rate))
                else:
                    await interaction.followup.send("No se pudo obtener un Pokémon. Intenta de nuevo más tarde.", ephemeral=True)

class PokemonCatchView(discord.ui.View):
    def __init__(self, plugin, pokemon_name, pokemon_id, catch_rate):
        super().__init__(timeout=60)
        self.plugin = plugin
        self.pokemon_name = pokemon_name
        self.pokemon_id = pokemon_id
        self.catch_rate = catch_rate
        self.users_attempted = set()

    @discord.ui.button(label="Capturar Pokémon", style=discord.ButtonStyle.primary)
    async def catch_pokemon(self, interaction: discord.Interaction, button: discord.ui.Button):
        if interaction.user.id in self.users_attempted:
            await interaction.response.send_message("Ya has intentado capturar este Pokémon.", ephemeral=True)
            return

        self.users_attempted.add(interaction.user.id)

        if random.random() <= self.catch_rate:
            self.plugin.add_pokemon(interaction.user.id, self.pokemon_name, self.pokemon_id)
            update_balance(interaction.user.id, 10)  # Recompensa de 10 monedas

            embed = interaction.message.embeds[0]
            embed.color = discord.Color.gold()
            embed.set_footer(text=f"Capturado por {interaction.user.name}", icon_url=interaction.user.avatar.url if interaction.user.avatar else None)
            await interaction.message.edit(embed=embed, view=None)
            await interaction.response.send_message(f"¡Felicidades! Has capturado un {self.pokemon_name} y ganado 10 {self.plugin.currency_name}.")
        else:
            await interaction.response.send_message(f"¡Oh no! El {self.pokemon_name} escapó.", ephemeral=True)

        if len(self.users_attempted) >= len(interaction.channel.members):
            await interaction.message.edit(view=None)
            self.stop()

async def setup(bot):
    await bot.add_cog(PokemonPlugin(bot))