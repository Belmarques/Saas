import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { auth } from '@/http/middlewares/jwt-validation'
import { prisma } from '@/lib/prisma'
import { createSlug } from '@/utils/create-slug'
import { getUserPermissions } from '@/utils/get-user-permission'

import { Unauthorized } from '../_errors/unauthorized-error'

export async function createProject(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/organization/:slug/projects',
      {
        schema: {
          tags: ['projects'],
          summary: 'Create projects',
          security: [{ bearerAuth: [] }],
          body: z.object({
            name: z.string(),
            description: z.string(),
            avatarUrl: z.string().url(),
          }),
          response: {
            201: z.object({
              projectId: z.string().uuid(),
            }),
          },
          params: z.object({
            slug: z.string(),
          }),
        },
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()
        const { slug } = await request.params
        const { membership, organization } =
          await request.getUserMembership(slug)

        const { cannot } = getUserPermissions(userId, membership.role)
        if (cannot('create', 'Project')) {
          throw new Unauthorized('you a not allowed to create new projects')
        }
        const { name, avatarUrl, description } = request.body

        const project = await prisma.project.create({
          data: {
            name,
            slug: createSlug(name),
            description,
            avatarUrl,
            organizationId: organization.id,
            ownerId: userId,
          },
        })
        return reply.status(201).send({
          projectId: project.id,
        })
      },
    )
}
