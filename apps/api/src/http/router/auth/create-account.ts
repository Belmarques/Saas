import { hash } from 'bcryptjs'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { prisma } from '@/lib/prisma'

import { BadRequestError } from '../_errors/bad-request-error'

export async function createAccount(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/users',
    {
      schema: {
        tags: ['auth'],
        summary: 'create a new account',
        body: z.object({
          name: z.string(),
          email: z.string().email(),
          password: z.string().min(6),
        }),
      },
    },
    async (request, reply) => {
      const { email, name, password } = request.body
      const userWhithSameEmail = await prisma.user.findUnique({
        where: {
          email,
        },
      })
      if (userWhithSameEmail) {
        throw new BadRequestError('user e-mail already exists')
      }
      const [, domain] = email.split('@')
      const autojoinOrganization = await prisma.organization.findFirst({
        where: {
          domain,
          shouldAttachUsersByDomain: true,
        },
      })
      const passwordHash = await hash(password, 6)
      await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          member_on: autojoinOrganization
            ? {
                create: {
                  organizationId: autojoinOrganization.id,
                },
              }
            : undefined,
        },
      })
      return reply.status(201).send()
    },
  )
}
