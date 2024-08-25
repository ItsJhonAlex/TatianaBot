from discord.ext import commands
import discord
import aiohttp
import random
import os
import json
import asyncio
import time
from discord.ui import View, Button

class YugiohCommands(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.yugioh_api_url = "https://db.ygoprodeck.com/api/v7/randomcard.php"
        self.currency_name = "monedas"
        self.data_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'data')
        self.data_file = os.path.join(self.data_dir, 'user_data.json')
        self.attempts_reset_time = 3600  # 1 hora en segundos
        self.max_attempts = 10

    def load_data(self):
        if os.path.exists(self.data_file):
            with open(self.data_file, 'r') as f:
                data = json.load(f)
        else:
            data = {}
        
        for user_id in data:
            if not isinstance(data[user_id], dict):
                data[user_id] = {}
            if "balance" not in data[user_id]:
                data[user_id]["balance"] = 0
            if "pokemons" not in data[user_id]:
                data[user_id]["pokemons"] = []
            if "yugioh_cards" not in data[user_id]:
                data[user_id]["yugioh_cards"] = []
            if "yugioh_attempts" not in data[user_id]:
                data[user_id]["yugioh_attempts"] = {"attempts": self.max_attempts, "last_reset": time.time()}
        
        return data

    def save_data(self, data):
        with open(self.data_file, 'w') as f:
            json.dump(data, f)

    def update_balance(self, user_id, amount):
        data = self.load_data()
        user_id = str(user_id)
        if user_id not in data:
            data[user_id] = {"balance": 0, "pokemons": [], "yugioh_cards": [], "yugioh_attempts": {"attempts": self.max_attempts, "last_reset": time.time()}}
        data[user_id]["balance"] += amount
        self.save_data(data)

    def add_yugioh_card(self, user_id, card):
        data = self.load_data()
        user_id = str(user_id)
        if user_id not in data:
            data[user_id] = {"balance": 0, "pokemons": [], "yugioh_cards": [], "yugioh_attempts": {"attempts": self.max_attempts, "last_reset": time.time()}}
        if "yugioh_cards" not in data[user_id]:
            data[user_id]["yugioh_cards"] = []
        data[user_id]["yugioh_cards"].append(card)
        self.save_data(data)

    def update_attempts(self, user_id):
        data = self.load_data()
        user_id = str(user_id)
        current_time = time.time()
        
        if user_id not in data:
            data[user_id] = {"balance": 0, "pokemons": [], "yugioh_cards": [], "yugioh_attempts": {"attempts": self.max_attempts, "last_reset": current_time}}
        
        if current_time - data[user_id]["yugioh_attempts"]["last_reset"] >= self.attempts_reset_time:
            data[user_id]["yugioh_attempts"]["attempts"] = self.max_attempts
            data[user_id]["yugioh_attempts"]["last_reset"] = current_time
        
        if data[user_id]["yugioh_attempts"]["attempts"] > 0:
            data[user_id]["yugioh_attempts"]["attempts"] -= 1
            self.save_data(data)
            return True
        return False

    def get_remaining_attempts(self, user_id):
        data = self.load_data()
        user_id = str(user_id)
        if user_id in data and "yugioh_attempts" in data[user_id]:
            current_time = time.time()
            if current_time - data[user_id]["yugioh_attempts"]["last_reset"] >= self.attempts_reset_time:
                return self.max_attempts
            return data[user_id]["yugioh_attempts"]["attempts"]
        return self.max_attempts

    @commands.command(name="cartas", description="Muestra tu inventario de cartas de Yu-Gi-Oh!")
    async def cartas(self, ctx):
        data = self.load_data()
        cards = data.get(str(ctx.author.id), {}).get("yugioh_cards", [])
        if not cards:
            await ctx.send("No tienes ninguna carta de Yu-Gi-Oh! en tu inventario.")
        else:
            embed = discord.Embed(title="🃏 Tu inventario de cartas de Yu-Gi-Oh!", color=discord.Color.gold())
            
            card_counts = {}
            for card in cards:
                card_counts[card] = card_counts.get(card, 0) + 1
            
            for card, count in card_counts.items():
                embed.add_field(name=card, value=f"Cantidad: {count}", inline=False)
            
            embed.set_footer(text=f"Total de cartas: {len(cards)}")
            embed.set_author(name=ctx.author.display_name, icon_url=ctx.author.avatar.url if ctx.author.avatar else None)
            
            await ctx.send(embed=embed)

    @commands.command(name="yugioh", description="Muestra una carta aleatoria de Yu-Gi-Oh!")
    async def yugioh(self, ctx):
        if not self.update_attempts(ctx.author.id):
            remaining_time = self.attempts_reset_time - (time.time() - self.load_data()[str(ctx.author.id)]["yugioh_attempts"]["last_reset"])
            await ctx.send(f"Has agotado tus intentos. Espera {int(remaining_time / 60)} minutos para obtener más intentos.")
            return

        async with ctx.typing():
            async with aiohttp.ClientSession() as session:
                async with session.get(self.yugioh_api_url) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        if 'data' not in data or not data['data']:
                            await ctx.send("La API no devolvió datos de carta. Intenta de nuevo más tarde.")
                            return
                        
                        card = data['data'][0]
                        card_name = card.get('name', 'Nombre desconocido')
                        card_price = float(card.get('card_prices', [{}])[0].get('cardmarket_price', 0))
                        catch_rate = max(0.1, min(0.9, 1 - (card_price / 100)))  # Ajusta según sea necesario
                        
                        embed = discord.Embed(title=f"¡Apareció {card_name}!", description=card.get('desc', 'No hay descripción disponible'), color=discord.Color.gold())
                        
                        if 'card_images' in card and card['card_images']:
                            embed.set_image(url=card['card_images'][0]['image_url'])
                        
                        embed.add_field(name="Tipo", value=card.get('type', 'Desconocido'), inline=True)
                        embed.add_field(name="Precio", value=f"${card_price:.2f}", inline=True)
                        if 'atk' in card:
                            embed.add_field(name="ATK", value=card['atk'], inline=True)
                        if 'def' in card:
                            embed.add_field(name="DEF", value=card['def'], inline=True)
                        if 'race' in card:
                            embed.add_field(name="Raza/Tipo", value=card['race'], inline=True)
                        if 'archetype' in card:
                            embed.add_field(name="Arquetipo", value=card['archetype'], inline=True)
                        
                        remaining_attempts = self.get_remaining_attempts(ctx.author.id)
                        embed.set_footer(text=f"Solicitado por {ctx.author.name} | Intentos restantes: {remaining_attempts}", icon_url=ctx.author.avatar.url if ctx.author.avatar else None)
                        
                        view = View()
                        button = Button(label="Obtener Carta", style=discord.ButtonStyle.primary)
                        
                        users_attempted = set()
                        
                        async def button_callback(interaction):
                            if interaction.user.id in users_attempted:
                                await interaction.response.send_message("Ya has intentado obtener esta carta.", ephemeral=True)
                                return
                            
                            users_attempted.add(interaction.user.id)
                            
                            if random.random() <= catch_rate:
                                self.add_yugioh_card(interaction.user.id, card_name)
                                self.update_balance(interaction.user.id, 10)
                                embed.color = discord.Color.green()
                                embed.set_footer(text=f"Obtenida por {interaction.user.name}", icon_url=interaction.user.avatar.url if interaction.user.avatar else None)
                                await interaction.message.edit(embed=embed, view=None)
                                await interaction.response.send_message(f"¡Felicidades! Has obtenido {card_name} y ganado 10 {self.currency_name}.")
                                view.stop()
                            else:
                                await interaction.response.send_message(f"¡Oh no! No pudiste obtener {card_name}.", ephemeral=True)
                            
                            if len(users_attempted) >= len(ctx.channel.members):
                                await interaction.message.edit(view=None)
                                view.stop()
                        
                        button.callback = button_callback
                        view.add_item(button)
                        
                        message = await ctx.send(embed=embed, view=view)
                        
                        await view.wait()
                        if not view.is_finished():
                            await message.edit(view=None)
                            await ctx.send("Tiempo agotado. La carta ha desaparecido.")
                    else:
                        await ctx.send(f"No se pudo obtener una carta. Código de estado: {response.status}. Intenta de nuevo más tarde.")

async def setup(bot):
    await bot.add_cog(YugiohCommands(bot))