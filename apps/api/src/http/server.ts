import fastifyCors from '@fastify/cors'
import fastifyJwt from '@fastify/jwt'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import fastify from 'fastify'
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from 'fastify-type-provider-zod'

import { authenticateWithPassword } from './router/auth/authenticate-with-password'
import { createAccount } from './router/auth/create-account'
import { getProfile } from './router/auth/get-profile'
const app = fastify().withTypeProvider<ZodTypeProvider>()
app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)
app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'Next-saas',
      description: 'Fullstack app',
      version: '1.0.0',
    },
    servers: [],
  },
  transform: jsonSchemaTransform,
})
app.register(fastifySwaggerUi, {
  routePrefix: '/docs',
})
app.register(fastifyJwt, {
  secret: 'my-jwt',
})
app.register(getProfile)
app.register(fastifyCors)
app.register(createAccount)
app.register(authenticateWithPassword)
app.listen({ port: 3333 }).then(() => {
  console.log('running server')
})
