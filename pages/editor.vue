<template lang="pug">
  .wrapper
    nav.navbar.navbar-expand.navbar-fix.navbar-light.bg-light
      a.navbar-brand(href="#")
        i.fa.fa-file-text.mr-2
        | UniMD
      ul.navbar-nav.mr-auto
        li.nav-item
          view-switcher(v-model="viewMode", @change="showMode")
        li.nav-item
          button.btn.bg-transparent(type="text")
            i.fa.fa-camera
        li.nav-item
          button.btn.bg-transparent(type="text")
            i.fa.fa-question-circle
        //- Upload(
        //-   class="upload-image",
        //-   :headers="uploadImageHeader",
        //-   action="https://api.imgur.com/3/image",
        //-   name="image",
        //-   :show-upload-list="false",
        //-   :before-upload="handleBeforeUpload",
        //-   :on-success="handleUploadSuccess",
        //-   clearFiles
        //- )
        //-   Button(type="text", icon="camera")
      ul.navbar-nav
        li.nav-item
          a.nav-link(href="#")
            i.fa.fa-plus.mr-2
            | 新增
        li.nav-item
          a.nav-link(href="#")
            i.fa.fa-plus.mr-2
            | 發表
        b-nav-item-dropdown(text="選單")
          b-dropdown-item(href="#") 選單項目1
          b-dropdown-item(href="#") 選單項目2
          b-dropdown-item(href="#") 選單項目3
          b-dropdown-item(href="#") 選單項目4
          b-dropdown-item(href="#") 選單項目5
        li.nav-item.ml-2.d-flex.align-items-center
          span.badge.badge-primary.m-0
            i.fa.fa-users.mr-2
            | 1 ONLINE
    main
      .editor-wrapper(v-if="viewMode !== 'preview'")
        .editor
          codemirror(@viewportChange="onEditorScroll", v-model="code", :options="editorOptions", ref="textEditor", @cursorActivity="showInfo")
        .editor-config.px-2
          span.mr-auto Line {{ current_line }}, Column {{ current_column }} -- {{ lines_count }} Lines
          i.fa.fa-check.fa-fw
          i.fa.fa-sun-o.fa-fw
          indent-switcher(v-model="indentMode")
          key-binding(v-model="keyMode")
          i.fa.fa-wrench.fa-fw
          span Length: {{ chars_count }}
      .preview-wrapper(v-if="viewMode !== 'edit'")
        preview(@scroll.native="onPreviewScroll", :source="code", :mode="viewMode", ref="preview")

</template>

