# Simulacro de Examen UT3 — Segunda Parte (Puntos 7 a 12)

Implementación completa de avisos, pruebas de entorno/middlewares y soluciones para `RESPUESTAS.md`.

---

## Puntos 7 y 8: Implementación de Avisos (Listado, Búsqueda, Paginación y CRUD)

Sobre la base de la primera parte, se ajustan el servicio y el controlador de `notices` para cumplir exactamente con las reglas de paginación (`limit = 2` por defecto), búsqueda solo en el título y validación centralizada mediante `AppError` y `ResourceNotFoundError`.

### 1. Servicio: `src/services/noticesService.ts`

La función `list` filtra por `search` únicamente sobre `notice.title` antes de calcular el total y recortar la página solicitada:

```typescript
import { randomUUID } from 'node:crypto';

export interface Notice {
  id: string;
  title: string;
  description: string;
  createdAt: string;
}

export interface NoticeChanges {
  title?: string;
  description?: string;
}

const notices: Notice[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    title: 'Apertura de matrícula ordinaria',
    description: 'El plazo de matrícula estará abierto hasta el día 15.',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    title: 'Normas de matrícula extraordinaria',
    description: 'Documentación necesaria para solicitar plaza fuera de plazo.',
    createdAt: '2026-09-02T09:00:00.000Z',
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    title: 'Horario de biblioteca del centro',
    description: 'Abierta de lunes a viernes de 08:00 a 20:00.',
    createdAt: '2026-09-03T10:00:00.000Z',
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    title: 'Reunión de inicio de curso',
    description: 'Presentación de tutores en el salón de actos.',
    createdAt: '2026-09-04T11:00:00.000Z',
  },
  {
    id: '55555555-5555-4555-8555-555555555555',
    title: 'Becas y ayudas al estudio',
    description: 'Información sobre la convocatoria oficial de becas.',
    createdAt: '2026-09-05T12:00:00.000Z',
  },
];

export function list(page: number, limit: number, search?: string) {
  let filtered = notices;

  if (search && search.trim().length > 0) {
    const term = search.trim().toLowerCase();
    filtered = notices.filter((notice) =>
      notice.title.toLowerCase().includes(term),
    );
  }

  const start = (page - 1) * limit;
  return {
    data: filtered.slice(start, start + limit),
    pagination: { page, limit, total: filtered.length },
  };
}

export function getById(id: string): Notice | undefined {
  return notices.find((notice) => notice.id === id);
}

export function create(title: string, description: string): Notice {
  const notice: Notice = {
    id: randomUUID(),
    title,
    description,
    createdAt: new Date().toISOString(),
  };
  notices.push(notice);
  return notice;
}

export function update(id: string, changes: NoticeChanges): Notice | undefined {
  const notice = getById(id);
  if (!notice) {
    return undefined;
  }
  if (changes.title !== undefined) {
    notice.title = changes.title;
  }
  if (changes.description !== undefined) {
    notice.description = changes.description;
  }
  return notice;
}
```

### 2. Controlador: `src/controllers/noticesController.ts`

Valida enteros positivos en `page` y `limit` (predeterminado `2`), comprueba `title` y `description` lanzando `AppError(400)` y propaga `ResourceNotFoundError(404)` cuando el ID no existe:

