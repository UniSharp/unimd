const wrap = render =>
  function (...args) {
    if (process.browser) {
      const flowchart = require('flowchart.js')
      let token = args[0][0]
      let diagram = null
      switch (token.info) {
        case 'flow':
        case 'flowchart':
          diagram = flowchart.parse(token.content)
          break
      }

      let id = `diagram-${Math.random() * 100}`
      // 這裡是故意異步的唷
      Promise.resolve().then(() => {
        diagram.drawSVG(id)
      })
      return `<div id='${id}'></div>`
    }

    return render.apply(this, args)
  }

const flowchartjs = (md, opts) => {
  // opts = Object.assign({}, highlightjs.defaults, opts)
  md.renderer.rules.fence = wrap(md.renderer.rules.fence)
}

export default flowchartjs
