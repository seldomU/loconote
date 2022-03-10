import {createDomNode} from './util.js'

let defaultConfig = {
  "content": "<xml xmlns=\"https://developers.google.com/blockly/xml\"><block type=\"loco_textout_start\" id=\")w{WiwJ)J@WRz1aD0C77\" x=\"129\" y=\"59\" deletable=\"false\"><statement name=\"INSTRUCTIONS\"><block type=\"loco_textout_write\" id=\",AI5q_*VyiSiI1w6Nwgy\"><value name=\"VALUE\"><block type=\"text\" id=\"SRSA_d%[fKDtpQ]IFu$m\"><field name=\"TEXT\">hello world</field></block></value></block></statement></block></xml>",
  "blockly": {
    "toolboxfolders": [
      {
        "kind": "category",
        "name": "Output",
        "categorystyle": "math_category",
        "contents": [
          {
            "kind": "block",
            "type": "loco_textout_write"
          },
          {
            "kind": "block",
            "type": "text",
            "fields": {
              "TEXT": "abc"
            }
          }
        ]
      }
    ]
  }
}

let blockdefs = [
  {
    "type": "loco_textout_start",
    "message0": "%{BKY_LOCO_TEXTOUT_START}",
    "args0": [
    { "type": "input_dummy" },
    {
      "type": "input_statement",
      "name": "INSTRUCTIONS"
    }],
    "style": "math_blocks",
    "tooltip": "%{BKY_LOCO_TEXTOUT_TIP}",
    "helpUrl": ""
  },
  {
    "type": "loco_textout_write",
    "message0": 'write line %1',
    "args0": [
      {
        "type": "input_value",
        "name": "VALUE",
        "check": "String"
      }
    ],
    "nextStatement": null,
    "previousStatement": null,
    "style": "math_blocks",
    "tooltip": "Writes the attached text into the output area.",
    "helpUrl": ""
  }  
];

Blockly.defineBlocksWithJsonArray(blockdefs);

Blockly.Msg.LOCO_TEXTOUT_START = "On start %1 %2";
Blockly.Msg.LOCO_TEXTOUT_TIP = "The code in the block runs when the ▶-play icon is clicked.";

Blockly.JavaScript.addReservedWords('writeOutput');

Blockly.JavaScript.loco_textout_start = function(block) {
  var value = Blockly.JavaScript.statementToCode(block, 'INSTRUCTIONS') || '""';
  // return code
  return value;
};

Blockly.JavaScript.loco_textout_write = function(block) {
  var value = Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_ATOMIC) || '""';
  // return code
  return'writeOutput( ' + value + ' + "\\n" );\n';
};

function displaySource(cellConfig, id, parent){

    let div = createDomNode(`<div id="${id}"> <img src="icons/codeblock.svg" width="30px" height="30px" alt="{}"> Computed text </div>`);
    parent.prepend(div);
    return div;
}

function editSource(cellConfig, blockContainerId, parent, onEdit){

    let blockContainer = createDomNode(`<div id="${blockContainerId}" style="height: 50vh; width: 100%;"></div>`);
    parent.prepend(blockContainer);

    // don't await the workspace, return right away
    let workspace = createWorkspace( cellConfig, blockContainerId, onEdit );
    if( !workspace ){
      console.error("failed to create code workspace");
    }
    return blockContainer;
}

async function createWorkspace(cellConfig, domId, onEdit) {

  let blocklyCfg = cellConfig.blockly || defaultConfig.blockly;
  if (!blocklyCfg.toolboxfolders) {
    return null;
  }

  // generate toolbox, load models and code generators
  // todo: handle strings, being references to objects on the server
  let createFolders = blocklyCfg.toolboxfolders.length > 1;
  let toolboxDefintion = {
    kind: createFolders ? "categoryToolbox" : "flyoutToolbox",
    contents: []
  }

  for (let folder of blocklyCfg.toolboxfolders) {
    if (createFolders) {
      toolboxDefintion.contents.push(folder);
    }
    else {
      // single folder, no need to concat
      toolboxDefintion.contents = folder.contents;
    }
  }

  // create workspace
  let workspace = Blockly.inject(domId, { toolbox: toolboxDefintion } );

  // populate workspace
  if (cellConfig.content) {
    let xml = Blockly.Xml.textToDom(cellConfig.content);
    Blockly.Xml.domToWorkspace(xml, workspace);
  }

  workspace.addChangeListener(() => {
    let xmlDom = Blockly.Xml.workspaceToDom(workspace);
    let text = Blockly.Xml.domToText(xmlDom);
    onEdit(text);
  });

  workspace.addChangeListener(Blockly.Events.disableOrphans);

  return workspace;
}

async function execute( cellConfig, id, parent ){

    let codeDiv = createDomNode(`<div id="${id}" style="white-space: pre;");></div>`);
    parent.append(codeDiv);
    window.outputDiv = codeDiv;

    // run the workspace code
    let code = workspaceToCode( cellConfig.content );
    try{
      Function(code)();
    }
    catch(err){
      console.error(err);
      window.outputDiv.textContent = "An error occured while running the program.";
    }

    window.outputDiv = null;
    return codeDiv;
}

function disposeEditor(editor){
  document.activeElement.blur();
  editor.remove();
}

function workspaceToCode( workspaceXmlString ){
  let xml = Blockly.Xml.textToDom( workspaceXmlString );
  let workspace = new Blockly.Workspace();
  Blockly.Xml.domToWorkspace( xml, workspace );
  return Blockly.JavaScript.workspaceToCode( workspace );
}

// cell context
window.writeOutput = function(content){
    window.outputDiv.textContent += content;
}

export default {
    displaySource, editSource, executable: true, execute, disposeEditor, defaultConfig
}