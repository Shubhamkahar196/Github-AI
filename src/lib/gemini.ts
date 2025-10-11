



// src/lib/gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Document } from "@langchain/core/documents";


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Helper delay
function delay(ms: number) {
  return new Promise(res => setTimeout(res, ms));
}

/**
 * Summarize commits in batches to avoid Gemini quota issues
 * @param commits Array of commits with full details and diff
 */
export async function aisummarizeCommits(
  commits: {
    commitHash: string;
    commitMessage: string;
    commitAuthorName: string;
    commitAuthorAvatar: string;
    commitDate: string;
    diff?: string;
  }[]
) {
  if (!commits.length) return [];

  const prompt = `
You are an assistant that summarizes git commits.  
For each commit, provide a concise bullet-point summary with file references.  
Format output as:

Commit <number>:
- Summary line 1
- Summary line 2

Commits:
${commits
  .map(
    (c, i) => `
Commit ${i + 1}:
Message: ${c.commitMessage}
Diff: ${c.diff ?? "No diff provided"}
`
  )
  .join("\n\n")}
`;

  let retries = 3; // retry up to 3 times if rate-limited
  while (retries > 0) {
    try {
      const response = await model.generateContent(prompt);
      const text = response.response.text().trim();

      // Split summaries back per commit (Commit 1:, Commit 2:, etc.)
      const summaries = text
        .split(/Commit\s+\d+:/i)
        .map((s) => s.trim())
        .filter(Boolean);

      return commits.map((c, i) => ({
        ...c,
        summary: summaries[i] ?? "⚠️ Failed to parse summary",
      }));
    } catch (err) {
      if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 429) {
        console.warn("⏳ Rate limit hit, retrying in 20s...");
        await delay(20000);
        retries--;
      } else {
        console.error("❌ Gemini error:", err);
        return commits.map((c) => ({
          ...c,
          summary: "⚠️ Error generating summary",
        }));
      }
    }
  }

  // Fallback if retries exhausted
  return commits.map((c) => ({
    ...c,
    summary: "⚠️ Skipped due to quota",
  }));
}



export async function summariesCode(doc: Document){
  console.log('getting summary for', doc.metadata.source);
  try {
     const code = doc.pageContent.slice(0,10000);  // limit to 10000 characters
  const response = await model.generateContent([
    `you are an intelligent senior software engineer who specialises in onboarding junior software engineers onto projects`,
    `You are onboarding a junior software engineer and explaining to them the purpose of the ${doc.metadata.source} file
    Here is the code: 
    _ _ _
    ${code}
    _ _ _
    Give a summary no more than 100 words of the code above `,
  ])
  return response.response.text();
  } catch (error) {
    console.log("summriesCode error",error);
    return ''
  }
 
}

export async function generateEmbedding(summary: string){
  const model = genAI.getGenerativeModel({
    model: "text-embedding-004"
  })
  const result = await model.embedContent(summary)
  const embedding = result.embedding
  return embedding.values
}


