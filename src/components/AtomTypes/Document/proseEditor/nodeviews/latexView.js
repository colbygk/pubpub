import {LatexEditor} from '../components';
import React from 'react';
import ReactDOM from 'react-dom';
import ReactView from './reactview';
import {schema} from '../schema';

class LatexView extends ReactView {
  constructor(node, view, getPos, options) {
    super(node, view, getPos, options);
  }

  bindFunctions() {
    super.bindFunctions();
    this.valueChanged = this.valueChanged.bind(this);
    this.changeToBlock = this.changeToBlock.bind(this);
    this.changeToInline = this.changeToInline.bind(this);
  }

  renderElement(domChild) {
    return ReactDOM.render(<LatexEditor
      changeToBlock={this.changeToBlock}
      changeToInline={this.changeToInline}
      block={this.block}
      updateValue={this.valueChanged}
      value={this.value}/>, domChild);
  }

  changeToBlock() {
    this.changeNode(schema.nodes.latex_block);
  }

  changeToInline() {
    this.changeNode(schema.nodes.latex);
  }
}

export default LatexView;
