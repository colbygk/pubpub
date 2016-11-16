import React, { PropTypes } from 'react';
import {follow, unfollow} from './actions';

import {FormattedMessage} from 'react-intl';
import { Link } from 'react-router';
import Radium from 'radium';
import {RichEditor} from 'components/AtomTypes/Document/proseEditor/richEditor';
import {connect} from 'react-redux';
import {globalMessages} from 'utils/globalMessages';

// import {globalStyles} from 'utils/styleConstants';
var jsondiffpatch = require('jsondiffpatch').create({textDiff: {minLength: 3}});
var diffchangeset = require('changeset');
var {diff} = require('json-diff');

let styles = {};

export const DiffView = React.createClass({
	propTypes: {
	},

	getInitialState() {
		return {
			isFollowing: false,
		};
	},

	componentWillMount() {
	},

	componentDidMount() {

		const place1 = document.getElementById('richeditor1');
		const place2 = document.getElementById('richeditor2');
		console.log(place1);

		this.editor1 = new RichEditor({place: place1, text: "# what \n heyyyyyyy55 \n ### hi \n # ho"});
		// this.editor2 = new RichEditor({place: place2, text: "# what \n heyyyyyyy \n ## hi \n # hi"});

		// window.setTimeout(this.compareDiffs, 5000);

	},

	compareDiffs() {
		const a = this.editor1.toJSON();
		const b = this.editor2.toJSON();

		this.editor1.view.update({decorations: function() {console.log('TRYIGN THIS'); return null;}});

		console.log(b);

		var delta = jsondiffpatch.diff(a, b);
		console.log('json diff:' , delta);
		var changes = diff(a, b);
		console.log('json diff2: ', changes);
		var changes2 = diffchangeset(a, b);
		console.log('json diff2: ', changes2);
	},


	render: function() {
		return (
			<div>
				<div id="richeditor1">
				</div>
				<div id="richeditor2">
				</div>
			</div>
		);
	}

});

export default connect( state => {
	return {
		followButtonData: state.followButton,
		loginData: state.login,
		path: state.router.location.pathname,
	};
})( Radium(DiffView) );

styles = {
	followButton: {
		padding: '0em 1em ',
		fontSize: '0.85em',
		position: 'relative',
	},
	loginMessage: {
		position: 'absolute',
		zIndex: 2,
		left: 0,
		top: 0,
		right: 0,
		bottom: 0,
		backgroundColor: '#2C2A2B',
		textDecoration: 'none',
		color: 'inherit',
		textAlign: 'center',
		padding: 0,
	}
};
