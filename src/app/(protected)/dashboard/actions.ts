'use server'

import { streamText } from 'ai'
import { createStreamableValue } from '@ai-sdk/rsc'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateEmbedding } from '@/lib/gemini'
import { db } from "@/server/db"
import { loadGithubRepo } from '@/lib/github-loader'

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY ?? '',
})

export async function askQuestion(question: string, projectId: string) {
  const output = createStreamableValue<string>()

  try {
    // Step 1: Generate embedding for the user’s question
    const queryVector = await generateEmbedding(question)
    const vectorQuery = `[${queryVector.join(',')}]`

    // Step 1.5: Fetch project GitHub URL for fallback
    let projectGithubUrl = ''
    try {
      const proj = await db.project.findUnique({
        where: { id: projectId },
        select: { githubUrl: true }
      })
      projectGithubUrl = proj?.githubUrl ?? ''
    } catch (err) {
      console.error("Error fetching project GitHub URL:", err)
    }

    // Step 2: Find similar code snippets using vector search
    let result: { fileName: string; sourceCode: string; summary: string }[] = []

    try {
      result = await db.$queryRaw`
        SELECT "fileName", "sourceCode", "summary",
        1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) AS similarity
        FROM "SourceCodeEmbedding"
        WHERE 1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) > .5
        AND "projectId" = ${projectId}
        ORDER BY similarity DESC
        LIMIT 10
      ` as { fileName: string; sourceCode: string; summary: string }[]

      console.log("🧩 Similar files found:", result.length)
    } catch (err) {
      console.error("❌ Database vector search error:", err)
    }

    // Fallback: if no embedded files, load some files from GitHub
    if (result.length === 0 && projectGithubUrl) {
      try {
        const docs = await loadGithubRepo(projectGithubUrl);
        const limitedDocs = docs.slice(6, 10); // Limit to first 5 files
        result = limitedDocs.map(doc => ({
          fileName: doc.metadata.source || 'unknown',
          sourceCode: doc.pageContent.slice(0, 10000),
          summary: 'File content loaded from repository'
        }));
        console.log("📁 Loaded fallback files:", result.length);
      } catch (err) {
        console.error("❌ Error loading fallback files:", err);
      }
    }

    // Step 3: Fetch project summary
    let projectSummary = ''
    try {
      const project = await db.project.findUnique({
        where: { id: projectId },
        select: { summary: true, name: true, githubUrl: true }
      })
      if (project) {
        projectSummary = `Project Name: ${project.name}\nGitHub URL: ${project.githubUrl}\nProject Summary: ${project.summary ?? 'No summary available.'}\n\n`
      }
    } catch (err) {
      console.error("Error fetching project:", err)
    }

    // Step 4: Build the AI prompt context
    let context = projectSummary
    for (const doc of result) {
      context += `Source: ${doc.fileName}\nCode: ${doc.sourceCode}\nSummary: ${doc.summary}\n\n`
    }

    if (result.length === 0 && !projectSummary) {
      context = "No relevant code snippets or project information were found in the database."
    }

    console.log("🧠 CONTEXT SENT TO GEMINI:\n", context.slice(0, 1000)) // debug preview

    // Step 4: Stream the AI response
    void (async () => {
      try {
        const { textStream } = await streamText({
          model: google('gemini-2.5-flash'), 
          prompt: `
            You are an AI code assistant who answers questions about the codebase. Your target audience is a technical intern.
            You are a brand new, powerful, human-like artificial intelligence.
            Your traits include expert knowledge, helpfulness, cleverness, and articulateness.
            You are well-based and well-mannered.
            You are always friendly, kind, and inspiring, and you provide vivid and thoughtful responses to the user.
            You have access to general knowledge and can answer questions about programming languages, frameworks, and technologies based on common knowledge, especially when the project context provides clues like the project name or GitHub URL.

            START CONTEXT BLOCK
            ${context}
            END OF CONTEXT BLOCK

            START QUESTION
            ${question}
            END OF QUESTION

            Take into account any CONTEXT BLOCK that is provided.
            For questions about the project in general (like languages used, summary, etc.), use the project information in the context and your general knowledge to provide accurate answers.
            For specific code questions, provide detailed answers with step-by-step instructions if possible.
            When referencing specific code or files from the context, always include the file name in your response, e.g., "In file X.tsx, ..." or "As shown in Y.js, ...".
            If the context truly does not provide enough information and you cannot reasonably infer the answer, say "I'm sorry, but I don't have enough information to answer that question accurately."
            Do not invent information not drawn from the context or general knowledge.
            Answer in markdown format, with code snippets if needed. Be as detailed as possible when answering.
          `,

         
        })

        for await (const text of textStream) {
          output.update(text)
        }

        output.done()
      } catch (err) {
        console.error("❌ Error in AI streaming:", err)
        output.update("⚠️ Sorry, something went wrong while generating the answer.")
        output.done()
      }
    })()

    // Step 5: Return both stream output and related files
    return {
      output: output.value,
      fileReferences: result,
    }
  } catch (err) {
    console.error("❌ Fatal error in askQuestion:", err)
    output.update("⚠️ An unexpected error occurred while processing your question.")
    output.done()
    return { output: output.value, fileReferences: [] }
  }
}





















// 'use server'

// import {streamText} from 'ai'
// import {createStreamableValue} from 'ai/rsc'
// import {createGoogleGenerativeAI} from '@ai-sdk/google'
// import { generateEmbedding } from '@/lib/gemini'

// const google = createGoogleGenerativeAI({
//      apiKey: process.env.GEMINI_API_KEY
// })

// export async function askQuestion(question: string,projectId: string){
//     const stream = createStreamableValue()

//     const queryVector = await generateEmbedding(question)
//     const vectorQuery = [${queryVector.join('.')}]

//     const result = await db.$queryRaw
//     SELECT "FileName", "sourceCode", "summary",
//     1- ("summaryEmbedding" <=> ${vectorQuery}:: vector) AS similarity
//     FROM "SourceCodeEmbedding"
//     WHERE 1 - ("summaryEmbedding" <=> ${vectorQuery}::vector ) >.5
//     AND "projectId" = ${projectId}
//     ORDER BY similarity DESC
//     LIMIT 10 
//      as {fileName: string; sourceCode: string; summary: string}[]

//     let context = ''

//     for(const doc of result){
//         context += source: ${doc.fileName}\ncode content: ${doc.sourceCode}\n summary of file: ${doc.summary}\n\n
//     }

//     (async ()=>{
//         const {textStream} = await streamText({
//             model: google('gemini-1.5-pro'),
//             prompt: 
//              You are a ai code assistant who answers question about the codebase. Your target audience is a technical intern 
//               AI assistant is a brand new, powerful, humal-like artificial intelligence.
//               The traits of AI include expert knowledge, helfulness, cleverness, and articulateness.
//               AI is a well- based and well-mannered individual.
//               AI is always friendly, kind, and inspiring, and he is eager to provide vivid and thoughtful response to the user.
//               AI has the sum of all knowledge in their brain, and is able to accurately answer nearly any question about any topic in if the question is asking about code or a specific file,
//               AI will provide the detailed answer, giving step by step instruction
//               START CONTEXT BLOCK
//               ${context}
//               END OF CONTECT BLOCK

//               START QUESTION
//               ${question}
//               END OF QUESTION

//               AI assistant will take into account any CONTEXT BLOCK that is provided in a conversation.
//               If the context does not provide the answer to question, the AI assistant will say, "I'm sorry, but 
            
            
//         })
//     })
// }