import React from 'react';
import PropTypes from 'prop-types';
import Avatar from 'components/Avatar/Avatar';

require('./discussionPreview.scss');

const propTypes = {
	discussions: PropTypes.array.isRequired,
	onPreviewClick: PropTypes.func.isRequired,
};


const DiscussionPreview = function(props) {
	const hasAttachments = props.discussions.reduce((prev, curr)=> {
		return prev || curr.attachments;
	}, false);
	const hasSuggestions = props.discussions.reduce((prev, curr)=> {
		return prev || curr.suggestions;
	}, false);
	const hasHighlights = props.discussions.reduce((prev, curr)=> {
		return prev || curr.highlights;
	}, false);
	let submissionStatus = '';
	const hasSubmission = props.discussions.reduce((prev, curr)=> {
		if (curr.submitHash && curr.submitApprovedAt) { submissionStatus = 'pt-intent-success'; }
		if (curr.submitHash && curr.isArchived && !curr.submitApprovedAt) { submissionStatus = 'pt-intent-danger'; }
		return prev || curr.submitHash;
	}, false);
	const isPublic = props.discussions.reduce((prev, curr)=> {
		return prev || curr.isPublic;
	}, false);

	const sortedDiscussions = props.discussions.sort((foo, bar)=> {
		if (foo.createdAt > bar.createdAt) { return 1; }
		if (foo.createdAt < bar.createdAt) { return -1; }
		return 0;
	});
	const usedAuthorNames = {};
	const uniqueAuthors = sortedDiscussions.filter((item)=> {
		if (usedAuthorNames[item.author.id]) { return false; }
		usedAuthorNames[item.author.id] = true;
		return true;
	});
	const discussionAuthors = uniqueAuthors.reduce((prev, curr, index)=> {
		if (index === uniqueAuthors.length - 1 && uniqueAuthors.length > 2) { return `${prev}, and ${curr.author.fullName}`; }
		if (index === uniqueAuthors.length - 1 && uniqueAuthors.length === 2) { return `${prev} and ${curr.author.fullName}`; }
		if (index === 0) { return `${curr.author.fullName}`; }
		return `${prev}, ${curr.author.fullName}`;
	}, '');
	// const toUrl = props.isPresentation
	// 	? `/pub/${props.slug}?thread=${props.discussions[0].threadNumber}`
	// 	: `/pub/${props.slug}/collaborate?thread=${props.discussions[0].threadNumber}`;

	return (
		<a
			// href={toUrl}
			onClick={()=> { props.onPreviewClick(props.discussions[0].threadNumber); }}
			className="discussion-preview-component"
		>
			<div className="icons">
				{hasAttachments &&
					<span className="pt-icon-standard pt-icon-paperclip" />
				}
				{hasSuggestions &&
					<span className="pt-icon-standard pt-icon-doc" />
				}
				{hasHighlights &&
					<span className="pt-icon-standard pt-icon-highlight" />
				}
				{hasSubmission &&
					<span className={`pt-icon-standard pt-icon-endorsed ${submissionStatus}`} />
				}
			</div>

			<div className="title">
				{sortedDiscussions[0].title}
				{!sortedDiscussions[0].title &&
					<span>Discussion by {sortedDiscussions[0].author.fullName}</span>
				}
				{!isPublic && <span className="pt-icon-standard pt-icon-lock2" />}
			</div>
			<div className="authors">
				{discussionAuthors}
			</div>
			<div>
				{sortedDiscussions.slice(0, 3).map((discussion)=> {
					return (
						<div className="discussion" key={`discussion-preview-${discussion.id}`}>
							<Avatar
								width={20}
								userInitials={discussion.author.initials}
								userAvatar={discussion.author.avatar}
							/>
							<div className="text">{discussion.text}</div>
						</div>
					);
				})}
			</div>
			{sortedDiscussions.length > 3 &&
				<div className="more">
					{sortedDiscussions.length - 3} more...
				</div>
			}
			<div className="bottom-border" />
		</a>
	);
};

DiscussionPreview.propTypes = propTypes;
export default DiscussionPreview;
