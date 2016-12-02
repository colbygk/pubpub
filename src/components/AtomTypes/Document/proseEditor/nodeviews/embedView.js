import {EmbedEdited} from '../components';
import React from 'react';
import ReactDOM from 'react-dom';
import ReactView from './reactview';
import {schema} from '../schema';

class EmbedView extends ReactView {
  constructor(node, view, getPos, options) {
    super(node, view, getPos, options);
  }

  bindFunctions() {
    super.bindFunctions();
  }

  renderElement(domChild) {
    const node = this.node;
    // updateParams={this.updateNodeParams} {...node.attrs}
    return ReactDOM.render(<EmbedEdited updateParams={this.updateParams} {...node.attrs}/>, domChild);
  }

  updateParams() {

  }

	valueChanged(nodeAttrs) {
    const start = this.getPos();
    const nodeType = schema.nodes.block_embed;
		const transform = this.view.state.tr.setNodeType(start, nodeType, nodeAttrs);
		const action = transform.action();
		this.applyAction(action);
	}


  changeToBlock() {
    this.changeNode(schema.nodes.block_embed);
  }

  changeToInline() {
    this.changeNode(schema.nodes.embed);
  }
}

export default EmbedView;
