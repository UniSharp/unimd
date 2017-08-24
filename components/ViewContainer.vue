<template lang="pug">
  div
    h1.display-4 Hello World
    .view-container(v-html="compiledMarkdown")
</template>

<script>
  var md = require('markdown-it')({
    html: true,
    linkify: true,
    typographer: true
  })

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
