<template lang="pug">
  section.layout
    .layout-header
      Row
        Col(span="12")

          Button(type="text", icon="document", size="large") UniMD

          view-switcher(v-model="viewMode", @change="showMode")

          Button(type="text", icon="ios-help")
          Upload(
            class="upload-image",
            :headers="uploadImageHeader",
            action="https://api.imgur.com/3/image",
            name="image",
            :show-upload-list="false",
            :before-upload="handleBeforeUpload",
            :on-success="handleUploadSuccess",
            clearFiles
          )
            Button(type="text", icon="camera")

        Col(span="12")
          .setting-items
            Button(type="text", icon="plus-round") 新增

            Button(type="text", icon="android-share-alt") 發表

            Dropdown(trigger="click")
              Button(type="text", icon="arrow-down-b") 選單
              Dropdown-menu(slot="list")
                Dropdown-item(disabled) 增益
                Dropdown-item 修訂版本
                Dropdown-item 簡報模式
                Dropdown-item(disabled, divided) 匯出
                Dropdown-item(disabled, divided) 匯入
                Dropdown-item Gist
                Dropdown-item 剪貼簿
                Dropdown-item(disabled, divided) 下載
                Dropdown-item Markdown
                Dropdown-item HTML
                Dropdown-item 純 HTML
                Dropdown-item PDF (Beta)
              Button(type="info", icon="ios-people") 1 ONLINE
    .layout-workspace
      #text_block(:class="text_width", v-if="!isHidden(text_width)")
        .code-editor
          codemirror(@viewportChange="onEditorScroll", v-model="code", :options="editorOptions", ref="textEditor", @cursorActivity="showInfo")

        .config-bar
          Row
            Col(span="12").cursor-info
              span Line {{ current_line }}, Column {{ current_column }} -- {{ lines_count }} Lines
            Col(span="12")
              .config-items
                .config-item: Button(type="text", icon="checkmark")
                .config-item: Button(type="text", icon="gear-a")
                indent-switcher(v-model="indentMode")
                key-binding(v-model="keyMode", @change="updateKeyMap")
                .config-item: Button(type="text", icon="wrench")
                .config-item.padding-6: span.padding-6 Length: {{ chars_count }}
      #view_block(:class="preview_width", v-if="!isHidden(preview_width)", @scroll="onViewScroll")
        view-container(@scroll="onViewScroll", :isHidden="isHidden(preview_width)", :source="code")

</template>

<script>
  import ViewSwitcher from '~/components/ViewSwitcher'
  import IndentSwitcher from '~/components/IndentSwitcher'
  import KeyBinding from '~/components/KeyBinding'
  import ViewContainer from '~/components/ViewContainer'
  import debugModule from 'debug'
  import config from '~/config.json'
  import UniSocket from '~/plugins/UniSocket.js'
  import DiffMatchPatch from 'diff-match-patch'
  let dmp = new DiffMatchPatch()
  let debug = debugModule('pages.editor')

  export default {
    components: {
      ViewSwitcher, IndentSwitcher, KeyBinding, ViewContainer
    },
    mounted () {
      this.connectSocket()
    },
    methods: {
      onEditorScroll (e) {
        if (e.doc && this.$el.querySelector('#view_block')) {
          this.$el.querySelector('#view_block').scrollTop = e.doc.scrollTop
        }
      },
      onViewScroll (e) {
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
      updateKeyMap () {
        this.editorOptions.keyMap = this.keyMode
        debug('Current key map : ' + this.keyMode)
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
      isHidden (width) {
        return width === 'hidden'
      },
      updateTextArea (message) {
        let doc = this.$refs.textEditor.editor.getDoc()
        let patch = this.patchFromText(message)
        let apply = this.patchApply(patch, doc.getValue())
        doc.setValue(apply[0])
      }
    },
    computed: {
      text_width () {
        if (this.viewMode === 'edit') {
          return 'full_width'
        } else if (this.viewMode === 'preview') {
          return 'half_width'
        } else {
          return 'hidden'
        }
      },
      editorOptions () {
        return {
          tabSize: this.indentMode.spaces,
          indentWithTabs: this.indentMode.useTab,
          mode: 'text/x-markdown',
          theme: 'monokai',
          keyMap: 'default'
        }
      },
      preview_width () {
        if (this.viewMode === 'view') {
          return 'full_width'
        } else if (this.viewMode === 'preview') {
          return 'half_width'
        } else {
          return 'hidden'
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
        viewMode: 'edit',
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

<style lang="scss">
  .layout{
    position: relative;
  }
  .layout-header{
    background-color: white;
    padding: 10px 0;
    border: 1px solid #d3e0e9;
      .upload-image {
        display: inline-block;
      }

      .setting-items{
        float: right;
        margin-right: 15px;
      }

      .ivu-btn{
        font-size: 14px;
        i.ivu-icon{
          font-size: 18px;
        }
      }
  }

  .layout-workspace{
    display: flex;

    #view_block{
      height: calc(100vh - 59px - 2px - 32px);
      overflow: scroll;
    }

    .code-editor{
      background-color: #9ea7b4;
    }

    .config-bar{
      background-color: #222;
      color: white;
      font-size: 8px;
      border: 1px solid #666;
      width: 100%;

      .cursor-info{
          padding: 6px;
      }

      .config-items{
        float: right;
        margin-right: 15px;
        display: flex;

        .config-item {
          border-left: 1px solid #666;
          button{
            color: white;
          }
          &.padding-6{
            padding:6px;
          }
        }
      }
    }
  }

  .CodeMirror {
    height: calc(100vh - 59px - 2px - 32px);
    background-color: #444;
    color: white;
  }
  .full_width {
    width: 100vw;
  }
  .half_width {
    width: 50vw;
  }
  .hidden {
    width: 0vw;
  }
</style>
