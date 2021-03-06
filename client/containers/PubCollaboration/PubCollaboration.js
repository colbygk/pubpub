import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { NonIdealState } from '@blueprintjs/core';
import Overlay from 'components/Overlay/Overlay';
import PubCollabEditor from 'components/PubCollabEditor/PubCollabEditor';
import PubCollabHeader from 'components/PubCollabHeader/PubCollabHeader';
import PubCollabShare from 'components/PubCollabShare/PubCollabShare';
import PubCollabPublish from 'components/PubCollabPublish/PubCollabPublish';
import PubCollabSubmit from 'components/PubCollabSubmit/PubCollabSubmit';
import PubCollabDetails from 'components/PubCollabDetails/PubCollabDetails';
import PubCollabCollections from 'components/PubCollabCollections/PubCollabCollections';
import DiscussionNew from 'components/DiscussionNew/DiscussionNew';
import DiscussionPreview from 'components/DiscussionPreview/DiscussionPreview';
import DiscussionPreviewArchived from 'components/DiscussionPreviewArchived/DiscussionPreviewArchived';
import DiscussionThread from 'components/DiscussionThread/DiscussionThread';
import PageWrapper from 'components/PageWrapper/PageWrapper';
import { apiFetch, hydrateWrapper, nestDiscussionsToThreads, getRandomColor, generateHash } from 'utilities';


require('./pubCollaboration.scss');
require('components/PubBody/pubBody.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	loginData: PropTypes.object.isRequired,
	locationData: PropTypes.object.isRequired,
	pubData: PropTypes.object.isRequired,

};

class PubCollaboration extends Component {
	constructor(props) {
		super(props);
		const loginData = props.loginData;
		const loginId = loginData.id || `anon-${Math.floor(Math.random() * 9999)}`;
		const userColor = getRandomColor(loginId);
		this.localUser = {
			id: loginId,
			backgroundColor: `rgba(${userColor}, 0.2)`,
			cursorColor: `rgba(${userColor}, 1.0)`,
			image: loginData.avatar || null,
			name: loginData.fullName || 'Anonymous',
			initials: loginData.initials || '?',
		};

		this.state = {
			isPublishOpen: false,
			isSubmitOpen: false,
			isShareOpen: false,
			isDetailsOpen: false,
			isCollaboratorsOpen: false,
			isCollectionsOpen: false,
			isArchivedVisible: false,
			activeCollaborators: [this.localUser],
			initNewDoc: undefined,
			collabStatus: 'connecting',

			thread: undefined,
			pubData: this.props.pubData,
			putPubIsLoading: false,
			deletePubIsLoading: false,
			postDiscussionIsLoading: false,
			postVersionIsLoading: false,
			docReadyForHighlights: false,
		};
		this.editorRef = undefined;
		this.togglePublish = this.togglePublish.bind(this);
		this.toggleSubmit = this.toggleSubmit.bind(this);
		this.toggleShare = this.toggleShare.bind(this);
		this.toggleDetails = this.toggleDetails.bind(this);
		this.toggleCollaborators = this.toggleCollaborators.bind(this);
		this.toggleCollections = this.toggleCollections.bind(this);
		this.toggleArchivedVisible = this.toggleArchivedVisible.bind(this);
		this.handleDetailsSave = this.handleDetailsSave.bind(this);
		this.handlePubDelete = this.handlePubDelete.bind(this);
		this.handlePostDiscussion = this.handlePostDiscussion.bind(this);
		this.handlePutDiscussion = this.handlePutDiscussion.bind(this);
		this.handleCollaboratorAdd = this.handleCollaboratorAdd.bind(this);
		this.handleCollaboratorUpdate = this.handleCollaboratorUpdate.bind(this);
		this.handleCollaboratorDelete = this.handleCollaboratorDelete.bind(this);
		this.onOpenShare = this.onOpenShare.bind(this);
		this.onOpenDetails = this.onOpenDetails.bind(this);
		this.onOpenCollaborators = this.onOpenCollaborators.bind(this);
		this.handlePublish = this.handlePublish.bind(this);
		this.handleClientChange = this.handleClientChange.bind(this);
		this.handleAddCollection = this.handleAddCollection.bind(this);
		this.handleNewHighlightDiscussion = this.handleNewHighlightDiscussion.bind(this);
		this.handleRemoveCollection = this.handleRemoveCollection.bind(this);
		this.handleHighlightClick = this.handleHighlightClick.bind(this);
		this.getHighlightContent = this.getHighlightContent.bind(this);
		this.handleStatusChange = this.handleStatusChange.bind(this);
		this.handleThreadClick = this.handleThreadClick.bind(this);
		this.handleEditorRef = this.handleEditorRef.bind(this);
	}

