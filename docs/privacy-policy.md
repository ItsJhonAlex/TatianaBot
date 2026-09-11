# Política de privacidad — TatianaBot

**Última actualización: 11 de septiembre de 2026**

---

## 1. Información que recopilamos

Tatiana Discord AI Bot ("el Bot") puede recopilar y procesar:

- ID de usuario de Discord
- Nombre de usuario y apodo en el servidor
- Contenido de mensajes enviados al Bot (menciones, respuestas, comandos slash)
- Datos de uso de comandos (economía, juegos, métricas agregadas en memoria, etc.)
- Historial de conversación con la IA (por usuario y servidor)
- Datos de inventarios y personajes (Pokémon, Yu-Gi-Oh!, ficha RPG)
- Acciones de moderación auditadas (cuando `/automod` está activo)
- Embeds guardados por moderadores
- Metadatos de voz necesarios para unirse a un canal (música), sin grabar conversaciones de voz

## 2. Cómo utilizamos la información

- Proporcionar y mejorar las funcionalidades del Bot
- Personalizar respuestas de la IA (personalidad Tatiana / Aethoria)
- Persistir progreso de usuario (balance, inventarios, personajes RPG)
- Aplicar reglas de moderación configuradas por el servidor
- Reproducir audio solicitado en canales de voz
- Mantener registros técnicos y resolver incidencias
- Cumplir obligaciones legales

## 3. Procesamiento de IA

Las conversaciones con Tatiana se procesan mediante la **API de Groq**. El contenido de los mensajes se envía a Groq únicamente para generar respuestas. No vendemos estos datos.

Consulta también la [política de privacidad de Groq](https://groq.com/privacy-policy/).

## 4. Música y terceros de contenido

Si la música está habilitada:

- El audio se obtiene vía **Lavalink** y, opcionalmente, **yt-dlp** en el servidor del operador
- Pueden crearse ficheros temporales de audio en el host; se borran tras reproducirse
- Cookies de navegador usadas por yt-dlp (si el operador las configura) permanecen en la máquina del operador y **no** se almacenan en la base de datos del Bot ni se envían a Discord
- Fuentes de catálogo (p. ej. YouTube) tienen sus propias condiciones; el Bot no controla esas plataformas

## 5. APIs de juegos y contenido

Features de captura y social pueden consultar APIs públicas (PokeAPI, YGOProDeck, meme-api, nekos.best, etc.). Esas peticiones no incluyen tu token de Discord.

## 6. Compartir información

No vendemos ni compartimos información personal con terceros, excepto:

- Proveedores necesarios para el servicio (Discord, Groq, APIs de contenido, infraestructura Lavalink del operador)
- Cuando la ley lo exija
- Con tu consentimiento explícito

## 7. Almacenamiento y seguridad

- Datos persistentes en **SQLite** en el servidor donde corre el Bot
- Métricas de uptime/comandos en **memoria** (se pierden al reiniciar)
- Variables sensibles (tokens, API keys) en variables de entorno, no en el código
- Medidas razonables contra acceso no autorizado

## 8. Retención de datos

Conservamos la información el tiempo necesario para operar el Bot o según lo exija la ley. El historial de conversación con IA puede recortarse por límites de contexto. Los ficheros temporales de música se eliminan tras el uso.

## 9. Derechos del usuario

Puedes solicitar:

- Acceso a tus datos
- Corrección de datos inexactos
- Eliminación de tus datos

Contacto: **isenkidu@gmail.com**

Los administradores de un servidor pueden desactivar features (p. ej. automod) o expulsar el Bot.

## 10. Uso por menores

El Bot no está dirigido a menores de 13 años, edad mínima de Discord. No recopilamos intencionalmente datos de menores de 13 años.

## 11. Cambios en esta política

Podemos actualizar esta política. Los cambios significativos se comunicarán por los canales apropiados del proyecto (p. ej. `/changelog`).

## 12. Consentimiento

Al usar el Bot, aceptas el procesamiento descrito en esta política.

## 13. Contacto

Preguntas sobre privacidad: **isenkidu@gmail.com**

Documentos relacionados:

- [Términos de Servicio](./terms-of-service.md)
- [Repositorio del proyecto](https://github.com/ItsJhonAlex/TatianaBot)

---

Desarrollado por ItsJhonAlex
