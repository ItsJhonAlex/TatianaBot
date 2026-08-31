import type { ChatInputCommandInteraction, GuildMember, VoiceBasedChannel } from 'discord.js';
import { EPHEMERAL } from '../../lib/discord-flags.js';

export function requireVoiceChannel(
  interaction: ChatInputCommandInteraction,
): { member: GuildMember; channel: VoiceBasedChannel } | null {
  if (!interaction.guild || !interaction.member) {
    return null;
  }

  const member = interaction.guild.members.resolve(interaction.user.id);
  const channel = member?.voice.channel ?? null;
  if (!member || !channel) {
    return null;
  }

  return { member, channel };
}

export async function replyMusicDisabled(interaction: ChatInputCommandInteraction) {
  return interaction.reply({
    content:
      'Music is not configured. Set `LAVALINK_HOST`, `LAVALINK_PORT` and `LAVALINK_PASSWORD`, then start Lavalink (see `docs/lavalink.md`).',
    flags: EPHEMERAL,
  });
}

export async function replyNeedVoice(interaction: ChatInputCommandInteraction) {
  return interaction.reply({
    content: 'Join a voice channel first.',
    flags: EPHEMERAL,
  });
}

export function musicErrorMessage(code: string, message?: string): string {
  switch (code) {
    case 'NO_NODE':
      return 'Lavalink node is not connected yet. Is the server running?';
    case 'NOT_CONNECTED':
      return 'I am not connected to a voice channel. Use `/join` first.';
    case 'EMPTY_QUEUE':
      return 'The queue is empty.';
    case 'NOTHING_PLAYING':
      return 'Nothing is playing right now.';
    case 'NO_RESULTS':
      return 'No results found for that query.';
    case 'RESOLVE_FAILED':
      return `Could not resolve that track${message ? `: ${message}` : '.'}`;
    default:
      return 'Music command failed.';
  }
}