	onOpenShare() {
		this.setState({
			isShareOpen: true,
			isDetailsOpen: false,
			isCollaboratorsOpen: false,
			isPublishOpen: false,
		});
	}
	onOpenDetails() {
		this.setState({
			isShareOpen: false,
			isDetailsOpen: true,
			isCollaboratorsOpen: false,
			isPublishOpen: false,
		});
	}
	onOpenCollaborators() {
		this.setState({
			isShareOpen: false,
			isDetailsOpen: false,
			isCollaboratorsOpen: true,
			isPublishOpen: false,
		});
	}
	getHighlightContent(from, to) {
		const primaryEditorState = this.editorRef.state.editorState;
		if (primaryEditorState.doc.nodeSize < from || primaryEditorState.doc.nodeSize < to) { return {}; }
		const exact = primaryEditorState.doc.textBetween(from, to);
		const prefix = primaryEditorState.doc.textBetween(Math.max(0, from - 10), Math.max(0, from));
		const suffix = primaryEditorState.doc.textBetween(Math.min(primaryEditorState.doc.nodeSize - 2, to), Math.min(primaryEditorState.doc.nodeSize - 2, to + 10));
		return {
			exact: exact,
			prefix: prefix,
			suffix: suffix,
			from: from,
			to: to,
			version: undefined,
			id: `h${generateHash(8)}`, /* Has to start with letter since it's a classname */
		};
	}
	togglePublish() {
		this.setState({ isPublishOpen: !this.state.isPublishOpen });
	}
	toggleSubmit() {
		this.setState({ isSubmitOpen: !this.state.isSubmitOpen });
	}
	toggleShare() {
		this.setState({ isShareOpen: !this.state.isShareOpen });
	}
	toggleDetails() {
		this.setState({ isDetailsOpen: !this.state.isDetailsOpen });
	}
	toggleCollaborators() {
		this.setState({ isCollaboratorsOpen: !this.state.isCollaboratorsOpen });
	}
	toggleCollections() {
		this.setState({ isCollectionsOpen: !this.state.isCollectionsOpen });
	}
	toggleArchivedVisible() {
		this.setState({ isArchivedVisible: !this.state.isArchivedVisible });
	}
	handleNewHighlightDiscussion(highlightObject) {
		this.setState({
			thread: 'new',
			initNewDoc: {
				type: 'doc',
				attrs: { meta: {} },
				content: [
					{ type: 'highlightQuote', attrs: { ...highlightObject, id: `h${generateHash(8)}` } },
					{ type: 'paragraph', content: [] },
				]
			}
		});
	}
	handleHighlightClick(threadNumber) {
		this.setState({ thread: threadNumber });
	}
	handleDetailsSave(detailsObject) {
		this.setState({ putPubIsLoading: true });
		return apiFetch('/api/pubs', {
			method: 'PUT',
			body: JSON.stringify({
				...detailsObject,
				pubId: this.props.pubData.id,
				communityId: this.props.communityData.id,
			})
		})
		.then((result)=> {
			/* Load new URL if slug changes */
			if (detailsObject.slug && detailsObject.slug !== this.props.locationData.params.slug) {
				window.location.href = `/pub/${detailsObject.slug}/collaborate`;
			} else {
				this.setState({
					isDetailsOpen: false,
					putPubIsLoading: false,
					pubData: { ...this.state.pubData, ...result },
				});
			}
		})
		.catch(()=> {
			this.setState({ putPubIsLoading: false });
		});
	}
	handlePubDelete(pubId) {
		this.setState({ deletePubIsLoading: true });
		return apiFetch('/api/pubs', {
			method: 'DELETE',
			body: JSON.stringify({
				pubId: pubId,
				communityId: this.props.communityData.id,
			})
		})
		.then(()=> {
			window.location.href = '/';
		})
		.catch(()=> {
			this.setState({ deletePubIsLoading: false });
		});
	}
	handlePostDiscussion(discussionObject) {
		this.setState({ postDiscussionIsLoading: true });
		return apiFetch('/api/discussions', {
			method: 'POST',
			body: JSON.stringify({
				...discussionObject,
				communityId: this.props.communityData.id,
			})
		})
		.then((result)=> {
			if (this.state.thread !== result.threadNumber) {
				document.getElementsByClassName('side-panel-content')[0].scrollTop = 0;
			}
			this.setState({
				postDiscussionIsLoading: false,
				isSubmitOpen: false,
				thread: result.threadNumber,
				initNewDoc: undefined,
				pubData: {
					...this.state.pubData,
					discussions: [
						...this.state.pubData.discussions,
						result,
					],
				},
			});
		})
		.catch(()=> {
			this.setState({ postDiscussionIsLoading: false });
		});
	}
	handlePutDiscussion(discussionObject) {
		return apiFetch('/api/discussions', {
			method: 'PUT',
			body: JSON.stringify({
				...discussionObject,
				communityId: this.props.communityData.id,
			})
		})
		.then((result)=> {
			this.setState({
				pubData: {
					...this.state.pubData,
					discussions: this.state.pubData.discussions.map((item)=> {
						if (item.id !== result.id) { return item; }
						return {
							...item,
							...result,
						};
					}),
				},
			});
		});
	}
	handleCollaboratorAdd(collaboratorObject) {
		return apiFetch('/api/collaborators', {
			method: 'POST',
			body: JSON.stringify({
				...collaboratorObject,
			})
		})
		.then((result)=> {
			this.setState({
				pubData: {
					...this.state.pubData,
					collaborators: [
						...this.state.pubData.collaborators,
						result,
					]
				},
			});
		});
	}
	handleCollaboratorUpdate(collaboratorObject) {
		return apiFetch('/api/collaborators', {
			method: 'PUT',
			body: JSON.stringify({
				...collaboratorObject,
			})
		})
		.then((result)=> {
			this.setState({
				pubData: {
					...this.state.pubData,
					collaborators: this.state.pubData.collaborators.map((item)=> {
						if (item.Collaborator.id === result.Collaborator.id) {
							return {
								...item,
								fullName: result.fullName || item.fullName,
								Collaborator: {
									...item.Collaborator,
									...result.Collaborator,
								}
							};
						}
						return item;
					})
				},
			});
		});
	}
	handleCollaboratorDelete(collaboratorObject) {
		return apiFetch('/api/collaborators', {
			method: 'DELETE',
			body: JSON.stringify({
				...collaboratorObject,
			})
		})
		.then((result)=> {
			this.setState({
				pubData: {
					...this.state.pubData,
					collaborators: this.state.pubData.collaborators.filter((item)=> {
						return item.Collaborator.id !== result;
					})
				},
			});
		});
	}
	handleAddCollection(addCollectionObject) {
		return apiFetch('/api/collectionPubs', {
			method: 'POST',
			body: JSON.stringify({
				...addCollectionObject,
				communityId: this.props.communityData.id,
			})
		})
		.then((result)=> {
			this.setState({
				pubData: {
					...this.state.pubData,
					collections: [
						...this.state.pubData.collections,
						result,
					]
				},
			});
		});
	}
	handleRemoveCollection(removeCollectionObject) {
		return apiFetch('/api/collectionPubs', {
			method: 'DELETE',
			body: JSON.stringify({
				...removeCollectionObject,
				communityId: this.props.communityData.id,
			})
		})
		.then((result)=> {
			this.setState({
				pubData: {
					...this.state.pubData,
					collections: this.state.pubData.collections.filter((item)=> {
						return item.id !== result;
					})
				},
			});
		});
	}
	handleStatusChange(status) {
		clearTimeout(this.setSavingTimeout);

		/* If loading, wait until 'connected' */
		if (this.state.collabStatus === 'connecting' && status === 'connected') {
			this.setState({ collabStatus: status });
		}
		if (this.state.collabStatus !== 'connecting' && this.state.collabStatus !== 'disconnected') {
			if (status === 'saving') {
				this.setSavingTimeout = setTimeout(()=> {
					this.setState({ collabStatus: status });
				}, 250);
			} else {
				this.setState({ collabStatus: status });
			}
		}
		/* If disconnected, only set state if the new status is 'connected' */
		if (this.state.collabStatus === 'disconnected' && status === 'connected') {
			this.setState({ collabStatus: status });
		}
	}
	handlePublish(submitHash) {
		this.setState({ postVersionIsLoading: true });
		return apiFetch('/api/versions', {
			method: 'POST',
			body: JSON.stringify({
				pubId: this.props.pubData.id,
				communityId: this.props.communityData.id,
				content: this.editorRef.view.state.doc.toJSON(),
				submitHash: submitHash,
			})
		})
		.then(()=> {
			window.location.href = `/pub/${this.props.locationData.params.slug}`;
		})
		.catch(()=> {
			this.setState({ postVersionIsLoading: false });
		});
	}
	handleClientChange(clients) {
		this.setState({
			activeCollaborators: [this.localUser, ...clients]
		});
	}
	handleThreadClick(threadNumber) {
		document.getElementsByClassName('side-panel-content')[0].scrollTop = 0;
		this.setState({
			thread: threadNumber,
		});
	}
	handleEditorRef(ref) {
		this.editorRef = ref;
		/* This timeout is how long we think */
		/* it will take the firebase server to */
		/* initalize the most recent doc and steps. */
		/* It doesn't hurt to be a bit conservative here */
		setTimeout(()=> {
			this.setState({ docReadyForHighlights: true });
		}, 2500);
	}
	render() {
		const queryObject = this.props.locationData.query;

		const pubData = this.state.pubData;
		const loginData = this.props.loginData;
		const discussions = pubData.discussions || [];
		const threads = nestDiscussionsToThreads(discussions);

		const submissionThreadNumber = threads.reduce((prev, curr)=> {
			if (curr[0].submitHash && !curr[0].isArchived) { return curr[0].threadNumber; }
			return prev;
		}, undefined);
		const activeThread = threads.reduce((prev, curr)=> {
			if (curr[0].threadNumber === Number(this.state.thread)) { return curr; }
			return prev;
		}, undefined);

		const activeThreads = threads.filter((items)=> {
			return items.reduce((prev, curr)=> {
				if (curr.isArchived) { return false; }
				return prev;
			}, true);
		}).sort((foo, bar)=> {
			if (foo[0].threadNumber > bar[0].threadNumber) { return -1; }
			if (foo[0].threadNumber < bar[0].threadNumber) { return 1; }
			return 0;
		});

		const archivedThreads = threads.filter((items)=> {
			return items.reduce((prev, curr)=> {
				if (curr.isArchived) { return true; }
				return prev;
			}, false);
		}).sort((foo, bar)=> {
			if (foo[0].threadNumber > bar[0].threadNumber) { return -1; }
			if (foo[0].threadNumber < bar[0].threadNumber) { return 1; }
			return 0;
		});

		let canManage = false;
		if (pubData.localPermissions === 'manage') { canManage = true; }
		if (pubData.adminPermissions === 'manage' && loginData.isAdmin) { canManage = true; }

		let canDelete = false;
		if (canManage && !pubData.firstPublishedAt) { canDelete = true; }
		if (pubData.adminPermissions === 'manage' && loginData.isAdmin) { canDelete = true; }

		const highlights = discussions.filter((item)=> {
			return !item.isArchived && item.highlights;
		}).reduce((prev, curr)=> {
			const highlightsWithThread = curr.highlights.map((item)=> {
				return { ...item, threadNumber: curr.threadNumber };
			});
			return [...prev, ...highlightsWithThread];
		}, []);
		if (this.editorRef && queryObject.from && queryObject.to) {
			highlights.push({
				...this.getHighlightContent(Number(queryObject.from), Number(queryObject.to)),
				permanent: true,
			});
			setTimeout(()=> {
				const thing = document.getElementsByClassName('permanent')[0];
				if (thing) {
					window.scrollTo(0, thing.getBoundingClientRect().top - 135);
				}
			}, 100);
		}

		return (
			<div id="pub-collaboration-container">
				<PageWrapper
					loginData={this.props.loginData}
					communityData={this.props.communityData}
					locationData={this.props.locationData}
					fixHeader={true}
					hideNav={true}
					hideFooter={true}
				>
					<div>
						<div className="upper">
							<div className="container">
								<div className="row">
									<div className="col-12">
										<PubCollabHeader
											pubData={pubData}
											collaborators={pubData.collaborators}
											canManage={canManage}
											isAdmin={loginData.isAdmin}
											activeCollaborators={this.state.activeCollaborators}
											submissionThreadNumber={submissionThreadNumber}
											activeThread={activeThread}
											collabStatus={this.state.collabStatus}
											onPublishClick={this.togglePublish}
											onSubmitClick={this.toggleSubmit}
											onShareClick={this.toggleShare}
											onDetailsClick={this.toggleDetails}
											onCollaboratorsClick={this.toggleCollaborators}
											onCollectionsClick={this.toggleCollections}
											onThreadClick={this.handleThreadClick}
										/>
									</div>
								</div>
							</div>
						</div>
						<div className="lower">
							<div className="container">
								<div className="row">
									<div className="col-12">

										<div className="side-panel">
											<div className="side-panel-content">
												{!this.state.thread &&
													<div className="new-discussion-wrapper">
														<button
															onClick={()=> { this.handleThreadClick('new'); }}
															className="pt-button pt-minimal pt-icon-add top-button"
														>
															New Discussion
														</button>
													</div>
												}
												{this.state.thread === 'new' &&
													<DiscussionNew
														pubId={pubData.id}
														slug={pubData.slug}
														loginData={this.props.loginData}
														pathname={`${this.props.locationData.pathname}${this.props.locationData.queryString}`}
														initialContent={this.state.initNewDoc}
														handleDiscussionSubmit={this.handlePostDiscussion}
														getHighlightContent={this.getHighlightContent}
														submitIsLoading={this.state.postDiscussionIsLoading}
														setThread={this.handleThreadClick}
													/>
												}
												{this.state.thread !== 'new' && !activeThread &&
													<div>
														{activeThreads.map((thread)=> {
															return (
																<DiscussionPreview
																	key={`thread-${thread[0].id}`}
																	discussions={thread}
																	onPreviewClick={this.handleThreadClick}
																/>
															);
														})}
														{!!archivedThreads.length &&
															<div className="archived-threads">
																<button className="pt-button pt-minimal pt-large pt-fill archive-title-button" onClick={this.toggleArchivedVisible}>
																	{this.state.isArchivedVisible ? 'Hide ' : 'Show '}
																	Archived Thread{archivedThreads.length === 1 ? '' : 's'} ({archivedThreads.length})
																</button>
																{this.state.isArchivedVisible && archivedThreads.map((thread)=> {
																	return (
																		<DiscussionPreviewArchived
																			key={`thread-${thread[0].id}`}
																			discussions={thread}
																			onPreviewClick={this.handleThreadClick}
																		/>
																	);
																})}
															</div>
														}
													</div>
												}
												{activeThread &&
													<DiscussionThread
														discussions={activeThread}
														canManage={pubData.localPermissions === 'manage' || (this.props.loginData.isAdmin && pubData.adminPermissions === 'manage')}
														slug={pubData.slug}
														loginData={this.props.loginData}
														pathname={`${this.props.locationData.pathname}${this.props.locationData.search}`}
														handleReplySubmit={this.handlePostDiscussion}
														handleReplyEdit={this.handlePutDiscussion}
														submitIsLoading={this.state.postDiscussionIsLoading}
														onPublish={this.handlePublish}
														publishIsLoading={this.state.postVersionIsLoading}
														getHighlightContent={this.getHighlightContent}
														hoverBackgroundColor={this.props.communityData.accentMinimalColor}
														setThread={this.handleThreadClick}
													/>
												}
												{threads.length === 0 && !this.state.thread &&
													<NonIdealState
														title="Start the Conversation"
														visual="pt-icon-chat"
														action={
															<button
																onClick={()=> { this.handleThreadClick('new'); }}
																className="pt-button"
															>
																Create New Discussion
															</button>
														}
													/>
												}
											</div>
										</div>

										<div
											className="content-panel"
											tabIndex={-1}
											role="textbox"
										>
											{this.state.collabStatus === 'connecting' &&
												<div className="collaborative-loading">
													<div className="loading pt-skeleton" style={{ width: '95%', height: '1.2em', marginBottom: '1em' }} />
													<div className="loading pt-skeleton" style={{ width: '85%', height: '1.2em', marginBottom: '1em' }} />
													<div className="loading pt-skeleton" style={{ width: '90%', height: '1.2em', marginBottom: '1em' }} />
													<div className="loading pt-skeleton" style={{ width: '80%', height: '1.2em', marginBottom: '1em' }} />
													<div className="loading pt-skeleton" style={{ width: '82%', height: '1.2em', marginBottom: '1em' }} />
												</div>
											}
											<div className={`pub-body-component ${this.state.collabStatus === 'connecting' ? 'loading' : ''}`}>
												<PubCollabEditor
													onRef={this.handleEditorRef}
													editorKey={`pub-${pubData.id}`}
													isReadOnly={!canManage && pubData.localPermissions !== 'edit'}
													clientData={this.state.activeCollaborators[0]}
													onClientChange={this.handleClientChange}
													onNewHighlightDiscussion={this.handleNewHighlightDiscussion}
													onHighlightClick={this.handleHighlightClick}
													hoverBackgroundColor={this.props.communityData.accentMinimalColor}
													highlights={this.state.docReadyForHighlights ? highlights : []}
													threads={threads}
													slug={pubData.slug}
													onStatusChange={this.handleStatusChange}
												/>
											</div>
										</div>

									</div>
								</div>
							</div>
						</div>
					</div>
				</PageWrapper>

				<Overlay isOpen={this.state.isPublishOpen} onClose={this.togglePublish}>
					<PubCollabPublish
						pubData={pubData}
						onPublish={this.handlePublish}
						onPutPub={this.handleDetailsSave}
						isLoading={this.state.postVersionIsLoading}
						onOpenDetails={this.onOpenDetails}
					/>
				</Overlay>
				<Overlay isOpen={this.state.isSubmitOpen} onClose={this.toggleSubmit}>
					<PubCollabSubmit
						communityData={this.props.communityData}
						pubData={pubData}
						loginData={this.props.loginData}
						pubId={pubData.id}
						onSubmit={this.handlePostDiscussion}
						onPutPub={this.handleDetailsSave}
						isLoading={this.state.postDiscussionIsLoading}
					/>
				</Overlay>
				<Overlay isOpen={this.state.isCollectionsOpen} onClose={this.toggleCollections}>
					<PubCollabCollections
						pubData={pubData}
						collections={this.props.communityData.collections}
						onAddCollection={this.handleAddCollection}
						onRemoveCollection={this.handleRemoveCollection}
					/>
				</Overlay>
				<Overlay isOpen={this.state.isShareOpen} onClose={this.toggleShare}>
					<PubCollabShare
						appData={this.props.communityData}
						pubData={pubData}
						canManage={canManage}
						onPutPub={this.handleDetailsSave}
						onOpenCollaborators={this.onOpenCollaborators}
						onCollaboratorAdd={this.handleCollaboratorAdd}
						onCollaboratorUpdate={this.handleCollaboratorUpdate}
						onCollaboratorDelete={this.handleCollaboratorDelete}
					/>
				</Overlay>
				<Overlay isOpen={this.state.isCollaboratorsOpen} onClose={this.toggleCollaborators}>
					<PubCollabShare
						communityData={this.props.communityData}
						pubData={pubData}
						canManage={canManage}
						onPutPub={this.handleDetailsSave}
						onOpenCollaborators={this.onOpenCollaborators}
						onOpenShare={this.onOpenShare}
						onCollaboratorAdd={this.handleCollaboratorAdd}
						onCollaboratorUpdate={this.handleCollaboratorUpdate}
						onCollaboratorDelete={this.handleCollaboratorDelete}
						collaboratorsOnly={true}
					/>
				</Overlay>
				<Overlay isOpen={this.state.isDetailsOpen} onClose={this.toggleDetails}>
					<PubCollabDetails
						pubData={pubData}
						canDelete={canDelete}
						onSave={this.handleDetailsSave}
						onDelete={this.handlePubDelete}
						putIsLoading={this.state.putPubIsLoading}
						deleteIsLoading={this.state.deletePubIsLoading}
					/>
				</Overlay>
			</div>
		);
	}
}

PubCollaboration.propTypes = propTypes;
export default PubCollaboration;

hydrateWrapper(PubCollaboration);
