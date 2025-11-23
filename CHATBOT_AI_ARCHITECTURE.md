# Arquitectura de Chatbots con IA - Sistema RAG Seguro

## Principio Fundamental
**La IA MEJORA respuestas basadas en KB, NO genera respuestas inventadas.**

## Flujo de Respuestas (Orden de Prioridad)

### 1️⃣ **Reglas (Rules)** - Máxima Prioridad
- Trigger keywords definidos por el usuario
- Respuesta exacta configurada
- **Nunca se modifica con IA**
- Ejemplo: "Horario" → "Abierto 9-18 hs"

### 2️⃣ **Base de Conocimientos (Knowledge Base)** - Contexto Primario
- Búsqueda por keywords en KB items
- Búsqueda por Q&A en Knowledge Base
- Si encuentra contenido relevante (confianza > 60%):
  - CON IA ACTIVA: Reformula/mejora la respuesta manteniendo la información KB
  - SIN IA ACTIVA: Devuelve contenido KB tal cual

### 3️⃣ **Respuesta de No Encontrado**
- Si NO hay nada en KB y IA está ACTIVA:
  - **NO genera respuesta libre**
  - Responde: "No tengo información sobre eso. Por favor contacta a..." (configurable)
- Si IA está DESACTIVA:
  - Responde mensaje default: "No sé cómo ayudarte con eso"

---

## Estructura de Respuesta con IA (RAG)

```typescript
interface ChatbotAIResponse {
  sourceType: 'rule' | 'knowledge_base' | 'not_found';
  source?: {
    kbItemId?: string;
    kbItemTitle?: string;
    relevanceScore?: number; // 0-100
  };
  originalContent?: string;      // Contenido crudo de KB
  aiEnhancedContent?: string;    // Contenido reformulado por IA
  useAiEnhanced: boolean;        // Si usar versión mejorada
  confidence: number;            // 0-100, qué tan seguro estamos
}
```

---

## Validación y Confianza

### Relevancia de KB
- **Alta (>70%)**: Usar IA para mejorar
- **Media (60-70%)**: Usar IA + aclaración "Basado en..."
- **Baja (<60%)**: Responder "No tengo información específica"

### Prompt para IA (CON CONTEXTO)
```
Eres un chatbot de soporte. Basándote ÚNICAMENTE en esta información:

[INFORMACIÓN DE KB]
{kbContent}

Mejora y reformula esta respuesta para hacerla más natural y útil, 
pero SOLO usando información de arriba:
{originalResponse}

Si la información no es suficiente, di explícitamente: "No tengo información suficiente sobre esto"
```

---

## Flujo de Implementación

1. **Búsqueda en Reglas** → Match → Devuelve respuesta rule
2. **Búsqueda en KB** (items + Q&A) → 
   - Encontrado y confianza alta?
     - IA activa? → Reformula + mejora
     - IA inactiva? → Devuelve KB tal cual
   - No encontrado o confianza baja?
     - Devuelve "No tengo información"

---

## Implementación Técnica

### Búsqueda en KB
```typescript
searchKnowledgeBase(query: string, chatbotId: string): {
  kbItems: KnowledgeBaseItem[];
  qaPairs: KnowledgeBase[];
  bestMatch: {
    content: string;
    relevanceScore: number;
    type: 'item' | 'qa';
  } | null;
}
```

### Generación de Respuesta Mejorada
```typescript
enhanceKBResponseWithAI(
  kbContent: string,
  originalMessage: string,
  aiProvider: { provider: string; apiKey: string }
): Promise<string>
```

Solo llama a IA SI hay contenido de KB que mejorar.

---

## Seguridad Legal ✅

- ✅ Nunca inventa información
- ✅ Toda respuesta es rastreable (sabe de dónde vino)
- ✅ IA mejora, no genera
- ✅ Auditoria completa de respuestas
- ✅ Responsabilidad clara del contenido
- ✅ Mensaje de "No tengo información" explícito cuando aplica

