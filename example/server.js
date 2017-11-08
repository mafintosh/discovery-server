var createServer = require('../')

var server = createServer(function (socket) {
  console.log('New connection!')
  socket.write('Hello, World!\n')
  socket.end()
})

server.listen('hello-world-server', 8080, function () {
  console.log('Now listening ...')
})
