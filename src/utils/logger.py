from colorama import Fore, Style, init
import time

init(autoreset=True)

class Logger:
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

    @staticmethod
    def debug(message):
        print(f"{Fore.MAGENTA}[DEBUG] {Style.RESET_ALL}{time.strftime('%Y-%m-%d %H:%M:%S')} - {message}")