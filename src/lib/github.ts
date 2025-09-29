import { Octokit } from 'octokit'
import { db } from '../server/db'
import axios from 'axios'
import { aisummariseCommit } from './gemini'

export const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
})

type Response = {
  commitHash: string
  commitMessage: string
  commitAuthorName: string
  commitAuthorAvatar: string
  commitDate: string
}

export const getCommitHashes = async (githubUrl: string): Promise<Response[]> => {
 
  
  const urlParts = githubUrl.split('/');
if (urlParts.length < 5 || urlParts[2] !== 'github.com') {
  throw new Error('Invalid GitHub URL format')
}
const owner = urlParts[3]
const repo = urlParts[4].split('.')[0]


  if (!owner || !repo) {
    throw new Error('Invalid GitHub URL: could not extract owner or repo')
  }

  const { data } = await octokit.rest.repos.listCommits({
    owner,
    repo
  })

  const sortedCommits = data.sort((a, b) => {
    const aDate = a.commit.author?.date ? new Date(a.commit.author.date).getTime() : 0
    const bDate = b.commit.author?.date ? new Date(b.commit.author.date).getTime() : 0
    return bDate - aDate
  })

  return sortedCommits.slice(0, 15).map((commit) => ({
    commitHash: commit.sha,
    commitMessage: commit.commit.message ?? '',
    commitAuthorName: commit.commit.author?.name ?? '',
    commitAuthorAvatar: commit.author?.avatar_url ?? '',
    commitDate: commit.commit.author?.date ?? ''
  }))
}

export const pollCommits = async (projectId: string) => {
  try {
    const { project, githubUrl } = await fetchProjectGithubUrl(projectId)
    const commitHashes = await getCommitHashes(githubUrl)
    const unprocessedCommits = await filterUnprocessedCommits(projectId, commitHashes)
    const summariseResponses = await Promise.allSettled(unprocessedCommits.map(commit =>{
      return summariseCommit(githubUrl,commit.commitHash)
    }))

    const summarise = summariseResponses.map((response)=>{
      if(response.status === 'fulfilled'){
        return response.value as string
      }
      return ""
    })


    const commits = await db.commit.createMany({
      data: summarise.map((summary,index)=>{
        return {
          projectId: projectId,
          commitHash: unprocessedCommits[index]!.commitHash,
          commitMessage: unprocessedCommits[index]!.commitMessage,
          commitAuthorName: unprocessedCommits[index]!.commitAuthorName,
          commitAuthorAvatar: unprocessedCommits[index]!.commitAuthorAvatar,
          commitDate: unprocessedCommits[index]!.commitDate,
          summary
        }
      })
    })

    return commits
  } catch (error) {
    console.error('Error polling commits for project', projectId, error)
    return { count: 0 }
  }
}

async function fetchProjectGithubUrl(projectId: string) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: {
      githubUrl: true
    }
  })
  if (!project?.githubUrl) {
    throw new Error('Project has no github url')
  }
  return { project, githubUrl: project.githubUrl }
}

async function filterUnprocessedCommits(projectId: string, commitHashes: Response[]) {
  const processedCommits = await db.commit.findMany({
    where: { projectId },
    select: { commitHash: true }
  })

  const unprocessedCommits = commitHashes.filter((commit) =>
    !processedCommits.some((processedCommit: { commitHash: string }) => processedCommit.commitHash === commit.commitHash)
  )
  return unprocessedCommits
}

async function summariseCommit(githubUrl: string,commitHash:string) {
//  get the difff. then pass the diff into ai

  let normalizedUrl = githubUrl;
  if (!githubUrl.startsWith('http')) {
    normalizedUrl = `https://${githubUrl}`;
  }
  const urlParts = normalizedUrl.split('/');
  if (urlParts.length < 4 || urlParts[3] !== 'github.com') {
    return "";
  }
  const owner = urlParts[4];
  const repo = urlParts[5];

  if (!owner || !repo) {
    return "";
  }

  try {
    const { data } = await octokit.rest.repos.getCommit({
      owner,
      repo,
      ref: commitHash,
      headers: {
        accept: 'application/vnd.github.v3.diff'
      }
    });
    return await aisummariseCommit(data) || "";
  } catch (error) {
    console.error('Error fetching commit diff:', error);
    return "";
  }
}

//  pollCommits(com)



