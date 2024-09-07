import discord
from discord import app_commands
from discord.ext import commands
from src.utils.database import (
    get_automod_status, get_automod_rules, add_mod_action, get_log_channel,
    set_automod_status, set_automod_config, add_automod_rule, set_mod_roles, set_log_channel,
    get_mod_roles, get_automod_config
)
import re
from collections import defaultdict
import time

class Automod(commands.Cog):
    """
    Este plugin proporciona comandos para activar, desactivar y configurar el sistema de moderación automática (automod)
    para un servidor de Discord. También permite añadir y gestionar reglas de moderación, como palabras prohibidas,
    detección de spam y enlaces.
    """
    name = "🔧 Automod"
    
    def __init__(self, bot):
        self.bot = bot
        self.user_messages = defaultdict(list)
        self.spam_threshold = 5  # Número máximo de mensajes permitidos en el intervalo
        self.spam_interval = 5  # Intervalo de tiempo en segundos

    @commands.Cog.listener()
    async def on_message(self, message):
        if message.author.bot or not message.guild:
            return

        if not get_automod_status(message.guild.id):
            return

        rules = get_automod_rules(message.guild.id)
        for rule in rules:
            if await self.check_rule(message, rule):
                await self.apply_action(message, rule)

    async def check_rule(self, message, rule):
        if rule.rule_type == 'banned_words':
            banned_words = rule.rule_config.get('words', [])
            return any(word.lower() in message.content.lower() for word in banned_words)
        elif rule.rule_type == 'spam':
            return self.check_spam(message)
        elif rule.rule_type == 'links':
            url_pattern = re.compile(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+')
            return bool(url_pattern.search(message.content))
        # Añadir más tipos de reglas según sea necesario
        return False

    def check_spam(self, message):
        current_time = time.time()
        user_id = message.author.id
        guild_id = message.guild.id

        # Eliminar mensajes antiguos
        self.user_messages[(guild_id, user_id)] = [
            msg_time for msg_time in self.user_messages[(guild_id, user_id)]
            if current_time - msg_time < self.spam_interval
        ]

        # Añadir el nuevo mensaje
        self.user_messages[(guild_id, user_id)].append(current_time)

        # Comprobar si se ha superado el umbral
        return len(self.user_messages[(guild_id, user_id)]) > self.spam_threshold

    async def apply_action(self, message, rule):
        action_type = rule.rule_config.get('action', 'warn')
        reason = f"Violación de regla de automod: {rule.rule_type}"

        if rule.rule_type == 'spam':
            action_type = 'mute'  # Podemos decidir mutar automáticamente por spam
            reason = "Detección de spam"

        if action_type == 'delete':
            await message.delete()
        elif action_type == 'warn':
            await message.channel.send(f"{message.author.mention}, por favor sigue las reglas del servidor.")
        elif action_type == 'kick':
            await message.author.kick(reason=reason)
        elif action_type == 'ban':
            await message.author.ban(reason=reason)
        elif action_type == 'mute':
            # Implementar lógica para silenciar al usuario
            mute_role = discord.utils.get(message.guild.roles, name="Muted")
            if mute_role:
                await message.author.add_roles(mute_role, reason=reason)
            else:
                # Si no existe el rol "Muted", crearlo
                mute_role = await message.guild.create_role(name="Muted")
                for channel in message.guild.channels:
                    await channel.set_permissions(mute_role, send_messages=False)
                await message.author.add_roles(mute_role, reason=reason)

        add_mod_action(message.guild.id, message.author.id, self.bot.user.id, action_type, reason)

        log_channel_id = get_log_channel(message.guild.id)
        if log_channel_id:
            log_channel = self.bot.get_channel(int(log_channel_id))
            if log_channel:
                await log_channel.send(f"Acción de automod: {action_type} aplicada a {message.author.mention} por {reason}")

    def get_commands(self):
        return [command for command in self.bot.tree.walk_commands() if command.binding == self]

    @app_commands.command(name="automod", description="Muestra información sobre los comandos de automod")
    @app_commands.checks.has_permissions(administrator=True)
    async def automod(self, interaction: discord.Interaction):
        await interaction.response.send_message("Usa `/automod_enable` o `/automod_disable` para activar o desactivar el automod.")

    @app_commands.command(name="automod_enable", description="Activa el automod para este servidor")
    @app_commands.checks.has_permissions(administrator=True)
    async def enable_automod(self, interaction: discord.Interaction):
        changed = set_automod_status(interaction.guild.id, True)
        if changed:
            await interaction.response.send_message("Automod activado para este servidor.")
        else:
            await interaction.response.send_message("El automod ya estaba activado para este servidor.")

    @app_commands.command(name="automod_disable", description="Desactiva el automod para este servidor")
    @app_commands.checks.has_permissions(administrator=True)
    async def disable_automod(self, interaction: discord.Interaction):
        changed = set_automod_status(interaction.guild.id, False)
        if changed:
            await interaction.response.send_message("Automod desactivado para este servidor.")
        else:
            await interaction.response.send_message("El automod ya estaba desactivado para este servidor.")

    @app_commands.command(name="automod_addrule", description="Añade una nueva regla de automod")
    @app_commands.describe(rule_type="Tipo de regla", config="Configuración de la regla en formato JSON")
    @app_commands.checks.has_permissions(administrator=True)
    async def add_rule(self, interaction: discord.Interaction, rule_type: str, config: str):
        try:
            import json
            rule_config = json.loads(config)
            add_automod_rule(interaction.guild.id, rule_type, rule_config)
            await interaction.response.send_message(f"Regla de tipo '{rule_type}' añadida.")
        except Exception as e:
            await interaction.response.send_message(f"Error al añadir la regla: {str(e)}")

    @app_commands.command(name="automod_setroles", description="Establece los roles de moderador")
    @app_commands.describe(role_ids="IDs de los roles separados por espacios")
    @app_commands.checks.has_permissions(administrator=True)
    async def set_mod_roles(self, interaction: discord.Interaction, role_ids: str):
        try:
            role_id_list = [int(role_id.strip()) for role_id in role_ids.split()]
            set_mod_roles(interaction.guild.id, role_id_list)
            await interaction.response.send_message("Roles de moderador actualizados.")
        except ValueError:
            await interaction.response.send_message("Error: Asegúrate de proporcionar IDs de roles válidos separados por espacios.")

    @app_commands.command(name="automod_setlogchannel", description="Establece el canal de logs para el automod")
    @app_commands.describe(channel="El canal donde se enviarán los logs de automod")
    @app_commands.checks.has_permissions(administrator=True)
    async def set_log_channel(self, interaction: discord.Interaction, channel: discord.TextChannel):
        set_log_channel(interaction.guild.id, str(channel.id))
        await interaction.response.send_message(f"Canal de logs establecido a {channel.mention}")

    @app_commands.command(name="automod_config", description="Muestra la configuración actual del automod")
    @app_commands.checks.has_permissions(administrator=True)
    async def show_config(self, interaction: discord.Interaction):
        status = get_automod_status(interaction.guild.id)
        config = get_automod_config(interaction.guild.id)
        rules = get_automod_rules(interaction.guild.id)
        mod_roles = get_mod_roles(interaction.guild.id)
        log_channel = get_log_channel(interaction.guild.id)

        embed = discord.Embed(title="Configuración de Automod", color=discord.Color.blue())
        embed.add_field(name="Estado", value="Activado" if status else "Desactivado", inline=False)
        embed.add_field(name="Reglas", value="\n".join([f"{rule.rule_type}: {rule.rule_config}" for rule in rules]) or "Ninguna", inline=False)
        embed.add_field(name="Roles de moderador", value=", ".join([f"<@&{role_id}>" for role_id in mod_roles]) or "Ninguno", inline=False)
        embed.add_field(name="Canal de logs", value=f"<#{log_channel}>" if log_channel else "No configurado", inline=False)

        await interaction.response.send_message(embed=embed)

    @app_commands.command(name="automod_spam_config", description="Configura los parámetros de detección de spam")
    @app_commands.describe(
        threshold="Número máximo de mensajes permitidos en el intervalo",
        interval="Intervalo de tiempo en segundos"
    )
    @app_commands.checks.has_permissions(administrator=True)
    async def spam_config(self, interaction: discord.Interaction, threshold: int, interval: int):
        self.spam_threshold = threshold
        self.spam_interval = interval
        await interaction.response.send_message(f"Configuración de spam actualizada. Umbral: {threshold} mensajes en {interval} segundos.")

    @app_commands.command(name="automod_status", description="Muestra el estado actual del automod")
    @app_commands.checks.has_permissions(administrator=True)
    async def automod_status(self, interaction: discord.Interaction):
        status = get_automod_status(interaction.guild.id)
        await interaction.response.send_message(f"El automod está {'activado' if status else 'desactivado'} para este servidor.")

async def setup(bot):
    await bot.add_cog(Automod(bot))
