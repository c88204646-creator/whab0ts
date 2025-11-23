# Guía Anti-Detección para WhatsApp CRM

Para evitar que WhatsApp bloquee tu número cuando usas automatización con chatbots, hemos implementado medidas avanzadas de anti-detección.

## Características Implementadas

### 1. **Delays Aleatorios**
- Los mensajes se envían con un delay aleatorio entre 2-8 segundos (configurable)
- Simula el comportamiento natural de un humano escribiendo
- Basado en la longitud del mensaje

### 2. **Cálculo de Tiempo de Escritura**
- Simula el tiempo que tarda una persona en escribir un mensaje
- Velocidad de escritura: ~3.3 caracteres por segundo
- Incluye tiempo de "pensamiento" antes de escribir (1-2 segundos)
- Variación aleatoria del ±30% para parecer más natural

### 3. **Límite de Mensajes Diarios**
- Máximo de mensajes por contacto por día (configurable)
- Por defecto: 100 mensajes por contacto
- Se reinicia cada 24 horas
- Previene detección por spam

### 4. **Configuración por Chatbot**
Cada chatbot tiene configuraciones específicas:

```
- minResponseDelay: Delay mínimo en ms (default: 2000ms)
- maxResponseDelay: Delay máximo en ms (default: 8000ms)  
- dailyMessageLimit: Límite diario de mensajes (default: 100, 0 = ilimitado)
- respectUserTypingTime: Simular tiempo de escritura (default: true)
```

## Cómo Configurar Anti-Detección

### Paso 1: Configuración Conservadora (Recomendado)
Para cuentas nuevas o de alto riesgo:

```json
{
  "minResponseDelay": 3000,      // 3 segundos mínimo
  "maxResponseDelay": 10000,     // 10 segundos máximo
  "dailyMessageLimit": 50,       // 50 mensajes por contacto/día
  "respectUserTypingTime": true  // Simular escritura
}
```

### Paso 2: Configuración Normal
Para cuentas establecidas:

```json
{
  "minResponseDelay": 2000,      // 2 segundos mínimo
  "maxResponseDelay": 8000,      // 8 segundos máximo
  "dailyMessageLimit": 100,      // 100 mensajes por contacto/día
  "respectUserTypingTime": true  // Simular escritura
}
```

### Paso 3: Configuración Agresiva (Riesgo Alto)
Solo si tienes confianza en tu cuenta:

```json
{
  "minResponseDelay": 1000,      // 1 segundo mínimo
  "maxResponseDelay": 3000,      // 3 segundos máximo
  "dailyMessageLimit": 200,      // 200 mensajes por contacto/día
  "respectUserTypingTime": true
}
```

## Mejores Prácticas

### ✅ Recomendado

1. **Respuestas Variadas**
   - No uses el mismo mensaje para todos los contactos
   - Varía el contenido y tono
   - Personaliza cuando sea posible

2. **Distribución de Mensajes**
   - Envía a diferentes contactos en diferentes horarios
   - No hagas campaña masiva a todos al mismo tiempo
   - Espacios de tiempo entre contactos

3. **Monitoreo Activo**
   - Revisa regularmente el estado de tu cuenta
   - Detecta advertencias de WhatsApp temprano
   - Pausa si ves patrones extraños

4. **Pausa Estratégica**
   - Usa el botón de pausa sin perder la sesión
   - Pausa cuando no uses la automatización
   - Respeta los tiempos de descanso

5. **Límites Realistas**
   - No intentes contactar a 1000 personas en 1 hora
   - Mantén ratio natural: 5-10 mensajes/minuto máximo
   - Respeta el tiempo de respuesta humano

### ❌ Evitar

- No cambies el User-Agent o pretendas ser mobile si no lo eres
- No uses palabras clave de spam (dinero, urgente, oferta limitada)
- No hagas scraping o bulk de números
- No reenvíes mensajes al mismo número múltiples veces
- No uses caracteres especiales o formatos sospechosos

## Monitoreo y Señales de Alerta

### Señales de que WhatsApp te está vigilando
- Mensajes tardan más en enviar
- Errores ocasionales al enviar
- No puedes crear grupos
- No puedes cambiar foto de perfil
- Se agota cuota de mensajes más rápido

### Acciones a Tomar
1. Pausa la automatización inmediatamente
2. Reduce significativamente los delays (aumenta más)
3. Reduce el límite diario en 50%
4. Espera 24-48 horas antes de reanudar
5. Si persiste, pausa la cuenta 1-2 semanas

## Implementación en Tu Chatbot

Cuando edites un chatbot, podrás configurar:

1. **Delay Mínimo** - tiempo mínimo entre mensajes
2. **Delay Máximo** - tiempo máximo entre mensajes
3. **Límite Diario** - máx mensajes por contacto/día
4. **Respetar Tiempo de Escritura** - simular escritura natural

## Ejemplos de Uso

### Crear Chatbot con Anti-Detección
```
POST /api/chatbots
{
  "name": "Atención al Cliente",
  "whatsappAccountId": "...",
  "minResponseDelay": 2000,
  "maxResponseDelay": 8000,
  "dailyMessageLimit": 100,
  "respectUserTypingTime": true,
  ...
}
```

### Actualizar Configuración Anti-Detección
```
PATCH /api/chatbots/:id
{
  "minResponseDelay": 3000,
  "maxResponseDelay": 10000,
  "dailyMessageLimit": 50,
  "respectUserTypingTime": true
}
```

## FAQ

**P: ¿Cuál es el delay seguro?**
R: 2-8 segundos es el rango seguro. Entre mayor el delay, menor riesgo de bloqueo.

**P: ¿Puedo usar 0ms de delay?**
R: No recomendado. Aunque la API lo permite, es muy detectable por WhatsApp.

**P: ¿El límite diario se resetea?**
R: Sí, cada 24 horas se reinicia el contador para cada contacto.

**P: ¿Qué pasa si llego al límite?**
R: El sistema rechazará el mensaje con error 429 (Too Many Requests).

**P: ¿Puedo cambiar la configuración en vivo?**
R: Sí, los cambios aplican inmediatamente a nuevos mensajes.

## Responsabilidad Legal

Esta herramienta es para uso legítimo. WhatsApp prohíbe:
- Spam o mensajes no solicitados
- Scraping de números
- Violación de privacidad

Asegúrate de tener consentimiento de los contactos y cumplir leyes locales de privacidad.
