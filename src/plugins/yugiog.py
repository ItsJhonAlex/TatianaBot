import discord
from discord import app_commands
from discord.ext import commands
import aiohttp
import random
from datetime import datetime, timedelta
from src.utils.database import session, User, YugiohCard, Attempt, get_user, update_balance, get_balance

class YugiohPlugin(commands.Cog):
    """
    Este plugin ofrece comandos relacionados con Yu-Gi-Oh!, incluyendo
    la obtención de cartas aleatorias y la gestión del inventario de cartas.
    """
    name = "🃏 Yu-Gi-Oh!"

    def __init__(self, bot):
        self.bot = bot
        self.yugioh_api_url = "https://db.ygoprodeck.com/api/v7/randomcard.php"
        self.currency_name = "monedas"
        self.attempts_reset_time = 3600  # 1 hora en segundos
        self.max_attempts = 10

    def get_remaining_attempts(self, user_id):
        user = get_user(user_id)
        attempt = session.query(Attempt).filter_by(user_id=user.id, attempt_type='yugioh').first()
        if not attempt:
            attempt = Attempt(user_id=user.id, attempt_type='yugioh', attempts=self.max_attempts, last_reset=datetime.utcnow())
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
        attempt = session.query(Attempt).filter_by(user_id=user.id, attempt_type='yugioh').first()
        if not attempt:
            attempt = Attempt(user_id=user.id, attempt_type='yugioh', attempts=self.max_attempts, last_reset=datetime.utcnow())
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

    def add_yugioh_card(self, user_id, card_name, card_id):
        user = get_user(user_id)
        new_card = YugiohCard(user_id=user.id, card_name=card_name, card_id=card_id)
        session.add(new_card)
        session.commit()

    @app_commands.command(name="deck", description="Muestra tu deck de cartas de Yu-Gi-Oh!")
    async def deck(self, interaction: discord.Interaction):
        user = get_user(interaction.user.id)
        cards = session.query(YugiohCard).filter_by(user_id=user.id).all()
        
        if not cards:
            await interaction.response.send_message("No tienes ninguna carta de Yu-Gi-Oh! en tu deck.")
        else:
            embed = discord.Embed(title="🃏 Tu deck de Yu-Gi-Oh!", color=discord.Color.blue())
            
            card_counts = {}
            for card in cards:
                card_counts[card.card_name] = card_counts.get(card.card_name, 0) + 1
            
            for card_name, count in card_counts.items():
                embed.add_field(name=card_name, value=f"Cantidad: {count}", inline=True)
            
            embed.set_footer(text=f"Total de cartas en el deck: {len(cards)}")
            embed.set_author(name=interaction.user.display_name, icon_url=interaction.user.avatar.url if interaction.user.avatar else None)
            
            await interaction.response.send_message(embed=embed)

    @app_commands.command(name="yugioh", description="Muestra una carta aleatoria de Yu-Gi-Oh!")
    async def yugioh(self, interaction: discord.Interaction):
        if not self.update_attempts(interaction.user.id):
            attempt = session.query(Attempt).filter_by(user_id=get_user(interaction.user.id).id, attempt_type='yugioh').first()
            remaining_time = self.attempts_reset_time - (datetime.utcnow() - attempt.last_reset).total_seconds()
            await interaction.response.send_message(f"Has agotado tus intentos. Espera {int(remaining_time / 60)} minutos para obtener más intentos.", ephemeral=True)
            return

        await interaction.response.defer()

        async with aiohttp.ClientSession() as session:
            async with session.get(self.yugioh_api_url) as response:
                if response.status == 200:
                    data = await response.json()
                    if 'data' not in data or not data['data']:
                        await interaction.followup.send("La API no devolvió datos de carta. Intenta de nuevo más tarde.", ephemeral=True)
                        return
                    
                    card = data['data'][0]
                    card_name = card.get('name', 'Nombre desconocido')
                    card_id = card.get('id', 'ID desconocido')
                    card_price = float(card.get('card_prices', [{}])[0].get('cardmarket_price', 0))
                    catch_rate = max(0.1, min(0.9, 1 - (card_price / 100)))  # Ajusta según sea necesario
                    
                    rarity_mapping = {
                        (0, 1): ("⚪ Común", 0xCCCCCC),
                        (1, 5): ("🔵 Rara", 0x3498db),
                        (5, 20): ("🟣 Súper Rara", 0x9b59b6),
                        (20, float('inf')): ("🟡 Ultra Rara", 0xf1c40f)
                    }
                    
                    rarity, color = next((v for k, v in rarity_mapping.items() if k[0] <= card_price < k[1]), ("⚫ Desconocida", 0x95a5a6))
                    
                    embed = discord.Embed(title=f"¡Apareció {card_name}!", color=color)
                    
                    if 'card_images' in card and card['card_images']:
                        embed.set_image(url=card['card_images'][0]['image_url'])
                    
                    description = f"**Tipo**: `{card.get('type', 'Desconocido')}`\n"
                    description += f"**Raza/Tipo**: `{card.get('race', 'Desconocido')}`\n"
                    if 'archetype' in card:
                        description += f"**Arquetipo**: `{card['archetype']}`\n"
                    description += f"\n**Descripción**: {card.get('desc', 'No hay descripción disponible')}"
                    
                    embed.description = description
                    
                    stats = []
                    if 'atk' in card:
                        stats.append(f"⚔️ ATK: **{card['atk']}**")
                    if 'def' in card:
                        stats.append(f"🛡️ DEF: **{card['def']}**")
                    if 'level' in card:
                        stats.append(f"⭐ Nivel: **{card['level']}**")
                    if stats:
                        embed.add_field(name="Estadísticas", value=" | ".join(stats), inline=False)
                    
                    embed.add_field(name="💰 Precio", value=f"${card_price:.2f}", inline=True)
                    embed.add_field(name="📊 Rareza", value=rarity, inline=True)
                    
                    remaining_attempts = self.get_remaining_attempts(interaction.user.id)
                    embed.set_footer(text=f"Solicitado por {interaction.user.name} | Intentos restantes: {remaining_attempts}", icon_url=interaction.user.avatar.url if interaction.user.avatar else None)
                    
                    await interaction.followup.send(embed=embed, view=YugiohCatchView(self, card_name, card_id, catch_rate))
                else:
                    await interaction.followup.send(f"No se pudo obtener una carta. Código de estado: {response.status}. Intenta de nuevo más tarde.", ephemeral=True)

