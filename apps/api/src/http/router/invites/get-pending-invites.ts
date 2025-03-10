import { roleSchema } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { auth } from '@/http/middlewares/jwt-validation'
import { prisma } from '@/lib/prisma'

import { BadRequestError } from '../_errors/bad-request-error'

export async function getPendingInvites(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      'pending-invites',
      {
        schema: {
          tags: ['invites'],
          summary: 'get all user pending invites',
          security: [{ bearerAuth: [] }],

          response: {
            200: z.object({
              invites: z.array(
                z.object({
                  id: z.string().uuid(),
                  role: roleSchema,
                  email: z.string().email(),
                  createdAt: z.date(),
                  organization: z.object({
                    name: z.string(),
                  }),
                  author: z
                    .object({
                      id: z.string().uuid(),
                      name: z.string().nullable(),
                      avatarUrl: z.string().url().nullable(),
                    })
                    .nullable(),
                }),
              ),
            }),
          },
        },
      },
      async (request) => {
        const userId = await request.getCurrentUserId()
        const user = await prisma.user.findUnique({
          where: {
            id: userId,
          },
        })
        if (!user) {
          throw new BadRequestError('user not found')
        }
        const invites = await prisma.invite.findMany({
          where: {
            email: user.email,
          },
          select: {
            id: true,
            role: true,
            createdAt: true,
            email: true,
            author: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
            organization: {
              select: {
                name: true,
              },
            },
          },
        })
        return { invites }
      },
    )
}
