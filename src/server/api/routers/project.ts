
import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";



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

        

        
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
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
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return project
    })
})