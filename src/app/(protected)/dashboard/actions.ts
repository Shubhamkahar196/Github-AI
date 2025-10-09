 



'use server'

import { streamText } from 'ai'
import { createStreamableValue } from '@ai-sdk/rsc'
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

  let result: { fileName: string; sourceCode: string; summary: string }[] = []

  try {
    result = await db.$queryRaw`
      SELECT "fileName", "sourceCode", "summary",
      1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) AS similarity
      FROM "SourceCodeEmbedding"
      WHERE 1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) > 0.5
      AND "projectId" = ${projectId}
      ORDER BY similarity DESC
      LIMIT 10
    ` as { fileName: string; sourceCode: string; summary: string }[]
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("Error fetching similar files:", err)
    } else {
      console.error("Error fetching similar files:", String(err))
    }
    // Continue with empty result
  }

  let context = ''
  for (const doc of result) {
    context += `Source: ${doc.fileName}\nCode: ${doc.sourceCode}\nSummary: ${doc.summary}\n\n`
  }

  // Start streaming AI response
  void (async () => {
    try {
      const { textStream } = await streamText({
        model: gemini-2.5-Flash,
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

      for await (const text of textStream) {
        output.update(text)
      }

      output.done()
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Error in AI streaming:", err)
      } else {
        console.error("Error in AI streaming:", String(err))
      }
      ;(output as any).update("❌ Sorry, something went wrong while processing your question.")
      ;(output as any).done()
    }
  })()

  return {
    output: output.value,
    fileReferences: result,
  }
}
