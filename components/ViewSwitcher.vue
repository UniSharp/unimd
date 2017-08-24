<template lang="pug">
  Button-group
    Button(v-for="mode in modes", :key="mode.name", type="ghost", :icon="mode.icon", @click="switchView(mode.name)", size="large")
</template>

<script>
  export default {
    props: {
      value: String
    },
    data () {
      return {
        modes: [
          {
            name: 'view',
            icon: 'eye'
          },
          {
            name: 'preview',
            icon: 'ios-book-outline'
          },
          {
            name: 'edit',
            icon: 'edit'
          }
        ]
      }
    },
    methods: {
      switchView (newModeName) {
        this.$emit('change').$emit('input', newModeName)
      }
    }
  }
</script>
