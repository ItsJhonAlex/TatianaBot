from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import os
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    discord_id = Column(String, unique=True)
    balance = Column(Integer, default=0)
    last_daily = Column(DateTime)
    yugioh_cards = relationship("YugiohCard", back_populates="user")
    pokemons = relationship("Pokemon", back_populates="user")
    attempts = relationship("Attempt", back_populates="user")

class YugiohCard(Base):
    __tablename__ = 'yugioh_cards'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    card_name = Column(String)
    card_id = Column(String)
    user = relationship("User", back_populates="yugioh_cards")

class Pokemon(Base):
    __tablename__ = 'pokemons'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    pokemon_name = Column(String)
    pokemon_id = Column(Integer)
    user = relationship("User", back_populates="pokemons")

class Attempt(Base):
    __tablename__ = 'attempts'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    attempt_type = Column(String)
    attempts = Column(Integer, default=10)
    last_reset = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="attempts")

# Crear el motor de la base de datos
db_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'bot_database.sqlite')
engine = create_engine(f'sqlite:///{db_path}')

# Crear todas las tablas
Base.metadata.create_all(engine)

# Crear una sesión
Session = sessionmaker(bind=engine)
session = Session()

def get_user(discord_id):
    user = session.query(User).filter_by(discord_id=str(discord_id)).first()
    if not user:
        user = User(discord_id=str(discord_id))
        session.add(user)
        session.commit()
    return user

def get_balance(discord_id):
    user = get_user(discord_id)
    return user.balance

def update_balance(discord_id, amount):
    user = get_user(discord_id)
    user.balance += amount
    session.commit()

def get_last_daily(discord_id):
    user = get_user(discord_id)
    return user.last_daily

def set_last_daily(discord_id, timestamp):
    user = get_user(discord_id)
    user.last_daily = timestamp
    session.commit()