class YugiohCatchView(discord.ui.View):
    def __init__(self, plugin, card_name, card_id, catch_rate):
        super().__init__(timeout=60)
        self.plugin = plugin
        self.card_name = card_name
        self.card_id = card_id
        self.catch_rate = catch_rate
        self.users_attempted = set()

    @discord.ui.button(label="Obtener Carta", style=discord.ButtonStyle.primary)
    async def catch_card(self, interaction: discord.Interaction, button: discord.ui.Button):
        if interaction.user.id in self.users_attempted:
            await interaction.response.send_message("Ya has intentado obtener esta carta.", ephemeral=True)
            return

        self.users_attempted.add(interaction.user.id)

        if random.random() <= self.catch_rate:
            self.plugin.add_yugioh_card(interaction.user.id, self.card_name, self.card_id)
            update_balance(interaction.user.id, 10)

            embed = interaction.message.embeds[0]
            embed.color = discord.Color.green()
            embed.set_footer(text=f"Obtenida por {interaction.user.name}", icon_url=interaction.user.avatar.url if interaction.user.avatar else None)
            await interaction.message.edit(embed=embed, view=None)
            await interaction.response.send_message(f"¡Felicidades! Has obtenido {self.card_name} y ganado 10 {self.plugin.currency_name}.")
            self.stop()
        else:
            await interaction.response.send_message(f"¡Oh no! No pudiste obtener {self.card_name}.", ephemeral=True)

        if len(self.users_attempted) >= len(interaction.channel.members):
            await interaction.message.edit(view=None)
            self.stop()

async def setup(bot):
    await bot.add_cog(YugiohPlugin(bot))