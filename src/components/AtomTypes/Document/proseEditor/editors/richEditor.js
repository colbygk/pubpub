import {EmbedView, LatexView, MentionView} from '../nodeviews';
import {migrateDiffs, migrateMarks, schema as pubSchema} from '../schema';

import ElementSchema from '../elementSchema';
import {Plugin} from 'prosemirror-state';

class AbstractEditor {

  constructor() {
    this._onAction = this._onAction.bind(this);
    this.reconfigure = this.reconfigure.bind(this);
  }

  create({place, contents, plugins, config}) {
    const {buildMenuItems} = require('../pubpubSetup');
    const {EditorState} = require('prosemirror-state');
    const {MenuBarEditorView, MenuItem} = require('prosemirror-menu');
    const collabEditing = require('prosemirror-collab').collab;
    const {clipboardParser, clipboardSerializer} = require('../clipboardSerializer');


    const menu = buildMenuItems(pubSchema);
    // TO-DO: USE UNIQUE ID FOR USER AND VERSION NUMBER

    // migrateMarks(contents);

    /*
    ElementSchema.initiateProseMirror({
    	changeNode: this.changeNode,
    	setEmbedAttribute: this.setEmbedAttribute,
    	getState: this.getState,
    });
    */

    this.plugins = plugins;

    const stateConfig = {
    	doc: pubSchema.nodeFromJSON(contents),
    	plugins: plugins,
      ...config
    };

    const state = EditorState.create(stateConfig);

     this.view = new MenuBarEditorView(place, {
      state: state,
      onAction: this._onAction,
    	onUnmountDOM: (view, node) => {
    		// console.log('unmountinggg', node);
    		return;
    		if (node.type && node.type.name === 'embed' || node.type.name === 'block_embed') {
    			ElementSchema.unmountNode(node);
    		}
    	},
    	// handleDOMEvent: this._handleDOMEvent,
      menuContent: menu.fullMenu,
    	spellcheck: true,
    	clipboardParser: clipboardParser,
    	clipboardSerializer: clipboardSerializer,
      nodeViews: {
        block_embed: (node, view, getPos) => new EmbedView(node, view, getPos, {block: true}),
        latex: (node, view, getPos) => new LatexView(node, view, getPos, {block: false}),
        latex_block: (node, view, getPos) => new LatexView(node, view, getPos, {block: true}),
        mention: (node, view, getPos) => new MentionView(node, view, getPos, {block: false}),
      }
    });
  }

  reconfigure(plugins, config) {
    const state = this.view.editor.state;
    const newState = state.reconfigure({plugins: plugins, ...config});
    this.view.updateState(newState);
  }

  /*
  _handleDOMEvent = (_view, evt) => {
    if (evt.type === 'paste') {
      setTimeout(ElementSchema.countNodes, 200);
    }
    return false;
  }
  */


  _onAction (action) {
    /*
    if (action.transform) {
      for (const step of action.transform.steps) {
        // console.log(step);
        if (step.slice.content.content.length === 0) {
          console.log('deleted!');
        const newStep = step.invert(this.view.editor.state.doc);
        action.transform.step(newStep);
        }
      }
    }
    */

    const newState = this.view.editor.state.applyAction(action);
    this.view.updateState(newState);
  }

  _createDecorations = (editorState) => {
    const {DecorationSet} = require("prosemirror-view");
    return DecorationSet.empty;
  }

	changeNode = (currentFrom, nodeType, nodeAttrs) => {
		const state = this.pm;
		const transform = state.tr.setNodeType(currentFrom, nodeType, nodeAttrs);
		const action = transform.action();
		this.applyAction(action);
	}

	getState = () => {
		return this.view.state;
	}

	applyAction = (action) => {
		const newState = this.view.editor.state.applyAction(action);
		this.view.updateState(newState);
	}

  toJSON = () => {
    return this.view.editor.state.doc.toJSON();
  }

  toMarkdown = () => {
    const {defaultMarkdownSerializer} = require("prosemirror-markdown");
    const markdown = defaultMarkdownSerializer.serialize(this.view.state.doc);
    return markdown;
  }

  setDoc = (newJSONDoc) => {
    const {EditorState} = require('prosemirror-state');
    const newState = EditorState.create({
    	doc: pubSchema.nodeFromJSON(newJSONDoc),
    	plugins: this.plugins,
    });
    this.view.updateState(newState);
  }
}


class RichEditor extends AbstractEditor {

  constructor({place, text, contents}) {
    super();
    const {pubpubSetup} = require('../pubpubSetup');
    const {markdownParser} = require("../markdownParser");

    const plugins = pubpubSetup({schema: pubSchema});
    let docJSON;
    if (text) {
      docJSON = markdownParser.parse(text).toJSON();
    } else {
      docJSON = contents;
    }
    this.create({place, contents: docJSON, plugins});
  }
}

class CollaborativeRichEditor extends AbstractEditor {

  constructor({place, contents, collaborative: {userId, versionNumber, lastDiffs, collab}}) {

    super();
    const {pubpubSetup} = require('../pubpubSetup');
    const plugins = [pubpubSetup({schema: pubSchema})];
    this.create({place, contents, plugins});
    migrateDiffs(lastDiffs);
    const appliedAction = collab.mod.collab.docChanges.applyAllDiffs(lastDiffs);
    if (appliedAction) {
    		// this.applyAction(appliedAction);
    } else {
    		// indicates that the DOM is broken and cannot be repaired
    		this.collab.mod.serverCommunications.disconnect();
    }

  }

  getStatus = () => {

  }

  onAction = () => {
    // console.log(action);
    const newState = view.editor.state.applyAction(action);
    this.pm = newState;
    view.updateState(newState);
    that.collab.mod.collab.docChanges.sendToCollaborators();
    if (action.type === "selection") {
      ElementSchema.onNodeSelect(newState, action.selection);
    }
  }


}

exports.RichEditor = RichEditor;
exports.AbstractEditor = AbstractEditor;

exports.CollaborativeRichEditor = CollaborativeRichEditor;
