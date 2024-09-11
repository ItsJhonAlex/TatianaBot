import logging
import os
from logging.handlers import RotatingFileHandler
from colorama import Fore, Style, init

init(autoreset=True)

class ColoredFormatter(logging.Formatter):
    COLORS = {
        'DEBUG': Fore.MAGENTA,
        'INFO': Fore.CYAN,
        'SUCCESS': Fore.GREEN,
        'WARNING': Fore.YELLOW,
        'ERROR': Fore.RED,
        'CRITICAL': Fore.RED + Style.BRIGHT,
    }

    def format(self, record):
        levelname = record.levelname
        if levelname in self.COLORS:
            record.levelname = f"{self.COLORS[levelname]}{levelname}{Style.RESET_ALL}"
        return super().format(record)

class Logger:
    LOG_DIR = 'logs'
    LOG_FILE = 'bot.log'
    MAX_BYTES = 5 * 1024 * 1024  # 5 MB
    BACKUP_COUNT = 5

    @staticmethod
    def setup():
        if not os.path.exists(Logger.LOG_DIR):
            os.makedirs(Logger.LOG_DIR)

        logger = logging.getLogger('bot')
        logger.setLevel(logging.DEBUG)

        # Configurar el manejador de archivo
        file_handler = RotatingFileHandler(
            os.path.join(Logger.LOG_DIR, Logger.LOG_FILE),
            maxBytes=Logger.MAX_BYTES,
            backupCount=Logger.BACKUP_COUNT
        )
        file_formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        file_handler.setFormatter(file_formatter)
        file_handler.setLevel(logging.DEBUG)

        # Configurar el manejador de consola
        console_handler = logging.StreamHandler()
        console_formatter = ColoredFormatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        console_handler.setFormatter(console_formatter)
        console_handler.setLevel(logging.INFO)

        # Agregar los manejadores al logger
        logger.addHandler(file_handler)
        logger.addHandler(console_handler)

        # Agregar nivel de log personalizado 'SUCCESS'
        logging.SUCCESS = 25  # Entre INFO y WARNING
        logging.addLevelName(logging.SUCCESS, 'SUCCESS')
        setattr(logger, 'success', lambda message, *args: logger._log(logging.SUCCESS, message, args))

        return logger

# Crear una instancia global del logger
bot_logger = Logger.setup()

# Funciones de conveniencia
def debug(message):
    bot_logger.debug(message)

def info(message):
    bot_logger.info(message)

def success(message):
    bot_logger.log(25, message)  # 25 es el nivel que definimos para SUCCESS

logging.addLevelName(25, "SUCCESS")

def warning(message):
    bot_logger.warning(message)

def error(message):
    bot_logger.error(message)

def critical(message):
    bot_logger.critical(message)