import type { Token } from "@clerk/nextjs/server";
import { GithubRepoLoader } from "@langchain/community/document_loaders/web/github";
import { Document } from "@langchain/core/documents";
import { generateEmbedding } from "./gemini";

export const loadGithubRepo = async (githubUrl: string, githubToken?: string) => {
  const loader = new GithubRepoLoader(githubUrl, {
    accessToken: githubToken || '',
    branch: 'main',
    ignoreFiles: ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb'],
    recursive: true,
    unknown: 'warn',
    maxConcurrency: 5
  });
  const docs = await loader.load();
  return docs;
}


export const indexGithubRepo = async(projectId: string, githubUrl: string, githubToken?: string) =>{
  const docs = await loadGithubRepo(githubUrl,githubToken)
  const allEmbeddings = await generateEmbeddings(docs)
   await Promise.allSettled(allEmbeddings.map(async(embedding,index)=>{
    console.log(`processing ${index} of ${allEmbeddings.length}`)
    if(!embedding) return

    const sourceCodeEmbedding = await db.sourceCodeEmbedding.create({
      data: {
        summary: embedding.summary,
        sourceCode: embedding.sourceCode,
        fileName: embedding.fileName,
        projectId,
      }
    })
    await db.$excuteRaw `
    UPDATE "SourceCodeEmbedding"
    SET "summaryEmbedding" = ${embedding.embedding} :: vector
    WHERE "id" = ${sourceCodeEmbedding.id}
    `
   }))
}

const generateEmbeddings = async(docs: Document[])=>{
return await Promise.all(docs.map(async doc =>{
  const summary = await summariesCode (docs)
  const embedding = await generateEmbedding(summary)
  return {
    summary,
    embedding,
    sourceCode: JSON.parse(JSON.stringify(docs.pageContent)),
    fileName: doc.metadata.source,
  }
}))
}

