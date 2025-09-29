
import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { pollCommits, getReadmeContent } from "@/lib/github"; // Added getReadmeContent import
import { summariseText } from "@/lib/gemini"; // Added summariseText import for project summary
// import { type Project } from "@prisma/client";



export const projectRouter = createTRPCRouter({
      
    createProject: protectedProcedure.input(
        z.object({
            name: z.string(),
            githubUrl: z.string().url().refine((url) => {
                try {
                    const urlObj = new URL(url);
                    return urlObj.hostname === 'github.com' && urlObj.pathname.split('/').filter(Boolean).length >= 2;
                } catch {
                    return false;
                }
            }, "Invalid GitHub URL. Must be a valid GitHub repository URL like https://github.com/owner/repo"),
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
        try {
            // Generate project summary from README
            const readmeContent = await getReadmeContent(input.githubUrl);
            if (readmeContent) {
                const summary = await summariseText(readmeContent);
                await ctx.db.project.update({
                    where: { id: project.id },
                    data: { summary }
                });
            }
            await pollCommits(project.id)
        } catch (error) {
            console.error('Failed to generate summary or poll commits:', error)
        }
        return project
    }),
    getProjects: protectedProcedure.query(async ({ctx}) =>{
        if (!ctx.user.userId) {
            throw new Error("User ID is required");
        }
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
        if (!ctx.user.userId) {
            throw new Error("User ID is required");
        }
        pollCommits(input.projectId).then().catch(console.error)
        return await ctx.db.commit.findMany({where: {projectId: input.projectId}})
    }),

    // askQuestion: protectedProcedure.input(z.object({
    //     projectId: z.string(),
    //     question: z.string()
    // })).mutation(async ({ctx,input})=>{
    //     if (!ctx.user.userId) {
    //         throw new Error("User ID is required");
    //     }
    //     const commits = await ctx.db.commit.findMany({where: {projectId: input.projectId}})
    //     const summaries = commits.map(commit => commit.summary).filter(Boolean)
    //     const context = summaries.join('\n')
    //     const { summariseText } = await import("@/lib/gemini")
    //     const prompt = `Based on the following project commit summaries, answer the question: ${input.question}\n\nSummaries:\n${context}`
    //     const answer = await summariseText(prompt)
    //     return { answer }
    // })

})
