import fastifyCors from '@fastify/cors'
import fastifyJwt from '@fastify/jwt'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import { env } from '@saas/env'
import fastify from 'fastify'
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from 'fastify-type-provider-zod'

import { errorHandle } from './error-handler'
import { authenticateWithGitHub } from './router/auth/authenticate-with-github'
import { authenticateWithPassword } from './router/auth/authenticate-with-password'
import { createAccount } from './router/auth/create-account'
import { getProfile } from './router/auth/get-profile'
import { requestPasswordRecover } from './router/auth/request-password-recover'
import { resetPassword } from './router/auth/reset-password'
import { acceptInvite } from './router/invites/accept-invite'
import { createInvite } from './router/invites/create-invite'
import { getInvite } from './router/invites/get-invite'
import { getInvites } from './router/invites/get-invites'
import { getPendingInvites } from './router/invites/get-pending-invites'
import { rejectInvite } from './router/invites/reject-invite'
import { revokeInvite } from './router/invites/revoke-invite'
import { getMembers } from './router/members/get-members'
import { removeMember } from './router/members/remove-members'
import { updateMember } from './router/members/update-member'
import { createOrganization } from './router/org/create-organization'
import { getMemberShip } from './router/org/get-membership'
import { getOrganization } from './router/org/get-organization'
import { getOrganizations } from './router/org/get-organizations'
import { shutDownOrganization } from './router/org/shutdown-organization'
import { transferOrganization } from './router/org/transfer-organization'
import { updateOrganization } from './router/org/update-organization'
import { createProject } from './router/project/create-project'
import { deleteProject } from './router/project/delete-project'
import { getProject } from './router/project/get-project'
import { getProjects } from './router/project/get-projects'
const app = fastify().withTypeProvider<ZodTypeProvider>()
app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)
app.setErrorHandler(errorHandle)
app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'Next-saas',
      description: 'Fullstack app',
      version: '1.0.0',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  transform: jsonSchemaTransform,
})
app.register(fastifySwaggerUi, {
  routePrefix: '/docs',
})
app.register(fastifyJwt, {
  secret: env.JWT_SECRET,
})
app.register(getProfile)
app.register(fastifyCors)
app.register(createAccount)
app.register(authenticateWithPassword)
app.register(resetPassword)
app.register(requestPasswordRecover)
app.register(authenticateWithGitHub)

app.register(createOrganization)
app.register(getMemberShip)
app.register(getOrganization)
app.register(getOrganizations)
app.register(shutDownOrganization)
app.register(transferOrganization)
app.register(updateOrganization)

app.register(createProject)
app.register(deleteProject)
app.register(getProject)
app.register(getProjects)

app.register(getMembers)
app.register(updateMember)
app.register(removeMember)

app.register(createInvite)
app.register(getInvite)
app.register(getInvites)
app.register(acceptInvite)
app.register(rejectInvite)
app.register(revokeInvite)
app.register(getPendingInvites)

app.listen({ port: env.SERVER_PORT }).then(() => {
  console.log('running server')
})
