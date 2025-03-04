import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  server: {
    SERVER_PORT: z.coerce.number().default(3333),
    DATABASE_URL: z.string().url(),

    JWT_SECRET: z.string(),
    GITHUB_DAUTH_CLIENT_ID: z.string(),
    GITHUB_DAUTH_SECRET: z.string(),
    GITHUB_DAUTH_CLIENT_REDIRECT_URI: z.string().url(),
  },
  client: {},
  shared: {},
  runtimeEnv: {
    SERVER_PORT: process.env.SERVER_PORT,
    DATABASE_URL: process.env.DATABASE_URL,
    GITHUB_DAUTH_CLIENT_ID: process.env.GITHUB_DAUTH_CLIENT_ID,
    GITHUB_DAUTH_CLIENT_REDIRECT_URI:
      process.env.GITHUB_DAUTH_CLIENT_REDIRECT_URI,
    GITHUB_DAUTH_SECRET: process.env.GITHUB_DAUTH_SECRET,
    JWT_SECRET: process.env.JWT_SECRET,
  },
  emptyStringAsUndefined: true,
})
