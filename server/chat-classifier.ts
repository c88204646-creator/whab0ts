// Open Source Chat Classification Engine
// Uses lightweight keyword matching and pattern recognition (no heavy ML models)

export interface ClassificationResult {
  category: string;
  priority: string;
  confidence: number; // 0-100
  matchedKeywords: string[];
  matchedPatterns: string[];
}

// Default classification rules based on common patterns
const DEFAULT_RULES = {
  ads: {
    keywords: ['vi tu anuncio', 'vi tu publicidad', 'vi tu anúncio', 'vi el anuncio', 'te vi en facebook', 'te vi en instagram', 'me llamó la atención', 'por el anuncio', 'por la publicidad', 'por la campaña', 'interesado en tu anuncio', 'por facebook', 'por instagram', 'tiktok', 'campaña publicitaria', 'encontré tu anuncio', 'clickee tu anuncio', 'hice click en', 'lead', 'leads'],
    patterns: ['(?:vi|encontré|vi|leí) (?:tu|el|su) (?:anuncio|publicidad|anúncio|campaña)', '(?:por|desde|vía) (?:facebook|instagram|tiktok|anuncio|publicidad)', '(?:clic|click|clickeé|cliquée) (?:en|tu) (?:anuncio|publicidad)', '(?:me|te|nos) (?:llamó|llamaba|llegó) (?:tu|el|la) (?:publicidad|anuncio)', 'primer(?:a)?\\s+(?:contacto|mensaje|comunicaci[óo]n)'],
    priority: 'high',
  },
  sales: {
    keywords: ['comprar', 'precio', 'costo', 'cuánto', 'cuanto', 'promoción', 'descuento', 'oferta', 'presupuesto', 'cotización', 'orden', 'pedido', 'pago', 'tarjeta', 'transferencia', 'disponible', 'stock'],
    patterns: ['(?:cuál|que) (?:es|cuesta|vale) (?:el|la|los|las)', 'me (?:interesa|atrae|gustaría) (?:comprar|contratar)', 'quiero (?:comprar|contratar|adquirir)', 'cuéntame (?:de|sobre)', 'información (?:de|sobre|acerca de)'],
    priority: 'high',
  },
  support: {
    keywords: ['problema', 'error', 'no funciona', 'falla', 'ayuda', 'como', 'cómo', 'como usar', 'instrucciones', 'manual', 'roto', 'no va', 'lento', 'crash', 'bug'],
    patterns: ['(?:no|nunca) (?:funciona|va|anda)', 'hay (?:un|una) (?:problema|error|falla)', 'cómo (?:se|le) (?:usa|utiliza)', 'me (?:ayuda|ayudas|ayudan)'],
    priority: 'high',
  },
  complaint: {
    keywords: ['queja', 'inconformidad', 'no estoy conforme', 'decepcionado', 'mal servicio', 'pésimo', 'terrible', 'horrible', 'nunca más', 'estafado', 'engaño', 'fraude'],
    patterns: ['(?:muy|bastante) (?:mal|pésimo|terrible|horrible)', 'nunca (?:más|jamás)', 'quiero (?:devolver|devuelva|cambiar)', 'reclamo', 'demanda'],
    priority: 'urgent',
  },
  vip: {
    keywords: ['cliente frecuente', 'vip', 'premium', 'preferente', 'elite', 'gold', 'platinum', 'ejecutivo', 'empresa grande'],
    patterns: ['(?:soy|somos) (?:un|una|clientes) (?:cliente|empresa) (?:grande|importante|preferente)'],
    priority: 'high',
  },
  inquiry: {
    keywords: ['información', 'datos', 'detalles', 'especificaciones', 'características', 'features', 'qué incluye', 'qué trae', 'alcance', 'cobertura', 'disponibilidad', 'ubicación', 'horario', 'dirección'],
    patterns: ['(?:puedo|podrías|pueden) (?:decir|contar|explicar) (?:de|sobre)', 'qué (?:es|son|incluye|trae)', 'dónde (?:está|están|quedan)', 'cuándo (?:está|están) (?:abierto|disponible)'],
    priority: 'normal',
  }
};

export function classifyMessage(
  messageContent: string,
  customRules?: Record<string, any>
): ClassificationResult {
  const rules = customRules || DEFAULT_RULES;
  const messageLower = messageContent.toLowerCase().trim();
  
  let bestMatch: ClassificationResult = {
    category: 'other',
    priority: 'normal',
    confidence: 0,
    matchedKeywords: [],
    matchedPatterns: [],
  };

  // Score each category
  for (const [category, ruleConfig] of Object.entries(rules)) {
    let score = 0;
    const matchedKeywords: string[] = [];
    const matchedPatterns: string[] = [];

    // Check keywords (each match adds points)
    for (const keyword of ruleConfig.keywords || []) {
      const keywordLower = keyword.toLowerCase();
      if (messageLower.includes(keywordLower)) {
        score += 10;
        matchedKeywords.push(keyword);
      }
    }

    // Check patterns (regex matches add more points)
    for (const pattern of ruleConfig.patterns || []) {
      try {
        const regex = new RegExp(pattern, 'gi');
        if (regex.test(messageLower)) {
          score += 25; // Patterns are more specific
          matchedPatterns.push(pattern);
        }
      } catch (e) {
        // Ignore invalid regex
      }
    }

    // Normalize score to confidence (0-100)
    const confidence = Math.min(100, score * 5);

    // Update best match if this is better
    if (confidence > bestMatch.confidence) {
      bestMatch = {
        category,
        priority: ruleConfig.priority || 'normal',
        confidence,
        matchedKeywords,
        matchedPatterns,
      };
    }
  }

  return bestMatch;
}

// Batch classify multiple messages for learning/training
export function classifyConversation(messages: string[]): ClassificationResult {
  if (!messages || messages.length === 0) {
    return {
      category: 'other',
      priority: 'normal',
      confidence: 0,
      matchedKeywords: [],
      matchedPatterns: [],
    };
  }

  // Combine and classify full conversation
  const fullConversation = messages.join(' ');
  return classifyMessage(fullConversation);
}

// Calculate urgency based on keyword intensity
export function calculatePriority(classification: ClassificationResult): string {
  const confidenceThreshold = 70;
  
  // Urgent: high confidence in complaint or support + urgent patterns
  if (
    (classification.category === 'complaint' && classification.confidence > confidenceThreshold) ||
    (classification.category === 'support' && classification.confidence > 80)
  ) {
    return 'urgent';
  }

  // High: high confidence in sales or vip
  if (
    (classification.category === 'sales' && classification.confidence > 60) ||
    classification.category === 'vip'
  ) {
    return 'high';
  }

  // Normal: medium confidence
  if (classification.confidence > 40) {
    return 'normal';
  }

  // Low: low confidence or inquiry
  return 'low';
}
