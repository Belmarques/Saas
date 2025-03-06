import { organizationSchema } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { auth } from '@/http/middlewares/jwt-validation'
import { prisma } from '@/lib/prisma'
import { getUserPermission } from '@/utils/get-user.permission'

import { Unauthorized } from '../_errors/unauthorized-error'

export async function shutDownOrganization(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .delete(
      '/organizations/:slug',
      {
        schema: {
          tags: ['organizations'],
          summary: 'Shutdown Organization',
          security: [{ bearerAuth: [] }],

          params: z.object({
            slug: z.string(),
          }),
          response: {
            204: z.object({
              message: z.string(),
            }),
          },
        },
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()
        const { slug } = request.params
        const { membership, organization } =
          await request.getUserMembership(slug)

        const authOrganization = organizationSchema.parse(organization)

        const { cannot } = getUserPermission(userId, membership.role)
        if (cannot('delete', authOrganization)) {
          throw new Unauthorized('You not allowed shutdown this organization')
        }

        await prisma.organization.delete({
          where: {
            id: organization.id,
          },
        })
        return reply.status(204).send({
          message: 'Organization delete',
        })
      },
    )
}
