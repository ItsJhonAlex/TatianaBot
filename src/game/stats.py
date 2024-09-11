import random
from src.game.classes import CLASSES, PROFESSIONS

BASE_STATS = {
    "health": 100,
    "mana": 50,
    "strength": 10,
    "intelligence": 10,
    "dexterity": 10,
    "wisdom": 10,
    "charisma": 10,
    "constitution": 10
}

CLASS_STAT_MODIFIERS = {
    "Guerrero": {"strength": 3, "constitution": 2, "health": 20},
    "Mago": {"intelligence": 3, "wisdom": 2, "mana": 20},
    "Sacerdote": {"wisdom": 3, "charisma": 2, "mana": 15},
    "Ladrón": {"dexterity": 3, "charisma": 2},
    "Arquero": {"dexterity": 3, "strength": 2},
    "Druida": {"wisdom": 3, "constitution": 2},
    "Bárbaro": {"strength": 3, "constitution": 3, "health": 30},
    "Monje": {"dexterity": 3, "wisdom": 2},
    "Hechicero": {"charisma": 3, "intelligence": 2, "mana": 15},
    "Bardo": {"charisma": 3, "dexterity": 2}
}

PROFESSION_STAT_MODIFIERS = {
    "Herrero": {"strength": 2, "constitution": 1},
    "Alquimista": {"intelligence": 2, "dexterity": 1},
    "Minero": {"strength": 2, "constitution": 2},
    "Cazador": {"dexterity": 2, "wisdom": 1},
    "Pescador": {"dexterity": 1, "wisdom": 2},
    "Cocinero": {"constitution": 2, "charisma": 1},
    "Carpintero": {"strength": 1, "dexterity": 2},
    "Sastre": {"dexterity": 2, "charisma": 1},
    "Joyero": {"dexterity": 2, "intelligence": 1},
    "Granjero": {"constitution": 2, "strength": 1}
}

def calculate_stats(primary_class, secondary_class, primordial_class, profession):
    stats = BASE_STATS.copy()
    
    # Aplicar modificadores de clase primaria
    for stat, modifier in CLASS_STAT_MODIFIERS[primary_class].items():
        stats[stat] += modifier
    
    # Aplicar modificadores de clase secundaria (con menor impacto)
    for stat, modifier in CLASS_STAT_MODIFIERS[secondary_class].items():
        stats[stat] += modifier // 2
    
    # Aplicar modificadores de profesión
    for stat, modifier in PROFESSION_STAT_MODIFIERS[profession].items():
        stats[stat] += modifier
    
    # Bono aleatorio por clase primordial
    primordial_bonus = random.randint(1, 3)
    random_stat = random.choice(list(stats.keys()))
    stats[random_stat] += primordial_bonus
    
    return stats