<script>
  import Vue from 'vue'
  import ViewSwitcher from '~/components/Editor/ViewSwitcher'
  import IndentSwitcher from '~/components/Editor/IndentSwitcher'
  import KeyBinding from '~/components/Editor/KeyBinding'
  import Preview from '~/components/Editor/Preview'
  import debugModule from 'debug'
  import config from '~/config.json'
  import UniSocket from '~/plugins/UniSocket.js'
  import DiffMatchPatch from 'diff-match-patch'
  let dmp = new DiffMatchPatch()
  let debug = debugModule('pages.editor')

  export default {
    components: {
      ViewSwitcher, IndentSwitcher, KeyBinding, Preview
    },
    mounted () {
      Vue.nextTick(() => this.connectSocket())
    },
    methods: {
      onEditorScroll (e) {
        if (e.doc && this.$refs.preview) {
          this.$refs.preview.$el.scrollTop = e.doc.scrollTop
        }
      },
      onPreviewScroll (e) {
        window.CodeMirror.scrollTop = e.target.scrollTop
        this.$refs.textEditor.editor.scrollTo(null, e.target.scrollTop)
      },
      patchFromText (args) {
        return dmp.patch_fromText(args)
      },
      patchToText (args) {
        return dmp.patch_toText(args)
      },
      patchMake (...args) {
        return dmp.patch_make(...args)
      },
      patchApply (...args) {
        return dmp.patch_apply(...args)
      },
      showMode () {
        debug('Current mode : ' + this.viewMode)
      },
      showInfo (editor) {
        this.current_line = this.$refs.textEditor.editor.getCursor().line + 1
        this.current_column = this.$refs.textEditor.editor.getCursor().ch + 1
      },
      handleBeforeUpload () {
        let doc = this.$refs.textEditor.editor.doc
        let cursor = this.$refs.textEditor.editor.getCursor()
        let from = {
          line: cursor.line,
          ch: cursor.ch
        }
        doc.replaceRange(`${this.uploadMessage}`, from)
      },
      handleUploadSuccess (response) {
        let doc = this.$refs.textEditor.editor.doc
        let cursor = this.$refs.textEditor.editor.getCursor()
        let from = {
          line: cursor.line,
          ch: cursor.ch - this.uploadMessage.length
        }
        let to = {
          line: cursor.line,
          ch: cursor.ch
        }
        doc.replaceRange(`![](${response.data.link})\n`, from, to)
      },
      replaceRange (diff) {
        this.$refs.textEditor.editor.replaceRange(diff.text, diff.from, diff.to)
      },
      connectSocket () {
        let editor = this.$refs.textEditor.editor
        let that = this

        this.socket = new UniSocket(config.websocket.endPoint)
        // console.log(this.socket)
        this.socket.on('open', () => {
          that.getNote(that.noteId)
        })

        editor.on('change', function (editor, diff) {
          if (diff.origin && (diff.origin !== 'setValue')) {
            that.socket.emit('changeNote', { message: diff })
            let newDiff = that.patchToText(that.patchMake(that.note, editor.getDoc().getValue()))
            that.diffSend(newDiff)
          }
        })
        this.socket.on('changeNote', (data) => {
          this.replaceRange(data.message)
        })
        this.socket.on('getNote', (data) => {
          let doc = this.$refs.textEditor.editor.getDoc()
          if (data.message !== null) {
            this.note = data.message
            doc.setValue(data.message)
          }
        })
        this.socket.on('getDiff', (data) => {
          this.updateTextArea(data.message)
        })
      },
      getNote (noteId) {
        this.socket.emit('getNote', { note_id: noteId })
      },
      getDiff (data) {
        this.updateTextArea(data.message)
      },
      diffSend (diff) {
        this.socket.emit('diffNote', { message: diff })
      },
      changeSend (diff) {
        this.socket.emit('changeNote', { message: diff })
      },
      updateTextArea (message) {
        let doc = this.$refs.textEditor.editor.getDoc()
        let patch = this.patchFromText(message)
        let apply = this.patchApply(patch, doc.getValue())
        doc.setValue(apply[0])
      }
    },
    computed: {
      editorOptions () {
        return {
          tabSize: this.indentMode.spaces,
          indentWithTabs: this.indentMode.useTab,
          mode: 'text/x-markdown',
          theme: 'monokai',
          keyMap: this.keyMode // TODO: it still got some bug when it change key map mode
        }
      },
      chars_count () {
        return this.code.length
      },
      lines_count () {
        return this.code.split('\n').length
      }
    },
    data () {
      return {
        note: '',
        noteId: 1,
        socket: null,
        viewMode: 'both',
        keyMode: 'default',
        indentMode: {
          useTab: false,
          spaces: 4
        },
        current_line: 1,
        current_column: 1,
        code: '',
        uploadImageHeader: {
          Authorization: `Client-ID ${config.imgur.clientID}`
        },
        uploadMessage: '![Uploading file...]()'
      }
    }
  }
</script>

<style lang="scss" scoped>
  .wrapper, main, .editor-config {
    display: flex;
    flex: 1 1 0;
  }

  .wrapper {
    height: 100vh;
    flex-direction: column;

    nav {
      flex: 0 0 60px;

      span.badge {
        font-size: 1rem;
      }
    }

    main {
      .editor-wrapper, .preview-wrapper {
        width: 50%;
      }

      .editor-wrapper {
        position: relative;

        .editor {
          height: 100%;
        }

        .editor-config {
          position: absolute;
          left: 0;
          bottom: 0;
          width: 100%;
          height: 30px;
          z-index: 100;
          align-items: center;
          color: white;
          font-size: .8rem;
          background-color: #222;
          border: 1px solid #666;
        }
      }

      .preview-wrapper, .view-container {
        margin: 0 auto;
      }
    }
  }
</style>

<style lang="scss">
  .CodeMirror {
    height: 100%;

    .CodeMirror-scroll {
      margin-right: 0 !important;
      margin-bottom: 0 !important;
      padding-bottom: 0 !important;
    }
  }
</style>
