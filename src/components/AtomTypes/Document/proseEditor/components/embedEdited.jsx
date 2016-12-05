import React, {PropTypes} from 'react';

import ReactDOM from 'react-dom';
import Resizable from 'react-resizable-box';
import TextArea from 'react-textarea-autosize';

// import EmbedEditor from './EmbedEditor';

// import {safeGetInToJS} from 'utils/safeParse';

let styles = {};

export const EmbedEdited = React.createClass({
	propTypes: {
		imageSource: PropTypes.string,

		align: PropTypes.oneOf(['inline', 'full', 'left', 'right', 'inline-word']),
		size: PropTypes.string,
		caption: PropTypes.string,
		citeCount: PropTypes.number,
		context: PropTypes.oneOf(['reference-list', 'document', 'library']), // where the embed is being used
		nodeId: PropTypes.number,

    updateAttrs: PropTypes.func,
	},
	getInitialState: function() {
		return {
			selected: false,
		};
	},
	getDefaultProps: function() {
		return {
			context: 'document',
		};
	},

	componentWillUpdate: function(nextProps, nextState) {
	},

	componentWillUnmount: function() {
		console.log('unmounted atom!');
	},

	getSize: function() {
		const elem = ReactDOM.findDOMNode(this.refs.menupointer);
		return {
			width: elem.clientWidth,
			left: elem.offsetLeft,
			top: elem.offsetTop,
		};
	},

	setCiteCount: function(citeCount) {
		this.setState({citeCount});
		this.forceUpdate();
	},

	setSelected: function(selected) {
		console.log('update selected!', selected);
		this.setState({selected});
	},

	updateAttrs: function(newAttrs) {
		this.props.updateAttrs(newAttrs);
	},

	focusCaption: function() {
		this.refs.captionInput.focus();
	},

	typeNewCaption: function() {
		const newCaption = this.refs.captionInput.value;
		this.updateAttrs({caption: newCaption});
	},

	render: function() {
		const {size, caption, align, source} = this.props;
		const {selected} = this.state;

		const data = this.props.data || {};
		// Data is the version object with a populated parent field.
		// The parent field is the atomData field


		return (
			<div ref="embedroot" style={styles.outline({selected})} className={'pub-embed ' + this.props.className}>
				<figure style={styles.figure({size, align})}>
				<div style={{width: size, position: 'relative', display: 'table-row'}}>
				<Resizable
					width={'100%'}
					height={'auto'}
					maxWidth={650}
					customStyle={styles.outline({false})}
					onResizeStop={(direction, styleSize, clientSize, delta) => {
						const ratio = (clientSize.width / 650) * 100;
						this.updateAttrs({size: ratio + '%' });
					}}>
						<img draggable="false" style={styles.image} src={source}></img>
				</Resizable>
			</div>
			<figcaption style={styles.caption({size, align})}>
				 <TextArea
					 ref="captionInput"
					 style={styles.captionInput}
					 onChange={this.typeNewCaption}
					 onKeyPress={this.handleKeyPress}
					 value={caption}
					 />
				{/*
					<span
						className="caption"
						ref="captionInput"
						contentEditable="true"
						onKeyPress={this.typeNewCaption}
						style={styles.captionText({align: this.props.align})}>
						{this.props.caption}
					</span>
					*/}
			</figcaption>
			</figure>
			</div>
		);
	}
});

styles = {
	image: {
		width: '100%',
	},
	captionInput: {
		width: '100%',
		border: 'none',
		fontSize: '1em'
	},
	embed: function({size}) {

		const style = {
			zIndex: 10000,
			pointerEvents: 'all',
			position: 'absolute',
			minWidth: '200px',
			width: `calc(${size} * 0.8)`,
			margin: `0 calc(${size} * 0.1)`,
		};

		const parsedSize = parseInt(size);
		const realSize = 650 * (parsedSize / 100);
		if (realSize * 0.8 < 200) {
			const newMargin = Math.round((realSize - 200) / 2);
			style.margin = `0 ${newMargin}px`
		}
		return style;
	},
	button: {
		padding: '0em 0em',
		height: '0.75em',
		width: '0.75em',
		position: 'relative',
		top: '-0.15em',
		verticalAlign: 'middle',
		display: 'inline-block',
		cursor: 'pointer',
		// border: 'none'
	},
	hover: {
		minWidth: '275px',
		padding: '1em',
		fontSize: '0.85em'
	},
	number: {
		display: 'inline-block',
		height: '100%',
		verticalAlign: 'top',
		position: 'relative',
		top: '-0.45em',
		fontSize: '0.85em',
	},
	outline: function({selected}) {
		return {
			outline: (selected) ? '3px solid #BBBDC0' : '3px solid transparent',
			transition: 'outline-color 0.15s ease-in',
			paddingTop: '10px',

		};
	},
	figure: function({size, align, selected}) {
		const style = {
			width: size,
			display: 'table',
		};
		if (align === 'left') {
			style.float = 'left';
		} else if (align === 'right') {
			style.float = 'right';
		} else if (align === 'full') {
			style.margin = '0 auto';
		}
 		return style;
	},
	caption: function({size, align}) {
		const style = {
			width: size,
			display: 'table-row',
		};
		return style;
	},
	captionText: function({align}) {
		const style = {
			width: '100%',
			display: 'inline-block',
		};
		return style;
	}
};

export default EmbedEdited;
