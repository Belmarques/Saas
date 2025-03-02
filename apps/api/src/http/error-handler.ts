import type { FastifyInstance } from 'fastify/types/instance'
import { ZodError } from 'zod'

import { BadRequestError } from './router/_errors/bad-request-error'
import { Unauthorized } from './router/_errors/unauthorized-error'

type FastifyErrorHandle = FastifyInstance['errorHandler']
export const errorHandle: FastifyErrorHandle = (error, request, reply) => {
  if (error instanceof ZodError) {
    return reply.status(400).send({
      message: 'validation error',
      errors: error.flatten().fieldErrors,
    })
  }
  if (error instanceof BadRequestError) {
    return reply.status(400).send({
      message: error.message,
    })
  }
  if (error instanceof Unauthorized) {
    return reply.status(401).send({
      message: error.message,
    })
  }
  console.log(error)
  return reply.status(500).send({
    message: 'internal server error',
  })
}
