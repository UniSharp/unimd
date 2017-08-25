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
      #text_block(:class="text_width")
        .code-editor
          codemirror(v-model="code", :options="editorOptions", ref="textEditor", @cursorActivity="showInfo")

        .config-bar
          Row
            Col(span="12").cursor-info
              span Line {{ current_line }}, Column {{ current_column }} -- {{ lines_count }} Lines
            Col(span="12")
              .config-items
                .config-item: Button(type="text", icon="checkmark")
                .config-item: Button(type="text", icon="gear-a")
                indent-switcher(v-model="indentMode", @change="updateIndent")
                key-binding(v-model="keyMode", @change="updateKeyMap")
                .config-item: Button(type="text", icon="wrench")
                .config-item.padding-6: span.padding-6 Length: {{ chars_count }}
      #view_block(:class="preview_width")
        view-container(:code="code")

</template>

<script>
  import ViewSwitcher from '~/components/ViewSwitcher'
  import IndentSwitcher from '~/components/IndentSwitcher'
  import KeyBinding from '~/components/KeyBinding'
  import ViewContainer from '~/components/ViewContainer'

  import config from '~/config.json'
  import UniSocket from '~/plugins/UniSocket.js'
  import dmp from 'diff-match-patch'

  export default {
    components: {
      ViewSwitcher, IndentSwitcher, KeyBinding, ViewContainer
    },
    mounted () {
      this.connectSocket()
    },
    methods: {
      showMode () {
        console.log('Current mode : ' + this.viewMode)
      },
      updateKeyMap () {
        this.editorOptions.keyMap = this.keyMode
        console.log('Current key map : ' + this.keyMode)
      },
      showInfo (editor) {
        this.current_line = this.$refs.textEditor.editor.getCursor().line + 1
        this.current_column = this.$refs.textEditor.editor.getCursor().ch + 1
      },
      updateIndent () {
        this.editorOptions.indentWithTabs = this.indentMode.useTab
        this.editorOptions.tabSize = this.indentMode.spaces
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

        this.socket = new UniSocket(config.websocket.endPoint)
        this.socket.on('open', () => {})
        editor.on('change', function (editor, diff) {
          console.log('change')
          if (diff.origin && (diff.origin !== 'setValue')) {
            this.socket.emit('changeNote', { message: diff })
            let newDiff = dmp.patch_toText(dmp.patch_make(this.note, editor.getDoc().getValue()))
            this.diffSend(newDiff)
          }
        })
        this.socket.on('changeNote', (data) => {
          this.replaceRange(data.message)
        })
        this.socket.on('getNote', (data) => {
          if (data.message !== null) {
            editor.getDoc().setValue(data.message)
          }
        })
        this.socket.on('getDiff', (data) => {
          let patch = dmp.patch_fromText(data.message)
          let apply = dmp.patch_apply(patch, editor.getDoc().getValue())
          editor.getDoc().setValue(apply[0])
        })
      },
      getNote (noteId) {
        console.log('getNote')
        this.socket.emit('getNote', { note_id: noteId })
      },
      getDiff (data) {
        console.log('getDiff')
        let doc = this.$refs.textEditor.editor.getDoc()
        let patch = dmp.patch_fromText(data.message)
        let apply = dmp.patch_apply(patch, doc.getValue())
        doc.setValue(apply[0])
      },
      diffSend (diff) {
        console.log('diffNite')
        this.socket.emit('diffNote', { message: diff })
      },
      changeSend (diff) {
        console.log('changeSend')
        this.socket.emit('changeNote', { message: diff })
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
        socket: null,
        viewMode: 'edit',
        keyMode: 'default',
        indentMode: {
          useTab: false,
          spaces: 4
        },
        current_line: 1,
        current_column: 1,
        code: config.codemirror.code,
        editorOptions: {
          // codemirror options
          tabSize: 4,
          indentWithTabs: false,
          mode: 'text/x-markdown',
          theme: 'monokai',
          // // sublime、emacs、vim三种键位模式，支持你的不同操作习惯
          keyMap: 'default'
          // // 按键映射，比如Ctrl键映射autocomplete，autocomplete是hint代码提示事件
          // extraKeys: { "Ctrl": "autocomplete" },
          // // 代码折叠
          // foldGutter: true,
          // gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
          // // 选中文本自动高亮，及高亮方式
          // styleSelectedText: true,
          // highlightSelectionMatches: { showToken: /\w/, annotateScrollbar: true },
          // more codemirror config...
          // 如果有hint方面的配置，也应该出现在这里
        },
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
