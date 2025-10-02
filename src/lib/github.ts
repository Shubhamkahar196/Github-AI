






// import { Octokit } from 'octokit'
// import axios from 'axios'
// import { aisummariesCommit } from './gemini'
// import { db } from '../server/db'  // adjust import path

// export const octokit = new Octokit({
//   auth: process.env.GITHUB_TOKEN
// })

// type CommitBasic = {
//   commitHash: string
//   commitMessage: string
//   commitAuthorName: string
//   commitAuthorAvatar: string
//   commitDate: string
// }

// // Fetch recent commits from GitHub
// export async function getCommitHashes(githubUrl: string): Promise<CommitBasic[]> {
//   const parts = githubUrl.split('/').slice(-2)
//   const owner = parts[0]
//   const repo = parts[1]
//   if (!owner || !repo) {
//     throw new Error('Invalid GitHub repo URL')
//   }

//   const { data } = await octokit.rest.repos.listCommits({
//     owner,
//     repo
//   })

//   // Sort by date descending
//   const sorted = data.sort((a, b) => {
//     const at = a.commit.author?.date ? new Date(a.commit.author.date).getTime() : 0
//     const bt = b.commit.author?.date ? new Date(b.commit.author.date).getTime() : 0
//     return bt - at
//   })

//   return sorted.slice(0, 15).map(c => ({
//     commitHash: c.sha,
//     commitMessage: c.commit.message || '',
//     commitAuthorName: c.commit.author?.name || '',
//     commitAuthorAvatar: c.author?.avatar_url || '',
//     commitDate: c.commit.author?.date || ''
//   }))
// }

// // Filter out commits already processed in DB
// async function filterUnprocessedCommits(projectId: string, commits: CommitBasic[]) {
//   const processed = await db.commit.findMany({
//     where: { projectId },
//     select: { commitHash: true }
//   })
//   const processedSet = new Set(processed.map(p => p.commitHash))
//   return commits.filter(c => !processedSet.has(c.commitHash))
// }

// // Main: poll new commits, fetch diffs, generate summaries, save
// export async function pollCommits(projectId: string) {
//   try {
//     const project = await db.project.findUnique({
//       where: { id: projectId }
//     })
//     if (!project) {
//       throw new Error('Project not found')
//     }
//     const githubUrl = project.githubUrl

//     const commits = await getCommitHashes(githubUrl)
//     const toProcess = await filterUnprocessedCommits(projectId, commits)

//     const summaryPromises = toProcess.map(async c => {
//       // fetch diff for this commit
//       const diffResp = await axios.get(`${githubUrl}/commit/${c.commitHash}.diff`, {
//         headers: {
//           Accept: 'application/vnd.github.v3.diff'
//         }
//       })
//       const diff = diffResp.data
//       const summary = await aisummariesCommit(diff)
//       return { commit: c, summary }
//     })

//     const results = await Promise.all(summaryPromises)

//     const createData = results.map(r => ({
//       projectId: projectId,
//       commitHash: r.commit.commitHash,
//       commitMessage: r.commit.commitMessage,
//       commitAuthorName: r.commit.commitAuthorName,
//       commitAuthorAvatar: r.commit.commitAuthorAvatar,
//       commitDate: r.commit.commitDate,
//       summary: r.summary || null
//     }))

//     const created = await db.commit.createMany({
//       data: createData
//     })

//     console.log('✅ Created commit summaries:', createData)
//     return created
//   } catch (err) {
//     console.error('❌ Error in pollCommits:', err)
//     return { count: 0 }
//   }
// }


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
