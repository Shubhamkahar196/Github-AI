
// import {GoogleGenerativeAI} from '@google/generative-ai'

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
// const model = genAI.getGenerativeModel({
//     model: 'gemini-2.5-flash'
// })

// export const aisummariesCommit = async (diff: string) => {
//     const response = await model.generateContent([
//     ` You are an expert programmer, and you are trying to summarize a git diff.
// Remainders about the git diff format:
// For every file, there are a few metadata lines, like(for example):
// '''
// diff --git a/lib/index.js b/lib/index.js
// index aadf691..bfef603 100644
// --- a/lib/index.js
// +++ b/lib/index.js
// '''
// This means that 'lib/index.js' was modified in this commit. Note that this is only an example.
// Then there is a specifier of the lines that were modified.
// A line starting with ' + ' means it was added.
// A line that startung with '-' means that line was deleted.
// A line that starts with neither '+' nor '-' is code given for context and better understanding.
// IT is not part of the diff.
// [...]
// EXAMPLE SUMMARY COMMENTS:
// '''
// *Raised the amount of returned recordings from '10' to '100' [packages/server/recordings_api.ts],[packges/server/constants.ts]
// *Fixed a typo in the github action name [.github/workflows/gpt-commit-summarizer.yml]
// *Moved the 'octokit' initialization to a separate file [src/octokit.ts],[src/index.ts]
// *Added an OpenAI API for completions [packages/utils/apis/openai.ts]
// "Lowered numeric tolerance for test files
// '''
// Most commits will have less comments than this example list.
// The last commit does not include the file name,
// because there were more than two relevant files in the hypothetical commit.
// Do not include parts of the example in you summary.
// It is given ony as an example of appropriate comments.`,

// `Please summarise the following diff file: \n\n${diff}`,
// ]);

//     // const response = await model.generateContent(prompt)
//     return response.response.text()
// }




import { GoogleGenerativeAI } from '@google/generative-ai'

// Set up the Gemini model with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

// Optional: Truncate large diffs to avoid token limits (Gemini Flash handles ~8,000 tokens well)
const MAX_DIFF_LENGTH = 12000 // Adjust if needed

// Main function to summarize Git diffs
export const aisummariesCommit = async (diff: string): Promise<string> => {
  try {
    const safeDiff = diff.length > MAX_DIFF_LENGTH ? diff.slice(0, MAX_DIFF_LENGTH) : diff

    const prompt = `
You are an expert programmer, and you are trying to summarize a git diff.

Reminders about the git diff format:
For every file, there are metadata lines like:
'''
diff --git a/lib/index.js b/lib/index.js
index aadf691..bfef603 100644
--- a/lib/index.js
+++ b/lib/index.js
'''
This means that 'lib/index.js' was modified. Lines starting with '+' were added, '-' were removed. Lines with neither are context.

Here are example summary comment styles (for inspiration only — do not copy them):
'''
* Raised the amount of returned recordings from '10' to '100' [packages/server/recordings_api.ts]
* Fixed a typo in the GitHub action name [.github/workflows/gpt-commit-summarizer.yml]
* Moved the 'octokit' initialization to a separate file [src/octokit.ts], [src/index.ts]
'''

Now, summarize the following git diff as a bullet list using '* ' at the beginning of each line:

${safeDiff}
    `.trim()

    const response = await model.generateContent(prompt)
    const text = await response.response.text()

    return text.trim()
  } catch (error) {
    console.error('❌ Failed to generate summary:', error)
    return 'Summary generation failed.'
  }
}
