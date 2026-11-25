# Respuestas — Simulacro de examen de la UT3 (Primera parte)

## 1. Prepara el proyecto

* **Cómo se instala y arranca el proyecto:** Se instala ejecutando `npm install` dentro de la carpeta `simulacro` para descargar las dependencias de `package.json`. Para arrancarlo en desarrollo con recarga automática se ejecuta `npm run dev` (que usa `tsx watch src/server.ts`), o `npm run build` seguido de `npm start` para compilar a JavaScript y ejecutar desde `dist/`.
* **Dónde se configura el puerto y cómo llega hasta el arranque:** El puerto se define en el archivo `.env` mediante `PORT=4000`. En `src/config/env.ts`, `process.loadEnvFile()` carga las variables de entorno en `process.env`, se lee `Number(process.env.PORT ?? 3000)` y se exporta en el objeto `env`. Finalmente, `src/server.ts` importa `env` y pasa `env.PORT` a `app.listen(env.PORT, ...)` para abrir el servidor en ese puerto.
* **Por qué se sube a GitHub `.env.example` y se excluye `.env`:** `.env` contiene valores específicos del entorno local y posibles datos sensibles (credenciales, claves API, puertos propios), por lo que se excluye en `.gitignore` por seguridad y para evitar conflictos entre compañeros. `.env.example` se sube al repositorio como plantilla sin secretos para documentar qué variables de entorno necesita la aplicación para arrancar.

---

## 3. Implementa un nuevo tipo de error

* **Dónde se crea el error:** Se instancia en `src/controllers/documentsController.ts` dentro de la función `getById`. Cuando `documentsService.getById(documentId)` devuelve `undefined`, se lanza `throw new ResourceNotFoundError(404, ...)` y el bloque `catch` lo envía a `next(err)`.
* **Dónde se convierte en una respuesta HTTP:** Express salta al middleware centralizado `errorHandler` (`src/middlewares/errorHandler.ts`). Allí, la condición `if (err instanceof ResourceNotFoundError)` captura el error y ejecuta `res.status(err.statusCode).json({ error: err.code, message: err.message, resourceId: err.resourceId })`, transformándolo en la respuesta HTTP 404 JSON.

---

## 4. Responde directamente desde un controlador

* **Diferencia entre este recorrido y el error centralizado:**
  * **Respuesta directa desde el controlador:** El controlador valida el campo `title`, envía directamente `res.status(400).json(...)` y corta la ejecución con `return`. No se instancia ningún `Error`, no se llama a `next(err)` y no interviene `errorHandler` (tampoco se escribe registro de error en `console.error`).
  * **Error centralizado (`next(err)`):** El controlador lanza una excepción (`AppError` o `ResourceNotFoundError`), el `catch` la propaga mediante `next(err)` y Express delega tanto el log del error como el formateo de la respuesta HTTP al middleware `errorHandler`.

---

## 5. Configura el logger mediante una variable de entorno

* **Por qué deshabilitar el logger no impide que la petición llegue a las rutas:** En Express, la cadena de ejecución avanza únicamente cuando cada middleware llama a `next()`. Aunque `env.LOG === 'OFF'` evite suscribirse al evento `res.on('finish', ...)` para imprimir logs, el middleware `logger` ejecuta `next()` antes de retornar, pasando el control a `express.json()` y a los routers.