const sendgridKey = process.env.NODE_ENV !== 'production' ? require('../authentication/sendgridCredentials').sendgridAPIKey : process.env.SENDGRID_API_KEY;
const sendgrid  = require('sendgrid')(sendgridKey);

const fromname = 'PubPub';
const from = 'pubpub@media.mit.edu';


export function registrationEmail(email, callback) {
	var emailObject = new sendgrid.Email();
	emailObject.addTo(email);
	emailObject.subject = "Welcome to PubPub!"; // We should have a journal here.
	emailObject.from = from;
	emailObject.fromname = fromname;
	emailObject.text = 'Welcome to PubPub!';
	emailObject.html = '<h1>Welcome!</h1><p></p>';

	emailObject.addFilter('templates', 'enable', 1);
	emailObject.addFilter('templates', 'template_id', 'caad4e63-a636-4c81-9cc2-7d65e581a876');

	sendgrid.send(emailObject, callback(err, json));
};

export function sendResetEmail(email, hash, username, callback) {
	const resetURL = 'http://www.pubpub.org/resetpassword/' + hash + '/' + username;

	var emailObject = new sendgrid.Email();
	emailObject.addTo(email);
	emailObject.subject = "PubPub Password Reset!";
	emailObject.from = from;
	emailObject.fromname = fromname;
	emailObject.text = 'Reset Password. We\'ve received a password reset request for your account. To reset, visit ' + resetURL + ' . If you did not request this reset - simply delete this email.';
	emailObject.html = '<h1 style="color: #373737;">Reset Password</h1> <p style="color: #373737;">We\'ve received a password reset request for your account.</p> <p style="color: #373737;">To reset, visit <a href="' + resetURL + '">' + resetURL + '</a></p> <p style="color: #373737;">If you did not request this reset - simply delete this email.</p>';

	emailObject.addFilter('templates', 'enable', 1);
	emailObject.addFilter('templates', 'template_id', 'caad4e63-a636-4c81-9cc2-7d65e581a876');

	sendgrid.send(emailObject, callback);
};


export function sendInviteEmail(senderName, pubName, pubURL, journalName, journalURL, journalIntroduction, recipientEmail, callback) {

	var emailObject = new sendgrid.Email();
	emailObject.addTo(recipientEmail);
	emailObject.subject = "Invitation to Review " + pubName;
	emailObject.from = from;
	// emailObject.fromname = fromname;
	emailObject.fromname = senderName + ' (PubPub)';
	// emailObject.addSubstitution('%recipient%', [recipientName]);
	emailObject.addSubstitution('%sender%', [senderName]);
	emailObject.addSubstitution('%journal%', [journalName]);
	emailObject.addSubstitution('%journalURL%', [journalURL]);
	emailObject.addSubstitution('%pub%', [pubName]);
	emailObject.addSubstitution('%pubURL%', [pubURL]);
	emailObject.addSubstitution('%journalIntroduction%', [journalIntroduction]);

	emailObject.text = ' ';
	emailObject.html = ' ';

	emailObject.addFilter('templates', 'enable', 1);
	emailObject.addFilter('templates', 'template_id', 'f3fb33cb-a630-4be0-9abd-5496ee05903d');

	sendgrid.send(emailObject, callback);
};

export function sendAddedAsCollaborator(email, url, senderName, pubTitle, groupName, journalName, callback) {

	const text = groupName
		? groupName + ' has been added as a collaborator on ' + pubTitle + ' As a member of this group, you too are now a collaborator!. You can collaborate by visiting this pub at ' + url + '.'
		: 'You\'ve been added as a collaborator on ' + pubTitle + '. You can collaborate by visiting this pub at ' + url + '.';
	const html = groupName 
		? '<div style="padding: 10px 0px">' + groupName + ' has been added as a collaborator on <a href="' + url + '" style="color: inherit; font-weight: bold;">' + pubTitle + '</a>. As a member of this group, you too are now a collaborator!</div><div style="padding: 10px 0px"><a href="' + url + '" style="color: inherit; font-weight: bold;">Click here to collaborate</a>.</div>'
		: '<div style="padding: 10px 0px">You\'ve been added as a collaborator on <a href="' + url + '" style="color: inherit; font-weight: bold;">' + pubTitle + '</a>.</div><div style="padding: 10px 0px"><a href="' + url + '" style="color: inherit; font-weight: bold;">Click here to collaborate</a>.</div>';

	var emailObject = new sendgrid.Email();
	emailObject.addTo(email);
	emailObject.subject = pubTitle + " - Added as Collaborator";
	emailObject.from = from;
	emailObject.fromname = senderName + ' (PubPub)';
	emailObject.text = text;
	emailObject.html = html;

	emailObject.addFilter('templates', 'enable', 1);
	emailObject.addFilter('templates', 'template_id', 'caad4e63-a636-4c81-9cc2-7d65e581a876');

	sendgrid.send(emailObject, callback);
};
