var dc = require('discovery-channel')
var net = require('net')
var utp = require('utp-native')
var events = require('events')
var inherits = require('util').inherits

module.exports = Server

function Server (opts, onconn) {
  if (!(this instanceof Server)) return new Server(opts, onconn)
  events.EventEmitter.call(this)

  if (typeof opts === 'function') {
    onconn = opts
    opts = null
  }

  if (!opts) opts = {}
  if (!opts.socket && opts.utp !== false) opts.socket = utp()

  if (onconn) {
    this.on('connection', onconn)
  }

  var self = this

  this._onlistening = []
  this._actuallyListening = false

  this.listening = false
  this.tcp = net.createServer(onconnection)
  this.utp = opts.socket ? opts.socket.on('connection', onconnection) : null
  this.channel = dc(opts)

  function onconnection (socket) {
    self.emit('connection', socket, {type: this === self.tcp ? 'tcp' : 'utp'})
  }
}

inherits(Server, events.EventEmitter)

Server.prototype.address = function () {
  return this.tcp.address()
}

Server.prototype._whenListening = function (cb) {
  if (this._actuallyListening) cb()
  this._onlistening.push(cb)
}

Server.prototype._listen = function (port) {
  var self = this
  var tcpListening = false

  this.listening = true
  this.tcp.listen(port, ontcplisten)

  function onerror (err) {
    if (tcpListening) self.tcp.close(emit)
    else emit()

    function emit () {
      cleanup()
      self._actuallyListening = false
      self.listening = false
      self.emit('error', err)
      drain(err)
    }
  }

  function ontcplisten () {
    tcpListening = true
    if (self.utp) self.utp.listen(self.tcp.address().port, onutplisten)
    else onutplisten()
  }

  function onutplisten () {
    cleanup()
    self._actuallyListening = true
    self.emit('listening')
    drain()
  }

  function drain (err) {
    while (self._onlistening.length) {
      self._onlistening.shift()(err)
    }
  }

  function cleanup () {
    self.tcp.removeListener('listening', ontcplisten)
    self.tcp.removeListener('error', onerror)
    if (!self.utp) return
    self.utp.removeListener('listening', onutplisten)
    self.utp.removeListener('error', onerror)
  }
}

Server.prototype.close = function (onclose) {
  if (!this.listening) return process.nextTick(onclose || noop)

  var self = this

  if (onclose) this.once('close', onclose)

  this._whenListening(function (err) {
    if (err) return

    var missing = self.utp ? 2 : 1

    if (self.utp) self.utp.close(onclose)
    self.tcp.close(onclose)

    function onclose () {
      if (--missing) return

      self.channel.destroy(function (err) {
        if (err) self.emit('error', err)
        self.emit('close')
      })
    }
  })
}

Server.prototype.leave = function (key) {
  this.channel.leave(key)
}

Server.prototype.join = function (key) {
  this.channel.join(key, this.address().port)
}

Server.prototype.listen = function (key, port, onlistening) {
  if (typeof port === 'function') return this.listen(key, 0, port)
  if (!this.listening) this._listen(port || 0)

  var self = this
  this._whenListening(function (err) {
    if (err) return onlistening(err)
    self.join(key)
    onlistening()
  })
}

function noop () {}
