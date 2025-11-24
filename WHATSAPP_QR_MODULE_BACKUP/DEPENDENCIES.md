# Descripción Detallada de Dependencias

## 🟢 Dependencias Críticas (MUST HAVE)

### @whiskeysockets/baileys v7.0.0-rc.9
**¿Qué es?**: Motor que emula WhatsApp sin navegador. Es el corazón del sistema.

**¿Por qué?**: Simula un cliente WhatsApp real, permitiendo recibir/enviar mensajes.

**¿Cómo funciona?**:
```typescript
import makeWASocket from '@whiskeysockets/baileys';

const socket = makeWASocket({
  auth: state,  // Credenciales guardadas
  printQRInTerminal: false,
});

socket.ev.on('connection.update', (update) => {
  if (update.qr) { /* Mostrar QR */ }
  if (update.connection === 'open') { /* Conectado */ }
});
```

**Versión importante**: v7.0.0-rc.9 es la versión más estable. Versiones beta posteriores pueden romper.

**Eventos que emite**:
- `connection.update` - Cambios de estado/QR
- `connection.error` - Errores de conexión
- `creds.update` - Credenciales actualizadas
- `messages.upsert` - Nuevos mensajes

---

### qrcode v1.5.4
**¿Qué es?**: Librería para generar códigos QR como imágenes.

**¿Por qué?**: Transforma los datos QR de Baileys en imagen mostrable.

**¿Cómo funciona?**:
```typescript
import QRCode from 'qrcode';

const qrCode = await QRCode.toDataURL(qr);
// Retorna: "data:image/png;base64,iVBORw0KGgo..."
```

**Sin esto**: No podrías mostrar el QR en la UI, no hay forma de vincular.

---

### react v18.3.1 & react-dom v18.3.1
**¿Qué es?**: Framework para construir interfaces de usuario.

**¿Por qué?**: Necesario para la UI en el navegador.

**Uso en módulo**: Componentes `QRModal.tsx` y `connections.tsx`

---

### @tanstack/react-query v5.60.5
**¿Qué es?**: Librería para manejar estado y caché de datos de servidor.

**¿Por qué?**: Permite obtener cuentas, mensajes, conversaciones con caché automático.

**¿Cómo funciona?**:
```typescript
// connections.tsx
const { data: accounts } = useQuery({
  queryKey: [`/api/whatsapp-accounts?userId=${userId}`],
  refetchInterval: 5000, // Polling cada 5 segundos
  retry: 1,
});
```

**Sin esto**: Tendrías que hacer fetch manual y manejar caché tú mismo.

---

## 🟡 Dependencias Importantes

### zod v3.24.2 & @hookform/resolvers v3.10.0
**¿Qué es?**: Validación de esquemas + integración con react-hook-form.

**¿Por qué?**: Valida que los datos enviados al backend sean correctos.

**Uso**:
```typescript
const deviceSchema = z.object({
  deviceName: z.string().min(2),
  accountType: z.enum(["normal", "business"]),
});
```

---

### react-hook-form v7.55.0
**¿Qué es?**: Librería para manejar formularios en React.

**¿Por qué?**: Form QR usa este para deviceName y accountType.

**Uso**:
```typescript
const form = useForm<DeviceFormData>({
  resolver: zodResolver(deviceSchema),
});
```

---

### express v4.21.2
**¿Qué es?**: Framework web para Node.js.

**¿Por qué?**: Servidor backend que maneja todas las rutas API.

**Rutas principales**:
- `POST /api/whatsapp-accounts` - Crear conexión
- `GET /api/whatsapp-accounts` - Obtener cuentas
- `DELETE /api/whatsapp-accounts/:id` - Desconectar

---

### drizzle-orm v0.39.1
**¿Qué es?**: ORM (Object-Relational Mapper) para SQL.

**¿Por qué?**: Permite interactuar con PostgreSQL de forma segura.

**Uso**:
```typescript
const account = await storage.getWhatsappAccount(accountId);
await storage.updateWhatsappAccount(accountId, { status: 'connected' });
```

---

### ws v8.18.0 & socket.io v4.8.1
**¿Qué es?**: Librerías para WebSockets.

**¿Por qué?**: Permiten comunicación en tiempo real entre servidor y clientes.

**Uso**: Cuando llega un nuevo mensaje, se emite en tiempo real a los clientes conectados.

**Diferencia**:
- `ws` - WebSocket puro, más ligero
- `socket.io` - Wrapper con fallbacks y features adicionales

---

### bcryptjs v3.0.3
**¿Qué es?**: Librería para hashear contraseñas.

**¿Por qué?**: Seguridad - las contraseñas no se guardan en texto plano.

**Uso**:
```typescript
const hashedPassword = await bcrypt.hash(password, 10);
const isValid = await bcrypt.compare(inputPassword, hashedPassword);
```

---

