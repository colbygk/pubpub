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

      if (action.type === 'patch') {
        const diffIndex = action.diffIndex;
        const diff = state.lastDiff[diffIndex];
        //Removals always require an insertion, and possibly a deletion
        //
        if (diff.removed) {
          const textNode = pubSchema.text(text);
          const newT = state.tr.replaceWith(to, to, textNode);
          const action = {
            type: 'transform',
            transform: newT
          };
          view.props.onAction(action);
        }
      }

			if (action.type === 'transform' || action.type === 'linkedTransform') {
	      const diff1 = state.linkedEditor.getDiffStr();
	      const diff2 = state.originalEditor.getDiffStr(editorState);
        const text1 = diff1.diffStr;
        const text2 = diff2.diffStr;

        const diffMap = diff2.diffMap;

	      var jsdiff = require('diff');
	      var diffResult = jsdiff.diffChars(text1, text2);
	      let decos = [];
	      let startCount = 0;


        // console.log('Diff result', diffResult);
        // console.log('Diff map', diffMap);
	      for (let [diffIndex, diff] of diffResult.entries()) {
	        // const strippedString = diff.value.replace(/\s/g, '');
					const strippedString = diff.value;
          if (diff.removed) {
            continue;
          }
	        if (diff.added) {

            //must find biggest chunk
	          const to = startCount;
	          const from = startCount + strippedString.length;

            const ranges = [];
            let lastRange = {type: 'inline', to: null, from: null};
            let lastNode = null;

            // find the contigous ranges and turn them into a map
            // need to join ranges afterwards
            for (let i = to; i <= from; i++) {
              if (diffMap[i] && diffMap[i].type) {
                if (lastNode === diffMap[i].index) {
                  continue;
                }
                lastNode = diffMap[i].index;
                ranges.push({
                  type: 'node',
                  to: diffMap[i].index,
                  from: diffMap[i].index + 1
                });
                continue;
              } else {
                lastNode = null;
              }
              if (i === from && diffMap[i] !== undefined) {
                if (lastRange.to === null) {
                  lastRange.to = diffMap[i];
                  lastRange.from = diffMap[i];
                } else {
                  lastRange.from = diffMap[i];
                }
                ranges.push(lastRange);
                continue;
              }
              if (diffMap[i] !== undefined && lastRange.to === null) {
                lastRange.to = diffMap[i];
              } else if (diffMap[i] === undefined && lastRange.to !== null) {
                lastRange.from = diffMap[i - 1] + 1;
                ranges.push(lastRange);
                lastRange = {type: 'inline', to: null, from: null};
              }
              if (i === from && diffMap[i] !== undefined) {
                if (lastRange.to === null) {
                  lastRange.to = diffMap[i];
                  lastRange.from = diffMap[i] + 1;
                } else {
                  lastRange.from = diffMap[i] + 1;
                }
                ranges.push(lastRange);
              }
            }

            let className = 'diff-marker';
            if (state.showAsAdditions) {
              className += ' added';
            } else {
              className += ' removed';
            }
            className += ` diff-index-${diffIndex}`
            const patch = {to, from, text: strippedString };


            const patchDecorations = ranges.map((range) => {
              if (range.type === 'node') {
                return Decoration.node(range.to, range.from, {class: className}, {diffIndex});
              } else {
                return Decoration.inline(range.to, range.from,
                  {class: className},
                  { inclusiveLeft: true,
                    inclusiveRight: true,
                    diffIndex
                  }
                );
              }
            });
	          decos = decos.concat(patchDecorations);
            console.log(decos);
	        }
	        startCount += strippedString.length;
	      }
				const deco = DecorationSet.create(editorState.doc, decos);
				return {deco,
          linkedEditor: state.linkedEditor,
          originalEditor: state.originalEditor,
          showAsAdditions: state.showAsAdditions,
          lastDiff: diffResult,
          lastDiffMap: diffMap,
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

  patchDiff() {

  }

  // if newState exists, then use that instead of the default state
  // this is useful if called by an action to get the top most diff
	getDiffStr(newState) {
		let doc;
    const diffMap = {};
    if (!newState) {
      doc = this.view.editor.state.doc;
    } else {
      doc = newState.doc;
    }
		const nodeSize = doc.nodeSize;
		let diffStr = "";

    // non-leaf tokens have a start and end size
		for (let nodeIndex = 0; nodeIndex < nodeSize - 1; nodeIndex++) {
			const child = doc.nodeAt(nodeIndex);
      // console.log(child);
			if (child) {
				let diffText = '';
				if (child.isText) {
					diffText = '"' + child.text + '"';
          // diffText = child.text
          if (child.text.length !== child.nodeSize) {
            console.log('WOAH THIS IS AN ISSUE');
          }
          for (var j = 0; j < child.nodeSize; j++) {
            diffMap[diffStr.length + j + 1 ] = nodeIndex + j;
          }
					nodeIndex += child.nodeSize - 1;
				} else if (child.type.name === 'block_embed') {
          const attrsStr = JSON.stringify(child.attrs);
          // diffText = 'embed' + attrsStr + ' ';
          diffText = 'embed ';
          for (var j = 0; j < diffText.length - 1; j++) {
            diffMap[diffStr.length + j] = {type: 'embed', index: nodeIndex};
          }
        } else {
					diffText = child.type.name.charAt(0);
          diffMap[diffStr.length] = nodeIndex;
          // node attrs
				}
				diffStr += diffText;
			} else {
				diffStr += " ";
			}

		}
    console.log(diffStr);
    // console.log(diffMap);
		return {diffStr, diffMap};
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
