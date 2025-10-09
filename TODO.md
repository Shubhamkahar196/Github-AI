# Fix Question Asking Feature

## Issues Identified
- Form in ask-question-card.tsx missing onSubmit handler
- readStreamableValue not imported in ask-question-card.tsx
- actions.ts has duplicate askQuestion functions with errors:
  - Incorrect column name "FileName" instead of "fileName"
  - Variable 'result' declared inside try block
  - stream.update(delta) uses undefined 'delta'

## Tasks
- [x] Clean up actions.ts: Remove duplicate askQuestion, fix query column name, move result declaration, fix stream.update
- [x] Update ask-question-card.tsx: Add onSubmit to form, import readStreamableValue, improve answer display UI
- [x] Test the question asking feature to ensure answers are displayed
