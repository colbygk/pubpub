import React, { PropTypes } from 'react';
import Radium from 'radium';
import {globalStyles} from '../../utils/styleConstants';
import {Autocomplete} from '../../containers';
import { Link } from 'react-router';
const HoverLink = Radium(Link);

let styles = {};

const LandingComponentBlock = React.createClass({
	propTypes: {
		style: PropTypes.object,
		showBottomLine: PropTypes.bool,
	},

	renderLandingSearchResults: function(results) {
		// console.log(results);
		return (
			<div style={styles.results}>
				{

					results.map((item, index)=>{
						const url = item.slug ? '/pub/' + item.slug : '/user/' + item.username;
						const type = item.slug ? 'pub' : 'user';
						return (<div key={'landingSearchResult-' + index} style={styles.result}>
							<HoverLink key={'landingSearchResultLink-' + index} style={styles.resultLink} to={url}>
								<div style={styles.type}>{type}</div>
								<div style={[styles.imageWrapper, styles[type].imageWrapper]}>
									<img style={styles.image} src={item.thumbnail} />
								</div>
								<div style={styles.name}>{item.name}</div>
								<div style={styles.name}>{item.title}</div>
							</HoverLink>

						</div>);	
					})
				}

				{results.length === 0
					? <div style={styles.noResults}>No Results</div>
					: null
				}
			</div>
		);
	},

	render: function() {
		return (
			<div style={[styles.container, this.props.style]}>
				<Autocomplete 
					autocompleteKey={'landingSearch'} 
					route={'autocompletePubsAndUsers'} 
					placeholder="Search Pubs and People" 
					height={40}
					showBottomLine={this.props.showBottomLine !== undefined ? this.props.showBottomLine : true}
					hideResultsOnClickOut={false}
					resultRenderFunction={this.renderLandingSearchResults}
					loaderOffset={-20}
					padding={'10px 0px'}/>
			</div>
		);
	}
});

export default Radium(LandingComponentBlock);

styles = {
	container: {
		width: 'calc(100% - 60px)',
		padding: '10px 30px',
		// backgroundColor: 'transparent',
		color: '#888',
	},
	results: {
		// backgroundColor: 'rgba(255,90,80,0.3)',
		margin: '9px 0px',
	},
	result: {
		padding: '10px 0px',
		// backgroundColor: 'rgba(100,200,49,0.5)',
		height: 40,
		borderTop: '1px solid #DDD',
	},
	imageWrapper: {
		float: 'left',
		height: 40,
		margin: '0px 10px 0px 0px',
	},
	pub: {
		imageWrapper: {
			display: 'none',
		},
	},
	user: {
	},
	image: {
		height: '100%',
	},
	
	type: {
		width: 40,
		float: 'left',
		fontSize: '15px',
		fontFamily: 'Courier',
		lineHeight: '40px',
		padding: '0px 25px 0px 0px',
		color: globalStyles.veryLight,
	},
	name: {
		float: 'left',
		fontSize: '20px',
		lineHeight: '40px',
		padding: '0px 10px 0px 0px',
	},
	noResults: {
		fontSize: '25px',
		height: 30,
		lineHeight: '30px',
		textAlign: 'center',
	},
	resultLink: {
		display: 'inline-block',
		height: '100%',
		color: globalStyles.sideText,
		':hover': {
			color: globalStyles.sideHover,
		},
	},
};
