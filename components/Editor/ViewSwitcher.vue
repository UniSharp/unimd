<template lang="pug">
  .btn-group
    button.btn.btn-outline-secondary(type="button", v-for="mode in modes", :key="mode.name", @click="switchView(mode.name)")
      i.fa(:class="mode.icon")
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
            name: 'preview',
            icon: 'fa-eye'
          },
          {
            name: 'both',
            icon: 'fa-columns'
          },
          {
            name: 'edit',
            icon: 'fa-pencil'
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
