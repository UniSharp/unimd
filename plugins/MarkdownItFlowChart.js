const wrap = render =>
  function (...args) {
    if (process.browser) {
      const flowchart = require('flowchart.js')
      let token = args[0][0]
      if (token.info === 'flow' || token.info === 'flowchart') {
        let id = `flowchart-${Math.random() * 100}`
        Promise.resolve().then(() => {
          flowchart.parse(token.content).drawSVG(id)
        })
        return `<div id='${id}'></div>`
      }
    }

    return render.apply(this, args)
  }

const flowchartjs = (md, opts) => {
  // opts = Object.assign({}, highlightjs.defaults, opts)
  md.renderer.rules.fence = wrap(md.renderer.rules.fence)
}

export default flowchartjs
