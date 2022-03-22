
// Copyright (c) 2022 Uwe Koch
// Licensed under the MIT license. See LICENSE file in the project root for details.

import {createDomNode} from './util.js'

function displaySource(cellConfig, id, parent){
    let display = createDomNode(`<div id="${id}">${cellConfig.content}</div>`);
    parent.prepend( display );  // make it the first child
    return display;
}

function editSource(cellConfig, id, parent, onEdit){
    let textArea = createDomNode(`<textarea id="${id}" style="height: 40vh; width: 100%;"></textarea>`);
    parent.prepend(textArea);
    let theEditor;
    tinymce.init({
        target: textArea,   // or selector: "my-css-selector"
        auto_focus: id,
        // https://www.tiny.cloud/docs/general-configuration-guide/localize-your-language/
        //language: "en_US",

        // https://www.tiny.cloud/docs/configure/editor-appearance/#toolbar
        // https://www.tiny.cloud/docs/advanced/available-toolbar-buttons/
        toolbar: 'undo redo | formatselect | bold italic | link unlink image media | alignleft aligncenter alignright alignjustify | outdent indent',
        plugins: "link image media",
        menubar: false,  // disable file, edit, view menu
        branding: false,

        setup: function (editor) {
            theEditor = editor;
            editor.on( 'init', function (e) {
              editor.setContent( cellConfig.content );
            });
            editor.on( 'change', function (e){
                onEdit( editor.getContent() )
            });
            editor.on( 'keyup', function (e){
                onEdit( editor.getContent() )
            });
          }
    });

    return theEditor;
}

function disposeEditor(editor){
    editor.getElement().remove();
    editor.remove();
}

let defaultConfig = { content: "Hello text cell" }

export default {
    displaySource, editSource, disposeEditor, defaultConfig, executable: false
}