'use server'

import { streamText } from 'ai'
import { createStreamableValue } from '@ai-sdk/rsc' // ✅ correct import
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateEmbedding } from '@/lib/gemini'
import { db } from "@/server/db"

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY!,
})

export async function askQuestion(question: string, projectId: string) {
  const output = createStreamableValue<string>()

  try {
    // Step 1: Generate embedding for the user’s question
    const queryVector = await generateEmbedding(question)
    const vectorQuery = `[${queryVector.join(',')}]`

    // Step 2: Find similar code snippets using vector search
    let result: { fileName: string; sourceCode: string; summary: string }[] = []

    try {
      result = await db.$queryRaw`
        SELECT "fileName", "sourceCode", "summary",
        1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) AS similarity
        FROM "SourceCodeEmbedding"
        WHERE 1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) > 0.3
        AND "projectId" = ${projectId}
        ORDER BY similarity DESC
        LIMIT 10
      ` as { fileName: string; sourceCode: string; summary: string }[]

      console.log("🧩 Similar files found:", result.length)
    } catch (err) {
      console.error("❌ Database vector search error:", err)
    }

    // Step 3: Build the AI prompt context
    let context = ''
    for (const doc of result) {
      context += `Source: ${doc.fileName}\nCode: ${doc.sourceCode}\nSummary: ${doc.summary}\n\n`
    }

    if (result.length === 0) {
      context = "No relevant code snippets were found in the database. Try answering generally based on project logic."
    }

    console.log("🧠 CONTEXT SENT TO GEMINI:\n", context.slice(0, 1000)) // debug preview

    // Step 4: Stream the AI response
    void (async () => {
      try {
        const { textStream } = await streamText({
          model: google('gemini-2.5-flash'), 
          prompt: `
            You are a ai code assistant who answers question about the codebase. Your target audience is a technical intern 
              AI assistant is a brand new, powerful, humal-like artificial intelligence.
              The traits of AI include expert knowledge, helfulness, cleverness, and articulateness.
              AI is a well- based and well-mannered individual.
              AI is always friendly, kind, and inspiring, and he is eager to provide vivid and thoughtful response to the user.
              AI has the sum of all knowledge in their brain, and is able to accurately answer nearly any question about any topic in if the question is asking about code or a specific file,
              AI will provide the detailed answer, giving step by step instruction
              START CONTEXT BLOCK
              ${context}
              END OF CONTEXT BLOCK

              START QUESTION
              ${question}
              END OF QUESTION

              AI assistant will take into account any CONTEXT BLOCK that is provided in a conversation.
              
            

            If you context does not provide the answer to question , the AI assistant will say, "I"'m sorrry, but i don't know the answer
          AI assistant will not apologize for previous respoonses, but instead will indicated new informtation
          AI assistant will not invent anything that is not drawn directly from the context.
          Answer in markdown SyntaxError, with code snippets if needed.Be as detailed as possible when answering
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