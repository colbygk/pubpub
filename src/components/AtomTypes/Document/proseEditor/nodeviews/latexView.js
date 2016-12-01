import {LatexEditor} from '../components';
import React from 'react';
import ReactDOM from 'react-dom';
import {schema} from '../schema';

function computeChange(oldVal, newVal) {
  let start = 0, oldEnd = oldVal.length, newEnd = newVal.length
  while (start < oldEnd && oldVal.charCodeAt(start) == newVal.charCodeAt(start)) ++start
  while (oldEnd > start && newEnd > start &&
         oldVal.charCodeAt(oldEnd - 1) == newVal.charCodeAt(newEnd - 1)) { oldEnd--; newEnd-- }
  return {from: start, to: oldEnd, text: newVal.slice(start, newEnd)}
}

class LatexView {
  constructor(node, view, getPos, options) {
    this.valueChanged = this.valueChanged.bind(this);
    this.changeToBlock = this.changeToBlock.bind(this);
    this.changeToInline = this.changeToInline.bind(this);


    this.block = options.block;
    this.node = node
    this.view = view
    this.getPos = getPos
    this.value = node.textContent
    const domChild = (this.block) ? document.createElement('div') : document.createElement('span');
		const reactElement = this.renderElement(domChild);
		const dom = domChild.childNodes[0];
    dom.contentEditable = false;
    this.dom = domChild;
    this.reactElement = reactElement;
  }

  /*

  maybeEscape(unit, dir) {
    let pos = this.cm.getCursor()
    if (this.cm.somethingSelected() || pos.line != (dir < 0 ? this.cm.firstLine() : this.cm.lastLine()) ||
        (unit == "char" && pos.ch != (dir < 0 ? 0 : this.cm.getLine(pos.line).length)))
      return CodeMirror.Pass
    this.view.focus()
    let targetPos = this.getPos() + (dir < 0 ? 0 : this.value.length + 2)
    this.view.props.onAction(Selection.near(this.view.state.doc.resolve(targetPos), dir).action())
  }
  */

  valueChanged(value) {
    if (value != this.value) {
      let change = computeChange(this.value, value)
      this.value = value
      let start = this.getPos() + 1
      let tr = this.view.state.tr.replaceWith(start + change.from, start + change.to,
                                              change.text ? schema.text(change.text) : null)
      this.view.props.onAction(tr.action())
    }
  }

  renderElement(domChild) {
    return ReactDOM.render(<LatexEditor
      changeToBlock={this.changeToBlock}
      changeToInline={this.changeToInline}
      block={this.block}
      updateValue={this.valueChanged}
      value={this.value}/>, domChild);
  }

  update(node) {
    if (node.type != this.node.type) return false
    this.node = node;
    this.reactElement = this.renderElement(this.dom);
    return true
  }

  changeToBlock() {
    this.changeNode(schema.nodes.latex_block);
  }

  changeToInline() {
    this.changeNode(schema.nodes.latex);
  }

  changeNode(nodeType) {

    const nodeText = this.node.textContent;
    const newNode = nodeType.create({}, schema.text(nodeText));

    const start = this.getPos();
    const end = start + this.node.nodeSize;

    let tr = this.view.state.tr.replaceWith(start, end, newNode);
    this.view.props.onAction(tr.action());
  }

  /*
  setSelection(anchor, head) {
    this.cm.focus()
    this.cm.setSelection(this.cm.posFromIndex(anchor), this.cm.posFromIndex(head))
  }

  selectNode() {
    this.cm.focus()
  }
  */

  stopEvent() { return true }
}

export default LatexView;
