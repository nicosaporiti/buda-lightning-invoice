---
title: "Recibir pagos web en Bitcoin con LN"
date: "2021-11-29"
author: "Nicolás Saporiti"
image: "https://i.imgur.com/ixihN2j.jpg"
resume: "Te explico como implementar un sistema sencillo para recibir pagos web en Bitcoin utilizando lightning network."
---
# Recibir pagos web en Bitcoin con Lightning Network

Antes de comenzar es importante saber que es Lightning Network y por qué día a día crece en adopción.

La **red Lightning**, en inglés **Lightning Network** (LN), es una [red](https://es.wikipedia.org/wiki/Red_de_computadoras) [entre pares](https://es.wikipedia.org/wiki/P2P) (P2P) concebida como sistema de segunda capa para [Bitcoin](https://es.wikipedia.org/wiki/Bitcoin) (BTC) que permite hacer micropagos de forma casi instantánea. 

Su diseño original fue publicado en enero de 2016 por Joseph Poon y Thaddeus Dryja.[2](https://es.wikipedia.org/wiki/Lightning_Network#cite_note-lightning-2)

Además de permitir transacciones casi inmediatas, LN posee otras importantes ventajas como:

- Comisiones casi cero.
- Es descentralizado operando entre nodos conectados a través de canales.
- No admite censura, cualquier persona puede poner en marcha su propio nodo. Ver [www.getumbrel.com](https://getumbrel.com/)
- El requerimiento de hardware para instalar un nodo es de bajo costo, inclusive la mayoría utilizan un simple raspberry o algún computador en desuso con sistema operativo linux.

En este post no voy a abordar cómo instalar un nodo y la complejidad de su gestión. Pero lo que si vamos a ver, es como podemos implementar un sistema de pago en LN utilizando el nodo de [www.buda.com](https://www.buda.com/)

Algunos exchanges ya han implementado soluciones LN para brindarle servicios a sus clientes, y es probable que en el futuro inmediato sea el común. Buda ya hace tiempo dispone de su propio nodo y lo ha puesto al servicio de sus clientes, y lo mejor de todo es que tienen una [API](https://api.buda.com/) con llamadas privadas para que podamos crear nuestros propios desarrollos.

## Requisitos para implementar pagos web con LN

Si no eres desarrollador, no creo que puedas implementar el sistema. De todos modos si te interesa, lees y aprendes a programar, en un tiempo podrás hacerlo.

Lo primero que necesitamos es tener una cuenta en BUDA y habilitar nuestras API Key y API Secret.

> Nota importante: no debes compartir con nadie ni exponer tus llaves privadas.

Una vez que disponemos de nuestras llaves privadas te recomiendo que comiences a jugar haciendo llamadas a la API y verificar que todo funcione. Para facilitarlo existe un repositorio que maneja las promesas de la API. Inclusive yo colaboré con un PR (el primero de mi vida! 😀) agregando la función requerida para generar un invoice LN. El [repo](https://github.com/ajunge/buda-promise) .

Una vez que te familiarices con la API y leas la documentación, te voy a dar los pasos para generar un formulario de pago web con el que tus clientes / amigos pueden pagarte con bitcoin.

### Creando nuestro Backend

> Te recomiendo que todos los llamados que hagas a la API corran del lado del servidor, ya que si lo haces del lado del cliente, tus llaves quedan expuestas.

En mi caso cree el backend en Node.js con Express y su objetivo es muy simple: resuelve dos endpoints para que uno genere el invoice y el otro verifique que la transferencia fue realizada. Acá puedes ver el [repo](https://github.com/nicosaporiti/buda-lightning-invoice)

Para comenzar clonaremos el repositorio:

```
$ git clone https://github.com/nicosaporiti/buda-lightning-invoice.git
```

Instalaremos las dependencias

```
$ nmp install
```

Crearemos un archivo .env en la raíz del proyecto e ingresaremos nuestras llaves privadas :

```
PORT=3001
BUDA_API_KEY='tu_buda_api_key'
BUDA_API_SECRET='tu_buda_api_secret'
```

Ejecutaremos el proyecto

```
npm run dev
```

En modo desarrollo utilizaremos nodemon, es recomendable que lo instales a nivel global.

Instalado y ejecutado nuestro back, utilizaremos [Postman](https://www.postman.com/) para probar nuestras rutas.

http://localhost:3001/newinvoice

La función para obtener el invoice recibe dos parámetros, el monto en satoshis (unidad mínima de bitcoin) y un mensaje en formato string que se incluye en la transferencia. Al generar el invoice recibimos como respuesta la dirección del invoice que luego procesaremos en nuestro frontend para generar el QR con el cuál el usuario podrá escanearlo y realizar la tansferencia.

Es un llamado del tipo POST y se envía en json, ejemplo:

```
{
    "amount": 5000,
    "msg": "Cuota del asado"
}
```

Si la respuesta es correcta, recibimos la siguiente respuesta:

```
{
    "invoice": "lnbc50...",
    "amount": 5000,
    "msg": "Cuota del asado"
}
```

Los controladores de las rutas se encuentran validados con express-validator.

Luego para cerrar el ciclo del proceso de pago, es importante que informemos al cliente que la transferencia fue un éxito. Para ello vamos a verificar que el invoice se encuentra pagado y para ello utlizamos la ruta http://localhost:3001/status donde enviamos un llamado tipo POST con el invoice en json como parámetro

```
{
    "invoice": "lnbc50...",
}
```

Si todo fue correcto, tendremos la siguiente respuesta:

```
{
    "invoice": "lnbc50...",
    "status": false
}
```

En este caso el status para el invoice es **<u>false</u>** ya que no se encuentra pago, con lo que ya tenemos todo lo necesario para crear nuestro frontend e implementar el formulario de pago.

Una vez que verifiquemos que el backend funciona, puedes subirlo a Heroku.

Como nota, el servidor en Express  utiliza CORS ya que es requerido por la API de Buda. No realicé test, pero si quieres aportar con ello, agradecido.

### Creando nuestro Frontend

Para el front utilicé create-react-app y lo primero que debes hacer es clonar el repo:

```
$ git clone https://github.com/nicosaporiti/ln-form.git
```

Luego instalar todas las dependencias:

> En nuestro frontend no debemos guardar ninguna llave privada ya que quedan expuestas.

En este caso, ya tiene la conectividad con nuestro backend pero debemos crear el archivo .env para indicar los endpoint de nuestro servidor:

```
REACT_APP_API_URL_INVOICE='https://tuservidor.com/newinvoice'
REACT_APP_API_URL_STATUS='https://tuservidor.com/status'
```

 Ya resuelto todo, debes ejecutar npm run start y podrás ver el formulario en tu localhost y realizar pruebas. Para subir el proyecto, puedes utilizar [Netlify](https://www.netlify.com/) y subir la carpeta build que generas con el comando npm run build.

Aquí [puedes ver el proyecto terminado y enviarme unos sat de prueba](https://ln-form.netlify.app/)

![LN-Form](https://i.imgur.com/c5xyiIF.png)

## Conclusiones

Como pudimos aprender Lightning Network es una tecnología que rápidamente nos permite implementar un sistema de pago sin censura y con funcionalidades completas. Quiénes tengan experiencia en implementar sistemas de pago sabrán lo complicado que es desde validar, proteger datos, etc. Inclusive antes de implementar un sistema de pago tradicional, se nos pide que llenemos un interminable papeleo.

 En el caso de LN todo queda resuelto de forma simple, por ejemplo el cliente mantiene sus llaves privadas y aprueba las transacciones. Del lado del servidor (nodo) contamos con una poderosa API para gestionar y podemos concentrarnos en desarrollar una experiencia de pago increible. Lo mejor de todo es que podemos recibir pagos a nivel global y al instante. Sin duda, los sistemas de pago tradicional con la mayor adopción de LN quedarán en el pasado.

Aclaro que **<u>no todo en LN es una maravilla</u>**. Es una tecnología muy reciente y en desarrollo, por lo que existen fallos. Principlamente hay fallos de liquidez en los nodos ya que  se debe inmovilizar bitcoin. Un buen nodo debe tener muchos canales y a mayor cantidad de canales, más capital se requiere inmovilizar.

Los pagos en LN están recomendados para montos pequeños, ya que por el problema de liquidez antes comentado pueden involucrar elevadas comisiones que cobran los nodos e incluso, puede que las transacciones fallen.

Pero los pro son más que los contra y ya podemos palpar lo que significa la libertad financiera de bitcoin. Otro pro importante que tiene esta tecnología es que al ser pagos pequeños, la volatilidad en el precio del Bitcoin no afecta tanto, inclusive se podría generar un mercado secundario para liquidar los pagos una vez que los recibimos y en cuestión de segundos podrías dejar el pago convertido a la moneda fiat que prefieras.

En este caso implementamos un sistema utilizando el nodo de un exchange, pero perfectamente podemos gestionar nuestro propio nodo, ***<u>con lo que lograremos completa independencia y es algo que veremos en otro post</u>***.

