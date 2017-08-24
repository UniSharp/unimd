import Timer from '~/plugins/Timer'

class UniSocket {
  constructor (wsUri) {
    this.events = {}

    this.wsUri = wsUri

    this.connect()
  }

  connect () {
    var events = this.events

    this.socket = new WebSocket(this.wsUri)
    this.socket.onopen = function (ev) {
      console.log('connected')
      // getNote(note_id)
      events['open']()
    }

    var that = this

    this.socket.onclose = function (ev) {
      console.log('Connection lost.')

      new Timer(5)
        .countDown((seconds) => {
          console.log('Retry connection in : ' + seconds + ' seconds')
        })
        .complete(() => {
          that.connect()
          console.log('restarting')
        })
        .start()
    }

    this.socket.onerror = function (ev) {
      console.log(ev)
    }
  }

  emit (eventName, data) {
    data['action'] = eventName
    this.socket.send(JSON.stringify(data))
    console.log('Event emited : ' + eventName)
  }

  on (eventName, callback) {
    this.events[eventName] = callback

    var events = this.events

    this.socket.onmessage = function (ev) {
      var data = JSON.parse(ev.data)
      if (events[data.action] !== undefined) {
        events[data.action](data)
      }
      console.log('message: ' + ev.data)
    }
    console.log('Event received : ' + eventName)
  }
}

export default UniSocket
