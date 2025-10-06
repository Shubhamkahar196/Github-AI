

import { GithubRepoLoader } from "@langchain/community/document_loaders/web/github";
import type { Document } from "@langchain/core/documents";

import { db } from "@/server/db";
import { summariesCode, generateEmbedding } from "@/lib/gemini";

// ✅ Load all repo files
export const loadGithubRepo = async (githubUrl: string, githubToken?: string) => {
  const loader = new GithubRepoLoader(githubUrl, {
    accessToken: githubToken ?? '',
    branch: 'main',
    ignoreFiles: [
      'package-lock.json',
      'yarn.lock',
      'pnpm-lock.yaml',
      'bun.lockb'
    ],
    recursive: true,
    unknown: 'warn',
    maxConcurrency: 5
  });

  const docs = await loader.load();
  console.log(`✅ Loaded ${docs.length} files from ${githubUrl}`);
  return docs;
};

// ✅ Index the repo: summarize + embed + save to DB
export const indexGithubRepo = async (projectId: string, githubUrl: string, githubToken?: string) => {
  const docs = await loadGithubRepo(githubUrl, githubToken);
  const allEmbeddings = await generateEmbeddings(docs);

  await Promise.allSettled(
    allEmbeddings.map(async (embedding, index) => {
      console.log(`🧠 Processing file ${index + 1} of ${allEmbeddings.length}`);

      if (!embedding) return;

      // 1️⃣ Create DB record
      const record = await db.sourceCodeEmbedding.create({
        data: {
          summary: embedding.summary,
          sourceCode: embedding.sourceCode,
          fileName: embedding.fileName,
          projectId,
        },
      });

      // 2️⃣ Update the embedding vector separately
      await db.$executeRawUnsafe(`
        UPDATE "SourceCodeEmbedding"
        SET "summaryEmbedding" = '${JSON.stringify(embedding.embedding)}'::vector
        WHERE "id" = '${record.id}'
      `);

      console.log(`✅ Indexed file: ${embedding.fileName}`);
    })
  );

  console.log(`✅ Finished indexing ${allEmbeddings.length} files for project ${projectId}`);
};

// ✅ Generate summaries and embeddings for each document
const generateEmbeddings = async (docs: Document[]) => {
  return await Promise.all(
    docs.map(async (doc) => {
      try {
        const summary = await summariesCode(doc);
        const embedding = await generateEmbedding(summary);

        return {
          summary,
          embedding,
          sourceCode: doc.pageContent.slice(0, 10000), // limit length
          fileName: doc.metadata.source || 'unknown',
        };
      } catch (err) {
        console.error(`❌ Error generating embedding for ${doc.metadata.source}:`, err);
        return null;
      }
    })
  );
};
