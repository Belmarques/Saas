import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { auth } from '@/http/middlewares/jwt-validation'
import { prisma } from '@/lib/prisma'

export async function requestPasswordRecover(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/password/recover',
      {
        schema: {
          tags: ['auth'],
          summary: 'get authenticade user profile',
          body: z.object({
            email: z.string().email(),
          }),
          response: {
            201: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { email } = request.body
        const userFromEmail = await prisma.user.findUnique({
          where: {
            email,
          },
        })
        if (!userFromEmail) {
          return reply.status(201).send()
        }
        const { id: code } = await prisma.token.create({
          data: {
            type: 'PASSWORD_RECOVER',
            userId: userFromEmail.id,
          },
        })
        console.log('Recover password token', code)

        return reply.status(201).send()
      },
    )
}
