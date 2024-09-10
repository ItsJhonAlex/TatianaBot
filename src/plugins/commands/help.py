import discord
from discord.ext import commands
import math

class HelpCommands(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @commands.command(name="ayuda", description="Muestra el menú de ayuda del bot")
    async def ayuda(self, ctx):
        await self.show_main_help_menu(ctx)

    async def show_main_help_menu(self, ctx):
        embed = discord.Embed(
            title=f"Ayuda de {self.bot.user.name}",
            description="Bienvenido al menú de ayuda. Este bot ofrece una variedad de comandos de prefijo. Selecciona una categoría abajo para obtener más información.",
            color=discord.Color.blue()
        )
        
        if self.bot.user.avatar:
            embed.set_thumbnail(url=self.bot.user.avatar.url)
        
        view = HelpView(self.bot, self)
        message = await ctx.send(embed=embed, view=view)
        view.message = message

class HelpView(discord.ui.View):
    def __init__(self, bot, help_plugin):
        super().__init__(timeout=180)
        self.bot = bot
        self.help_plugin = help_plugin
        self.message = None
        self.add_plugin_buttons()

    def add_plugin_buttons(self):
        plugins = [
            cog for cog in self.bot.cogs.values() 
            if hasattr(cog, 'get_commands') and cog.get_commands() and 
            cog.__class__.__module__.startswith('src.plugins.commands') and
            not cog.__class__.__name__ in ['PowerCommands', 'UpdateCommands', 'HelpCommands', 'RulesCommands']
        ]
        for plugin in plugins:
            button = discord.ui.Button(
                label=getattr(plugin, 'name', plugin.__class__.__name__.replace('Commands', '')),
                style=discord.ButtonStyle.primary
            )
            button.callback = self.create_callback(plugin)
            self.add_item(button)

    def create_callback(self, plugin):
        async def callback(interaction: discord.Interaction):
            commands = plugin.get_commands()
            if not commands:
                embed = discord.Embed(
                    title=f"Comandos de {getattr(plugin, 'name', plugin.__class__.__name__.replace('Commands', ''))}",
                    description=plugin.__doc__ or "No hay descripción disponible.",
                    color=discord.Color.green()
                )
                embed.add_field(name="Sin comandos", value="Este plugin no tiene comandos disponibles.", inline=False)
                await interaction.response.edit_message(embed=embed, view=self)
                return

            pages = []
            commands_per_page = 24
            
            for i in range(0, len(commands), commands_per_page):
                embed = discord.Embed(
                    title=f"Comandos de {getattr(plugin, 'name', plugin.__class__.__name__.replace('Commands', ''))}",
                    description=plugin.__doc__ or "No hay descripción disponible.",
                    color=discord.Color.green()
                )
                for command in commands[i:i+commands_per_page]:
                    embed.add_field(name=f"!{command.name}", value=command.description or "Sin descripción", inline=False)
                
                total_pages = math.ceil(len(commands) / commands_per_page)
                current_page = i // commands_per_page + 1
                embed.set_footer(text=f"Página {current_page} de {total_pages}")
                pages.append(embed)
            
            if len(pages) == 1:
                await interaction.response.edit_message(embed=pages[0], view=self)
            else:
                await interaction.response.edit_message(embed=pages[0], view=PaginationView(pages, self, self.help_plugin))
        
        return callback

class PaginationView(discord.ui.View):
    def __init__(self, pages, original_view, help_plugin):
        super().__init__(timeout=180)
        self.pages = pages
        self.current_page = 0
        self.original_view = original_view
        self.help_plugin = help_plugin
        self.update_buttons()

    def update_buttons(self):
        self.clear_items()
        if len(self.pages) > 1:
            if self.current_page > 0:
                self.add_item(self.previous_page)
            if self.current_page < len(self.pages) - 1:
                self.add_item(self.next_page)
        self.add_item(self.back_to_main)

    @discord.ui.button(label="Anterior", style=discord.ButtonStyle.gray)
    async def previous_page(self, interaction: discord.Interaction, button: discord.ui.Button):
        self.current_page -= 1
        self.update_buttons()
        await interaction.response.edit_message(embed=self.pages[self.current_page], view=self)

    @discord.ui.button(label="Siguiente", style=discord.ButtonStyle.gray)
    async def next_page(self, interaction: discord.Interaction, button: discord.ui.Button):
        self.current_page += 1
        self.update_buttons()
        await interaction.response.edit_message(embed=self.pages[self.current_page], view=self)

    @discord.ui.button(label="Volver", style=discord.ButtonStyle.red)
    async def back_to_main(self, interaction: discord.Interaction, button: discord.ui.Button):
        await self.help_plugin.show_main_help_menu(interaction)

    async def on_timeout(self):
        for item in self.children:
            item.disabled = True
        await self.original_view.message.edit(view=self)

async def setup(bot):
    await bot.add_cog(HelpCommands(bot))