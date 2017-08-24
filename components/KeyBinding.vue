<template lang="pug">
  .config-item
    Dropdown(trigger="click", placement="top", @on-click="switchKeyMap")
      Button(type="text") {{ value }}
      Dropdown-menu(slot="list")
        Dropdown-item(v-for="mode in modes", :key="mode", :name="mode") {{ mode }}
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
      switchKeyMap (newModeName) {
        this.$emit('input', newModeName)
        this.$emit('change')
      }
    }
  }
</script>

<style scoped>
  button{
    color: white;
  }
</style>
