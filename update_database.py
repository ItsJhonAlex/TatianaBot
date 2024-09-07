from src.utils.database import Base, engine, create_tables
from src.utils.logger import Logger

def update_database():
    create_tables()
    Logger.success("Base de datos actualizada con éxito.")

if __name__ == "__main__":
    update_database()