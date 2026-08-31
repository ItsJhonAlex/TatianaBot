import lore from '../../content/lore/aethoria.json';

export interface LoreEntry {
  category: string;
  name: string;
  description: string;
  meta?: string;
}

const CATEGORIES = [
  'eras',
  'eventos_importantes',
  'personajes_legendarios',
  'razas',
  'lugares_importantes',
  'sistemas_magicos',
  'facciones',
  'leyendas',
  'criaturas',
  'artefactos',
] as const;

export class LoreService {
  public listCategories(): string[] {
    return [...CATEGORIES];
  }

  public overview(): { world: string; description: string; categories: string[] } {
    return {
      world: lore.nombre_mundo,
      description: lore.descripcion,
      categories: this.listCategories(),
    };
  }

  public search(query: string): LoreEntry[] {
    const q = query.trim().toLowerCase();
    if (!q) {
      return [];
    }

    return this.allEntries().filter(
      (entry) =>
        entry.name.toLowerCase().includes(q) ||
        entry.description.toLowerCase().includes(q) ||
        entry.category.toLowerCase().includes(q),
    );
  }

  public byCategory(category: string): LoreEntry[] {
    return this.allEntries().filter((entry) => entry.category === category);
  }

  private allEntries(): LoreEntry[] {
    const entries: LoreEntry[] = [];

    for (const era of lore.eras) {
      entries.push({
        category: 'eras',
        name: era.nombre,
        description: era.descripcion,
        meta: `${String(era.inicio)}–${String(era.fin)}`,
      });
    }
    for (const event of lore.eventos_importantes) {
      entries.push({
        category: 'eventos_importantes',
        name: event.nombre,
        description: event.descripcion,
        meta: `Year ${String(event.año)}`,
      });
    }
    for (const hero of lore.personajes_legendarios) {
      entries.push({
        category: 'personajes_legendarios',
        name: hero.nombre,
        description: hero.descripcion,
        meta: hero.era,
      });
    }

    const simpleGroups: { key: (typeof CATEGORIES)[number]; items: { nombre: string; descripcion: string }[] }[] =
      [
        { key: 'razas', items: lore.razas },
        { key: 'lugares_importantes', items: lore.lugares_importantes },
        { key: 'sistemas_magicos', items: lore.sistemas_magicos },
        { key: 'facciones', items: lore.facciones },
        { key: 'leyendas', items: lore.leyendas },
        { key: 'criaturas', items: lore.criaturas },
        { key: 'artefactos', items: lore.artefactos },
      ];

    for (const group of simpleGroups) {
      for (const item of group.items) {
        entries.push({
          category: group.key,
          name: item.nombre,
          description: item.descripcion,
        });
      }
    }

    return entries;
  }
}
