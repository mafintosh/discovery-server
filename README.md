# discovery-server

A tcp/utp server that auto announces itself using [discovery-channel](https://github.com/maxogden/discovery-channel). Basically a server-only version of [discovery-swarm](https://github.com/mafintosh/discovery-swarm)

## Usage

First spin up a server

```js
var createServer = require('discovery-server')

var server = createServer(function (socket) {
  console.log('New connection!')
  socket.write('Hello, World!\n')
  socket.end()
})

server.listen('hello-world-server', 8080, function () {
  console.log('Now listening ...')
})
```

Then using discovery-channel you can connect to it

```js
var dc = require('discovery-channel')()
var net = require('net')

dc.on('peer', function (key, peer) {
  var socket = net.connect(peer.port, peer.host)

  socket.on('data', function (data) {
    process.stdout.write(data)
    socket.on('end', function () {
      process.exit()
    })
  })

  socket.on('error', function () {
    socket.destroy()
  })
})

dc.join('hello-world-server')
```

## API

#### `var server = createServer([discoveryOptions], [onconnection])`

Create a new tcp + utp server. `discoveryOptions` are forwarded to the [discovery-channel](https://github.com/maxogden/discovery-channel) constructor. In addition you can set `{utp: false}` to disable utp and only use tcp

Optionally you can pass a `onconnection` listener

#### `server.listen(key, [port], [onlistening])`

Start listening and announce your ip:port using the given key.

#### `server.close([onclose])`

Completely close down the server.

#### `server.join(key)`

Announce to an addition key after listening. It is also safe to call `.listen` multiple times instead.

#### `server.address()`

Returns an address object after the server has started listening containing the port and local address.

#### `server.leave(key)`

Stop announcing a key.

#### `server.on('connection', connection, info)`

Emitted when a tcp or utp socket connects. The info object looks like this `{type: 'utp' | 'tcp'}` and can be used to figure out what kind of connection you received.

#### `server.on('listening')`

Emitted when the server is fully listening.

#### `server.on('close')`

Emitted when the server is fully closed.

## License

MIT
