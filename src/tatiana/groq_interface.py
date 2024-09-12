from groq import Groq
from src.config.settings import Settings
from src.utils.logger import bot_logger, debug, info, success, warning, error, critical
import json
import tiktoken
import os
import toml

class TatianaInterface:
    MODEL_NAME = 'llama-3.1-8b-instant'
    MAX_TOKENS = 3000
    MEMORY_FILE = 'src/tatiana/memory.json'
    CONFIG_FILE = 'src/tatiana/tatiana_config.toml'
    TOKENS_PER_DAY = 1_000_000
    TOKENS_PER_MINUTE = 20_000
    MAX_MEMORY_TOKENS = TOKENS_PER_DAY // 4

    @staticmethod
    def get_start_message():
        try:
            with open(TatianaInterface.CONFIG_FILE, 'r') as file:
                config = toml.load(file)
            info("Configuración de Tatiana cargada correctamente")
        except FileNotFoundError:
            error(f"No se pudo encontrar el archivo {TatianaInterface.CONFIG_FILE}")
            return None
        except toml.TomlDecodeError:
            error(f"Error al decodificar el archivo {TatianaInterface.CONFIG_FILE}")
            return None

        backstory = config['backstory']['content'].format(
            bot_name=Settings.BOT_NAME,
            creator_name=Settings.CREATOR_NAME,
            server_name=Settings.SERVER_NAME,
            version=Settings.VERSION
        )
        interaction_guidelines = config['interaction_guidelines']['content']
        technical_instructions = config['technical_instructions']['content'].format(
            bot_name=Settings.BOT_NAME,
            creator_name=Settings.CREATOR_NAME,
            server_name=Settings.SERVER_NAME,
            version=Settings.VERSION
        )
        ai_behavior = config['ai_behavior']['content']

        return f"{backstory}\n\n{interaction_guidelines}\n\n{technical_instructions}\n\n{ai_behavior}"

    def __init__(self):
        try:
            self.client = Groq(api_key=Settings.GROQ_API_KEY)
            info("Cliente Groq inicializado correctamente")
        except Exception as e:
            error(f"Error al inicializar el cliente Groq: {str(e)}")
            raise

        start_message = self.get_start_message()
        if start_message is None:
            error("No se pudo obtener el mensaje de inicio para Tatiana")
            raise ValueError("Mensaje de inicio no disponible")

        self.conversation_history = [{"role": "system", "content": start_message}]
        self.load_memory()
        success("Conciencia de Tatiana inicializada correctamente")

    def count_tokens(self, text):
        encoding = tiktoken.encoding_for_model("gpt-3.5-turbo")
        return len(encoding.encode(text))

    def calculate_total_tokens(self):
        return sum(self.count_tokens(message["content"]) for message in self.conversation_history)

    def trim_conversation_history(self):
        while self.calculate_total_tokens() > self.MAX_MEMORY_TOKENS:
            if len(self.conversation_history) > 1:
                self.conversation_history.pop(1)
            else:
                break
        self.save_memory()

    def generate_text(self, prompt):
        try:
            self.conversation_history.append({"role": "user", "content": prompt})
            self.trim_conversation_history()
            
            # Limitamos el contexto para la generación de respuesta
            context = self.conversation_history[-10:]  # Últimos 10 mensajes
            
            completion = self.client.chat.completions.create(
                model=self.MODEL_NAME,
                messages=context,
                temperature=0.7,
                max_tokens=1024,
                top_p=1,
                stream=False,
                stop=None
            )

            response = completion.choices[0].message.content
            self.conversation_history.append({"role": "assistant", "content": response})
            self.trim_conversation_history()
            
            debug(f"Respuesta de Tatiana generada: {response[:50]}...")
            return response
        except Exception as e:
            error(f"Error al generar texto: {str(e)}")
            return None

    def save_memory(self):
        try:
            with open(self.MEMORY_FILE, 'w', encoding='utf-8') as f:
                json.dump(self.conversation_history, f, ensure_ascii=False, indent=2)
            debug("Memoria de Tatiana guardada correctamente")
        except Exception as e:
            error(f"Error al guardar la memoria de Tatiana: {str(e)}")

    def load_memory(self):
        try:
            if os.path.exists(self.MEMORY_FILE):
                with open(self.MEMORY_FILE, 'r', encoding='utf-8') as f:
                    loaded_memory = json.load(f)
                    self.conversation_history = [self.conversation_history[0]] + loaded_memory
                    self.trim_conversation_history()
                info("Memoria de Tatiana cargada correctamente")
            else:
                info("No se encontró archivo de memoria. Iniciando con memoria vacía.")
        except Exception as e:
            error(f"Error al cargar la memoria de Tatiana: {str(e)}")