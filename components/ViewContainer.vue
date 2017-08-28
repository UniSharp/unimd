<template lang="pug">
  .view-container
    .markdown-toc(v-html="tocHtml", v-if="!isHidden")
    .markdown-html(v-html="compiledMarkdown")
</template>

<script>
  import markdownModule from 'markdown-it'
  import markdownItHightlight from 'markdown-it-highlightjs'
  import markdownItTocAndAnchor from 'markdown-it-toc-and-anchor'
  let md = markdownModule({
    html: true,
    linkify: true,
    typographer: true
  })

  md.use(markdownItHightlight, {auto: true})
  md.use(markdownItTocAndAnchor, {
    tocClassName: 'markdown-toc-list',
    anchorLink: false,
    anchorLinkSymbol: '',
    tocFirstLevel: 1,
    tocLastLevel: 2
  })

  export default {
    props: ['source', 'isHidden'],
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
  .view-container{
    .markdown-toc{
      position: fixed;
      right: 0;
      padding: 20px;
      background-color: white;
    }
    .markdown-html{
      padding: 15px;
    }
  }
</style>
