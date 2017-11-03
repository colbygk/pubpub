import React, { PropTypes } from 'react';
import Radium from 'radium';
import { Link } from 'react-router';
import AutocompleteBar from 'components/AutocompleteBar/AutocompleteBar';
import DropdownButton from 'components/DropdownButton/DropdownButton';
import request from 'superagent';
import dateFormat from 'dateformat';
import { Menu, Button } from '@blueprintjs/core';
import { globalStyles } from 'utils/globalStyles';
import { postReviewer, getUserJournals } from './actionsReviewers';

let styles;

export const PubReviewers = React.createClass({
	propTypes: {
		pub: PropTypes.object,
		invitedReviewers: PropTypes.array,
		accountUser: PropTypes.object,
		discussionsData: PropTypes.array,
		isLoading: PropTypes.bool,
		pathname: PropTypes.string,
		query: PropTypes.object,
		dispatch: PropTypes.func,
	},

	getInitialState: function() {
		return {
			newReviewer: null,
			newReviewerEmail: '',
			newReviewerName: '',
			inviteByEmail: false,
		};
	},

	componentWillMount() {
		const accountUser = this.props.accountUser || {};
		if (accountUser.id) {
			this.props.dispatch(getUserJournals(accountUser.id));
		}
	},
	componentWillReceiveProps(nextProps) {
		const prevReviewers = this.props.invitedReviewers || [];
		const nextReviewers = nextProps.invitedReviewers || [];

		if (prevReviewers.length < nextReviewers.length) {
			this.setState({ newReviewer: null });
		}

		const prevAccountUser = this.props.accountUser || {};
		const nextAccountUser = this.props.accountUser || {};
		if (!prevAccountUser.id && nextAccountUser.id) {
			this.props.dispatch(getUserJournals(nextAccountUser.id));
		}
	},

	loadOptions: function(input, callback) {
		if (input.length < 3) {
			callback(null, { options: null });
		}
		request.get('https://v2-api.pubpub.org/search/user?q=' + input).end((err, response)=>{
			const responseArray = (response && response.body) || [];
			const options = responseArray.map((item)=>{
				return {
					value: item.username,
					label: item.firstName + ' ' + item.lastName,
					slug: item.username,
					image: item.avatar,
					id: item.id,
				};
			});
			callback(null, { options: options });
		});
	},
	handleSelectChange: function(value) {
		this.setState({ newReviewer: value });
	},

	inviteReviewer: function() {
		const email = null;
		const name = null;
		const inviterJournal = this.state.inviterJournal || {};
		const inviterJournalId = inviterJournal.id || null;
		this.props.dispatch(postReviewer(email, name, this.props.pub.id, this.state.newReviewer.id, inviterJournalId));
	},

	newReviewerEmailChange: function(evt) {
		this.setState({ newReviewerEmail: evt.target.value });
	},
	newReviewerNameChange: function(evt) {
		this.setState({ newReviewerName: evt.target.value });
	},

	handleEmailInvite: function(evt) {
		evt.preventDefault();
		// console.log('sending invite to ', this.state.newReviewerEmail);
		const email = this.state.newReviewerEmail;
		const name = this.state.newReviewerName;
		const inviterJournal = this.state.inviterJournal || {};
		const inviterJournalId = inviterJournal.id || null;
		const invitedUserId = null;
		if (!email || !name) {
			return this.setState({ errorMessage: 'Both email and name are required' });
		}
		this.setState({ errorMessage: undefined });
		return this.props.dispatch(postReviewer(email, name, this.props.pub.id, invitedUserId, inviterJournalId));
	},
	setJournal: function(journal) {
		this.setState({ inviterJournal: journal });
	},

	toggleInviteByEmail: function() {
		this.setState({ inviteByEmail: !this.state.inviteByEmail });
	},

	render: function() {
		const invitedReviewers = this.props.invitedReviewers || [];
		const discussionsData = this.props.discussionsData || [];
		const accountUser = this.props.accountUser || {};
		const accountJournalAdmins = accountUser.journalAdmins || [];
		const accountJournals = accountJournalAdmins.map((journalAdmin)=> {
			return journalAdmin.journal;
		});
		const currentInviterJournal = this.state.inviterJournal || {};

		const pub = this.props.pub || {};
		const versions = pub.versions || [];
		const canInvite = versions.reduce((previous, current)=> {
			if (current.isPublished || current.isRestricted) { return true; }
			return previous;
		}, false);

		return (
			<div style={styles.container}>
				<h2>Reviewers</h2>

				{/*<div style={{ position: 'fixed', top: '20px', right: '20px'}}>
					<div className={'pt-card pt-elevation-3'}>Hey you're invited!</div>
				</div>*/}

				{!!accountUser.id &&
					<div>
						{!canInvite &&
							<div className={'pt-callout pt-intent-danger'} style={{ margin: '1em 0em' }}>Pubs must have at least one published or restricted version to invite a reviewer. Go to <Link to={`/pub/${pub.slug}/versions`}>Versions</Link> to update.</div>
						}
						<div style={canInvite ? {} : styles.disabled}>
							<div style={styles.invitingAsTable}>
								<div style={styles.invitingAs}>
									<div style={styles.invitingText}>Inviting as:</div>
									<img src={accountUser.avatar} style={{ maxWidth: '35px' }} />	
								</div>
								{!!accountJournals.length &&
									<div style={styles.invitingOnBehalf}>
										<div style={styles.invitingText}>On behalf of:</div>
										<div>
											<DropdownButton 
												content={
													<Menu>
														<li key={'authorFilter-null'} onClick={this.setJournal.bind(this, undefined)} className="pt-menu-item pt-popover-dismiss">None</li>
														{accountJournals.map((journal, index)=> {
															return (
																<li key={'authorFilter-' + index} onClick={this.setJournal.bind(this, journal)} className="pt-menu-item pt-popover-dismiss">
																	<img src={journal.avatar} style={{ maxWidth: '35px', verticalAlign: 'middle', marginRight: '0.5em' }} />
																	{journal.title}
																</li>
															);
														})}
													</Menu>
												} 
												title={
													<span>
														{!!currentInviterJournal.id &&
															<span>
																<img src={currentInviterJournal.avatar} style={{ maxWidth: '35px', verticalAlign: 'middle', marginRight: '0.5em' }} /> {currentInviterJournal.title}
															</span>
														}
														{!currentInviterJournal.id &&
															<span style={styles.placeholder}>
																Select Journal
															</span>
														}
													</span>
												} 
												style={{ paddingLeft: '0px' }}
												position={0} />
										</div>	
									</div>
								}
							</div>

					
							{!this.state.inviteByEmail &&
								<div>
									<AutocompleteBar
										filterOptions={(options)=>{
											// Remove if invited, or if an existing contributor on the work.

											return options.filter((option)=>{
												for (let index = 0; index < invitedReviewers.length; index++) {
													if (invitedReviewers[index].invitedUserId === option.id) {
														return false;
													}
												}
												return true;
											});
										}}
										placeholder={'Find New Reviewer'}
										loadOptions={this.loadOptions}
										value={this.state.newReviewer}
										onChange={this.handleSelectChange}
										onComplete={this.inviteReviewer}
										completeDisabled={!this.state.newReviewer || !this.state.newReviewer.id}
										completeLoading={this.props.isLoading}
										completeString={'Invite'}
									/>
									<div style={[styles.emailToggleText, { marginTop: '-1em' }]} className={'pt-button pt-minimal'} onClick={this.toggleInviteByEmail}>
										Invite by email
									</div>
								</div>
								
							}
							{this.state.inviteByEmail &&
								<div>
									<form onSubmit={this.handleEmailInvite} style={styles.inviteEmailForm}>
										<label htmlFor={'email'}>
											Email
											<input className={'pt-input margin-bottom'} id={'email'} name={'email'} type="email" style={styles.input} value={this.state.newReviewerEmail} onChange={this.newReviewerEmailChange} placeholder={'example@email.com'} />
										</label>
										<label htmlFor={'name'}>
											Name
											<input className={'pt-input margin-bottom'} id={'name'} name={'name'} type="text" style={styles.input} value={this.state.newReviewerName} onChange={this.newReviewerNameChange} placeholder={'Jane Doe'} />
										</label>

										<Button text={'Send Email Invitation'} className={'pt-button pt-intent-primary'} onClick={this.handleEmailInvite} loading={this.props.isLoading} />
										<span style={styles.errorMessage}>{this.state.errorMessage}</span>
									</form>
									<div style={styles.emailToggleText} className={'pt-button pt-minimal'} onClick={this.toggleInviteByEmail}>
										Invite existing PubPub users
									</div>
								</div>
							}
						</div>
					</div>
				}

				{!accountUser.id &&
					<div className={'pt-callout'}>You must be logged in to Invite Reviewers.</div>
				}

				<div style={styles.invitedReviewers}>

					{invitedReviewers.map((reviewer, index)=> {
						const invitedUser = reviewer.invitedUser;
						const inviterUser = reviewer.inviterUser;
						const inviterJournal = reviewer.inviterJournal;
						const discussionCount = discussionsData.reduce((previous, current)=> {
							if (!invitedUser) { return previous; }
							const children = current.children || [];
							const discussionAuthors = [
								current.contributors[0].user.username,
								...children.map((child)=> {
									return child.contributors[0].user.username;
								})
							];
							return previous + Number(discussionAuthors.includes(invitedUser.username));
						}, 0);

						return (
							<div key={'reviewer-' + index} style={styles.invitationWrapper}>
								{!!invitedUser &&
									<div style={styles.invitedReviewerWrapper}>
										<div style={styles.reviewerImageWrapper}>
											<Link to={'/user/' + invitedUser.username}>
												<img alt={invitedUser.firstName + ' ' + invitedUser.lastName} src={'https://jake.pubpub.org/unsafe/50x50/' + invitedUser.avatar} />	
											</Link>
										</div>
										
										<div style={styles.reviewerDetails}>
											<div style={styles.reviewerName}>
												<Link to={'/user/' + invitedUser.username}>{invitedUser.firstName + ' ' + invitedUser.lastName}</Link>
												<span style={styles.reviewerStatus}>({!reviewer.invitationAccepted && !reviewer.invitationRejected && 'Pending'}{reviewer.invitationAccepted && 'Accepted'}{reviewer.invitationRejected && 'Rejected'}{reviewer.rejectionReason && `: ${reviewer.rejectionReason}`})</span>
											</div>
											<div>Invited on {dateFormat(reviewer.createdAt, 'mmm dd, yyyy')} · <Link to={{ pathname: this.props.pathname, query: { ...this.props.query, panel: undefined, label: undefined, sort: undefined, author: invitedUser.username } }}>{discussionCount} discussions</Link> </div>
										</div>
									</div>
								}
								{!invitedUser &&
									<div style={styles.invitedReviewerWrapper}>
										<div style={styles.reviewerImageWrapper}>
											<span>
												<img style={{ width: '50px' }} alt={reviewer.name} src={'http://icons.iconarchive.com/icons/uiconstock/socialmedia/256/Email-icon.png'} />	
											</span>
										</div>
										
										<div style={styles.reviewerDetails}>
											<div style={styles.reviewerName}>
												<span>{reviewer.name}</span>
												<span style={styles.reviewerStatus}>(Pending)</span>
											</div>
											<div>Invited on {dateFormat(reviewer.createdAt, 'mmm dd, yyyy')}</div>
										</div>
									</div>
								}
								<div>
									<Link to={'/user/' + inviterUser.username}>
										<img alt={inviterUser.firstName + ' ' + inviterUser.lastName} src={'https://jake.pubpub.org/unsafe/50x50/' + inviterUser.avatar} style={styles.inviterImage} />	
									</Link>
									Invited by <Link to={'/user/' + inviterUser.username}>{inviterUser.firstName + ' ' + inviterUser.lastName}</Link>
									{!!inviterJournal &&
										<div>
											<Link to={'/' + inviterJournal.slug}>
												<img alt={inviterJournal.title} src={'https://jake.pubpub.org/unsafe/50x50/' + inviterJournal.avatar} style={styles.inviterImage} />	
											</Link>
											on behalf of <Link to={'/' + inviterJournal.slug}>{inviterJournal.title}</Link>
										</div>
									}
									
								</div>
							</div>
						);
					})}
				</div>
			</div>
		);
	}
});

