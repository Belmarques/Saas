import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

export async function createAccount(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/users',
    {
      schema: {
        body: z.object({
          nome: z.string(),
          email: z.string().email(),
          password: z.string().min(6),
        }),
      },
    },
    () => {
      return 'user create'
    },
  )
}
