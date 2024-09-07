from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, DateTime, Boolean, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import os
from datetime import datetime
from sqlalchemy.types import TypeDecorator, VARCHAR
import json

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

class Guild(Base):
    __tablename__ = 'guilds'
    id = Column(Integer, primary_key=True)
    discord_id = Column(String, unique=True)
    automod_enabled = Column(Boolean, default=False)
    automod_config = Column(JSON)
    mod_roles = Column(JSON)
    log_channel = Column(String)

class AutomodRule(Base):
    __tablename__ = 'automod_rules'
    id = Column(Integer, primary_key=True)
    guild_id = Column(Integer, ForeignKey('guilds.id'))
    rule_type = Column(String)
    rule_config = Column(JSON)
    guild = relationship("Guild", back_populates="automod_rules")

class ModAction(Base):
    __tablename__ = 'mod_actions'
    id = Column(Integer, primary_key=True)
    guild_id = Column(Integer, ForeignKey('guilds.id'))
    user_id = Column(Integer, ForeignKey('users.id'))
    moderator_id = Column(Integer, ForeignKey('users.id'))
    action_type = Column(String)
    reason = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
    guild = relationship("Guild")
    user = relationship("User", foreign_keys=[user_id])
    moderator = relationship("User", foreign_keys=[moderator_id])
    
class CustomEmbed(Base):
    __tablename__ = 'custom_embeds'
    id = Column(Integer, primary_key=True)
    guild_id = Column(Integer, ForeignKey('guilds.id'))
    name = Column(String, unique=True)
    title = Column(String)
    description = Column(String)
    color = Column(Integer)
    footer = Column(String)
    image_url = Column(String)
    thumbnail_url = Column(String)
    author_name = Column(String)
    author_icon_url = Column(String)
    fields = Column(JSON)
    timestamp = Column(Boolean, default=False)

Guild.custom_embeds = relationship("CustomEmbed", back_populates="guild")
CustomEmbed.guild = relationship("Guild", back_populates="custom_embeds")

Guild.automod_rules = relationship("AutomodRule", back_populates="guild")

db_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'bot_database.sqlite')
engine = create_engine(f'sqlite:///{db_path}')


def create_tables():
    Base.metadata.create_all(engine)

Base.metadata.create_all(engine)

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

def get_guild(discord_id):
    guild = session.query(Guild).filter_by(discord_id=str(discord_id)).first()
    if not guild:
        guild = Guild(discord_id=str(discord_id))
        session.add(guild)
        session.commit()
    return guild

def set_automod_status(guild_id, status):
    guild = get_guild(guild_id)
    if guild.automod_enabled == status:
        return False  # No se realizó ningún cambio
    guild.automod_enabled = status
    session.commit()
    return True  # Se realizó un cambio

def get_automod_status(guild_id):
    guild = get_guild(guild_id)
    return guild.automod_enabled

def set_automod_config(guild_id, config):
    guild = get_guild(guild_id)
    guild.automod_config = config
    session.commit()

def get_automod_config(guild_id):
    guild = get_guild(guild_id)
    return guild.automod_config

def add_automod_rule(guild_id, rule_type, rule_config):
    guild = get_guild(guild_id)
    rule = AutomodRule(guild_id=guild.id, rule_type=rule_type, rule_config=rule_config)
    session.add(rule)
    session.commit()

def get_automod_rules(guild_id):
    guild = get_guild(guild_id)
    return guild.automod_rules

def set_mod_roles(guild_id, roles):
    guild = get_guild(guild_id)
    guild.mod_roles = roles
    session.commit()

def get_mod_roles(guild_id):
    guild = get_guild(guild_id)
    return guild.mod_roles

def set_log_channel(guild_id, channel_id):
    guild = get_guild(guild_id)
    guild.log_channel = str(channel_id)
    session.commit()

def get_log_channel(guild_id):
    guild = get_guild(guild_id)
    return guild.log_channel

def add_mod_action(guild_id, user_id, moderator_id, action_type, reason):
    action = ModAction(
        guild_id=get_guild(guild_id).id,
        user_id=get_user(user_id).id,
        moderator_id=get_user(moderator_id).id,
        action_type=action_type,
        reason=reason
    )
    session.add(action)
    session.commit()

def get_mod_actions(guild_id, user_id=None):
    query = session.query(ModAction).filter_by(guild_id=get_guild(guild_id).id)
    if user_id:
        query = query.filter_by(user_id=get_user(user_id).id)
    return query.all()


def create_embed(guild_id, name, title, description, color=None, footer=None, image_url=None, 
                 thumbnail_url=None, author_name=None, author_icon_url=None, fields=None, timestamp=False):
    try:
        guild = get_guild(guild_id)
        embed = CustomEmbed(
            guild_id=guild.id,
            name=name,
            title=title,
            description=description,
            color=color,
            footer=footer,
            image_url=image_url,
            thumbnail_url=thumbnail_url,
            author_name=author_name,
            author_icon_url=author_icon_url,
            fields=fields,
            timestamp=timestamp
        )
        session.add(embed)
        session.commit()
        return embed
    except Exception as e:
        session.rollback()
        raise e

def get_embed(guild_id, name):
    guild = get_guild(guild_id)
    return session.query(CustomEmbed).filter_by(guild_id=guild.id, name=name).first()

def update_embed(guild_id, name, **kwargs):
    embed = get_embed(guild_id, name)
    if embed:
        for key, value in kwargs.items():
            setattr(embed, key, value)
        session.commit()
    return embed

def delete_embed(guild_id, name):
    embed = get_embed(guild_id, name)
    if embed:
        session.delete(embed)
        session.commit()
        return True
    return False

def get_all_embeds(guild_id):
    guild = get_guild(guild_id)
    return session.query(CustomEmbed).filter_by(guild_id=guild.id).all()

create_tables()

