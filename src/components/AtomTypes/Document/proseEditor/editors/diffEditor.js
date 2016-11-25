import {AbstractEditor} from './richEditor';
import {Plugin} from 'prosemirror-state';
import {schema as pubSchema} from '../schema';

// var jsondiffpatch = require('jsondiffpatch').create({textDiff: {minLength: 3}});

const diffPlugin = new Plugin({
  state: {
    init(config, instance) {
			const {DecorationSet, Decoration} = require("prosemirror-view");
      return {deco: DecorationSet.empty,
        linkedEditor: config.linkedEditor,
        originalEditor: config.originalEditor,
        showAsAdditions: config.showAsAdditions,
      };
    },
    applyAction(action, state, prevEditorState, editorState) {
			const {DecorationSet, Decoration} = require("prosemirror-view");
			if (action.type === 'transform') {
				state.linkedEditor.linkedTransform();
			}

			if (action.type === 'transform' || action.type === 'linkedTransform') {
	      const text1 = state.linkedEditor.getDiffStr();
	      const text2 = state.originalEditor.getDiffStr(editorState);

	      var jsdiff = require('diff');
	      var diffResult = jsdiff.diffChars(text1, text2);
	      const decos = [];
	      let startCount = 0;
	      for (const diff of diffResult) {
	        // const strippedString = diff.value.replace(/\s/g, '');
					const strippedString = diff.value;
          if (diff.removed) {
            continue;
          }
	        if (diff.added) {
	          const to = startCount;
	          const from = startCount + strippedString.length;
            let className = 'diff-marker';
            if (state.showAsAdditions) {
              className += ' added';
            } else {
              className += ' removed';
            }
	          const deco = Decoration.inline(to, from, {class: className}, {inclusiveLeft: true, inclusiveRight: true});
	          decos.push(deco);
	        }
	        startCount += strippedString.length;
	      }
				const deco = DecorationSet.create(editorState.doc, decos);
				return {deco,
          linkedEditor: state.linkedEditor,
          originalEditor: state.originalEditor,
          showAsAdditions: state.showAsAdditions
        };
			}

      return state;
    }
  },
  props: {
    decorations(state) {
      if (state && this.getState(state)) {
        return this.getState(state).deco;
      }
      return null;
    }
  }
});

// show added in green and removed in reduce
// hovering on one, highlights both changeset
// clicking on one, accepts changes into the document

class DiffRichEditor extends AbstractEditor {

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

	linkEditor(linkedEditor, {showAsAdditions}) {
    const {pubpubSetup} = require('../pubpubSetup');
    const plugins = pubpubSetup({schema: pubSchema});
		const diffPlugins = plugins.concat(diffPlugin);
		super.reconfigure(diffPlugins, {linkedEditor, originalEditor: this, showAsAdditions});
	}

	linkedTransform() {
		const action = {type: 'linkedTransform'};
		this._onAction(action);
	}

  // if newState exists, then use that instead of the default state
  // this is useful if called by an action to get the top most diff
	getDiffStr(newState) {
		let doc;
    if (!newState) {
      doc = this.view.editor.state.doc;
    } else {
      doc = newState.doc;
    }
		const nodeSize = doc.nodeSize;
		let diffStr = "";

		for (let i = 0; i < nodeSize - 1; i++) {
			const child = doc.nodeAt(i);
			if (child) {
				let diffText = "";
				if (child.isText) {
					diffText = child.text;
					i += child.nodeSize - 1;
				} else {
					diffText = child.type.name.charAt(0);
				}
				diffStr += diffText;
			} else {
				diffStr += "Z";
			}

		}
		return diffStr;
	}


	/*
  create({place, contents, plugins}) {

    const otherEditor = this.otherEditor;
    // const diffPlugins = plugins.concat(diffPlugin);

    super.create({place, contents, plugins: plugins, config: {otherEditor: 'test'}});
  }
	*/


}

exports.DiffRichEditor = DiffRichEditor;
