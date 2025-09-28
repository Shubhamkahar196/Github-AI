
import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { pollCommits } from "@/lib/github";
// import { type Project } from "@prisma/client";



export const projectRouter = createTRPCRouter({
      
    createProject: protectedProcedure.input(
        z.object({
            name: z.string(),
            githubUrl: z.string(),
            githubToken: z.string().optional()
        })
    ).mutation(async ({ctx,input})=>{

          if (!ctx.user.userId) {
        throw new Error("User ID is required");
      }

        

        
        const project = await ctx.db.project.create({
            data:{
                githubUrl: input.githubUrl,
                name: input.name,
                UserToProjects:{
                    create: {
                        userId: ctx.user.userId,
                    }
                }
            }
        })
        await pollCommits(project.id)
        return project
    }),
    getProjects: protectedProcedure.query(async ({ctx}) =>{
        return await ctx.db.project.findMany({
            where: {
                UserToProjects:{
                    some:{
                        userId: ctx.user.userId
                    }
                },
                deletedAt: null
            }
        })
    }),

    getCommits: protectedProcedure.input(z.object({
        projectId: z.string()
    })).query(async ({ctx,input})=>{
        return await ctx.db.commit.findMany({where: {projectId: input.projectId}})
    })

})
