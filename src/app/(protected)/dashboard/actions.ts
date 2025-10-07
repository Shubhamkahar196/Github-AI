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
//     const vectorQuery = `[${queryVector.join('.')}]`

//     const result = await db.$queryRaw`
//     SELECT "FileName", "sourceCode", "summary",
//     1- ("summaryEmbedding" <=> ${vectorQuery}:: vector) AS similarity
//     FROM "SourceCodeEmbedding"
//     WHERE 1 - ("summaryEmbedding" <=> ${vectorQuery}::vector ) >.5
//     AND "projectId" = ${projectId}
//     ORDER BY similarity DESC
//     LIMIT 10 
//     ` as {fileName: string; sourceCode: string; summary: string}[]

//     let context = ''

//     for(const doc of result){
//         context += `source: ${doc.fileName}\ncode content: ${doc.sourceCode}\n summary of file: ${doc.summary}\n\n`
//     }

//     (async ()=>{
//         const {textStream} = await streamText({
//             model: google('gemini-1.5-pro'),
//             prompt: `
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
            
//             `
//         })
//     })
// }




"use server";

import { streamText } from "ai";
import { createStreamableValue } from "ai/rsc";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateEmbedding } from "@/lib/gemini";
import { db } from "@/server/db";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function askQuestion(question: string, projectId: string) {
  // Step 1. Create a streamable response
  const stream = createStreamableValue();

  try {
    // Step 2. Create embedding for the question
    const queryVector = await generateEmbedding(question);
    const vectorQuery = `[${queryVector.join(",")}]`; // ✅ FIXED: use commas, not dots

    // Step 3. Fetch similar files from database
    const result = (await db.$queryRaw`
      SELECT "fileName", "sourceCode", "summary",
      1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) AS similarity
      FROM "SourceCodeEmbedding"
      WHERE 1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) > 0.5
      AND "projectId" = ${projectId}
      ORDER BY similarity DESC
      LIMIT 10
    `) as { fileName: string; sourceCode: string; summary: string }[];

    // Step 4. Build a rich context for Gemini
    let context = "";
    for (const doc of result) {
      context += `File: ${doc.fileName}\nCode Content:\n${doc.sourceCode}\nSummary: ${doc.summary}\n\n`;
    }

    // Step 5. Stream Gemini’s response asynchronously
    (async () => {
      const { textStream } = await streamText({
        model: google("gemini-1.5-flash"),
        prompt: `
You are an expert AI code assistant. Your role is to help developers understand and improve their codebase.

Be polite, detailed, and clear. Always give step-by-step help when asked about specific files or logic.

### CONTEXT ###
${context || "No relevant code found for this project."}

### QUESTION ###
${question}

If the context doesn’t contain relevant information, say:
"I'm sorry, but I couldn’t find relevant details in the codebase to answer this question."
        `,
      });

      for await (const text of textStream) {
        stream.update(delta);
      }

      stream.done();
    })();
  } catch (err) {
    console.error("Error in askQuestion:", err);
    stream.update("❌ Sorry, something went wrong while processing your question.");
    stream.done();
  }

  // Step 6. Return the streamable value
  return { output: stream.value,
    fileReferences: result
   };
}
