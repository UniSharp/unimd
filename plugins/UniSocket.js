import Timer from '~/plugins/Timer'
import debugModule from 'debug'
let debug = debugModule('UniSocket')

class UniSocket {
  constructor (wsUri) {
    this.events = {}

    this.wsUri = wsUri

    this.connect()
  }

  connect () {
    let events = this.events
    let that = this

    this.socket = new WebSocket(this.wsUri)
    this.socket.onopen = function (ev) {
      debug('connected')
      // getNote(note_id)
      events['open']()
    }

    this.socket.onclose = function (ev) {
      debug('Connection lost.')

      new Timer(5)
        .countDown((seconds) => {
          console.log('Retry connection in : ' + seconds + ' seconds')
        })
        .complete(() => {
          console.log('restarting')
          that.connect()
        })
        .start()
    }

    this.socket.onerror = function (ev) {
      debug(ev)
    }
  }

  emit (eventName, data) {
    data['action'] = eventName
    this.socket.send(JSON.stringify(data))
    console.log('Event emited : ' + eventName)
  }

  on (eventName, callback) {
    this.events[eventName] = callback

    let events = this.events

    this.socket.onmessage = function (ev) {
      let data = JSON.parse(ev.data)
      if (events[data.action] !== undefined) {
        events[data.action](data)
      }
      debug('message: ' + ev.data)
    }
    debug('Event received : ' + eventName)
  }
}

export default UniSocket
