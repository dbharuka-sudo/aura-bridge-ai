const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3')
const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb')
const { readableStreamToString } = require('./util.cjs')

const s3 = new S3Client({})
const ddb = new DynamoDBClient({})

module.exports.handler = async (event) => {
	const bucket = process.env.BUCKET_NAME
	const table = process.env.TABLE_NAME
	const route = event?.rawPath || ''

	const headers = {
		'Content-Type': 'application/json',
		'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
		'Pragma': 'no-cache',
		'Expires': '0',
		'Access-Control-Allow-Origin': '*'
	}

	try {
		// naïve: pick most recent job by updatedAt
		const scan = await ddb.send(new ScanCommand({ TableName: table }))
		const items = (scan.Items || []).sort((a, b) => (a.updatedAt?.S || '').localeCompare(b.updatedAt?.S || ''))
		const latest = items[items.length - 1]

		if (route.endsWith('/latest/status')) {
			if (!latest) return { statusCode: 200, headers, body: JSON.stringify({ valid: false, message: 'Awaiting data' }) }
			return { statusCode: 200, headers, body: JSON.stringify({ valid: latest.status?.S === 'VALID', message: latest.status?.S || 'Unknown' }) }
		}

		if (route.endsWith('/latest/path')) {
			try {
				if (!latest || !latest.pathKey?.S) return { statusCode: 200, headers, body: JSON.stringify({ path: { points: [] } }) }
				const obj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: latest.pathKey.S }))
				const body = await readableStreamToString(obj.Body)
				let parsed
				try { parsed = JSON.parse(body) } catch { parsed = { points: [] } }
				const normalized = Array.isArray(parsed?.points) ? parsed : { points: [] }
				return { statusCode: 200, headers, body: JSON.stringify({ path: normalized }) }
			} catch (err) {
				return { statusCode: 200, headers, body: JSON.stringify({ path: { points: [] } }) }
			}
		}

		if (route.endsWith('/latest/code')) {
			try {
				if (!latest) return { statusCode: 200, headers, body: JSON.stringify({ karel: 'Awaiting code...', krl: 'Awaiting code...', rapid: 'Awaiting code...' }) }
				const karelKey = latest.karelKey?.S
				const krlKey = latest.krlKey?.S
				const rapidKey = latest.rapidKey?.S
				const refinedKarelKey = latest.refinedKarelKey?.S
				const refinedKrlKey = latest.refinedKrlKey?.S
				const refinedRapidKey = latest.refinedRapidKey?.S
				if (!karelKey || !krlKey || !rapidKey) return { statusCode: 200, headers, body: JSON.stringify({ karel: 'Awaiting code...', krl: 'Awaiting code...', rapid: 'Awaiting code...' }) }
				const baseKarelObj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: karelKey }))
				const baseKrlObj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: krlKey }))
				const baseRapidObj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: rapidKey }))
				const [baseKarel, baseKrl, baseRapid] = await Promise.all([
					readableStreamToString(baseKarelObj.Body),
					readableStreamToString(baseKrlObj.Body),
					readableStreamToString(baseRapidObj.Body)
				])
				let refinedKarel = null, refinedKrl = null, refinedRapid = null
				try {
					if (refinedKarelKey) {
						const obj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: refinedKarelKey }))
						refinedKarel = await readableStreamToString(obj.Body)
					}
					if (refinedKrlKey) {
						const obj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: refinedKrlKey }))
						refinedKrl = await readableStreamToString(obj.Body)
					}
					if (refinedRapidKey) {
						const obj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: refinedRapidKey }))
						refinedRapid = await readableStreamToString(obj.Body)
					}
				} catch { }
				return { statusCode: 200, headers, body: JSON.stringify({ karel: refinedKarel || baseKarel, krl: refinedKrl || baseKrl, rapid: refinedRapid || baseRapid }) }
			} catch (err) {
				return { statusCode: 200, headers, body: JSON.stringify({ karel: 'Awaiting code...', krl: 'Awaiting code...', rapid: 'Awaiting code...' }) }
			}
		}

		if (!latest) return { statusCode: 200, headers, body: JSON.stringify({ message: 'No jobs yet' }) }
		return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) }
	} catch (error) {
		console.error('API error', error)
		return { statusCode: 200, headers, body: JSON.stringify({ path: { points: [] }, karel: 'Awaiting code...', krl: 'Awaiting code...', message: 'Awaiting data' }) }
	}
}
