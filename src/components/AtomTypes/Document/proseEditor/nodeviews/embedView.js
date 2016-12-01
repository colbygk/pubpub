import EmbedEditWrapper from '../EmbedEditWrapper';

function wrapDOM(dom) {
  let dummy = document.createElement("div")
  dummy.textContent = "\u200b"
  dummy.style.height = 0
  let wrap = document.createElement("div")
  wrap.appendChild(dummy.cloneNode(true))
  wrap.appendChild(dom)
  wrap.appendChild(dummy)
  return wrap
}

class EmbedView {
  constructor(node, view, getPos) {
    console.log('made embed view!!!');
    this.node = node
    this.view = view
    this.getPos = getPos

    const domChild = document.createElement('span');
		const reactElement = ReactDOM.render(<EmbedEditWrapper {...node.attrs}/>, domChild);
		const dom = domChild.childNodes[0];

		if (block && dom.className.indexOf('block-embed') === -1) {
			dom.className += ' block-embed';
		} else if (dom.className.indexOf(' embed') === -1) {
			dom.className += ' embed';
		}
		dom.setAttribute('data-nodeId', nodeId);
    dom.contentEditable = false;
    this.dom = domChild;
    this.reactElement = reactElement;
  }

  /*
  valueChanged() {
    let value = this.cm.getValue()
    if (value != this.value) {
      let change = computeChange(this.value, value)
      this.value = value
      let start = this.getPos() + 1
      let tr = this.view.state.tr.replaceWith(start + change.from, start + change.to,
                                              change.text ? schema.text(change.text) : null)
      this.view.props.onAction(tr.action())
    }
  }

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

  update(node) {
    if (node.type != this.node.type) return false
    this.node = node;
    this.reactElement = ReactDOM.render(<EmbedEditWrapper {...node.attrs}/>, this.dom);
    return true
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