```typescript
import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../errors/AppError.js';
import { ResourceNotFoundError } from '../errors/ResourceNotFoundError.js';
import * as noticesService from '../services/noticesService.js';

export function list(req: Request, res: Response, next: NextFunction): void {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 2);

    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1) {
      throw new AppError(400, 'page and limit must be positive integers', 'BAD_REQUEST');
    }

    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    res.json(noticesService.list(page, limit, search));
  } catch (err) {
    next(err);
  }
}

export function getById(req: Request, res: Response, next: NextFunction): void {
  try {
    const noticeId = String(req.params.noticeId);
    const notice = noticesService.getById(noticeId);
    if (!notice) {
      throw new ResourceNotFoundError(
        404,
        `Notice with id '${noticeId}' not found`,
        'RESOURCE_NOT_FOUND',
        noticeId,
      );
    }
    res.json({ data: notice });
  } catch (err) {
    next(err);
  }
}

export function create(req: Request, res: Response, next: NextFunction): void {
  try {
    const { title, description } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      throw new AppError(400, 'Title must be a non-empty string', 'BAD_REQUEST');
    }
    if (description !== undefined && typeof description !== 'string') {
      throw new AppError(400, 'Description must be a string', 'BAD_REQUEST');
    }

    const notice = noticesService.create(
      title.trim(),
      description !== undefined ? description.trim() : '',
    );
    res.status(201).json({ data: notice });
  } catch (err) {
    next(err);
  }
}

export function update(req: Request, res: Response, next: NextFunction): void {
  try {
    const { title, description } = req.body;

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        throw new AppError(400, 'Title must be a non-empty string', 'BAD_REQUEST');
      }
    }
    if (description !== undefined && typeof description !== 'string') {
      throw new AppError(400, 'Description must be a string', 'BAD_REQUEST');
    }

    const noticeId = String(req.params.noticeId);
    const notice = noticesService.update(noticeId, {
      title: title !== undefined ? title.trim() : undefined,
      description: description !== undefined ? description.trim() : undefined,
    });

    if (!notice) {
      throw new ResourceNotFoundError(
        404,
        `Notice with id '${noticeId}' not found`,
        'RESOURCE_NOT_FOUND',
        noticeId,
      );
    }

    res.json({ data: notice });
  } catch (err) {
    next(err);
  }
}
```

### 3. Router: `src/routes/notices.ts` y montaje en `src/app.ts`

```typescript
// src/routes/notices.ts
import { Router } from 'express';
import * as noticesController from '../controllers/noticesController.js';

export const noticesRouter = Router();

noticesRouter.get('/', noticesController.list);
noticesRouter.get('/:noticeId', noticesController.getById);
noticesRouter.post('/', noticesController.create);
noticesRouter.patch('/:noticeId', noticesController.update);

// En src/app.ts (antes de notFound y errorHandler):
app.use('/api/v1/notices', noticesRouter);
```

> **Verificación clave del Punto 8:** Envía `PATCH /api/v1/notices/11111111-1111-4111-8111-111111111111` con cuerpo `{"description": "Nueva descripción"}` y realiza inmediatamente un `GET` sobre ese mismo ID para evidenciar que `title` se mantiene intacto.

---

## Procedimiento para las Pruebas Temporales (Puntos 9 y 10)

1. **Punto 9 (Entorno `production` vs `development`):** Añade temporalmente `throw new Error('Fallo interno de prueba');` en una ruta (por ejemplo, al inicio de `getById`). Lanza una petición correcta (`GET /health/live`) y la petición con error primero con `NODE_ENV=development` y después cambiando a `NODE_ENV=production` en `.env` (reiniciando el servidor tras cada cambio). Guarda tanto la respuesta JSON de Bruno como la salida de consola del servidor, y retira después el `throw`.
2. **Punto 10 — Prueba 1 (`notFound` antes de los routers):** En `src/app.ts`, mueve temporalmente `app.use(notFound);` por encima de `app.use('/health', healthRouter);` y solicita `GET /health/live`. Captura el 404 y restaura el orden original.
3. **Punto 10 — Prueba 2 (`logger` sin `next()`):** En `src/middlewares/logger.ts`, comenta temporalmente la línea `next();` y solicita `GET /health/live`. Comprueba que la petición queda colgada sin responder, cancela la petición y restaura `next();`.

---

## Contenido Completo para `simulacro/RESPUESTAS.md` (Puntos 9, 10 y 11)

### 9. Comportamiento en producción

* **¿Cambiar `NODE_ENV` desactiva automáticamente el logger?**
  No. El logger sigue habilitado y registrando cada petición porque depende exclusivamente de la variable `LOG` (`env.LOG !== 'OFF'`), no de `NODE_ENV`.
* **Diferencias en la respuesta al error inesperado:**
  Con `NODE_ENV=development`, la respuesta HTTP `500` muestra el mensaje real de la excepción (`"message": "Fallo interno de prueba"`). Con `NODE_ENV=production`, oculta el detalle interno al cliente y devuelve un mensaje genérico (`"message": "An unexpected error occurred"`).
* **Diferencias en los registros del manejador de errores:**
  En `development`, el objeto JSON impreso por `console.error` incluye el campo `"stack"` con toda la traza de llamadas del error. En `production`, `"stack"` toma el valor `undefined` y se omite del JSON registrado en consola.
