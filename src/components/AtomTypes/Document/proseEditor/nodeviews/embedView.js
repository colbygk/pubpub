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
    return ReactDOM.render(<EmbedEdited updateAttrs={this.valueChanged} {...node.attrs}/>, domChild);
  }

	valueChanged(nodeAttrs) {
    const start = this.getPos();
    const nodeType = schema.nodes.block_embed;
    const oldNodeAttrs = this.node.attrs;
		const transform = this.view.state.tr.setNodeType(start, nodeType,  {...oldNodeAttrs, ...nodeAttrs});
		const action = transform.action();
		this.view.props.onAction(action);
	}

  changeToBlock() {
    this.changeNode(schema.nodes.block_embed);
  }

  changeToInline() {
    this.changeNode(schema.nodes.embed);
  }

  selectNode() {
    this.reactElement.setSelected(true);
  }

  deselectNode() {
    this.reactElement.setSelected(false);
  }

}

export default EmbedView;
