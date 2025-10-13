# TODO: Fix Linter Errors

## archive-button.tsx
- [ ] Handle projectId null check (line 19)
- [ ] Await or void the mutate promise (line 22)

## invite-button.tsx
- [ ] Await navigator.clipboard.writeText (line 28)

## team-member.tsx
- [ ] Handle null for imageUrl (line 8)
- [ ] Handle null for src (line 12)
- [ ] Use ?? instead of || (line 12)
- [ ] Replace <img> with <Image> (line 12)

## join/[projectId]/page.tsx
- [ ] Import db from server/db
- [ ] Fix redirect calls to include statusOrUrl
- [ ] Import EmailAddress as type-only
- [ ] Remove unused imports: useProject, EmailAddress, React, error
- [ ] Handle unsafe operations properly

## project.ts
- [ ] Fix unsafe assignment (line 76)
- [ ] Remove unnecessary type assertion (line 79)

## tsconfig.json
- [ ] Remove deprecated baseUrl or add ignoreDeprecations
