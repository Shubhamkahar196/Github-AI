


import { Octokit } from "octokit";
import axios from "axios";
import { aisummarizeCommits} from "./gemini"; 
import { db } from "../server/db";

if (!process.env.GITHUB_TOKEN) throw new Error('GITHUB_TOKEN required');
export const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

type CommitBasic = {
  commitHash: string;
  commitMessage: string;
  commitAuthorName: string;
  commitAuthorAvatar: string;
  commitDate: string;
};

type CommitWithSummary = CommitBasic & { summary: string; diff?: string };

// Fetch recent commits from GitHub
export async function getCommitHashes(githubUrl: string): Promise<CommitBasic[]> {
  const parts = githubUrl.split("/").slice(-2);
  const owner = parts[0];
  const repo = parts[1];
  if (!owner || !repo) throw new Error("Invalid GitHub repo URL");

  const { data } = await octokit.rest.repos.listCommits({ owner, repo });

  const sorted = data.sort((a, b) => {
    const at = a.commit.author?.date ? new Date(a.commit.author.date).getTime() : 0;
    const bt = b.commit.author?.date ? new Date(b.commit.author.date).getTime() : 0;
    return bt - at;
  });

  return sorted.slice(0, 15).map((c) => ({
    commitHash: c.sha,
    commitMessage: c.commit.message ?? "",
    commitAuthorName: c.commit.author?.name ?? "",
    commitAuthorAvatar: c.author?.avatar_url ?? "",
    commitDate: c.commit.author?.date ?? "",
  }));
}

// Filter out commits already in DB
async function filterUnprocessedCommits(projectId: string, commits: CommitBasic[]) {
  const processed = await db.commit.findMany({
    where: { projectId },
    select: { commitHash: true },
  });
  const processedSet = new Set(processed.map((p) => p.commitHash));
  return commits.filter((c) => !processedSet.has(c.commitHash));
}

// Fetch raw diff for a commit from GitHub
async function fetchCommitDiff(owner: string, repo: string, sha: string) {
  if (!process.env.GITHUB_TOKEN) throw new Error('GITHUB_TOKEN required');
  const url = `https://api.github.com/repos/${owner}/${repo}/commits/${sha}`;
  const { data } = await axios.get(url, {
    headers: { Accept: "application/vnd.github.v3.diff", Authorization: `token ${process.env.GITHUB_TOKEN}` },
  });
  return data as string; // cast to string for diff content
}

// Main: poll new commits, fetch diffs, generate summaries, save
export async function pollCommits(projectId: string) {
  try {
    const project = await db.project.findUnique({ where: { id: projectId } });
    if (!project) throw new Error("Project not found");

    const githubUrl = project.githubUrl;
    if (!githubUrl) throw new Error('No githubUrl');
    const parts = githubUrl.split("/").slice(-2) as [string, string];
    const owner = parts[0];
    const repo = parts[1];
    if (!owner || !repo) throw new Error('Invalid GitHub URL');

    const commits = await getCommitHashes(githubUrl);
    const toProcess = await filterUnprocessedCommits(projectId, commits);
    if (!toProcess.length) {
      console.log("✅ No new commits to process");
      return { count: 0 };
    }

    // Fetch diffs in parallel for speed (free trial may hit rate limits, but faster) - improved for better performance
    const diffPromises = toProcess.map(async (c) => {
      try {
        const diff = await fetchCommitDiff(owner, repo, c.commitHash);
        return { ...c, diff };
      } catch (e) {
        console.warn(`⚠️ Failed to fetch diff for ${c.commitHash}`, e);
        return { ...c, diff: "" };
      }
    });
    const withDiffs = await Promise.all(diffPromises);

    // Batch summarize commits (fewer Gemini API calls)
    const summarized: CommitWithSummary[] = await aisummarizeCommits(withDiffs);

    // Insert commits in smaller chunks
    const chunkSize = 10;
    for (let i = 0; i < summarized.length; i += chunkSize) {
      const chunk = summarized.slice(i, i + chunkSize);
      await db.commit.createMany({
        data: chunk.map((c) => ({
          projectId,
          commitHash: c.commitHash,
          commitMessage: c.commitMessage,
          commitAuthorName: c.commitAuthorName,
          commitAuthorAvatar: c.commitAuthorAvatar,
          commitDate: c.commitDate,
          summary: c.summary,
        })),
        skipDuplicates: true,
      });
    }

    console.log(`✅ Created ${summarized.length} commit summaries`);
    return { count: summarized.length };
  } catch (err) {
    console.error("❌ Error in pollCommits:", err);
    return { count: 0 };
  }
}




