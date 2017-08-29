const wrap = render =>
  function (tokens, index, options, env, self) {
    if (process.browser) {
      const flowchart = require('flowchart.js')
      let token = tokens[index]
      let diagram = null
      console.log(token)
      switch (token.info) {
        case 'flow':
        case 'flowchart':
          diagram = flowchart.parse(token.content)
          break
      }

      if (['flow', 'flowchart'].includes(token.info)) {
        let id = `diagram-${Math.random() * 100}`
        // 這裡是故意異步的唷
        Promise.resolve().then(() => {
          diagram.drawSVG(id)
        })

        token.content = ''
        token.attrJoin('id', id)
      }
    }

    return render.apply(this, arguments)
  }

const flowchartjs = (md, opts) => {
  md.renderer.rules.fence = wrap(md.renderer.rules.fence)
}

export default flowchartjs
