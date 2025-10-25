import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

// In-memory cache for demo
let latestPath = null;
let latestStatus = { valid: false, message: 'Waiting for path...' };
let latestCode = { karel: '', krl: '' };

// Load mock data if available
try {
	const mockPath = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../mock/path.json'), 'utf-8'));
	latestPath = mockPath;
	latestStatus = { valid: true, message: 'Path is Valid' };
	latestCode = {
		karel: fs.readFileSync(path.resolve(__dirname, '../mock/sample.karel'), 'utf-8'),
		krl: fs.readFileSync(path.resolve(__dirname, '../mock/sample.src'), 'utf-8')
	};
	// eslint-disable-next-line no-console
	console.log('Loaded mock data.');
} catch (e) {
	// eslint-disable-next-line no-console
	console.log('No mock data found, starting empty.');
}

app.get('/api/health', (_, res) => {
	res.json({ ok: true, service: 'Aura Bridge AI server' });
});

app.get('/api/latest/path', (_, res) => {
	res.json({ path: latestPath });
});

app.get('/api/latest/status', (_, res) => {
	res.json(latestStatus);
});

app.get('/api/latest/code', (_, res) => {
	res.json(latestCode);
});

app.post('/api/ingest', (req, res) => {
	// Simulate IoT ingestion
	const { path: robotPath } = req.body || {};
	if (!robotPath || !Array.isArray(robotPath.points)) {
		return res.status(400).json({ error: 'Invalid path payload' });
	}
	latestPath = robotPath;
	// naive checks
	latestStatus = { valid: true, message: 'Path is Valid (mock)' };
	latestCode = {
		karel: `PROGRAM AURA_BRIDGE_PATH\n  ! Mock KAREL code generated\nEND`,
		krl: `DEF AURA_BRIDGE_PATH()\n  ; Mock KRL code generated\nEND`,
	};
	res.json({ ok: true });
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
	// eslint-disable-next-line no-console
	console.log(`Server listening on http://localhost:${port}`);
});
