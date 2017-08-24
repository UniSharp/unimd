class Timer {
  constructor (seconds) {
    this.seconds = seconds
    this.countDownCallback = () => {}
    this.completeCallback = () => {}
  }

  countDown (callback) {
    this.countDownCallback = callback
    return this
  }

  complete (callback) {
    this.completeCallback = callback
    return this
  }

  start () {
    var seconds = this.seconds
    var that = this

    that.countDownCallback(seconds)
    seconds--

    var counter = setInterval(function () {
      if (seconds > 0) {
        that.countDownCallback(seconds)
        seconds--
      }
    }, 1000)

    setTimeout(function () {
      clearInterval(counter)
      that.completeCallback()
    }, 1000 * (seconds + 1))
  }
}

export default Timer
