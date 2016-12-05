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

class ReactView {
  constructor(node, view, getPos, options) {
    this.bindFunctions();
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

  bindFunctions() {
    this.valueChanged = this.valueChanged.bind(this);
  }

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

  // Needs to be override by child classes
  renderElement(domChild) {
    return null;
  }

  update(node, decorations) {
    console.log(decorations);
    if (node.type != this.node.type) return false
    this.node = node;
    this.reactElement = this.renderElement(this.dom);
    return true
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

export default ReactView;
