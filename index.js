import dotenv from 'dotenv';
import express from 'express';
import { networkInterfaces } from 'os';
import morgan from 'morgan';
import Indago from 'indago';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, existsSync, mkdirSync } from 'fs';

const packageInfo = JSON.parse(readFileSync('./package.json').toString());

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;

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

app.enable('trust proxy', true);

const localIPs = getAllLocalIPs();
app.use((req, res, next) => {
	if([...localIPs, 'corps.tools', 'localhost'].includes(req.hostname)) {
		next();
	} else {
		res.redirect('https://corps.tools/');
	}
});

app.use(morgan('combined'));

app.get('/_debug', analyticsTracker.analyticsMW());

app.use('/', (req, res, next) => {
	if(req.path === '/') {
		return analyticsTracker.trackerMW()(req, res, next);
	}
	next();
});

app.use('/', express.static(__dirname + '/dist'));

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