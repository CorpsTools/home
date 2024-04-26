import dotenv from 'dotenv';
import express from 'express';
import { networkInterfaces } from 'os';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import Indago from 'indago';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import passport from 'passport';
import { Strategy as MicrosoftStrategy } from 'passport-microsoft';
import session from 'express-session';
import jwt from 'jsonwebtoken';
import { createHash } from 'crypto';

const packageInfo = JSON.parse(readFileSync('./package.json').toString());

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT_APP_URL = process.env.API_URL || 'http://localhost:' + PORT;
const SESSION_SECRET = process.env.SESSION_SECRET;
const CANNY_PRIVATE_KEY = process.env.CANNY_PRIVATE_KEY;

if (!existsSync(`${__dirname}/indago`)) {
	mkdirSync(`${__dirname}/indago`);
}

const analyticsTracker = new Indago.Tracker({
	savePath: `${__dirname}/indago/${packageInfo.name}-analytics.json`,
	template: {},
	authentication: {
		base64: process.env.INDAGO_AUTH
	},
	onTick: async () => {}
});

const currentCannyConfig = {
	redirectURL: '',
	companyID: ''
};

const userSessionMiddleware = session({
	secret: SESSION_SECRET,
	cookie: {
		maxAge: 1000 * 60 * 60 * 24 * 7,
	},
	resave: false,
	saveUninitialized: false,
});

app.enable('trust proxy', true);

const localIPs = getAllLocalIPs();
app.use((req, res, next) => {
	if([...localIPs, 'corps.tools', 'localhost'].includes(req.hostname)) {
		next();
	} else {
		res.redirect('https://corps.tools/');
	}
});

passport.use(new MicrosoftStrategy({
	// Standard OAuth2 options
	clientID: process.env.MICROSOFT_CLIENT_ID,
	clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
	callbackURL: `${ROOT_APP_URL}/auth/microsoft/callback`,
	scope: ['user.read'],

	// Microsoft specific options

	// [Optional] The tenant for the application. Defaults to 'common'. 
	// Used to construct the authorizationURL and tokenURL
	tenant: 'common',

	// [Optional] The authorization URL. Defaults to `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`
	authorizationURL: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',

	// [Optional] The token URL. Defaults to `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`
	tokenURL: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
}, async (accessToken, refreshToken, profile, done) => {
	const microsoftProfile = profile._json;

	if(!microsoftProfile.mail.endsWith('@westpoint.edu')){
		if(microsoftProfile.mail.toLowerCase() !== 'korbin.deary45@gmail.com') {
			return done('Only cadet westpoint.edu emails can use this application.', null);
		}
	}

	const userEmail = microsoftProfile.mail === 'korbin.deary@westpoint.edu' ? 'corpstools@pm.me' : microsoftProfile.mail;

	const userData = {
		// avatarURL: user.avatarURL, // optional, but preferred
		email: userEmail,
		id: createHash('sha256').update(userEmail).digest('hex'),
		name: microsoftProfile.displayName,
	};

	done(null, userData);
}));

passport.serializeUser((user, done) => {
	done(null, user);
});

passport.deserializeUser((user, done) => {
	done(null, user);
});

app.use(morgan('combined'));
app.use(userSessionMiddleware);
app.use(passport.authenticate('session'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/_debug', analyticsTracker.analyticsMW());

app.use('/', (req, res, next) => {
	if(req.path === '/') {
		return analyticsTracker.trackerMW()(req, res, next);
	}
	next();
});

app.use('/', express.static(__dirname + '/dist'));

app.get('/auth/microsoft', (req, res, next) => {
	currentCannyConfig.companyID = req.query.companyID.toString();
	currentCannyConfig.redirectURL = req.query.redirectURL.toString();

	passport.authenticate('microsoft', {
		// Optionally define any authentication parameters here
		// For example, the ones in https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow

		prompt: 'select_account',
	})(req, res, next);
});

app.get('/auth/microsoft/callback', passport.authenticate('microsoft', { failureRedirect: ROOT_APP_URL }), (req, res) => {
	console.log(req.user);
	const ssoToken = jwt.sign(req.user, CANNY_PRIVATE_KEY, {algorithm: 'HS256'});

	const cannyRedirectURL = 'https://canny.io/api/redirects/sso?companyID=' + currentCannyConfig.companyID +
		'&ssoToken=' + ssoToken +
		'&redirect=' + currentCannyConfig.redirectURL;
	res.redirect(cannyRedirectURL);
});

app.get('/logout', (req, res) => {
	res.contentType('text/html');
	res.send(`<script>fetch('/logout', {method: 'POST'}).then(() => location.href = '/')</script>`);
});
app.post('/logout', (req, res) => {
	req.logout(err => {
		if (err) { return next(err); }
		res.redirect('/');
	});
});

function getAllLocalIPs() {
	let interfaces = networkInterfaces();
	const results = []; // Or just '{}', an empty object

	for (const name of Object.keys(interfaces)) {
		for (const net of interfaces[name]) {
			results.push(net.address);
		}
	}

	return results;
}

app.listen(PORT, () => {
	analyticsTracker.init();
	console.log(`[${packageInfo.name}] listening on port ${PORT}`);
});