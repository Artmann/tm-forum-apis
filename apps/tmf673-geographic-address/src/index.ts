import { Hono } from 'hono'
import {
  errorHandler,
  fieldsFilter,
  pagination,
  requestId
} from '@tm-forum/tmf-common'
import { db } from './db/client'
import { createGeographicAddressRoutes } from './routes/geographic-address'
import { createHubRoutes } from './routes/hub'

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3673
const BASE_URL = process.env.BASE_URL ?? `http://localhost:${PORT}`

export function createApp(database = db, baseUrl = BASE_URL) {
  const app = new Hono()

  app.onError(errorHandler)
  app.use('*', requestId())
  app.use('*', pagination())
  app.use('*', fieldsFilter())

  app.get('/health', (c) => c.json({ status: 'ok' }))

  const api = new Hono()
  api.route('/geographicAddress', createGeographicAddressRoutes(database, baseUrl))
  api.route('/hub', createHubRoutes(database))

  app.route('/tmf-api/geographicAddressManagement/v4', api)

  return app
}

const app = createApp()

export default {
  port: PORT,
  fetch: app.fetch
}
