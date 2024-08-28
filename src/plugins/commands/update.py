import discord
from discord.ext import commands
import aiohttp
import json
import os
from src.config.settings import Settings
from src.utils.logger import Logger

def is_authorized():
    async def predicate(ctx):
        return ctx.author.id == Settings.AUTHORIZED_USER_ID
    return commands.check(predicate)

async def get_latest_commit():
    url = f"https://api.github.com/repos/{Settings.GITHUB_REPO}/commits"
    headers = {
        "Authorization": f"token {Settings.GITHUB_ACCESS_TOKEN}",
        "Accept": "application/vnd.github.v3+json"
    }
    async with aiohttp.ClientSession() as session:
        async with session.get(url, headers=headers) as response:
            if response.status == 200:
                commits = await response.json()
                return commits[0] if commits else None
            else:
                return None

def save_commit_sha(sha):
    data_path = os.path.join('src', 'data', 'commit_data.json')
    with open(data_path, 'w') as f:
        json.dump({"sha": sha}, f)

def get_saved_sha():
    data_path = os.path.join('src', 'data', 'commit_data.json')
    try:
        with open(data_path, 'r') as f:
            data = json.load(f)
            return data.get("sha")
    except FileNotFoundError:
        return None

@commands.command(name="update", description="Verifica actualizaciones en el repositorio")
@is_authorized()
async def update(ctx):
    try:
        latest_commit = await get_latest_commit()
        if latest_commit:
            new_sha = latest_commit['sha']
            saved_sha = get_saved_sha()

            if new_sha != saved_sha:
                save_commit_sha(new_sha)
                
                embed = discord.Embed(
                    title=f"✨ ¡{Settings.BOT_NAME} ha sido actualizada!",
                    description="Se ha instalado una nueva actualización.",
                    color=discord.Color.blue()
                )
                
                embed.add_field(name="Cambios", value=latest_commit['commit']['message'], inline=False)
                embed.add_field(name="Desarrollador", value=latest_commit['author']['login'], inline=True)
                embed.add_field(name="Fecha", value=latest_commit['commit']['author']['date'], inline=True)
                embed.set_footer(text=f"Versión: {Settings.VERSION} • Creado por {Settings.CREATOR_NAME}")
                
                logo_path = os.path.join('src', 'assets', 'logo.png')
                if os.path.exists(logo_path):
                    file = discord.File(logo_path, filename="logo.png")
                    embed.set_author(name=latest_commit['author']['login'], icon_url="attachment://logo.png")
                
                update_channel = ctx.bot.get_channel(Settings.GITHUB_UPDATES_CHANNEL_ID)
                if update_channel:
                    if 'file' in locals():
                        await update_channel.send(file=file, embed=embed)
                    else:
                        await update_channel.send(embed=embed)
                else:
                    await ctx.send("No se pudo encontrar el canal de actualizaciones.")
            else:
                await ctx.send(f"{Settings.BOT_NAME} ya está en la versión más reciente.")
        else:
            await ctx.send("No se pudo obtener información de la última actualización.")
    except Exception as e:
        Logger.error(f"Error al verificar actualizaciones: {e}")
        await ctx.send("Ocurrió un error al verificar las actualizaciones.")

async def setup(bot):
    bot.add_command(update)
