# Bozz

Here is your new microservices' boss(zz) !

It allows you to build a coherent ecosystem based on two main principles :

  + Key based requests
  + Pattern based events

## Requests

Concept : Someone requests something, another one reacts and send a response.

### Requests example

A file `index.js` :
```javascript
const ms = require(`bozz`).createMs();

ms.onRequest(`users.getOne`, ({ id }) => ({
  id,
  firstname : `John`,
  lastname  : `Doe`,
}));

ms.init()
.then(() => ms.request(`users.getOne`, { id : 123 }))
.then(console.log);
```

And in console when running `node index.js` :
```javascript
{ id: 123, firstname: 'John', lastname: 'Doe' }
```

**To simple ? Ok, let's try to split code in two differents services :**

`service1.js` :
```javascript
const ms = require(`bozz`).createMs();

ms.onRequest(`users.getOne`, ({ id }) => ({
  id,
  firstname : `John`,
  lastname  : `Doe`,
}));

ms.init();
```

`service2.js` :
```javascript
const ms = require(`bozz`).createMs();

ms.init()
.then(() => ms.request(`users.getOne`, { id : 123 }))
.then(console.log);
```

Run in one console `node service1.js` and in another `node service2.js`, look at the service2's console :
```javascript
{ id: 123, firstname: 'John', lastname: 'Doe' }
```

## Events

Concept : Someone broadcasts an event and 0 to x others reacts but no one can answer.

### Events example

`service1.js` :
```javascript
const ms = require(`bozz`).createMs();

ms.onEvent(`user:created`, console.log);
ms.onEvent(`user:*`, console.log);

ms.init();
```

`service2.js` :
```javascript
const ms = require(`bozz`).createMs();

ms.onEvent(`user:created`, console.log);

ms.init()
.then(() => ms.broadcast(`user:created`, { id : 123 }));
```

Run in one console `node service1.js` and in another `node service2.js`.

Look at the service1's console :
```javascript
user:created { id : 123 }
user:created { id : 123 }
```

Look at the service2's console :
```javascript
user:created { id : 123 }
```

## config

`config` is an object used in `bozz.createMs(config)`.

### name

Default value = `package.json => name`

With this param you can change the name your service will be see by Bozz.

### namespace

Default value = `default`

With this param you can have multiple bozz applications running on the same server without conflicts.

## Available plugins

[bozz-load-dir](https://www.npmjs.com/package/bozz-load-dir) : Automatically load a directory of bozz files
