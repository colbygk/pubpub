import Promise from 'bluebird';
import React from 'react';
import UserContainer from 'containers/User/User';
import Html from '../Html';
import app from '../server';
import { Community, Pub, User } from '../models';
import { renderToNodeStream, getInitialData, handleErrors, generateMetaComponents } from '../utilities';

app.get(['/user/:slug', '/user/:slug/:mode'], (req, res, next)=> {
	const getUserData = User.findOne({
		where: {
			slug: req.params.slug.toLowerCase()
		},
		attributes: {
			exclude: ['salt', 'hash', 'email', 'createdAt', 'updatedAt']
		},
		include: [
			{
				model: Pub,
				as: 'pubs',
				required: false,
				through: { attributes: [] },
				include: [
					{
						model: User,
						as: 'collaborators',
						attributes: ['id', 'avatar', 'initials', 'fullName'],
						through: { attributes: ['isAuthor'] },
					},
					{
						model: Community,
						as: 'community',
						attributes: ['id', 'subdomain', 'domain', 'title', 'smallHeaderLogo', 'accentColor'],
					},
				]
			}
		],
	});

	return Promise.all([getInitialData(req), getUserData])
	.then(([initialData, userData])=> {
		if (!userData) { throw new Error('User Not Found'); }

		const userDataJson = userData.toJSON();
		if (userDataJson.pubs) {
			userDataJson.pubs = userDataJson.pubs.filter((item)=> {
				const isOwnProfile = userDataJson.id === initialData.loginData.id;
				const isPublicCollab = item.collaborationMode !== 'private';
				return !!item.firstPublishedAt || isOwnProfile || isPublicCollab;
			});	
		}

		const newInitialData = {
			...initialData,
			userData: userDataJson,
		};
		return renderToNodeStream(res,
			<Html
				chunkName="User"
				initialData={newInitialData}
				headerComponents={generateMetaComponents({
					initialData: newInitialData,
					title: `${userDataJson.fullName} · PubPub`,
					description: userDataJson.bio,
					image: userDataJson.avatar,
				})}
			>
				<UserContainer {...newInitialData} />
			</Html>
		);
	})
	.catch(handleErrors(req, res, next));
});
