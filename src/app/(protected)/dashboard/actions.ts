



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



'use server'

import { streamText } from 'ai'
// import { createStreamableValue } from 'ai/rsc'
// import {createStreamableValue} from '@ai/rsc'
// import { createStreamableValue } from "@ai-sdk/react";
// import { createStreamableValue } from '@ai-sdk/react'

import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateEmbedding } from '@/lib/gemini'
import { db } from "@/server/db";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY!,
})

export async function askQuestion(question: string, projectId: string) {
  const output = createStreamableValue<string>()

  const queryVector = await generateEmbedding(question)
  const vectorQuery = `[${queryVector.join(',')}]`

  const result = (await db.$queryRaw`
    SELECT "FileName", "sourceCode", "summary",
    1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) AS similarity
    FROM "SourceCodeEmbedding"
    WHERE 1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) > 0.5
    AND "projectId" = ${projectId}
    ORDER BY similarity DESC
    LIMIT 10
  `) as { fileName: string; sourceCode: string; summary: string }[]

  let context = ''
  for (const doc of result) {
    context += `Source: ${doc.fileName}\nCode: ${doc.sourceCode}\nSummary: ${doc.summary}\n\n`
  }

  // Start streaming AI response
  ;(async () => {
    const { textStream } = await streamText({
      model: google('gemini-1.5-pro'),
      prompt: `
        You are an AI code assistant answering technical questions about a codebase.
        START CONTEXT:
        ${context}
        END CONTEXT.

        QUESTION:
        ${question}

        If you cannot find an answer in the context, say:
        "I'm sorry, but I couldn't find enough context in the project files to answer that."
      `,
    })

    for await (const delta of textStream) {
      output.update(delta)
    }

    output.done()
  })()

  return {
    output,
    fileReferences: result,
  }
}
