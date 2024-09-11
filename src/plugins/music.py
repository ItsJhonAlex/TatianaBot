import asyncio
import functools
import yt_dlp
import discord
from discord import app_commands
from discord.ext import commands
from src.utils.database import add_song_to_queue, get_guild_queue, remove_song_from_queue, clear_guild_queue
import logging

# Configuración de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('music_plugin')

class YTDLSource(discord.PCMVolumeTransformer):
    YTDL_OPTIONS = {
        'format': 'bestaudio/best',
        'extractaudio': True,
        'audioformat': 'mp3',
        'outtmpl': '%(extractor)s-%(id)s-%(title)s.%(ext)s',
        'restrictfilenames': True,
        'noplaylist': True,
        'nocheckcertificate': True,
        'ignoreerrors': False,
        'logtostderr': False,
        'quiet': True,
        'no_warnings': True,
        'default_search': 'auto',
        'source_address': '0.0.0.0',
        'verbose': True  # Agrega esta línea
    }

    FFMPEG_OPTIONS = {
        'before_options': '-reconnect 1 -reconnect_streamed 1 -reconnect_delay_max 5',
        'options': '-vn',
    }

    ytdl = yt_dlp.YoutubeDL(YTDL_OPTIONS)

    def __init__(self, source, *, data, volume=0.5):
        super().__init__(source, volume)
        self.data = data
        self.title = data.get('title')
        self.url = data.get('url')

    @classmethod
    async def from_url(cls, url, *, loop=None, stream=False):
        loop = loop or asyncio.get_event_loop()
        data = await loop.run_in_executor(None, lambda: cls.ytdl.extract_info(url, download=not stream))

        if 'entries' in data:
            # Toma el primer item de una playlist
            data = data['entries'][0]

        filename = data['url'] if stream else cls.ytdl.prepare_filename(data)
        return cls(discord.FFmpegPCMAudio(filename, **cls.FFMPEG_OPTIONS), data=data)

class MusicPlugin(commands.Cog):
    """
    Este plugin proporciona comandos para reproducir música en canales de voz.
    """
    name = "🎵 Música"

    def __init__(self, bot):
        self.bot = bot
        self.voice_states = {}

    def get_voice_state(self, ctx: commands.Context):
        state = self.voice_states.get(ctx.guild.id)
        if not state:
            state = VoiceState(self.bot, ctx)
            self.voice_states[ctx.guild.id] = state
        return state

    def cog_unload(self):
        for state in self.voice_states.values():
            self.bot.loop.create_task(state.stop())

    def cog_check(self, ctx: commands.Context):
        if not ctx.guild:
            raise commands.NoPrivateMessage('Este comando no se puede usar en canales privados.')
        return True

    @app_commands.command(name="unirse", description="Une el bot al canal de voz")
    async def _join(self, interaction: discord.Interaction):
        if not interaction.user.voice:
            return await interaction.response.send_message("Necesitas estar en un canal de voz para usar este comando.", ephemeral=True)
        
        await interaction.response.defer()
        destination = interaction.user.voice.channel
        if interaction.guild.voice_client:
            await interaction.guild.voice_client.move_to(destination)
        else:
            await destination.connect()
        await interaction.followup.send(f'Conectado a {destination.name}')

    @app_commands.command(name="reproducir", description="Reproduce una canción o la agrega a la cola")
    @app_commands.describe(busqueda="URL o nombre de la canción a reproducir")
    async def _play(self, interaction: discord.Interaction, busqueda: str):
        if not interaction.user.voice:
            return await interaction.response.send_message("Necesitas estar en un canal de voz para usar este comando.", ephemeral=True)

        await interaction.response.defer()
        logger.info(f"Comando de reproducción iniciado para: {busqueda}")

        if not interaction.guild.voice_client:
            await interaction.user.voice.channel.connect()

        try:
            player = await YTDLSource.from_url(busqueda, loop=self.bot.loop, stream=True)
            logger.info(f"Fuente de audio creada para: {player.title}")

            if interaction.guild.voice_client.is_playing():
                # Agregar a la cola
                add_song_to_queue(str(interaction.guild.id), player.url, player.title, str(interaction.user.id))
                await interaction.followup.send(f'Canción agregada a la cola: {player.title}')
            else:
                # Reproducir inmediatamente
                interaction.guild.voice_client.play(player, after=lambda e: self.bot.loop.create_task(self.play_next(interaction)))
                await interaction.followup.send(f'Reproduciendo ahora: {player.title}')
        except Exception as e:
            logger.error(f"Error al reproducir {busqueda}: {str(e)}", exc_info=True)
            await interaction.followup.send(f'Ocurrió un error al procesar esta solicitud: {str(e)}')

    async def play_next(self, interaction: discord.Interaction):
        next_song = remove_song_from_queue(str(interaction.guild.id))
        if next_song:
            player = await YTDLSource.from_url(next_song.song_url, loop=self.bot.loop, stream=True)
            interaction.guild.voice_client.play(player, after=lambda e: self.bot.loop.create_task(self.play_next(interaction)))
            await interaction.channel.send(f'Reproduciendo ahora: {player.title}')
        else:
            await interaction.guild.voice_client.disconnect()

    @app_commands.command(name="volumen", description="Cambia el volumen de la música")
    @app_commands.describe(volumen="Nivel de volumen (0-100)")
    async def _volume(self, interaction: discord.Interaction, volumen: int):
        if not interaction.guild.voice_client:
            return await interaction.response.send_message('No estoy conectado a un canal de voz.')

        interaction.guild.voice_client.source.volume = volumen / 100
        await interaction.response.send_message('Volumen del reproductor cambiado a {}%'.format(volumen))

    @app_commands.command(name="salir", description="Desconecta el bot del canal de voz")
    async def _leave(self, interaction: discord.Interaction):
        if not interaction.guild.voice_client:
            return await interaction.response.send_message('No estoy conectado a ningún canal de voz.')

        await interaction.guild.voice_client.disconnect()
        await interaction.response.send_message('Desconectado del canal de voz.')

    @app_commands.command(name="pausa", description="Pausa la reproducción actual")
    async def _pause(self, interaction: discord.Interaction):
        if interaction.guild.voice_client and interaction.guild.voice_client.is_playing():
            interaction.guild.voice_client.pause()
            await interaction.response.send_message('Reproducción pausada.')
        else:
            await interaction.response.send_message('No hay nada reproduciéndose actualmente.')

    @app_commands.command(name="reanudar", description="Reanuda la reproducción pausada")
    async def _resume(self, interaction: discord.Interaction):
        if interaction.guild.voice_client and interaction.guild.voice_client.is_paused():
            interaction.guild.voice_client.resume()
            await interaction.response.send_message('Reproducción reanudada.')
        else:
            await interaction.response.send_message('La reproducción no está pausada.')

    @app_commands.command(name="saltar", description="Salta a la siguiente canción en la cola")
    async def _skip(self, interaction: discord.Interaction):
        if not interaction.guild.voice_client:
            return await interaction.response.send_message('No estoy reproduciendo nada actualmente.')

        interaction.guild.voice_client.stop()
        await interaction.response.send_message('Saltando la canción actual.')

    @app_commands.command(name="cola", description="Muestra la cola de reproducción")
    async def _queue(self, interaction: discord.Interaction):
        queue = get_guild_queue(str(interaction.guild.id))
        
        if not queue:
            return await interaction.response.send_message('La cola está vacía.')

        em = discord.Embed(title="Cola de reproducción", color=discord.Color.blue())
        song_list = []
        for i, song in enumerate(queue, start=1):
            song_list.append(f"**{i}.** {song.title} (Solicitado por <@{song.requester_id}>)")

        em.description = "\n".join(song_list)
        await interaction.response.send_message(embed=em)

