const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb')

const s3 = new S3Client({})
const ddb = new DynamoDBClient({})

module.exports.handler = async (event) => {
	// event from IoT contains .message
	const bucket = process.env.BUCKET_NAME
	const table = process.env.TABLE_NAME
	const expectedThing = process.env.THING_NAME
	let jobId = `job_${Date.now()}`

	let payload
	try {
		payload = typeof event === 'string' ? JSON.parse(event) : (event?.message ? JSON.parse(event.message) : event)
	} catch (e) {
		payload = { error: 'invalid', raw: String(event) }
	}

	// Relax client validation: just log mismatch, do not reject
	const clientId = event?.clientId || event?.clientid
	if (expectedThing && clientId && clientId !== expectedThing) {
		console.warn(`IoT clientId ${clientId} != expected THING_NAME ${expectedThing}; continuing.`)
	}

	// Map Jetson payload -> internal canonical format
	// Jetson sends: { robot_model, path_id, timestamp, fixtures, path_points: [{x,y,z}], grasp_events: [{index,event}] }
	let canonicalPath = []
	if (Array.isArray(payload?.path_points)) {
		// Convert mm (Jetson) -> meters for Three.js scene
		canonicalPath = payload.path_points.map((p) => ({ x: Number(p.x) / 1000, y: Number(p.y) / 1000, z: Number(p.z) / 1000 }))
		if (Array.isArray(payload?.grasp_events)) {
			payload.grasp_events.forEach((ge) => {
				const i = ge?.index
				if (Number.isInteger(i) && canonicalPath[i]) {
					if (ge.event === 'grasp') canonicalPath[i].grasp = true
					if (ge.event === 'release') canonicalPath[i].grasp = false
				}
			})
		}
	}

	const valid = Array.isArray(canonicalPath) && canonicalPath.length >= 2
	const status = valid ? 'VALID' : 'INVALID'

	// Basic motion code generation from path/grasp events
	const fmtPoint = (p, i) => `P[${i + 1}] = X ${p.x.toFixed(3)} Y ${p.y.toFixed(3)} Z ${p.z.toFixed(3)}`
	const karelBody = canonicalPath.map((p, i) => `  L ${fmtPoint(p, i)}  FINE`).join('\n')
	const karel = `PROGRAM AURA_BRIDGE_PATH\n  ! Auto-generated motion from Lambda\n${karelBody}\nEND\n`
	const krlBody = canonicalPath.map((p) => `  LIN {X ${p.x.toFixed(3)}, Y ${p.y.toFixed(3)}, Z ${p.z.toFixed(3)}} C_DIS`).join('\n')
	const krl = `DEF AURA_BRIDGE_PATH()\n  ; Auto-generated motion from Lambda\n${krlBody}\nEND\n`

	// Optionally call Bedrock to refine (guarded by env)
	let refinedKarel = null, refinedKrl = null
	if (process.env.BEDROCK_ENABLED === 'true') {
		try {
			const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime')
			const br = new BedrockRuntimeClient({})
			const prompt = `You are a robotics motion expert. Given a path as JSON points in meters and grasp/release events, produce concise and correct robot programs.\n\nJSON path:\n${JSON.stringify({ points: canonicalPath, grasp_events: payload?.grasp_events || [] }).slice(0, 15000)}\n\nReturn two sections: KAREL and KRL. Use linear moves between waypoints (FINE).`
			const model = process.env.BEDROCK_MODEL || 'anthropic.claude-3-haiku-20240307-v1:0'
			const body = JSON.stringify({
				anthropic_version: 'bedrock-2023-05-31',
				max_tokens: 2000,
				temperature: 0,
				messages: [{ role: 'user', content: [{ type: 'text', text: prompt }] }]
			})
			const resp = await br.send(new InvokeModelCommand({ modelId: model, contentType: 'application/json', accept: 'application/json', body }))
			const txt = JSON.parse(new TextDecoder('utf-8').decode(resp.body)).content?.[0]?.text || ''
			const karelMatch = /KAREL[\s\S]*?(?=KRL|$)/i.exec(txt)
			const krlMatch = /KRL[\s\S]*$/i.exec(txt)
			refinedKarel = (karelMatch ? karelMatch[0].replace(/^[\s\S]*?\n/, '') : null) || null
			refinedKrl = (krlMatch ? krlMatch[0].replace(/^KRL\s*/i, '') : null) || null
		} catch (e) {
			console.warn('Bedrock refinement failed:', e?.message || e)
		}
	}

	// Store artifacts
	// Store original payload and normalized path for API
	await s3.send(new PutObjectCommand({ Bucket: bucket, Key: `${jobId}/iot_raw.json`, Body: JSON.stringify(payload) }))
	await s3.send(new PutObjectCommand({ Bucket: bucket, Key: `${jobId}/path.json`, Body: JSON.stringify({ points: canonicalPath, fixtures: payload?.fixtures || null, grasp_events: payload?.grasp_events || [] }) }))
	await s3.send(new PutObjectCommand({ Bucket: bucket, Key: `${jobId}/karel.LS`, Body: karel }))
	await s3.send(new PutObjectCommand({ Bucket: bucket, Key: `${jobId}/kuka.src`, Body: krl }))
	if (refinedKarel) await s3.send(new PutObjectCommand({ Bucket: bucket, Key: `${jobId}/karel.refined.LS`, Body: refinedKarel }))
	if (refinedKrl) await s3.send(new PutObjectCommand({ Bucket: bucket, Key: `${jobId}/kuka.refined.src`, Body: refinedKrl }))

	await ddb.send(new PutItemCommand({
		TableName: table,
		Item: {
			jobId: { S: jobId },
			status: { S: status },
			pathKey: { S: `${jobId}/path.json` },
			karelKey: { S: `${jobId}/karel.LS` },
			krlKey: { S: `${jobId}/kuka.src` },
			refinedKarelKey: { S: refinedKarel ? `${jobId}/karel.refined.LS` : '' },
			refinedKrlKey: { S: refinedKrl ? `${jobId}/kuka.refined.src` : '' },
			updatedAt: { S: new Date().toISOString() }
		}
	}))

	return { ok: true, jobId, status }
}
