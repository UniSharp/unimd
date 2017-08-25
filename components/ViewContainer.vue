<template lang="pug">
  .view-container(v-html="compiledMarkdown")
</template>

<script>
  import markdownModule from 'markdown-it'
  import markdownItHightlight from 'markdown-it-highlightjs'
  let md = markdownModule({
    html: true,
    linkify: true,
    typographer: true
  })

  md.use(markdownItHightlight, {auto: true})

  export default {
    props: ['code'],
    computed: {
      compiledMarkdown () {
        return md.render(this.code)
      }
    }
  }
</script>

<style lang="scss" scoped>
  .view-container {
    padding: 15px;
  }
</style>
