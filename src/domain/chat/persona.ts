import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bot } from '../../config/bot.js';

interface PersonaSection {
  content: string;
}

interface PersonaFile {
  backstory: PersonaSection;
  interaction_guidelines: PersonaSection;
  technical_instructions: PersonaSection;
  ai_behavior: PersonaSection;
}

function interpolate(template: string): string {
  return template
    .replaceAll('{botName}', bot.name)
    .replaceAll('{creatorName}', bot.creatorName)
    .replaceAll('{version}', bot.version);
}

/** Carga el prompt de sistema desde persona.toml. */
export function loadSystemPrompt(personaPath?: string): string {
  const path =
    personaPath ??
    join(dirname(fileURLToPath(import.meta.url)), '../../content/persona.toml');

  const text = readFileSync(path, 'utf8');
  const parsed = Bun.TOML.parse(text) as PersonaFile;

  return [
    interpolate(parsed.backstory.content.trim()),
    interpolate(parsed.interaction_guidelines.content.trim()),
    interpolate(parsed.technical_instructions.content.trim()),
    interpolate(parsed.ai_behavior.content.trim()),
  ].join('\n\n');
}
