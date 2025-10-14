# TODO: Fix TypeScript Compilation Error in assembly.ts

## Steps to Complete:
- [x] Update src/env.js to add ASSEMBLYAI_API_KEY to the server environment schema and runtimeEnv.
- [x] Update src/lib/assembly.ts to use env.ASSEMBLYAI_API_KEY instead of process.env.ASSEMBLYAI_API_KEY.
- [ ] Run Next.js build to verify the fix resolves the type error.
