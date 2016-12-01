import Radium, {Style} from 'radium';
import React, {PropTypes} from 'react';

import ReactDOM from 'react-dom';
import katex from 'katex';
import katexStyles from './katex.css.js';

// import {safeGetInToJS} from 'utils/safeParse';

let styles = {};

export const LatexEditor = React.createClass({
	propTypes: {
		latexString: PropTypes.string,
    updateValue: PropTypes.func,
    block: PropTypes.bool,
	},
	getInitialState: function() {
    console.log('inital state!', this.props);
    const displayHTML = this.generateHTML(this.props.value);
		return {
      editing: false,
      displayHTML,
		};
	},
	getDefaultProps: function() {
		return {
			context: 'document',
		};
	},

	componentWillReceiveProps: function(nextProps) {
    if (this.props.value !== nextProps.value) {
      const text = nextProps.value;
      if (!this.state.editing) {
        const displayHTML= this.generateHTML(text);
        this.setState({displayHTML});
      }
    }
	},

	componentWillUnmount: function() {
		console.log('unmounted atom!');
	},

  changeToEditing: function() {
    const clientWidth =  ReactDOM.findDOMNode(this.refs.latexElem).getBoundingClientRect().width;
    this.setState({editing: true, clientWidth});
    setTimeout(() => this.refs.input.focus(), 10);
  },

  changeToNormal: function() {
    const displayHTML= this.generateHTML(this.props.value);
    this.setState({editing: false, displayHTML});
  },

  handleChange: function(event) {
    const value = event.target.value;
    // this.setState({value});
    this.props.updateValue(value);
  },

  generateHTML(text) {
    return katex.renderToString(text, {displayMode: this.props.block, throwOnError: false});
  },

  changeToBlock() {

  },

  handleKeyPress: function(e) {
     if (e.key === 'Enter') {
       console.log('do validate');
       this.changeToNormal();
     }
  },


  renderDisplay() {
    const {displayHTML} = this.state;
    const {value} = this.props;
    return (
      <span style={styles.display}>
        <Style rules={ katexStyles } />
        <span ref={'latexElem'}
          onDoubleClick={this.changeToEditing}
          dangerouslySetInnerHTML={{__html: displayHTML}}
          style={styles.output}>
        </span>
      </span>
    );
  },

  renderEdit() {
    const {clientWidth} = this.state;
    const {value} = this.props;
    return (
      <span style={{position: 'relative'}}>
        <input
          ref="input"
          style={styles.editing({clientWidth})}
          onDoubleClick={this.changeToNormal}
          onChange={this.handleChange}
          onKeyPress={this.handleKeyPress}
          type="text" name="name"
          value={value} />
        <div onClick={this.changeToBlock} style={styles.block}>Block</div>
      </span>
    );
  },


	render: function() {
    const {editing} = this.state;
    if (editing) {
      return this.renderEdit();
    }
		return this.renderDisplay();
	}
});

styles = {
  wrapper: {
    backgroundColor: 'blue',
  },
  block: {
    position: 'absolute',
    left: '0px',
    fontSize: '15px',
    border: '1px solid black',
    borderRadius: '1px',
    width: '100px',
    height: '25px',
    lineHeight: '25px',
    width: 'auto',
    padding: '3px 6px',
    marginTop: '5px',
    cursor: 'pointer',
  },
  display: {
    fontSize: '0.9em',
  },
  editing: function({clientWidth}) {
    return {
      display: 'inline',
      width: Math.round(clientWidth),
      minWidth: '100px',
      fontSize: '12px',
      margin: '0px',
      padding: '0px',
      lineHeight: '1em',
      border: 'none',
      outline: '2px solid #BBBDC0',
      borderRadius: 'none',
    }
  },
};

export default LatexEditor;
