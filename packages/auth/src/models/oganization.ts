import z from 'zod'

export const projectSchema = z.object({
  __typename: z.literal('Organization').default('Project'),
  id: z.string(),
  ownerId: z.string(),
})
export type Project = z.infer<typeof projectSchema>
