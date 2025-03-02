import { compare } from 'bcryptjs'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { prisma } from '@/lib/prisma'
export async function authenticateWithPassword(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/session/password',
    {
      schema: {
        tags: ['auth'],
        summary: 'authenticate',
        body: z.object({
          email: z.string().email(),
          password: z.string().min(6),
        }),
        response: {
          201: z.object({
            token: z.string(),
          }),
          400: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body
      const userFromEmail = await prisma.user.findUnique({
        where: {
          email,
        },
      })
      if (!userFromEmail) {
        return reply.status(400).send({ message: 'email not found' })
      }
      if (userFromEmail.passwordHash === null) {
        return reply
          .status(400)
          .send({ message: 'user does not have a password' })
      }
      const isvalidPassword = await compare(
        password,
        userFromEmail.passwordHash,
      )
      if (!isvalidPassword) {
        return reply.status(400).send({ message: 'password not found' })
      }
      const token = await reply.jwtSign(
        {
          sub: userFromEmail.id,
        },
        {
          sign: {
            expiresIn: '7d',
          },
        },
      )
      return reply.status(201).send({ token })
    },
  )
}
