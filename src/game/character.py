import discord
from discord.ext import commands
from discord import app_commands
from src.utils.database import session, Character, get_balance, delete_character
from src.game.classes import CLASSES, PROFESSIONS, get_primordial_class
from src.game.stats import calculate_stats
from src.game.races import Race, get_race_description
import random

class CharacterCreation(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @app_commands.command(name="aventura", description="✨ Comienza tu aventura creando un nuevo personaje")
    async def aventura(self, interaction: discord.Interaction):
        existing_character = session.query(Character).filter_by(user_id=str(interaction.user.id)).first()
        if existing_character:
            await interaction.response.send_message("🚫 Ya tienes un personaje creado. No puedes crear otro.", ephemeral=True)
            return

        embed = discord.Embed(title="🌟 ¡Comienza tu Aventura!", description="Prepárate para embarcarte en un viaje épico. ¡Crea tu personaje y forja tu destino!", color=discord.Color.gold())
        embed.set_footer(text="Presiona el botón para comenzar tu aventura.")
        await interaction.response.send_message(embed=embed, view=NameInput())

    @app_commands.command(name="personaje", description="📜 Muestra el perfil de tu personaje")
    async def personaje(self, interaction: discord.Interaction):
        character = session.query(Character).filter_by(user_id=str(interaction.user.id)).first()
        if not character:
            await interaction.response.send_message("❌ No tienes un personaje creado. Usa /aventura para crear uno.", ephemeral=True)
            return

        balance = get_balance(interaction.user.id)

        embed = discord.Embed(title=f"📊 Perfil de {character.name} {character.surname}", color=discord.Color.blue())
        embed.set_thumbnail(url=interaction.user.avatar.url if interaction.user.avatar else None)
        embed.add_field(name="👤 Género", value=character.gender, inline=True)
        embed.add_field(name="🧬 Raza", value=character.race, inline=True)
        embed.add_field(name="🛡️ Clase Primaria", value=character.primary_class, inline=True)
        embed.add_field(name="🗡️ Clase Secundaria", value=character.secondary_class, inline=True)
        embed.add_field(name="✨ Clase Primordial", value=character.primordial_class, inline=True)
        embed.add_field(name="🛠️ Profesión", value=character.profession, inline=True)
        embed.add_field(name="📊 Nivel", value=str(character.level), inline=True)
        embed.add_field(name="📈 Experiencia", value=str(character.experience), inline=True)
        embed.add_field(name="💰 Monedas", value=str(balance), inline=True)
        
        stats = [
            ("❤️ Salud", character.health),
            ("🔮 Mana", character.mana),
            ("💪 Fuerza", character.strength),
            ("🧠 Inteligencia", character.intelligence),
            ("🏃‍♂️ Destreza", character.dexterity),
            ("🦉 Sabiduría", character.wisdom),
            ("🗣️ Carisma", character.charisma),
            ("🏋️ Constitución", character.constitution)
        ]
        
        for stat_name, stat_value in stats:
            embed.add_field(name=stat_name, value=str(stat_value), inline=True)

        embed.set_footer(text="🌟 ¡Continúa tu aventura y mejora tus habilidades!")
        await interaction.response.send_message(embed=embed)

    @app_commands.command(name="eliminar_personaje", description="🗑️ Elimina tu personaje actual")
    async def eliminar_personaje(self, interaction: discord.Interaction):
        success, message = delete_character(interaction.user.id)
        if success:
            await interaction.response.send_message("✅ " + message, ephemeral=True)
        else:
            await interaction.response.send_message("❌ " + message, ephemeral=True)

class NameInput(discord.ui.View):
    def __init__(self):
        super().__init__()
        self.name = None
        self.surname = None

    @discord.ui.button(label="📝 Ingresar Nombre", style=discord.ButtonStyle.primary)
    async def input_name(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_modal(NameModal(self))

    async def on_name_set(self, interaction: discord.Interaction):
        embed = discord.Embed(title="🌟 Creación de Personaje", description=f"Nombre: **{self.name} {self.surname}**\n\nAhora, elige la raza de tu personaje.", color=discord.Color.green())
        await interaction.response.edit_message(embed=embed, view=RaceSelection(self.name, self.surname))

class NameModal(discord.ui.Modal, title="📝 Ingresa el nombre de tu personaje"):
    name_input = discord.ui.TextInput(label="Nombre")
    surname_input = discord.ui.TextInput(label="Apellido")

    def __init__(self, original_view: NameInput):
        super().__init__()
        self.original_view = original_view

    async def on_submit(self, interaction: discord.Interaction):
        self.original_view.name = self.name_input.value
        self.original_view.surname = self.surname_input.value
        await self.original_view.on_name_set(interaction)

class RaceSelection(discord.ui.View):
    def __init__(self, name, surname):
        super().__init__()
        self.name = name
        self.surname = surname
        options = [discord.SelectOption(label=race.value, value=race.name, description=get_race_description(race)[:100]) for race in Race]
        select_menu = discord.ui.Select(placeholder="🧬 Elige tu raza", options=options)
        select_menu.callback = self.race_callback
        self.add_item(select_menu)

    async def race_callback(self, interaction: discord.Interaction):
        race = Race[interaction.data['values'][0]]
        embed = discord.Embed(title="🌟 Creación de Personaje", description=f"Nombre: **{self.name} {self.surname}**\nRaza: **{race.value}**\n\nAhora, elige el género de tu personaje.", color=discord.Color.green())
        await interaction.response.edit_message(embed=embed, view=GenderSelection(self.name, self.surname, race))

class GenderSelection(discord.ui.View):
    def __init__(self, name, surname, race):
        super().__init__()
        self.name = name
        self.surname = surname
        self.race = race

    @discord.ui.button(label="♂️ Masculino", style=discord.ButtonStyle.primary)
    async def select_male(self, interaction: discord.Interaction, button: discord.ui.Button):
        await self.gender_selected(interaction, "Masculino")

    @discord.ui.button(label="♀️ Femenino", style=discord.ButtonStyle.primary)
    async def select_female(self, interaction: discord.Interaction, button: discord.ui.Button):
        await self.gender_selected(interaction, "Femenino")

    @discord.ui.button(label="⚧️ No binario", style=discord.ButtonStyle.primary)
    async def select_non_binary(self, interaction: discord.Interaction, button: discord.ui.Button):
        await self.gender_selected(interaction, "No binario")

    async def gender_selected(self, interaction: discord.Interaction, gender):
        embed = discord.Embed(title="🌟 Creación de Personaje", description=f"Nombre: **{self.name} {self.surname}**\nRaza: **{self.race.value}**\nGénero: **{gender}**\n\nAhora, elige tu clase primaria.", color=discord.Color.green())
        await interaction.response.edit_message(embed=embed, view=ClassSelection(self.name, self.surname, self.race, gender))

class ClassSelection(discord.ui.View):
    def __init__(self, name, surname, race, gender):
        super().__init__()
        self.name = name
        self.surname = surname
        self.race = race
        self.gender = gender
        self.primary_class = None
        self.secondary_class = None
        self.update_options()

    def update_options(self):
        self.clear_items()
        options = [discord.SelectOption(label=class_name, value=class_name, emoji="🛡️") for class_name in CLASSES if class_name != self.primary_class]
        select_menu = discord.ui.Select(placeholder="🛡️ Elige tu clase", options=options)
        select_menu.callback = self.class_callback
        self.add_item(select_menu)

    async def class_callback(self, interaction: discord.Interaction):
        selected_class = interaction.data['values'][0]
        if not self.primary_class:
            self.primary_class = selected_class
            embed = discord.Embed(title="🌟 Creación de Personaje", description=f"Nombre: **{self.name} {self.surname}**\nRaza: **{self.race.value}**\nGénero: **{self.gender}**\nClase Primaria: **{self.primary_class}**\n\nAhora, elige tu clase secundaria.", color=discord.Color.green())
            await interaction.response.edit_message(embed=embed, view=self)
            self.update_options()
        elif selected_class != self.primary_class:
            self.secondary_class = selected_class
            primordial_options = get_primordial_class(self.primary_class, self.secondary_class)
            embed = discord.Embed(title="🌟 Creación de Personaje", description=f"Nombre: **{self.name} {self.surname}**\nRaza: **{self.race.value}**\nGénero: **{self.gender}**\nClase Primaria: **{self.primary_class}**\nClase Secundaria: **{self.secondary_class}**\n\nElige tu clase primordial:", color=discord.Color.green())
            await interaction.response.edit_message(embed=embed, view=PrimordialSelection(self.name, self.surname, self.race, self.gender, self.primary_class, self.secondary_class, primordial_options))
        else:
            await interaction.response.send_message("No puedes elegir la misma clase como primaria y secundaria. Por favor, elige una clase diferente.", ephemeral=True)

class PrimordialSelection(discord.ui.View):
    def __init__(self, name, surname, race, gender, primary_class, secondary_class, primordial_options):
        super().__init__()
        self.name = name
        self.surname = surname
        self.race = race
        self.gender = gender
        self.primary_class = primary_class
        self.secondary_class = secondary_class
        options = [discord.SelectOption(label=class_name, value=class_name, emoji="✨") for class_name in primordial_options]
        select_menu = discord.ui.Select(placeholder="✨ Elige tu clase primordial", options=options)
        select_menu.callback = self.primordial_callback
        self.add_item(select_menu)

    async def primordial_callback(self, interaction: discord.Interaction):
        primordial_class = interaction.data['values'][0]
        embed = discord.Embed(title="🌟 Creación de Personaje", description=f"Nombre: **{self.name} {self.surname}**\nRaza: **{self.race.value}**\nGénero: **{self.gender}**\nClase Primaria: **{self.primary_class}**\nClase Secundaria: **{self.secondary_class}**\nClase Primordial: **{primordial_class}**\n\nPor último, elige tu profesión:", color=discord.Color.green())
        await interaction.response.edit_message(embed=embed, view=ProfessionSelection(self.name, self.surname, self.race, self.gender, self.primary_class, self.secondary_class, primordial_class))

class ProfessionSelection(discord.ui.View):
    def __init__(self, name, surname, race, gender, primary_class, secondary_class, primordial_class):
        super().__init__()
        self.name = name
        self.surname = surname
        self.race = race
        self.gender = gender
        self.primary_class = primary_class
        self.secondary_class = secondary_class
        self.primordial_class = primordial_class
        options = [discord.SelectOption(label=profession, value=profession, emoji="🛠️") for profession in PROFESSIONS]
        select_menu = discord.ui.Select(placeholder="🛠️ Elige tu profesión", options=options)
        select_menu.callback = self.profession_callback
        self.add_item(select_menu)

    async def profession_callback(self, interaction: discord.Interaction):
        profession = interaction.data['values'][0]
        stats = calculate_stats(self.primary_class, self.secondary_class, self.primordial_class, profession)
        
        new_character = Character(
            user_id=str(interaction.user.id),
            name=self.name,
            surname=self.surname,
            race=self.race.name,
            gender=self.gender,
            primary_class=self.primary_class,
            secondary_class=self.secondary_class,
            primordial_class=self.primordial_class,
            profession=profession,
            level=1,
            experience=0,
            **stats
        )
        session.add(new_character)
        session.commit()

        embed = discord.Embed(title="🎉 ¡Personaje Creado!", description="Tu aventura comienza ahora. ¡Buena suerte, héroe!", color=discord.Color.gold())
        embed.add_field(name="👤 Nombre", value=f"{self.name} {self.surname}", inline=False)
        embed.add_field(name="🧬 Raza", value=self.race.value, inline=True)
        embed.add_field(name="👥 Género", value=self.gender, inline=True)
        embed.add_field(name="🛡️ Clase Primaria", value=self.primary_class, inline=True)
        embed.add_field(name="🗡️ Clase Secundaria", value=self.secondary_class, inline=True)
        embed.add_field(name="✨ Clase Primordial", value=self.primordial_class, inline=True)
        embed.add_field(name="🛠️ Profesión", value=profession, inline=True)
        embed.add_field(name="📊 Nivel", value="1", inline=True)
        for stat, value in stats.items():
            embed.add_field(name=f"{get_stat_emoji(stat)} {stat.capitalize()}", value=str(value), inline=True)

        embed.set_footer(text="Usa /personaje para ver tu perfil en cualquier momento.")
        await interaction.response.edit_message(embed=embed, view=None)

def get_stat_emoji(stat):
    emoji_map = {
        "health": "❤️",
        "mana": "🔮",
        "strength": "💪",
        "intelligence": "🧠",
        "dexterity": "🏃‍♂️",
        "wisdom": "🦉",
        "charisma": "🗣️",
        "constitution": "🏋️"
    }
    return emoji_map.get(stat, "📊")

async def setup(bot):
    await bot.add_cog(CharacterCreation(bot))