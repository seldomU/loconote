
// Copyright (c) 2022 Uwe Koch
// Licensed under the MIT license. See LICENSE file in the project root for details.

import {createDomNode} from './util.js'
import CelltypeRichText from './celltype-richtext.js'
import CelltypeBlockText from './celltype-block-text.js'

// serialization version
const formatVersion = "0.1";

// kinds of notebook cells
const CellTypes = {
    richtext: {
        name: "richtext",
        label: "text",
        type: CelltypeRichText
    },
    blocktext: {
        name: "blocktext",
        label: "code",
        type: CelltypeBlockText
    }
}

let cellData = [];
let nextCellId = 1; // next unique id to be used for DOM nodes

window.noteState = {} // cell-global state of the user programs

// state accessors, for user code
window.setNoteState = function(name, value){
    noteState[name] = value;
}
window.getNoteState = function(name){
    return noteState[name];
}

let welcomeDiv;

window.addEventListener('load', () => {

    // DOM references
    let addRichtextButton = document.getElementById("add-richtext");
    let addConsoleButton = document.getElementById("add-console");
    let addConsoleBlocksButton = document.getElementById("add-consoleblocks");
    let cellListContainer = document.getElementById("cellList");
    welcomeDiv = document.querySelector('#welcome');

    // if this is an iframe, listen for content
    // and respond to content requests
    if(self != top){
        window.addEventListener( "message", (msgEvent) => {
            
            // only trust same origin
            if(msgEvent.origin !== window.origin){
                console.error("untrusted parent message origin ", msgEvent.origin);
                return;
            }

            let msgData = JSON.parse(msgEvent.data);
            if(msgData.type == "setContent"){
                cellData = msgData.content.cells;
                resetNotebook(cellListContainer);
            }
            else if(msgData.type == "getContent"){
                let msg = JSON.stringify({
                    content: {
                        version: formatVersion,
                        cells: cellData
                    }
                });
                window.parent.postMessage( msg, "*" );
            }
            else{
                console.error("unknown msg type: ", msgData.type);
            }
        }, false );
    }
    
    // populates cells
    resetNotebook( cellListContainer);

    // handle rich text button
    addRichtextButton.onclick = () => {
        let cell = Object.assign( {}, CellTypes.richtext.type.defaultConfig, {type: CellTypes.richtext.name} );
        cellData.push(cell);
        generateCellDOM(cell, cellListContainer);
        updateWelcomeVisibility();
    }

    // handle console blocks button
    addConsoleBlocksButton.onclick = () => {
        let cell = Object.assign( {}, CellTypes.blocktext.type.defaultConfig, {type: CellTypes.blocktext.name} );
        cellData.push(cell);
        generateCellDOM(cell, cellListContainer);
        updateWelcomeVisibility();
    }
})

function updateWelcomeVisibility(){
    welcomeDiv.style.display = (cellData.length == 0) ? "block" : "none";
}

function resetNotebook(cellContainer){
    
    //reset state
    window.noteState = {};

    // flush DOM contents of cells
    while (cellContainer.firstChild) {
        cellContainer.firstChild.remove();
    }

    // show something, even when there are no cells yet
    updateWelcomeVisibility();

    // populate cell list
    for(let cell of cellData){
        generateCellDOM(cell, cellContainer);
    }
}

function generateCellDOM(cell, parent){

    let isRichText = cell.type == CellTypes.richtext.name;

    let type = CellTypes[cell.type].type;
    if(!type){
        console.error("unknown cell type: ", cell.type);
    }

    // generate unique ids
    let cellId = nextCellId++;
    let cellContainerId = "cell-" + cellId;
    let editBtnId = "cell-ctrl-edit-" + cellId;
    let execBtnId = "cell-ctrl-exec-" + cellId;
    let deleteBtnId = "cell-ctrl-del-" + cellId;
    let saveBtnId = "cell-content-save-" + cellId;
    let contentId = "cell-content-" + cellId;
    let editorId = "cell-editor-" + cellId;
    let displayId = "cell-display-" + cellId;
    let executeId = "cell-exec-" + cellId;

    let template = `<div id="${cellContainerId}" class="row my-2">
    <!--controls-->
    <div class="col-1">
        <div class="row">
            <div class="col-11 offset-1 col-sm-8 offset-sm-4 col-md-6 offset-md-6 col-lg-5 offset-lg-7 text-end">
                <div id="${editBtnId}" style="cursor: pointer">
                    <img src="icons/remix/pencil-fill.svg" width="24px" height="24px" alt="🖉">
                </div>
                <div id="${saveBtnId}" style="cursor: pointer; display: none">
                    <img src="icons/remix/eye-fill.svg" width="24px" height="24px" alt="🖉">
                </div>
            </div>
        </div>
        ${type.executable ? `
        <div class="row">
            <div class="col-11 offset-1 col-sm-8 offset-sm-4 col-md-6 offset-md-6 col-lg-5 offset-lg-7 text-end">
                <div id="${execBtnId}" style="cursor: pointer;">
                    <img src="icons/remix/play-fill.svg" width="24px" height="24px" alt="▶">
                </div>
            </div>
        </div>` : ""
        }
        <div class="row">
            <div class="col-11 offset-1 col-sm-8 offset-sm-4 col-md-6 offset-md-6 col-lg-5 offset-lg-7 text-end">
                <div id="${deleteBtnId}" style="cursor: pointer;">
                    <img src="icons/remix/delete-bin-7-fill.svg" width="24px" height="24px" alt="ⓧ">
                </div>
            </div>
        </div>
    </div>
    <!--content-->
    <div id="${contentId}" class="col-10 border border-2 rounded-3 p-2">
        <!-- ${isRichText ? "": "<hr/>"} -->
    </div>
</div>`;

    parent.appendChild( createDomNode(template) );
    let cellContainer = document.getElementById(cellContainerId);
    let editButton = document.getElementById(editBtnId);
    let executeButton = document.getElementById(execBtnId);
    let deleteButton = document.getElementById(deleteBtnId);
    let contentElem = document.getElementById(contentId);
    let saveButton = document.getElementById(saveBtnId);

    // by default, fill the cell with rich text or 
    // (for code cells) the name of the cell type
    let displayElem = type.displaySource( cell, displayId, contentElem );
    let editorObj = null;
    let execElem = null;

    // edit cell
    editButton.onclick = () => {
        editButton.style.display="none";
        saveButton.style.display="block";
        editorObj = type.editSource( cell, editorId, contentElem, (newValue) => cell.content = newValue );
        displayElem.remove();
    }
    
    // save cell-editor content
    saveButton.onclick = () => {
        editButton.style.display = "block";
        saveButton.style.display = "none";

        type.disposeEditor( editorObj );

        displayElem = type.displaySource( cell, displayId, contentElem );
    }
    
    // execute cell code
    if(type.executable){
        executeButton.onclick = async () => {
            if(execElem){
                execElem.remove();
            }
            // wait a bit before running the code,
            // so that the user sees the previous output disappear
            setTimeout( async () => {
                execElem = await type.execute(cell, executeId, contentElem);
            }, 100);
        }
    }

    // delete cell
    deleteButton.onclick = () => {
        if(window.confirm("Really remove cell?")){
            let cellSequenceId = cellData.indexOf(cell);
            cellData.splice(cellSequenceId,1);
            cellContainer.remove();
            updateWelcomeVisibility();
        }
    }
}