class VoiceState:
    def __init__(self, bot: commands.Bot, ctx: commands.Context):
        self.bot = bot
        self._ctx = ctx

        self.current = None
        self.voice = None
        self.next = asyncio.Event()
        self.songs = asyncio.Queue()

        self._loop = False
        self._volume = 0.5
        self.skip_votes = set()

        self.audio_player = bot.loop.create_task(self.audio_player_task())

    def __del__(self):
        self.audio_player.cancel()

    @property
    def loop(self):
        return self._loop

    @loop.setter
    def loop(self, value: bool):
        self._loop = value

    @property
    def volume(self):
        return self._volume

    @volume.setter
    def volume(self, value: float):
        self._volume = value

    @property
    def is_playing(self):
        return self.voice and self.current

    async def audio_player_task(self):
        while True:
            self.next.clear()
            logger.info("Esperando la próxima canción...")

            try:
                async with asyncio.timeout(180):  # 3 minutos
                    self.current = await self.songs.get()
            except asyncio.TimeoutError:
                logger.info("No se reprodujo música durante 3 minutos, desconectando...")
                self.bot.loop.create_task(self.stop())
                return

            logger.info(f"Reproduciendo: {self.current.source.title}")
            self.guild.voice_client.play(self.current.source, after=lambda _: self.bot.loop.call_soon_threadsafe(self.next.set))
            await self.current.source.channel.send(embed=self.current.create_embed())
            await self.next.wait()

    def skip(self):
        self.skip_votes.clear()

        if self.is_playing:
            self.voice.stop()

    async def stop(self):
        while not self.songs.empty():
            await self.songs.get()

        if self.voice:
            await self.voice.disconnect()
            self.voice = None

class Song:
    __slots__ = ('source', 'requester')

    def __init__(self, source: YTDLSource):
        self.source = source
        self.requester = source.requester

    def create_embed(self):
        embed = (discord.Embed(title='Reproduciendo ahora',
                               description='```css\n{0.source.title}\n```'.format(self),
                               color=discord.Color.blurple())
                 .add_field(name='Duración', value=self.source.duration)
                 .add_field(name='Solicitado por', value=self.requester.mention)
                 .add_field(name='Uploader', value='[{0.source.uploader}]({0.source.uploader_url})'.format(self))
                 .add_field(name='URL', value='[Click]({0.source.url})'.format(self))
                 .set_thumbnail(url=self.source.thumbnail))

        return embed

class VoiceError(Exception):
    pass

class YTDLError(Exception):
    pass

async def setup(bot):
    await bot.add_cog(MusicPlugin(bot))