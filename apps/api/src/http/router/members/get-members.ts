import { roleSchema } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { auth } from '@/http/middlewares/jwt-validation'
import { prisma } from '@/lib/prisma'
import { getUserPermission } from '@/utils/get-user-permission'

import { Unauthorized } from '../_errors/unauthorized-error'

export async function getMembers(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organization/:slug/members',
      {
        schema: {
          tags: ['members'],
          summary: 'Get all organization members',
          security: [{ bearerAuth: [] }],

          response: {
            200: z.object({
              members: z.array(
                z.object({
                  userId: z.string().uuid(),
                  name: z.string().nullable(),
                  email: z.string().email(),
                  role: roleSchema,
                  id: z.string().uuid(),
                  avatarUrl: z.string().url().nullable(),
                }),
              ),
            }),
          },
          params: z.object({
            slug: z.string(),
          }),
        },
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()
        const { slug } = request.params
        const { membership, organization } =
          await request.getUserMembership(slug)

        const { cannot } = getUserPermission(userId, membership.role)
        if (cannot('get', 'User')) {
          throw new Unauthorized(
            'you a not allowed to see organization members',
          )
        }

        const members = await prisma.member.findMany({
          select: {
            id: true,
            role: true,
            user: {
              select: {
                name: true,
                email: true,
                id: true,
                avatarUrl: true,
              },
            },
          },
          where: {
            organizationId: organization.id,
          },
          orderBy: {
            role: 'asc',
          },
        })
        const membersWithRoles = members.map(
          ({ user: { id: userId, ...user }, ...members }) => {
            return {
              ...user,
              ...members,
              userId,
            }
          },
        )
        return reply.status(200).send({ members: membersWithRoles })
      },
    )
}
