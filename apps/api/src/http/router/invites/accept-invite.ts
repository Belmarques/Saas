import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { auth } from '@/http/middlewares/jwt-validation'
import { prisma } from '@/lib/prisma'

import { BadRequestError } from '../_errors/bad-request-error'

export async function acceptInvite(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/invites/:inviteId/accept',
      {
        schema: {
          tags: ['invites'],
          security: [{ bearerAuth: [] }],
          summary: 'accept an invite',
          params: z.object({
            inviteId: z.string().uuid(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { inviteId } = request.params
        const userId = await request.getCurrentUserId()
        const invite = await prisma.invite.findUnique({
          where: {
            id: inviteId,
          },
        })
        if (!invite) {
          throw new BadRequestError('invite not found or expired')
        }
        const user = await prisma.user.findUnique({
          where: {
            id: userId,
          },
        })
        if (!user) {
          throw new BadRequestError('user not found')
        }
        if (invite.email !== user.email) {
          throw new BadRequestError('This invite belogs to another user')
        }
        await prisma.$transaction([
          prisma.member.create({
            data: {
              userId,
              organizationId: invite.organizationId,
              role: invite.role,
            },
          }),
          prisma.invite.delete({
            where: {
              id: inviteId,
            },
          }),
        ])
        return reply.status(204).send()
      },
    )
}
