from colorama import Fore, Style, init
import time
import os
import traceback

init(autoreset=True)

class Logger:
    LOG_DIR = 'logs'

    @staticmethod
    def ensure_log_directory():
        if not os.path.exists(Logger.LOG_DIR):
            os.makedirs(Logger.LOG_DIR)

    @staticmethod
    def log_to_file(level, message):
        Logger.ensure_log_directory()
        timestamp = time.strftime('%Y-%m-%d_%H-%M-%S')
        filename = f"{Logger.LOG_DIR}/error_{timestamp}.log"
        
        with open(filename, 'w') as f:
            f.write(f"[{level}] {time.strftime('%Y-%m-%d %H:%M:%S')} - {message}\n")
            f.write(traceback.format_exc())

    @staticmethod
    def info(message):
        print(f"{Fore.CYAN}[INFO] {Style.RESET_ALL}{time.strftime('%Y-%m-%d %H:%M:%S')} - {message}")

    @staticmethod
    def success(message):
        print(f"{Fore.GREEN}[SUCCESS] {Style.RESET_ALL}{time.strftime('%Y-%m-%d %H:%M:%S')} - {message}")

    @staticmethod
    def warning(message):
        print(f"{Fore.YELLOW}[WARNING] {Style.RESET_ALL}{time.strftime('%Y-%m-%d %H:%M:%S')} - {message}")

    @staticmethod
    def error(message):
        print(f"{Fore.RED}[ERROR] {Style.RESET_ALL}{time.strftime('%Y-%m-%d %H:%M:%S')} - {message}")
        Logger.log_to_file("ERROR", message)

    @staticmethod
    def debug(message):
        print(f"{Fore.MAGENTA}[DEBUG] {Style.RESET_ALL}{time.strftime('%Y-%m-%d %H:%M:%S')} - {message}")