export default Radium(PubReviewers);

styles = {
	container: {
		
	},
	invitingAsTable: {
		display: 'table',
	},
	invitingAs: {
		display: 'table-cell',
		width: '1%',
		whiteSpace: 'nowrap',
		paddingRight: '1em',
	},
	invitingOnBehalf: {
		display: 'table-cell',
	},
	invitingText: {
		
	},
	placeholder: {
		opacity: '0.5',
		paddingLeft: '10px',
	},
	inviteEmailForm: {
		margin: '1em 0em',
	},
	emailToggleText: {
		padding: 0,
		color: '#555',
		marginTop: '-1em',
	},
	disabled: {
		pointerEvents: 'none',
		opacity: '0.5',
	},
	input: {
		width: 'calc(100% - 20px - 4px)', // Calculations come from padding and border in pubpub.css
	},
	invitedReviewers: {
		marginTop: '2em',
	},
	invitationWrapper: {
		padding: '0em 0em 1em',
		borderBottom: '1px solid #CCC',
		margin: '0em 0em 1em',
	},
	reviewerStatus: {
		fontWeight: 'normal',
		opacity: '0.75',
		padding: '0em 1em',
	},
	invitedReviewerWrapper: {
		display: 'table',
		width: '100%',
	},
	reviewerImageWrapper: {
		width: '50px',
		display: 'table-cell',
	},
	reviewerDetails: {
		display: 'table-cell',
		padding: '0em .25em',
		verticalAlign: 'top',
	},
	reviewerName: {
		padding: '.25em 0em',
		fontWeight: 'bold',
	},
	inviterImage: {
		width: '25px',
		verticalAlign: 'middle',
		padding: '.25em 0em',
		marginRight: '.25em',
	},
	errorMessage: {
		padding: '0px 10px',
		color: globalStyles.errorRed,
	},
};
