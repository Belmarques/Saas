import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { auth } from '@/http/middlewares/jwt-validation'
import { prisma } from '@/lib/prisma'
import { getUserPermission } from '@/utils/get-user-permission'

import { Unauthorized } from '../_errors/unauthorized-error'

export async function removeMember(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .delete(
      '/organization/:slug/members/:memberId',
      {
        schema: {
          tags: ['members'],
          summary: 'remove a member from this organization',
          security: [{ bearerAuth: [] }],

          response: {
            204: z.null(),
          },
          params: z.object({
            slug: z.string(),
            memberId: z.string().uuid(),
          }),
        },
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()
        const { slug, memberId } = request.params
        const { membership, organization } =
          await request.getUserMembership(slug)

        const { cannot } = getUserPermission(userId, membership.role)
        if (cannot('delete', 'User')) {
          throw new Unauthorized('you a not allowed to delete this member')
        }

        await prisma.member.delete({
          where: {
            id: memberId,
            organizationId: organization.id,
          },
        })
        return reply.status(204).send()
      },
    )
}
