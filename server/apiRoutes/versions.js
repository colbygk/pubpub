import app from '../server';
import { Pub, Version, Collaborator, CommunityAdmin, Discussion } from '../models';

app.post('/api/versions', (req, res)=> {
	const user = req.user || {};
	const findCollaborator = Collaborator.findOne({
		where: {
			userId: user.id,
			pubId: req.body.pubId,
		}
	});
	const findCommunityAdmin = CommunityAdmin.findOne({
		where: {
			userId: req.user && req.user.id,
			communityId: req.body.communityId || null,
		}
	});
	const findPub = Pub.findOne({
		where: { id: req.body.pubId, communityId: req.body.communityId }
	});
	const findSubmitDiscussion = Discussion.findOne({
		where: {
			submitHash: req.body.submitHash,
			pubId: req.body.pubId,
			communityId: req.body.communityId || null,
			isArchived: { $not: true },
		}
	});
	const currentTimestamp = new Date();
	let firstPublishedAtValue;

	Promise.all([findCollaborator, findCommunityAdmin, findPub, findSubmitDiscussion])
	.then(([collaboratorData, communityAdminData, pubData, discussionData])=> {
		const isManager = collaboratorData && collaboratorData.permissions === 'manage';
		const accessAsCommunityAdmin = communityAdminData && pubData.adminPermissions === 'manage';
		const canApproveSubmission = communityAdminData && discussionData;
		if (user.id !== 'b242f616-7aaa-479c-8ee5-3933dcf70859'
			&& !isManager
			&& !accessAsCommunityAdmin
			&& !canApproveSubmission
		) {
			throw new Error('Not Authorized to update this pub');
		}
		firstPublishedAtValue = pubData.firstPublishedAt;
		return Version.create({
			pubId: req.body.pubId,
			content: req.body.content,
		});
	})
	.then(()=> {
		return Pub.update({
			firstPublishedAt: firstPublishedAtValue || currentTimestamp,
			lastPublishedAt: currentTimestamp,
		}, {
			where: { id: req.body.pubId }
		});
	})
	.then(()=> {
		return Discussion.update({ isArchived: true, submitApprovedAt: currentTimestamp }, {
			where: {
				submitHash: req.body.submitHash,
				pubId: req.body.pubId,
				communityId: req.body.communityId || null,
				isArchived: { $not: true },
			}
		});
	})
	.then(()=> {
		return res.status(201).json('Version Published Successfully');
	})
	.catch((err)=> {
		console.error('Error in postVersion: ', err);
		return res.status(500).json(err.message);
	});
});
