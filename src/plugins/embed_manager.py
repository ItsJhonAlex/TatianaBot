import discord
from discord import app_commands
from discord.ext import commands
from src.utils.database import create_embed, get_embed, update_embed, delete_embed, get_all_embeds
from src.utils.logger import bot_logger, debug, info, success, warning, error, critical

class EmbedCreator(discord.ui.View):
    def __init__(self, bot, interaction, existing_embed=None):
        super().__init__(timeout=300)
        self.bot = bot
        self.interaction = interaction
        self.embed = discord.Embed() if existing_embed is None else existing_embed
        self.embed_name = None if existing_embed is None else existing_embed.name

    @discord.ui.button(label="Título", style=discord.ButtonStyle.primary)
    async def set_title(self, interaction: discord.Interaction, button: discord.ui.Button):
        try:
            await interaction.response.send_modal(TitleModal(self))
        except Exception as e:
            error(f"Error al mostrar el modal de título: {str(e)}")
            await interaction.response.send_message("Hubo un error al mostrar el modal de título. Por favor, inténtalo de nuevo.", ephemeral=True)

    @discord.ui.button(label="Descripción", style=discord.ButtonStyle.primary)
    async def set_description(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_modal(DescriptionModal(self))

    @discord.ui.button(label="Color", style=discord.ButtonStyle.primary)
    async def set_color(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_modal(ColorModal(self))

    @discord.ui.button(label="Imagen", style=discord.ButtonStyle.primary)
    async def set_image(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_modal(ImageModal(self))

    @discord.ui.button(label="Thumbnail", style=discord.ButtonStyle.primary)
    async def set_thumbnail(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_modal(ThumbnailModal(self))

    @discord.ui.button(label="Autor", style=discord.ButtonStyle.primary)
    async def set_author(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_modal(AuthorModal(self))

    @discord.ui.button(label="Footer", style=discord.ButtonStyle.primary)
    async def set_footer(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_modal(FooterModal(self))

    @discord.ui.button(label="Añadir Campo", style=discord.ButtonStyle.primary)
    async def add_field(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_modal(FieldModal(self))

    @discord.ui.button(label="Hecho", style=discord.ButtonStyle.success)
    async def done(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_modal(NameModal(self))

    @discord.ui.button(label="Cancelar", style=discord.ButtonStyle.danger)
    async def cancel(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_message("Creación de embed cancelada.", ephemeral=True)
        self.disable_all_items()
        await self.interaction.edit_original_response(view=self)
        self.stop()

    async def update_preview(self):
        await self.interaction.edit_original_response(embed=self.embed, view=self)

    def disable_all_items(self):
        for item in self.children:
            item.disabled = True

class TitleModal(discord.ui.Modal, title="Establecer Título"):
    title_input = discord.ui.TextInput(label="Título", placeholder="Ingrese el título del embed")

    def __init__(self, view):
        super().__init__()
        self.view = view

    async def on_submit(self, interaction: discord.Interaction):
        self.view.embed.title = self.title_input.value
        await interaction.response.defer()
        await self.view.update_preview()

class DescriptionModal(discord.ui.Modal, title="Establecer Descripción"):
    description = discord.ui.TextInput(label="Descripción", style=discord.TextStyle.paragraph)

    def __init__(self, view):
        super().__init__()
        self.view = view

    async def on_submit(self, interaction: discord.Interaction):
        self.view.embed.description = self.description.value
        await interaction.response.defer()
        await self.view.update_preview()

class ColorModal(discord.ui.Modal, title="Establecer Color"):
    color = discord.ui.TextInput(label="Color (en formato hexadecimal, ej: #FF0000)")

    def __init__(self, view):
        super().__init__()
        self.view = view

    async def on_submit(self, interaction: discord.Interaction):
        try:
            color = int(self.color.value.strip('#'), 16)
            self.view.embed.color = color
            await interaction.response.defer()
            await self.view.update_preview()
        except ValueError:
            await interaction.response.send_message("Color inválido. Por favor, usa formato hexadecimal.", ephemeral=True)

class ImageModal(discord.ui.Modal, title="Establecer Imagen"):
    image_url = discord.ui.TextInput(label="URL de la imagen")

    def __init__(self, view):
        super().__init__()
        self.view = view

    async def on_submit(self, interaction: discord.Interaction):
        self.view.embed.set_image(url=self.image_url.value)
        await interaction.response.defer()
        await self.view.update_preview()

class ThumbnailModal(discord.ui.Modal, title="Establecer Thumbnail"):
    thumbnail_url = discord.ui.TextInput(label="URL del thumbnail")

    def __init__(self, view):
        super().__init__()
        self.view = view

    async def on_submit(self, interaction: discord.Interaction):
        self.view.embed.set_thumbnail(url=self.thumbnail_url.value)
        await interaction.response.defer()
        await self.view.update_preview()

class AuthorModal(discord.ui.Modal, title="Establecer Autor"):
    author_name = discord.ui.TextInput(label="Nombre del autor")
    author_icon_url = discord.ui.TextInput(label="URL del icono del autor", required=False)

    def __init__(self, view):
        super().__init__()
        self.view = view

    async def on_submit(self, interaction: discord.Interaction):
        self.view.embed.set_author(name=self.author_name.value, icon_url=self.author_icon_url.value or None)
        await interaction.response.defer()
        await self.view.update_preview()

class FooterModal(discord.ui.Modal, title="Establecer Footer"):
    footer_text = discord.ui.TextInput(label="Texto del footer")
    footer_icon_url = discord.ui.TextInput(label="URL del icono del footer", required=False)

    def __init__(self, view):
        super().__init__()
        self.view = view

    async def on_submit(self, interaction: discord.Interaction):
        self.view.embed.set_footer(text=self.footer_text.value, icon_url=self.footer_icon_url.value or None)
        await interaction.response.defer()
        await self.view.update_preview()

class FieldModal(discord.ui.Modal, title="Añadir Campo"):
    field_name = discord.ui.TextInput(label="Nombre del campo")
    field_value = discord.ui.TextInput(label="Valor del campo")
    inline = discord.ui.TextInput(label="Inline (true/false)", default="false")

    def __init__(self, view):
        super().__init__()
        self.view = view

    async def on_submit(self, interaction: discord.Interaction):
        inline = self.inline.value.lower() == "true"
        self.view.embed.add_field(name=self.field_name.value, value=self.field_value.value, inline=inline)
        await interaction.response.defer()
        await self.view.update_preview()

class NameModal(discord.ui.Modal, title="Guardar Embed"):
    name = discord.ui.TextInput(label="Nombre del embed")

    def __init__(self, view):
        super().__init__()
        self.view = view

    async def on_submit(self, interaction: discord.Interaction):
        self.view.embed_name = self.name.value
        embed_dict = self.view.embed.to_dict()
        try:
            if self.view.embed_name in [embed.name for embed in get_all_embeds(interaction.guild.id)]:
                update_embed(
                    interaction.guild.id,
                    self.view.embed_name,
                    title=embed_dict.get('title'),
                    description=embed_dict.get('description'),
                    color=embed_dict.get('color'),
                    footer=embed_dict.get('footer', {}).get('text'),
                    image_url=embed_dict.get('image', {}).get('url'),
                    thumbnail_url=embed_dict.get('thumbnail', {}).get('url'),
                    author_name=embed_dict.get('author', {}).get('name'),
                    author_icon_url=embed_dict.get('author', {}).get('icon_url'),
                    fields=embed_dict.get('fields'),
                    timestamp='timestamp' in embed_dict
                )
                await interaction.response.send_message(f"Embed '{self.view.embed_name}' actualizado con éxito.", ephemeral=True)
            else:
                create_embed(
                    interaction.guild.id,
                    self.view.embed_name,
                    embed_dict.get('title'),
                    embed_dict.get('description'),
                    embed_dict.get('color'),
                    embed_dict.get('footer', {}).get('text'),
                    embed_dict.get('image', {}).get('url'),
                    embed_dict.get('thumbnail', {}).get('url'),
                    embed_dict.get('author', {}).get('name'),
                    embed_dict.get('author', {}).get('icon_url'),
                    embed_dict.get('fields'),
                    'timestamp' in embed_dict
                )
                await interaction.response.send_message(f"Embed '{self.view.embed_name}' guardado con éxito.", ephemeral=True)
        except Exception as e:
            await interaction.response.send_message(f"Error al guardar el embed: {str(e)}", ephemeral=True)
        finally:
            self.view.disable_all_items()
            await self.view.interaction.edit_original_response(view=self.view)
            self.view.stop()

class EmbedManager(commands.Cog):
    """
    Este plugin proporciona comandos para crear, editar y gestionar embeds personalizados,
    incluyendo la creación, previsualización y publicación de embeds en canales específicos.
    """
    name = "🔧 Embed Manager"
    
    def __init__(self, bot):
        self.bot = bot

    @app_commands.command(name="embed", description="Crea un nuevo embed personalizado")
    @app_commands.checks.has_permissions(manage_messages=True)
    async def create_embed(self, interaction: discord.Interaction):
        view = EmbedCreator(self.bot, interaction)
        await interaction.response.send_message("Crea tu embed personalizado:", view=view, ephemeral=True)

    @app_commands.command(name="embed_preview", description="Muestra una vista previa de un embed")
    @app_commands.checks.has_permissions(manage_messages=True)
    async def preview_embed(self, interaction: discord.Interaction, name: str):
        embed_data = get_embed(interaction.guild.id, name)
        if embed_data:
            embed = discord.Embed(
                title=embed_data.title,
                description=embed_data.description,
                color=embed_data.color
            )
            if embed_data.footer:
                embed.set_footer(text=embed_data.footer)
            if embed_data.image_url:
                embed.set_image(url=embed_data.image_url)
            if embed_data.thumbnail_url:
                embed.set_thumbnail(url=embed_data.thumbnail_url)
            if embed_data.author_name:
                embed.set_author(name=embed_data.author_name, icon_url=embed_data.author_icon_url)
            if embed_data.fields:
                for field in embed_data.fields:
                    embed.add_field(name=field["name"], value=field["value"], inline=field["inline"])
            if embed_data.timestamp:
                embed.timestamp = discord.utils.utcnow()
            
            await interaction.response.send_message(f"Vista previa del embed '{name}':", embed=embed)
        else:
            await interaction.response.send_message(f"No se encontró el embed '{name}'.")

    @app_commands.command(name="publicar", description="Publica un embed en un canal específico")
    @app_commands.checks.has_permissions(manage_messages=True)
    async def publish_embed(self, interaction: discord.Interaction, name: str, channel: discord.TextChannel, 
                            mention_roles: str = None):
        embed_data = get_embed(interaction.guild.id, name)
        if embed_data:
            embed = discord.Embed(
                title=embed_data.title,
                description=embed_data.description,
                color=embed_data.color
            )
            if embed_data.footer:
                embed.set_footer(text=embed_data.footer)
            if embed_data.image_url:
                embed.set_image(url=embed_data.image_url)
            if embed_data.thumbnail_url:
                embed.set_thumbnail(url=embed_data.thumbnail_url)
            if embed_data.author_name:
                embed.set_author(name=embed_data.author_name, icon_url=embed_data.author_icon_url)
            if embed_data.fields:
                for field in embed_data.fields:
                    embed.add_field(name=field["name"], value=field["value"], inline=field["inline"])
            if embed_data.timestamp:
                embed.timestamp = discord.utils.utcnow()
            
            content = ""
            if mention_roles:
                role_mentions = []
                for role in mention_roles.split(','):
                    role = role.strip()
                    if role.isdigit():
                        role_mentions.append(f"<@&{role}>")
                    elif role.startswith('<@&') and role.endswith('>'):
                        role_mentions.append(role)
                    else:
                        # Intenta encontrar el rol por nombre
                        found_role = discord.utils.get(interaction.guild.roles, name=role)
                        if found_role:
                            role_mentions.append(found_role.mention)
                        else:
                            await interaction.response.send_message(f"No se pudo encontrar el rol: {role}", ephemeral=True)
                            return
                content = " ".join(role_mentions)
            
            await channel.send(content=content, embed=embed)
            await interaction.response.send_message(f"Embed '{name}' publicado en {channel.mention}.")
        else:
            await interaction.response.send_message(f"No se encontró el embed '{name}'.")

    @app_commands.command(name="embed_list", description="Lista todos los embeds guardados")
    @app_commands.checks.has_permissions(manage_messages=True)
    async def list_embeds(self, interaction: discord.Interaction):
        embeds = get_all_embeds(interaction.guild.id)
        if embeds:
            embed_list = "\n".join([f"• {embed.name}" for embed in embeds])
            await interaction.response.send_message(f"Embeds guardados:\n{embed_list}")
        else:
            await interaction.response.send_message("No hay embeds guardados.")

    @app_commands.command(name="embed_delete", description="Elimina un embed guardado")
    @app_commands.checks.has_permissions(manage_messages=True)
    async def delete_embed(self, interaction: discord.Interaction, name: str):
        if delete_embed(interaction.guild.id, name):
            await interaction.response.send_message(f"Embed '{name}' eliminado con éxito.")
        else:
            await interaction.response.send_message(f"No se encontró el embed '{name}'.")

    @app_commands.command(name="embed_edit", description="Edita un embed existente")
    @app_commands.checks.has_permissions(manage_messages=True)
    async def edit_embed(self, interaction: discord.Interaction, name: str):
        info(f"Intentando editar el embed '{name}' para el servidor {interaction.guild.id}")
        try:
            existing_embed = get_embed(interaction.guild.id, name)
            if existing_embed:
                info(f"Embed '{name}' encontrado. Creando objeto discord.Embed")
                discord_embed = discord.Embed(
                    title=existing_embed.title,
                    description=existing_embed.description,
                    color=existing_embed.color
                )
                if existing_embed.footer:
                    discord_embed.set_footer(text=existing_embed.footer)
                if existing_embed.image_url:
                    discord_embed.set_image(url=existing_embed.image_url)
                if existing_embed.thumbnail_url:
                    discord_embed.set_thumbnail(url=existing_embed.thumbnail_url)
                if existing_embed.author_name:
                    discord_embed.set_author(name=existing_embed.author_name, icon_url=existing_embed.author_icon_url)
                if existing_embed.fields:
                    for field in existing_embed.fields:
                        discord_embed.add_field(name=field["name"], value=field["value"], inline=field["inline"])
                if existing_embed.timestamp:
                    discord_embed.timestamp = discord.utils.utcnow()
                
                info(f"Creando vista EmbedCreator para el embed '{name}'")
                view = EmbedCreator(self.bot, interaction, discord_embed)
                view.embed_name = name
                
                info(f"Enviando respuesta con la vista de edición para el embed '{name}'")
                await interaction.response.send_message(f"Editando el embed '{name}':", view=view, embed=discord_embed, ephemeral=True)
            else:
                warning(f"No se encontró el embed '{name}' para el servidor {interaction.guild.id}")
                await interaction.response.send_message(f"No se encontró el embed '{name}'.", ephemeral=True)
        except Exception as e:
            error(f"Error al editar el embed '{name}': {str(e)}")
            await interaction.response.send_message(f"Ocurrió un error al editar el embed: {str(e)}", ephemeral=True)

    def get_commands(self):
        return [command for command in self.bot.tree.walk_commands() if command.binding == self]

async def setup(bot):
    await bot.add_cog(EmbedManager(bot))