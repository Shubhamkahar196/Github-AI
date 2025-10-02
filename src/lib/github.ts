// import { Octokit } from 'octokit'
// import { db } from '../server/db'
// import axios from 'axios'
// import { aisummariesCommit } from './gemini'

// export const octokit = new Octokit({
//   auth: process.env.GITHUB_TOKEN,
// })

// type Response = {
//   commitHash: string
//   commitMessage: string
//   commitAuthorName: string
//   commitAuthorAvatar: string
//   commitDate: string
// }

// export const getCommitHashes = async (githubUrl: string): Promise<Response[]> => {
 


// const [owner,repo] = githubUrl.split('/').slice(-2);
// if(!owner || !repo){
//   throw new Error("Invalid github url")
// }

// const {data} = await octokit.rest.repos.listCommits({
//   owner,
//   repo
// })

//   const sortedCommits = data.sort((a, b) => {
//     const aDate = a.commit.author?.date ? new Date(a.commit.author.date).getTime() : 0
//     const bDate = b.commit.author?.date ? new Date(b.commit.author.date).getTime() : 0
//     return bDate - aDate
//     // new Date(b.commit.author.date).getTime()- new Date(a.commit.author.date).getTime() as any[]
//   })

//   return sortedCommits.slice(0, 15).map((commit) => ({
//     commitHash: commit.sha,
//     commitMessage: commit.commit.message ?? '',
//     commitAuthorName: commit.commit.author?.name ?? '',
//     commitAuthorAvatar: commit.author?.avatar_url ?? '',
//     commitDate: commit.commit.author?.date ?? ''
//   }))
// }

// export const pollCommits = async (projectId: string) => {
//   try {
//     const { project, githubUrl } = await fetchProjectGithubUrl(projectId)
//     const commitHashes = await getCommitHashes(githubUrl)
//     const unprocessedCommits = await filterUnprocessedCommits(projectId, commitHashes)
//     const summaryResponses = await Promise.allSettled(unprocessedCommits.map(commit =>{
//       return summariesCommit(githubUrl,commit.commitHash)
//     }))

//     const summaries = summaryResponses.map((response)=>{
//       if(response.status === 'fulfilled'){
//         return response.value as string
//       }
//       return ""
//     })


//     const commits = await db.commit.createMany({
//       data: summaries.map((summary,index)=>{
//         return {
//           projectId: projectId,
//           commitHash: unprocessedCommits[index]!.commitHash,
//           commitMessage: unprocessedCommits[index]!.commitMessage,
//           commitAuthorName: unprocessedCommits[index]!.commitAuthorName,
//           commitAuthorAvatar: unprocessedCommits[index]!.commitAuthorAvatar,
//           commitDate: unprocessedCommits[index]!.commitDate,
//           summary
          
//         }
//       })
//     })

//     return commits
//   } catch (error) {
//     console.error('Error polling commits for project', projectId, error)
//     return { count: 0 }
//   }
// }

// async function fetchProjectGithubUrl(projectId: string) {
//   const project = await db.project.findUnique({
//     where: { id: projectId },
//     select: {
//       githubUrl: true
//     }
//   })
//   if (!project?.githubUrl) {
//     throw new Error('Project has no github url')
//   }
//   // return { project, githubUrl: project.githubUrl }
//   return { project, githubUrl: project?.githubUrl }
// }

// async function filterUnprocessedCommits(projectId: string, commitHashes: Response[]) {
//   const processedCommits = await db.commit.findMany({
//     where: { projectId },
//     select: { commitHash: true }
//   })

//   const unprocessedCommits = commitHashes.filter((commit) =>
//     !processedCommits.some((processedCommit: { commitHash: string }) => processedCommit.commitHash === commit.commitHash)
//   )
//   return unprocessedCommits
// }

// async function summariesCommit(githubUrl: string,commitHash:string) {
// //  get the difff. then pass the diff into ai

// const {data} = await axios.get(`${githubUrl}/commit/${commitHash}.diff`,{
//   headers: {
//     Accept: 'application/vnd.github.v3.diff'
//   }
// })

// return await aisummariesCommit(data) || ""
 

// }






import { Octokit } from 'octokit'
import axios from 'axios'
import { aisummariesCommit } from './gemini'
import { db } from '../server/db'  // adjust import path

export const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
})

type CommitBasic = {
  commitHash: string
  commitMessage: string
  commitAuthorName: string
  commitAuthorAvatar: string
  commitDate: string
}

// Fetch recent commits from GitHub
export async function getCommitHashes(githubUrl: string): Promise<CommitBasic[]> {
  const parts = githubUrl.split('/').slice(-2)
  const owner = parts[0]
  const repo = parts[1]
  if (!owner || !repo) {
    throw new Error('Invalid GitHub repo URL')
  }

  const { data } = await octokit.rest.repos.listCommits({
    owner,
    repo
  })

  // Sort by date descending
  const sorted = data.sort((a, b) => {
    const at = a.commit.author?.date ? new Date(a.commit.author.date).getTime() : 0
    const bt = b.commit.author?.date ? new Date(b.commit.author.date).getTime() : 0
    return bt - at
  })

  return sorted.slice(0, 15).map(c => ({
    commitHash: c.sha,
    commitMessage: c.commit.message || '',
    commitAuthorName: c.commit.author?.name || '',
    commitAuthorAvatar: c.author?.avatar_url || '',
    commitDate: c.commit.author?.date || ''
  }))
}

// Filter out commits already processed in DB
async function filterUnprocessedCommits(projectId: string, commits: CommitBasic[]) {
  const processed = await db.commit.findMany({
    where: { projectId },
    select: { commitHash: true }
  })
  const processedSet = new Set(processed.map(p => p.commitHash))
  return commits.filter(c => !processedSet.has(c.commitHash))
}

// Main: poll new commits, fetch diffs, generate summaries, save
export async function pollCommits(projectId: string) {
  try {
    const project = await db.project.findUnique({
      where: { id: projectId }
    })
    if (!project) {
      throw new Error('Project not found')
    }
    const githubUrl = project.githubUrl

    const commits = await getCommitHashes(githubUrl)
    const toProcess = await filterUnprocessedCommits(projectId, commits)

    const summaryPromises = toProcess.map(async c => {
      // fetch diff for this commit
      const diffResp = await axios.get(`${githubUrl}/commit/${c.commitHash}.diff`, {
        headers: {
          Accept: 'application/vnd.github.v3.diff'
        }
      })
      const diff = diffResp.data
      const summary = await aisummariesCommit(diff)
      return { commit: c, summary }
    })

    const results = await Promise.all(summaryPromises)

    const createData = results.map(r => ({
      projectId: projectId,
      commitHash: r.commit.commitHash,
      commitMessage: r.commit.commitMessage,
      commitAuthorName: r.commit.commitAuthorName,
      commitAuthorAvatar: r.commit.commitAuthorAvatar,
      commitDate: r.commit.commitDate,
      summary: r.summary || null
    }))

    const created = await db.commit.createMany({
      data: createData
    })

    console.log('✅ Created commit summaries:', createData)
    return created
  } catch (err) {
    console.error('❌ Error in pollCommits:', err)
    return { count: 0 }
  }
}
