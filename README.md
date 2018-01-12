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
```

## Available plugins

[bozz-load-dir](https://www.npmjs.com/package/bozz-load-dir) : Automatically load a directory of bozz files
