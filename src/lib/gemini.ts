




// import { GoogleGenerativeAI } from '@google/generative-ai'

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
// const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

// const MAX_DIFF_LENGTH = 12000

// export async function aisummariesCommit(diff: string): Promise<string> {
//   try {
//     const safeDiff = diff.length > MAX_DIFF_LENGTH ? diff.slice(0, MAX_DIFF_LENGTH) : diff

//     const prompt = `
// You are an expert programmer, and you are trying to summarize a git diff.

// Reminders about the git diff format:
// For every file, there are metadata lines like:
// '''
// diff --git a/lib/index.js b/lib/index.js
// index aadf691..bfef603 100644
// --- a/lib/index.js
// +++ b/lib/index.js
// '''
// This means that 'lib/index.js' was modified. Lines starting with '+' were added, '-' were removed. Lines with neither are context.

// Here are example summary comment styles (for inspiration only — do not copy them):
// '''
// * Raised the amount of returned recordings from '10' to '100' [packages/server/recordings_api.ts]
// * Fixed a typo in the GitHub action name [.github/workflows/gpt-commit-summarizer.yml]
// * Moved the 'octokit' initialization to a separate file [src/octokit.ts], [src/index.ts]
// '''

// Now, summarize the following git diff as a bullet list using '* ' at the beginning of each line:

// ${safeDiff}
//     `.trim()

//     const response = await model.generateContent(prompt)
//     const text = await response.response.text()

//     return text.trim()
//   } catch (error) {
//     console.error('❌ Failed to generate summary:', error)
//     return ''
//   }
// }




// src/lib/gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

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
