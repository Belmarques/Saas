import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { auth } from '@/http/middlewares/jwt-validation'
import { prisma } from '@/lib/prisma'
import { getUserPermission } from '@/utils/get-user-permission'

import { BadRequestError } from '../_errors/bad-request-error'
import { Unauthorized } from '../_errors/unauthorized-error'

export async function getProject(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organization/:orgSlug/projects/:projectSlug',
      {
        schema: {
          tags: ['projects'],
          summary: 'Get projects',
          security: [{ bearerAuth: [] }],

          response: {
            200: z.object({
              project: z.object({
                id: z.string().uuid(),
                name: z.string(),
                description: z.string(),
                slug: z.string(),
                ownerId: z.string().uuid(),
                organizationId: z.string().uuid(),
                avatarUrl: z.string().url().nullish(),
                owner: z.object({
                  id: z.string().uuid(),
                  name: z.string().nullish(),
                  avatarUrl: z.string().url().nullish(),
                }),
              }),
            }),
          },
          params: z.object({
            orgSlug: z.string(),
            projectSlug: z.string().uuid(),
          }),
        },
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()
        const { orgSlug, projectSlug } = await request.params
        const { membership, organization } =
          await request.getUserMembership(orgSlug)

        const { cannot } = getUserPermission(userId, membership.role)
        if (cannot('get', 'Project')) {
          throw new Unauthorized('you a not allowed to see this projects')
        }

        const project = await prisma.project.findUnique({
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            organizationId: true,
            avatarUrl: true,
            ownerId: true,
            owner: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
          where: {
            slug: projectSlug,
            organizationId: organization.id,
          },
        })
        if (!project) {
          throw new BadRequestError('Project not found')
        }
        return reply.status(200).send({ project })
      },
    )
}
