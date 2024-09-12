from enum import Enum

class Race(Enum):
    HUMAN = "Humano"
    ELF = "Elfo"
    DWARF = "Enano"
    DRACONID = "Dracónido"
    SYLPH = "Silfo"
    ORC = "Orco"
    FAE = "Fae"
    AUTOMATON = "Autómata"
    SHAPESHIFTER = "Cambiaformas"
    ELEMENTAL = "Elemental"

RACE_DESCRIPTIONS = {
    Race.HUMAN: "Versátiles y ambiciosos, los humanos han prosperado en Aethoria gracias a su adaptabilidad.",
    Race.ELF: "Guardianes ancestrales de los bosques, poseen una afinidad natural con la magia de la naturaleza.",
    Race.DWARF: "Maestros artesanos y mineros, han perfeccionado la fusión de magia y tecnología en sus creaciones.",
    Race.DRACONID: "Descendientes de dragones, poseen un dominio innato sobre los elementos y una fuerza formidable.",
    Race.SYLPH: "Seres etéreos nacidos de la unión entre el viento y la magia, expertos en las artes arcanas.",
    Race.ORC: "Guerreros feroces con una conexión profunda con la tierra y una cultura rica en tradiciones.",
    Race.FAE: "Criaturas mágicas del reino feérico, conocidas por su astucia y habilidades ilusorias.",
    Race.AUTOMATON: "Seres artificiales creados por la fusión de magia y tecnología, en busca de su lugar en el mundo.",
    Race.SHAPESHIFTER: "Individuos capaces de alterar su forma física, adaptándose a diversos entornos y situaciones.",
    Race.ELEMENTAL: "Manifestaciones vivientes de los elementos primordiales, con poderes sobre la naturaleza misma."
}

RACE_BONUSES = {
    Race.HUMAN: {"adaptability": 2, "skill_variety": 1},
    Race.ELF: {"dexterity": 2, "nature_magic": 1},
    Race.DWARF: {"constitution": 2, "crafting": 1},
    Race.DRACONID: {"strength": 2, "elemental_resistance": 1},
    Race.SYLPH: {"intelligence": 2, "air_magic": 1},
    Race.ORC: {"strength": 2, "endurance": 1},
    Race.FAE: {"charisma": 2, "illusion_magic": 1},
    Race.AUTOMATON: {"constitution": 2, "technology": 1},
    Race.SHAPESHIFTER: {"dexterity": 2, "adaptability": 1},
    Race.ELEMENTAL: {"elemental_magic": 2, "resistance": 1}
}

def get_race_description(race):
    return RACE_DESCRIPTIONS.get(race, "Descripción no disponible.")

def get_race_bonuses(race):
    return RACE_BONUSES.get(race, {})