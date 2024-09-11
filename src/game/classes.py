CLASSES = [
    "Guerrero", "Mago", "Sacerdote", "Ladrón", "Arquero",
    "Druida", "Bárbaro", "Monje", "Hechicero", "Bardo"
]

PRIMORDIAL_CLASSES = {
    ("Guerrero", "Mago"): ["Magus", "Espadachín Arcano", "Caballero Rúnico"],
    ("Guerrero", "Sacerdote"): ["Templario", "Cruzado", "Inquisidor"],
    ("Guerrero", "Ladrón"): ["Mercenario", "Duelista", "Vigilante"],
    ("Guerrero", "Arquero"): ["Capitán de Arqueros", "Maestro de Armas", "Cazador de Bestias"],
    ("Guerrero", "Druida"): ["Guardián de la Naturaleza", "Cambiador de Forma", "Protector Primordial"],
    ("Guerrero", "Bárbaro"): ["Campeón Salvaje", "Gladiador Furioso", "Señor de la Guerra"],
    ("Guerrero", "Monje"): ["Maestro de Armas", "Guerrero Zen", "Puño de Hierro"],
    ("Guerrero", "Hechicero"): ["Caballero Arcano", "Destructor Místico", "Campeón Elemental"],
    ("Guerrero", "Bardo"): ["Héroe Legendario", "Comandante Inspirador", "Campeón de la Canción"],
    ("Mago", "Sacerdote"): ["Taumaturgo", "Hierofante Arcano", "Oráculo Místico"],
    ("Mago", "Ladrón"): ["Asesino Arcano", "Ilusionista", "Embaucador Místico"],
    ("Mago", "Arquero"): ["Arquero Arcano", "Tirador Místico", "Francotirador Elemental"],
    ("Mago", "Druida"): ["Archimago Natural", "Hechicero Primordial", "Mago de las Bestias"],
    ("Mago", "Bárbaro"): ["Berserker Arcano", "Chamán de Guerra", "Destructor Primigenio"],
    ("Mago", "Monje"): ["Místico Arcano", "Sabio de los Elementos", "Maestro del Ki Mágico"],
    ("Mago", "Hechicero"): ["Archimago", "Señor de los Elementos", "Tejedor de Realidades"],
    ("Mago", "Bardo"): ["Encantador Melodioso", "Archimago Lírico", "Tejedor de Historias"],
    ("Sacerdote", "Ladrón"): ["Inquisidor Sombrío", "Agente Divino", "Redentor"],
    ("Sacerdote", "Arquero"): ["Cazador Sagrado", "Arquero Divino", "Guardián Celestial"],
    ("Sacerdote", "Druida"): ["Guardián de la Vida", "Chamán Celestial", "Druida Divino"],
    ("Sacerdote", "Bárbaro"): ["Berserker Sagrado", "Campeón Divino", "Flagelante"],
    ("Sacerdote", "Monje"): ["Asceta Divino", "Puño Sagrado", "Místico Iluminado"],
    ("Sacerdote", "Hechicero"): ["Canalizado Divino", "Profeta Arcano", "Médium Celestial"],
    ("Sacerdote", "Bardo"): ["Cantor Divino", "Orador Sagrado", "Heraldo Celestial"],
    ("Ladrón", "Arquero"): ["Francotirador Furtivo", "Cazador de Sombras", "Acechador Silencioso"],
    ("Ladrón", "Druida"): ["Acechador de la Naturaleza", "Espíritu del Bosque", "Depredador Salvaje"],
    ("Ladrón", "Bárbaro"): ["Saqueador Salvaje", "Asesino Tribal", "Merodeador Implacable"],
    ("Ladrón", "Monje"): ["Sombra Silenciosa", "Acróbata Místico", "Infiltrador Zen"],
    ("Ladrón", "Hechicero"): ["Ladrón de Almas", "Estafador Arcano", "Asesino Dimensional"],
    ("Ladrón", "Bardo"): ["Espía Melodioso", "Estafador Carismático", "Artista del Engaño"],
    ("Arquero", "Druida"): ["Guardián del Bosque", "Cazador de Bestias", "Arquero Elemental"],
    ("Arquero", "Bárbaro"): ["Cazador Salvaje", "Arquero de la Tormenta", "Depredador Implacable"],
    ("Arquero", "Monje"): ["Arquero Zen", "Maestro de la Precisión", "Tirador Meditativo"],
    ("Arquero", "Hechicero"): ["Arquero Arcano", "Tirador Místico", "Francotirador Elemental"],
    ("Arquero", "Bardo"): ["Trovador de la Batalla", "Arquero Lírico", "Tirador Inspirador"],
    ("Druida", "Bárbaro"): ["Guardián Primigenio", "Furia de la Naturaleza", "Cambiador de Forma Salvaje"],
    ("Druida", "Monje"): ["Guardián del Equilibrio", "Místico Natural", "Puño de la Naturaleza"],
    ("Druida", "Hechicero"): ["Archidruida Elemental", "Señor de las Bestias", "Chamán Primordial"],
    ("Druida", "Bardo"): ["Cantor de la Naturaleza", "Guardián de las Leyendas", "Voz de la Tierra"],
    ("Bárbaro", "Monje"): ["Puño Salvaje", "Maestro del Caos", "Asceta Primitivo"],
    ("Bárbaro", "Hechicero"): ["Berserker Místico", "Chamán de Guerra", "Destructor Arcano"],
    ("Bárbaro", "Bardo"): ["Skald", "Narrador de Sagas", "Grito de Guerra"],
    ("Monje", "Hechicero"): ["Místico Arcano", "Puño Elemental", "Asceta de los Arcanos"],
    ("Monje", "Bardo"): ["Danzarín de la Batalla", "Maestro de la Armonía", "Poeta Marcial"],
    ("Hechicero", "Bardo"): ["Encantador de Almas", "Virtuoso Arcano", "Tejedor de Destinos"]
}

PROFESSIONS = [
    "Herrero", "Alquimista", "Minero", "Cazador", "Pescador",
    "Cocinero", "Carpintero", "Sastre", "Joyero", "Granjero"
]

def get_primordial_class(primary_class, secondary_class):
    combo = (primary_class, secondary_class)
    reverse_combo = (secondary_class, primary_class)
    
    if combo in PRIMORDIAL_CLASSES:
        return PRIMORDIAL_CLASSES[combo]
    elif reverse_combo in PRIMORDIAL_CLASSES:
        return PRIMORDIAL_CLASSES[reverse_combo]
    else:
        return ["Aventurero Versátil", "Especialista Mixto", "Prodigio Multifacético"]