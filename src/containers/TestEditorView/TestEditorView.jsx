import {Media, MediaFiltered} from 'components';
import React, { PropTypes } from 'react';

import {FormattedMessage} from 'react-intl';
import Radium from 'radium';
import {RichEditor} from 'components/AtomTypes/Document/proseEditor';
import {connect} from 'react-redux';

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

		this.editor1 = new RichEditor({place: place1, text: "# what \n heyyyyyyy \n# what \n ## hi \n # hi"});

	},


	render: function() {
		return (
			<div style={{position: 'relative'}}>
				<div style={[styles.editor, {display:'inline-block'}]} id="richeditor1">
				</div>
				<MediaFiltered ref={'mediaRef'}/>
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
	editor: {
		width: '40vw',
		padding: '0px 2vw',
		// position: 'absolute',
	},
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