* **Instrucciones del código que explican estos resultados:**
  En `src/middlewares/errorHandler.ts`:
  * `const isProduction = env.NODE_ENV === 'production';`
  * En el log: `stack: isProduction ? undefined : err.stack`
  * En la respuesta: `message: isProduction ? 'An unexpected error occurred' : err.message`

### 10. Diagnóstico de dos fallos de middleware

#### Primera prueba (`notFound` registrado antes de los routers)
* **Qué esperaba antes de probarlo:** Que cualquier petición a una ruta válida devolviera `404`, ya que `notFound` interceptaría todas las peticiones antes de alcanzar los routers.
* **Qué sucedió realmente y respuesta recibida:** Al solicitar `GET /health/live`, el servidor respondió `404 Not Found` con el cuerpo `{"error":"NOT_FOUND","message":"Route not found: GET /health/live"}`.
* **Qué parte del flujo explica el resultado:** Express ejecuta los middlewares en el orden exacto en que se registran con `app.use()` en `src/app.ts`. Al estar `notFound` antes que los routers, captura cualquier petición entrante y cierra la respuesta con 404 sin llamar a `next()`.
* **Cómo lo corregí:** Moviendo `app.use(notFound)` de vuelta debajo de todos los routers y justo antes de `app.use(errorHandler)`.

#### Segunda prueba (`logger` sin llamada a `next()`)
* **Qué esperaba antes de probarlo:** Que la petición quedara detenida en el middleware `logger` y nunca llegara a las rutas.
* **Qué sucedió realmente y respuesta recibida:** No se recibió ninguna respuesta; la petición quedó esperando indefinidamente hasta agotar el tiempo de espera (timeout) en el cliente, y tampoco se imprimió ningún log en consola.
* **Qué parte del flujo explica el resultado:** En Express, la cadena de middlewares solo avanza cuando cada función invoca a `next()`. Al eliminar `next()`, la ejecución se detiene dentro de `logger`, nunca alcanza el router ni envía respuesta (`res.end`), por lo que tampoco se dispara el evento `finish`.
* **Cómo lo corregí:** Restaurando la llamada `next();` al final del middleware `logger`.

### 11. Recorrido de las peticiones

*Nota sobre el logger: en todos los casos, `logger` entra al inicio de la petición para guardar el instante inicial (`performance.now()`) y suscribir el listener `res.on('finish', ...)`, mientras que su callback de impresión se ejecuta al final, una vez enviada la respuesta HTTP.*

| Caso | Middlewares y funciones que intervienen | Dónde se responde | `errorHandler` |
| :--- | :--- | :--- | :---: |
| **1. Consulta documento existente**<br>`GET /api/v1/admin/documents/:id` | `requestId` → `logger` (entrada) → `express.json()` → `documentsRouter` → `documentsController.getById` → `documentsService.getById` → `logger` (callback `finish`). | `documentsController.getById` (`200`) | No |
| **2. Consulta documento inexistente**<br>`GET /api/v1/admin/documents/no-existe` | `requestId` → `logger` (entrada) → `express.json()` → `documentsRouter` → `documentsController.getById` → `documentsService.getById` (`undefined`) → lanza `ResourceNotFoundError` → `next(err)` → `errorHandler` → `logger` (callback `finish`). | `errorHandler` (`404`) | Sí |
| **3. Petición a URL inexistente**<br>`GET /ruta-inventada` | `requestId` → `logger` (entrada) → `express.json()` → (ningún router coincide) → `notFound` → `logger` (callback `finish`). | `notFound` (`404`) | No |
| **4. Crear aviso con título inválido**<br>`POST /api/v1/notices` | `requestId` → `logger` (entrada) → `express.json()` → `noticesRouter` → `noticesController.create` → lanza `AppError` → `next(err)` → `errorHandler` → `logger` (callback `finish`). | `errorHandler` (`400`) | Sí |
| **5. Petición con JSON mal formado**<br>`POST` con `{malo` | `requestId` → `logger` (entrada) → `express.json()` (lanza `SyntaxError`) → `errorHandler` → `logger` (callback `finish`). | `errorHandler` (`400`) | Sí |
| **6. Actualizar documento con título vacío**<br>(respuesta directa) | `requestId` → `logger` (entrada) → `express.json()` → `documentsRouter` → `documentsController.update` → `logger` (callback `finish`). | `documentsController.update` (`400`) | No |

