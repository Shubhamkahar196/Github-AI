



import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'

import {pollCommits} from '@/lib/github'

export const projectRouter = createTRPCRouter({
  createProject: protectedProcedure
    .input(z.object({
      name: z.string(),
      githubUrl: z.string().url().refine(url => {
        try {
          const u = new URL(url)
          return u.hostname === 'github.com' && u.pathname.split('/').filter(Boolean).length >= 2
        } catch {
          return false
        }
      }, 'Invalid GitHub URL'),
      githubToken: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.userId) throw new Error('User required')

      const project = await ctx.db.project.create({
        data: {
          name: input.name,
          githubUrl: input.githubUrl,
          UserToProjects: {
            create: { userId: ctx.user.userId }
          }
        }
      })

      // trigger initial summary fetch
      await pollCommits(project.id)
      return project
    }),

  getProjects: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user.userId) throw new Error('User required')
    return ctx.db.project.findMany({
      where: {
        UserToProjects: { some: { userId: ctx.user.userId } },
        deletedAt: null
      }
    })
  }),

  getCommits: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user.userId) throw new Error('User required')

      // fetch new ones before returning
      await pollCommits(input.projectId)

      const commits = await ctx.db.commit.findMany({
        where: { projectId: input.projectId }
      })
      return commits
    }),

    saveAnswer: protectedProcedure.input(z.object({
      projectId: z.string(),
      question: z.string(),
      answer: z.string(),
      fileReferences: z.any()
    })).mutation(async({ctx,input}) =>{
      return await ctx.db.question.create({
        data: {
          answer: input.answer,
          fileReferences: input.fileReferences,
          projectId: input.projectId,
          question: input.question,
          userId: ctx.user.userId!
        }
      })
    }),

    getQuestions: protectedProcedure.input(z.object({projectId: z.string()})).query(async({ctx,input})=>{
      return await ctx.db.question.findMany({
        where:{
          projectId: input.projectId
        },
        include:{
          user: true
        },
        orderBy: {
          createdAt: "desc"
        }
      })
    }),

    uploadMeeting : protectedProcedure.input(z.object({ projectId: z.string(), meetingUrl: z.string(), name: z.string()}))
    .mutation(async ({ctx,input})=>{
      const meeting  = await ctx.db.meeting.create({
        data: {
          meetingUrl: input.meetingUrl,
          projectId: input.projectId,
          name: input.name,
          status: "PROCESSING"
        }
      })
    })

    getMeetings: protectedProcedure.input(z.object({projectId: z.string()})).query(async ({ctx,input})=>{
      return await ctx.db.meeting.findMany({ where: {projectId: input.projectId}})
    })
})

