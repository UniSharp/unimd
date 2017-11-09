<template lang="pug">
  .key-binding
    b-dropdown(variant="link", size="sm", :dropup="true")
      template(slot="button-content") {{ value }}
      b-dropdown-item(v-for="mode in modes", :key="mode", @click="switchKeyMap(mode)") {{ mode }}
</template>

<script>
  export default {
    props: {
      value: String
    },
    data () {
      return {
        modes: ['sublime', 'emacs', 'vim', 'default']
      }
    },
    methods: {
      switchKeyMap (mode) {
        console.log(mode)
        // this.$emit('input', mode)
        // this.$emit('change')
      }
    }
  }
</script>

<style lang="scss">
  .key-binding button {
    padding: 0;
  }
</style>
