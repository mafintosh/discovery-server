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
