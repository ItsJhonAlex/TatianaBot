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

class Commit(Base):
    __tablename__ = 'commits'
    id = Column(Integer, primary_key=True)
    sha = Column(String, unique=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
class StatusMessage(Base):
    __tablename__ = 'status_messages'
    id = Column(Integer, primary_key=True)
    channel_id = Column(String, unique=True)
    message_id = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

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

def get_saved_sha():
    commit = session.query(Commit).order_by(Commit.timestamp.desc()).first()
    return commit.sha if commit else None

def save_commit_sha(sha):
    commit = Commit(sha=sha)
    session.add(commit)
    session.commit()
    
def get_status_message_id(channel_id):
    status_message = session.query(StatusMessage).filter_by(channel_id=str(channel_id)).first()
    return status_message.message_id if status_message else None

def save_status_message_id(channel_id, message_id):
    status_message = session.query(StatusMessage).filter_by(channel_id=str(channel_id)).first()
    if status_message:
        status_message.message_id = str(message_id)
        status_message.timestamp = datetime.utcnow()
    else:
        status_message = StatusMessage(channel_id=str(channel_id), message_id=str(message_id))
        session.add(status_message)
    session.commit()
