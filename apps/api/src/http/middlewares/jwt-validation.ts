import type { FastifyInstance } from 'fastify/types/instance'
import { fastifyPlugin } from 'fastify-plugin'

import { Unauthorized } from '../router/_errors/unauthorized-error'

export const auth = fastifyPlugin(async (app: FastifyInstance) => {
  app.addHook('preHandler', async (request) => {
    request.getCurrentUserId = async () => {
      try {
        const { sub } = await request.jwtVerify<{ sub: string }>()
        return sub
      } catch {
        throw new Unauthorized('Invalid auth token')
      }
    }
  })
})
