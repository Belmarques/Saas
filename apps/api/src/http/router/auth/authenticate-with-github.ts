import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import {env} from '@saas/env'
import { prisma } from '@/lib/prisma'

import { BadRequestError } from '../_errors/bad-request-error'

export async function authenticateWithGitHub(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/session/github',
    {
      schema: {
        tags: ['auth'],
        summary: 'authenticate whith github',
        body: z.object({
          code: z.string(),
        }),
        response: {
          201: z.object({
            token: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { code } = request.body

      const gitHubOrAuth = new URL(
        'https://github.com/login/oauth/access_token',
      )
      gitHubOrAuth.searchParams.set('client_id',env.GITHUB_DAUTH_CLIENT_ID)
      gitHubOrAuth.searchParams.set(
        'client_secret',
        env.GITHUB_DAUTH_SECRET,
      )
      gitHubOrAuth.searchParams.set(
        'redirect_uri',
        env.GITHUB_DAUTH_CLIENT_REDIRECT_URI,
      )
      gitHubOrAuth.searchParams.set('code', code)
      const githubAccessTokenResponse = await fetch(gitHubOrAuth, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
      })
      const githubAccessTokenData = await githubAccessTokenResponse.json()

      const { access_token: githubAccessToken } = z
        .object({
          access_token: z.string(),
          token_type: z.literal('bearer'),
          scope: z.string(),
        })
        .parse(githubAccessTokenData)
      const githubUserResponse = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${githubAccessToken}`,
        },
      })
      const githubUserData = await githubUserResponse.json()
      console.log(githubUserData)

      const {
        id: gitHubId,
        name,
        avatar_url: avatarUrl,
        email,
      } = z
        .object({
          id: z.number().int().transform(String),
          avatar_url: z.string().url(),
          name: z.string().nullable(),
          email: z.string().nullable(),
        })
        .parse(githubUserData)
      if (email === null) {
        throw new BadRequestError(
          'Your github account must have email to authenticate',
        )
      }
      let user = await prisma.user.findUnique({
        where: {
          email,
        },
      })
      if (!user) {
        user = await prisma.user.create({
          data: {
            name,
            email,
            avatarUrl,
          },
        })
      }
      let account = await prisma.account.findUnique({
        where: {
          provider_userId: {
            provider: 'GITHUB',
            userId: user.id,
          },
        },
      })
      if (!account) {
        account = await prisma.account.create({
          data: {
            provider: 'GITHUB',
            providerAccountId: gitHubId,
            userId: user.id,
          },
        })
      }
      const token = await reply.jwtSign(
        {
          sub: user.id,
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
