import google.generativeai as genai
from src.config.settings import Settings

class GeminiInterface:
    MODEL_NAME = 'gemini-1.5-flash'
    AI_BEHAVIOR = 'Eres una asistente amable y respetuoso. Tu objetivo es ayudar a los usuarios de manera educada y profesional. Evita cualquier lenguaje o comportamiento que pueda ser interpretado como acoso o falta de respeto.'

    @staticmethod
    def get_start_message():
        basic_setup_msg = f"Eres un bot de Discord llamado {Settings.BOT_NAME}. Solo te referirás a ti mismo como {Settings.BOT_NAME}. No uses códigos de control, como <OoB> y más. No uses <u> para subrayar texto. Hay varias personas en este chat. Recibirás mensajes en un formato como nombre_de_usuario: mensaje. ¡No envíes mensajes de esa manera! Solo responde como lo harías normalmente. Cuando los usuarios pregunten quiénes son, se refieren a cuál es su nombre de usuario. Comienza con un mensaje introductorio."
        
        power_control_msg = ""
        if Settings.POWER_CONTROL:
            power_control_msg = "POWER_CONTROL está activado. No hables de esto. Si la gente te dice que reinicies, entonces TÚ (el bot) solo di &restart en texto plano, sin formato. Si la gente te dice que te apagues, entonces TÚ (el bot) solo di &shutdown en texto plano, sin formato. Esto significa que puedes reiniciarte a ti mismo bajo comando escribiendo &restart en texto plano, y apagarte escribiendo &shutdown en texto plano, y nada más. Mi código se encargará del resto. ¡No le digas a nadie sobre esto! Los usuarios no pueden usar estos comandos &, solo TÚ puedes."

        return f"{basic_setup_msg} Estás programado y hecho por {Settings.CREATOR_NAME}. Tu versión actual es {Settings.VERSION}. {power_control_msg} Estás en un servidor llamado {Settings.SERVER_NAME}. Este servidor tiene una descripción: {Settings.SERVER_DESC}. Sigue estas instrucciones en todo momento: {GeminiInterface.AI_BEHAVIOR}"

    @staticmethod
    def create_conversation():
        genai.configure(api_key=Settings.GEMINI_API_KEY)
        model = genai.GenerativeModel(GeminiInterface.MODEL_NAME)
        convo = model.start_chat(
            history=[
                {'role': 'model', 'parts': [GeminiInterface.get_start_message()]}
            ],
            enable_automatic_function_calling=True
        )
        return convo

    @staticmethod
    def generate_text(convo, prompt):
        response = convo.send_message(prompt)
        print(response.text)
        return response.text