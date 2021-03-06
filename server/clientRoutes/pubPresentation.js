import React from 'react';
import Promise from 'bluebird';
import PubPresentation from 'containers/PubPresentation/PubPresentation';
import Html from '../Html';
import app from '../server';
import { hostIsValid, renderToNodeStream, getInitialData, handleErrors, generateMetaComponents } from '../utilities';
import { findPub } from '../queryHelpers';

app.get('/pub/:slug', (req, res, next)=> {
	if (!hostIsValid(req, 'community')) { return next(); }

	return getInitialData(req)
	.then((initialData)=> {
		return Promise.all([initialData, findPub(req, initialData)]);
	})
	.then(([initialData, pubData])=> {
		const isUnlisted = pubData.collections.reduce((prev, curr)=> {
			if (curr.isPublic) { return false; }
			return prev;
		}, true);

		const newInitialData = {
			...initialData,
			pubData: pubData,
		};
		return renderToNodeStream(res,
			<Html
				chunkName="PubPresentation"
				initialData={newInitialData}
				headerComponents={generateMetaComponents({
					initialData: initialData,
					title: pubData.title,
					description: pubData.description,
					image: pubData.avatar,
					publishedAt: pubData.firstPublishedAt,
					unlisted: isUnlisted,
				})}
			>
				<PubPresentation {...newInitialData} />
			</Html>
		);
	})
	.catch(handleErrors(req, res, next));
});