### Preguntas teóricas del Punto 11

* **¿Por qué `notFound` no llama a `next()`?**
  Porque su función es actuar como cierre para cualquier ruta no reconocida enviando directamente la respuesta `404`; si llamara a `next()`, dejaría la petición sin responder.
* **Cuando un controlador llama a `next(err)`, ¿por qué no se ejecuta el `notFound` registrado a continuación?**
  Porque al pasar un argumento a `next(err)`, Express entra en modo de manejo de errores y salta directamente todos los middlewares normales (incluido `notFound`, que solo tiene 2 o 3 parámetros) hasta encontrar el primer middleware con firma de 4 parámetros (`errorHandler`).
* **¿Por qué el manejador de errores necesita cuatro parámetros aunque no use el último?**
  Porque Express inspecciona el número de argumentos declarados en la función (`fn.length === 4`: `(err, req, res, next)`) para distinguir un manejador de errores de un middleware convencional.
* **¿Qué diferencia hay entre una ruta inexistente y un recurso inexistente?**
  Una **ruta inexistente** es una combinación de método HTTP y URL que no está definida en ningún router (la gestiona `notFound`). Un **recurso inexistente** es una ruta válida (por ejemplo, `GET /api/v1/notices/:noticeId`) cuyo identificador no corresponde a ningún elemento almacenado (lo detecta el controlador y lanza `ResourceNotFoundError`).
* **¿Por qué el `logger` utiliza el evento `finish` para registrar el estado de la respuesta?**
  Porque cuando el middleware `logger` se ejecuta al entrar la petición, los routers y controladores aún no se han ejecutado, por lo que todavía no se conoce ni el código de estado final (`200`, `400`, `404`, `500`) ni la duración total del procesamiento.
* **¿Para qué sirve `requestId`? Muestra registros de una misma petición que puedas relacionar mediante él:**
  Sirve para identificar de forma única cada petición HTTP desde que entra al servidor y poder correlacionar todas las líneas de log que genera (tanto el log de error en `errorHandler` como el log de acceso en `logger`).
  *Ejemplo de correlación (sustituir por tu captura real de consola):*
  ```json
  {"requestId":"a1b2c3d4-...","error":"Document with id 'no-existe' not found","stack":"..."}
  {"requestId":"a1b2c3d4-...","method":"GET","path":"/api/v1/admin/documents/no-existe","status":404,"durationMs":2,"timestamp":"..."}
  ```
* **¿Es obligatorio separar router, controlador y servicio para desarrollar con Express? Justifica qué aporta esa separación:**
  No es obligatorio (Express permite escribir toda la lógica dentro de las rutas), pero aporta claridad, mantenimiento y facilidad de pruebas: cada capa tiene una única responsabilidad y el servicio queda completamente desacoplado de Express (sin `req` ni `res`), permitiendo testear la lógica de negocio de forma aislada sin levantar un servidor HTTP.
* **¿Qué ocurre con los avisos creados cuando reinicias el servidor? ¿Por qué?**
  Desaparecen y el listado vuelve a mostrar únicamente los 5 avisos iniciales, porque los datos se almacenan en un array en memoria RAM dentro del proceso de Node.js y no en un sistema de persistencia o base de datos.

---

## Punto 12: Checklist Final Antes de la Entrega

1. Ejecutar `npm run typecheck` y `npm run lint` dentro de `simulacro/` y verificar que terminan sin errores.
2. Comprobar que siguen funcionando todas las rutas de `health`, `documents`, `questions` y `notices` en el puerto `4000`.
3. Verificar que se han retirado todos los fallos temporales de los puntos 9 y 10 (`throw new Error`, orden de `notFound` y `next()` en `logger`).
4. Confirmar que `.env` y `.env.example` contienen `PORT=4000`, `NODE_ENV=development`, `APP_NAME=connectia` y `LOG=ON`, y que `.env` está excluido en `.gitignore`.
5. Verificar que la carpeta de la colección de **Bruno** está guardada dentro de `simulacro/` (por ejemplo, `simulacro/bruno/`), junto con `RESPUESTAS.md` y las evidencias organizadas.