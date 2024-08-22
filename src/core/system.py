import sys
import os

def restart_program():
    print("argv era", sys.argv)
    print("sys.executable era", sys.executable)
    print("reiniciando ahora")
    os.execv(sys.executable, ['python'] + sys.argv)

def shutdown_program():
    print("Deteniendo script...")
    sys.exit()

async def handle_power_control(message, response):
    if response.startswith("&shutdown"):
        await message.channel.send(":o2: Ok. Me apagaré.")
        shutdown_program()
    elif response.startswith("&restart"):
        await message.channel.send(":repeat: ¡Ok. Estoy reiniciando!")
        restart_program()
