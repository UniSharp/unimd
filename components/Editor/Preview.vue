<template lang="pug">
  .preview
    .markdown-toc(:class="mode", v-html="tocHtml")
    .markdown-html(v-html="compiledMarkdown")
</template>

<script>
  import markdownModule from 'markdown-it'
  import markdownItHightlight from 'markdown-it-highlightjs'
  import markdownItTocAndAnchor from 'markdown-it-toc-and-anchor'
  import markdownItFlowChart from '~/plugins/MarkdownItFlowChart'
  let md = markdownModule({
    html: true,
    linkify: true,
    typographer: true
  })

  // sequence.Diagram()
  md.use(markdownItHightlight, {auto: true})
    .use(markdownItTocAndAnchor, {
      tocClassName: 'markdown-toc-list',
      anchorLink: false,
      anchorLinkSymbol: '',
      tocFirstLevel: 1,
      tocLastLevel: 2
    })
    .use(markdownItFlowChart)

  export default {
    props: ['source', 'mode'],
    data () {
      return {
        tocHtml: ''
      }
    },
    computed: {
      compiledMarkdown () {
        md.set({
          tocCallback: (tocMarkdown, tocArray, tocHtml) => {
            this.$data.tocHtml = tocHtml
          }
        })
        return md.render(this.source)
      }
    }
  }
</script>

<style lang="scss" scoped>
  .preview {
    .markdown-toc {
      display: none;
    }

    .markdown-toc.preview {
      display: block;
      position: fixed;
      right: 0;
      padding: 20px;
      background-color: white;
    }

    .markdown-html {
      padding: 15px;
    }
  }
</style>

<style lang="scss">
  .preview {
    height: 100%;
    overflow: auto;

    .markdown-html {
      width: 800px;
      margin: auto;
      padding: 0 1rem;

      pre {
        padding: .5rem;
        border-radius: 3px;
        background: #f7f7f7;

        .hljs {
          background: transparent !important;
        }
      }
    }
  }
</style>