// import { Octokit } from "octokit";
// import { db } from "@/server/db";
// import { generateEmbedding, summariesCode } from "@/lib/gemini";

// if (!process.env.GITHUB_TOKEN) {
//   throw new Error("❌ GITHUB_TOKEN is missing in environment variables.");
// }

// // Reusable Octokit instance
// const defaultOctokit = new Octokit({
//   auth: process.env.GITHUB_TOKEN,
// });

// // Utility to get Octokit instance (handles optional user token)
// function getOctokit(githubToken?: string) {
//   return new Octokit({
//     auth: githubToken || process.env.GITHUB_TOKEN,
//   });
// }

// export async function indexGithubRepo(
//   projectId: string,
//   githubUrl: string,
//   githubToken?: string
// ) {
//   try {
//     console.log("🚀 Indexing repository:", githubUrl);

//     // Extract repo owner and name
//     const parts = githubUrl.split("/").slice(-2);
//     const owner = parts[0];
//     const repo = parts[1];
//     if (!owner || !repo) throw new Error("Invalid GitHub repository URL.");

//     const octokit = getOctokit(githubToken);

//     // Fetch repo tree (recursive = true)
//     const { data: tree } = await octokit.rest.git.getTree({
//       owner,
//       repo,
//       tree_sha: "main",
//       recursive: "true",
//     });

//     // Filter code files only
//     const codeFiles = tree.tree.filter(
//       (f: any) =>
//         f.type === "blob" &&
//         /\.(js|jsx|ts|tsx|java|py|cs|cpp|html|css|json)$/.test(f.path)
//     );

//     console.log(`📦 Found ${codeFiles.length} code files to index`);

//     for (const file of codeFiles) {
//       try {
//         const { data: fileContent } = await octokit.rest.repos.getContent({
//           owner,
//           repo,
//           path: file.path,
//         });

//         const content = Buffer.from(
//           (fileContent as any).content,
//           "base64"
//         ).toString("utf8");

//         // Skip large files
//         if (content.length > 20000) {
//           console.log(`⚠️ Skipping large file: ${file.path}`);
//           continue;
//         }

//         // Summarize the file content using Gemini
//         const summary = await summariesCode({
//           pageContent: content,
//           metadata: { source: file.path },
//         });

//         // Generate embedding vector for similarity search
//         const embedding = await generateEmbedding(summary);

//         // Save into the database
//         await db.sourceCodeEmbedding.upsert({
//           where: {
//             projectId_fileName: {
//               projectId,
//               fileName: file.path,
//             },
//           },
//           update: {
//             sourceCode: content,
//             summary,
//             summaryEmbedding: embedding,
//           },
//           create: {
//             projectId,
//             fileName: file.path,
//             sourceCode: content,
//             summary,
//             summaryEmbedding: embedding,
//           },
//         });

//         console.log(`✅ Indexed ${file.path}`);
//       } catch (err) {
//         console.warn(`⚠️ Failed to index file ${file.path}:`, err);
//       }
//     }

//     console.log("🎯 Repository indexing complete:", githubUrl);
//   } catch (err) {
//     console.error("❌ Error during repository indexing:", err);
//   }
// }
