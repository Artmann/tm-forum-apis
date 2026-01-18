import { Hono } from 'hono'
import { db } from './db/client'
import { createIndividualRoutes } from './routes/individual'
import { createOrganizationRoutes } from './routes/organization'
import { createHubRoutes } from './routes/hub'
import { errorHandler, fieldsFilter, pagination, requestId } from '@tm-forum/tmf-common'

const PORT = parseInt(process.env.PORT ?? '3632', 10)
const BASE_URL = process.env.BASE_URL ?? `http://localhost:${PORT}`

export function createApp(database = db, baseUrl = BASE_URL) {
  const app = new Hono()

  app.onError(errorHandler)
  app.use('*', requestId())
  app.use('*', pagination())
  app.use('*', fieldsFilter())

  app.get('/health', (c) => c.json({ status: 'ok' }))

  const api = new Hono()
  api.route('/individual', createIndividualRoutes(database, baseUrl))
  api.route('/organization', createOrganizationRoutes(database, baseUrl))
  api.route('/hub', createHubRoutes(database))

  app.route('/tmf-api/partyManagement/v4', api)

  return app
}

const app = createApp()

export default {
  port: PORT,
  fetch: app.fetch
}