### @neondatabase/serverless v0.10.4
**¿Qué es?**: Driver de PostgreSQL optimizado para serverless.

**¿Por qué?**: Acceso a la BD PostgreSQL desde el backend.

---

## 🔵 Dependencias UI (Radix + Tailwind)

### @radix-ui/react-* (múltiples)
**¿Qué son?**: Componentes accesibles de bajo nivel.

**Usados en módulo**:
- `@radix-ui/react-dialog` - Modal QR
- `@radix-ui/react-label` - Labels en formularios
- `@radix-ui/react-select` - Selectores

---

### tailwindcss v3.4.17
**¿Qué es?**: Framework CSS utility-first.

**¿Por qué?**: Estiliza los componentes (colores, espaciado, etc).

---

### lucide-react v0.453.0
**¿Qué es?**: Librería de iconos SVG.

**¿Por qué?**: Iconos en botones (Plus, Trash2, Wifi, etc).

**Usados**:
```typescript
import { Plus, Trash2, Wifi, Activity, Pause, Play } from "lucide-react";
```

---

## 🔴 Dependencias Opcionales

### @xenova/transformers v2.17.2
**¿Qué es?**: Modelos de IA para procesamiento de audio/texto.

**¿Para qué?**: Transcribir audios de WhatsApp a texto (audio → texto).

**¿Es obligatorio?**: No, pero agregao función de transcripción en mensajes.

---

### openai v6.9.1
**¿Qué es?**: Cliente para API de OpenAI (ChatGPT).

**¿Para qué?**: Respuestas automáticas con IA.

**¿Es obligatorio?**: No, pero agregua respuestas inteligentes en chatbots.

---

## 🛠️ Dependencias de Desarrollo

### typescript v5.6.3
**¿Qué es?**: Lenguaje tipado que compila a JavaScript.

**¿Por qué?**: Todo el código usa TypeScript para evitar bugs.

---

### vite v5.4.20
**¿Qué es?**: Bundler y dev server rápido.

**¿Por qué?**: Compila React y sirve en desarrollo/producción.

---

### drizzle-kit v0.31.4
**¿Qué es?**: CLI para gestionar migraciones de BD.

**¿Por qué?**: Crear/actualizar tablas en PostgreSQL.

**Comando**:
```bash
npm run db:push
```

---

### esbuild v0.25.0
**¿Qué es?**: Compilador/bundler extremadamente rápido.

**¿Por qué?**: Usaado por vite para compilación.

---

## 📋 Checklist de Dependencias Mínimas

Para que el módulo WhatsApp funcione, NECESITAS:

```json
{
  "dependencies": {
    "@whiskeysockets/baileys": "^7.0.0-rc.9",
    "qrcode": "^1.5.4",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@tanstack/react-query": "^5.60.5",
    "express": "^4.21.2",
    "drizzle-orm": "^0.39.1",
    "@neondatabase/serverless": "^0.10.4",
    "ws": "^8.18.0",
    "bcryptjs": "^3.0.3",
    "zod": "^3.24.2"
  }
}
```

## 🚨 Versiones CRÍTICAS

NO uses versiones diferentes de:
1. **@whiskeysockets/baileys** - v7.0.0-rc.9 específicamente
2. **qrcode** - ≥1.5.0
3. **@tanstack/react-query** - v5+ (no v4)
4. **drizzle-orm** - ≥0.39.0

Cambiar estas puede romper:
- Generación de QR
- Recepción de mensajes
- Caché de datos
- Esquema de BD

---

## 📦 Instalación Completa

```bash
npm install \
  @whiskeysockets/baileys@7.0.0-rc.9 \
  qrcode@1.5.4 \
  @tanstack/react-query@5.60.5 \
  express@4.21.2 \
  drizzle-orm@0.39.1 \
  @neondatabase/serverless@0.10.4 \
  ws@8.18.0 \
  bcryptjs@3.0.3 \
  zod@3.24.2 \
  react@18.3.1 \
  react-dom@18.3.1
```

---

## 🐛 Troubleshooting de Dependencias

### Error: "Cannot find module '@whiskeysockets/baileys'"
**Solución**:
```bash
npm install @whiskeysockets/baileys@7.0.0-rc.9
npm run dev  # Reinicia el servidor
```

### Error: "QRCode is not a function"
**Solución**: Asegurar que importas de forma correcta
```typescript
import QRCode from 'qrcode';  // ✅ Correcto
import * as QRCode from 'qrcode';  // ❌ Incorrecto
```

### Error: "useQuery is not exported"
**Solución**:
```bash
npm install @tanstack/react-query@5.60.5
```

---

## 📊 Tamaño de Dependencias

Las más pesadas:
1. `@whiskeysockets/baileys` - ~3MB (más grande pero necesaria)
2. `@tanstack/react-query` - ~40KB
3. `express` - ~50KB
4. `drizzle-orm` - ~200KB

Total para módulo: ~5-6MB (aceptable para aplicación web)
