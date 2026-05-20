# Buda Lightning Invoice

Backend Node.js/Express para crear invoices de Bitcoin Lightning Network con la API de Buda.com, verificar si fueron pagadas y exponer endpoints compatibles con LNURL-pay / Lightning Address.

El servicio funciona como un wrapper server-side: las credenciales privadas de Buda quedan en el servidor y los clientes consumen endpoints HTTP simples.

## Estado del proyecto

- API Express con CORS habilitado y soporte JSON.
- Integracion privada con Buda.com mediante `buda-promise/buda.js`.
- Creacion de invoices Lightning BOLT11.
- Verificacion de pagos buscando deposits `confirmed`.
- Endpoints LNURL-pay para Lightning Address.
- Tests unitarios e integracion con Jest y Supertest.
- Configuracion de despliegue en Fly.io.

## Requisitos

- Node.js 20 recomendado. El `Dockerfile` usa Node `20.18.0`.
- npm.
- Cuenta en Buda.com con `BUDA_API_KEY` y `BUDA_API_SECRET`.
- `nodemon` disponible para `npm run dev`. Si no lo tienes, puedes usar `npm start`.

## Configuracion

Crea un archivo `.env` en la raiz del proyecto:

```env
PORT=3001
BUDA_API_KEY=tu_buda_api_key
BUDA_API_SECRET=tu_buda_api_secret
DOMAIN=tu-dominio.com
```

`PORT` es opcional. Si no se define, la aplicacion escucha en `8080`, que coincide con `fly.toml`.

`DOMAIN` tambien es opcional. Se usa para construir el callback de Lightning Address en `/.well-known/lnurlp/:username`. Si no se define, se usa el host de la request.

## Instalacion y uso local

```bash
npm install
npm run dev
```

Con la configuracion anterior, la API queda disponible en:

```text
http://localhost:3001
```

Para correr sin hot reload:

```bash
npm start
```

## Scripts

| Comando | Descripcion |
| --- | --- |
| `npm run dev` | Inicia el servidor con `nodemon index.js`. |
| `npm start` | Inicia el servidor con `node index.js`. |
| `npm test` | Ejecuta la suite de Jest. |
| `npm run test:coverage` | Ejecuta tests y genera coverage. |
| `npm run test:watch` | Ejecuta Jest en modo watch. |

## Endpoints

### `POST /newinvoice`

Crea una invoice Lightning en Buda.

Request:

```json
{
  "amount": 5000,
  "msg": "Cuota del asado"
}
```

- `amount`: monto en satoshis. Debe ser un entero mayor o igual a `1`.
- `msg`: descripcion o memo de la invoice. No puede estar vacio.

Respuesta exitosa:

```json
{
  "invoice": "lnbc50...",
  "amount": 5000,
  "msg": "Cuota del asado"
}
```

### `POST /status`

Verifica si una invoice fue pagada y confirmada.

Request:

```json
{
  "invoice": "lnbc50..."
}
```

Respuesta:

```json
{
  "invoice": "lnbc50...",
  "status": false
}
```

`status` es `true` solo cuando la invoice existe entre los deposits BTC de Buda y su estado es `confirmed`.

### `GET /.well-known/lnurlp/:username`

Endpoint de metadata para Lightning Address / LNURL-pay.

Ejemplo:

```text
GET /.well-known/lnurlp/nicolas
```

Respuesta:

```json
{
  "callback": "https://tu-dominio.com/callback",
  "maxSendable": 100000000,
  "minSendable": 1000,
  "metadata": "[[\"text/plain\",\"Pago Lightning a nicolas\"]]",
  "tag": "payRequest",
  "commentAllowed": 140
}
```

Los montos de LNURL-pay se expresan en millisatoshis.

### `GET /callback`

Callback LNURL-pay. Recibe un monto en millisatoshis, lo convierte a satoshis y crea una invoice Lightning.

Query params:

- `amount`: requerido, entero mayor o igual a `1000` millisatoshis.
- `comment`: opcional, se usa como memo de la invoice.

Ejemplo:

```text
GET /callback?amount=5000000&comment=Gracias
```

Respuesta:

```json
{
  "pr": "lnbc50...",
  "successAction": {
    "tag": "message",
    "message": "Gracias por tu pago"
  },
  "routes": []
}
```

Si `comment` no se envia, el memo por defecto es `Pago desde Lightning Address`.

## Errores de validacion

Cuando una request no cumple las validaciones de `express-validator`, la API responde con `400`:

```json
{
  "ok": false,
  "errors": {
    "amount": {
      "msg": "Ingrese un número entero mayor a 1"
    }
  }
}
```

Cuando falla una llamada a Buda u otra operacion de negocio, la respuesta tambien usa `400`:

```json
{
  "ok": false,
  "error": "Buda error ..."
}
```

## Flujo interno

```text
HTTP Request
  -> Express route
  -> express-validator + fieldsValidation
  -> controller
  -> helper
  -> buda-promise/buda.js
  -> Buda.com API
  -> HTTP Response
```

Archivos principales:

- `index.js`: configura Express, CORS, JSON body parser y puerto.
- `routes/buda.js`: define rutas y reglas de validacion.
- `controllers/buda.js`: maneja las respuestas HTTP y flujo de negocio.
- `helpers/getInvoice.js`: crea invoices Lightning en Buda.
- `helpers/getPaymentConfirmation.js`: verifica deposits confirmados.
- `middlewares/fields-validator.js`: normaliza errores de validacion.
- `buda-promise/buda.js`: wrapper local de la API de Buda con autenticacion HMAC-SHA384.

## Autenticacion con Buda

Los endpoints publicos de este servicio no requieren autenticacion propia. Las credenciales de Buda se usan unicamente desde el backend.

El wrapper `buda-promise/buda.js` firma las llamadas privadas con HMAC-SHA384 y envia:

```text
X-SBTC-APIKEY
X-SBTC-NONCE
X-SBTC-SIGNATURE
```

Nunca expongas `BUDA_API_KEY` ni `BUDA_API_SECRET` en un frontend.

## Tests

La suite actual cubre:

- Helpers de creacion y verificacion de invoices.
- Controladores.
- Middleware de validacion.
- Integracion de rutas con Supertest.

Ejecutar tests:

```bash
npm test
```

Ejecutar coverage:

```bash
npm run test:coverage
```

`jest.config.js` define umbrales globales minimos:

- branches: `60`
- functions: `70`
- lines: `70`
- statements: `70`

## Despliegue

El repo incluye configuracion para Fly.io:

- App: `budaln`
- Region primaria: `gru`
- Puerto interno: `8080`
- VM: `1gb`, CPU shared

Configurar secretos:

```bash
fly secrets set BUDA_API_KEY=tu_buda_api_key
fly secrets set BUDA_API_SECRET=tu_buda_api_secret
fly secrets set DOMAIN=tu-dominio.com
```

El `Dockerfile` instala dependencias con `npm ci`, copia la aplicacion y ejecuta:

```bash
npm run start
```

## Notas de seguridad

- CORS esta habilitado para permitir consumo desde frontends externos.
- No hay rate limiting propio en la API.
- La validacion de inputs ocurre en las rutas antes de llegar a los controladores.
- Las credenciales privadas deben vivir solo en variables de entorno del servidor.

## Recursos

- Documentacion detallada de endpoints: `API.md`
- Wrapper local de Buda: `buda-promise/`
- Frontend historico de referencia: https://github.com/nicosaporiti/ln-form
