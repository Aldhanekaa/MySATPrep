# localStorage → Redux Migration Plan

## Objective

Update all components that fetch user data from localStorage to use Redux state when the user is authenticated, falling back to localStorage only for unauthenticated users.

## Pattern to Follow

```typescript
// Import hooks
import { useAppSelector } from "@/lib/redux/hooks";
import { selectIsAuthenticated, selectUserXXX } from "@/lib/redux/selectors";

// In component
const isAuthenticated = useAppSelector(selectIsAuthenticated);
const reduxData = useAppSelector(selectUserXXX);
const [localData] = useLocalStorage("key", defaultValue);

// Resolve data
const data = isAuthenticated ? reduxData : localData;
```

## Files to Update

### ✅ Already Correct (have auth-conditional pattern)

- `dashboard/home.tsx`
- `dashboard/summary/charts.tsx`
- `dashboard/sessions.tsx`
- `dashboard/saved.tsx`
- `dashboard/previousSaved.tsx`
- `app/dashboard/preferences/page.tsx`

### ⚠️ Partially Done (work in progress)

- `app/dashboard/page.tsx` — UPDATED ✅
- `dashboard/answered.tsx` — UPDATED ✅

### 🔴 Needs Update

#### High Priority (core dashboard)

1. **`components/dashboard-layout/app-sidebar.tsx`**
   - Keys: `savedQuestions`, `practiceStatistics`
   - Selectors: `selectUserBookmarks`, `selectUserStatistics`

2. **`app/review/page.tsx`**
   - Keys: `savedQuestions`, `practiceStatistics`
   - Selectors: `selectUserBookmarks`, `selectUserStatistics`

3. **`components/ui/save-button.tsx`**
   - Key: `savedCollections`
   - Selector: `selectUserCollections`

4. **`components/questionbank/compact-render.tsx`**
   - Key: `savedQuestions`
   - Selector: `selectUserBookmarks`

5. **`components/questionbank/question-results.tsx`**
   - Key: `practiceStatistics`
   - Selector: `selectUserStatistics`

#### Medium Priority (vocabulary system - needs new vocab selector)

6. **`components/dashboard/vocabs/vocabs.tsx`**
   - Keys: `vocabsData`, `practicePerformanceData`
   - Selector: `selectUserVocabulary` (for vocabsData)
   - Note: `practicePerformanceData` may need its own Redux slice or be part of vocabulary

7. **`components/dashboard/vocabs/learn.tsx`**
8. **`components/dashboard/vocabs/practice/*.tsx`** (6 files)

#### Complex (direct writes - need to use dataSync)

9. **`components/practice-rush-multistep.tsx`**
   - Directly writes to `practiceHistory`, `practiceStatistics`
   - Should use `dataSync.ts` functions

10. **`components/question-problem-card.tsx`**
    - Directly writes to `practiceStatistics`
    - Should use `dataSync.ts` functions

## Notes

- UI preferences (banner, tour, theme) can remain in localStorage (not user data)
- Session management (`currentPracticeSession`) can remain in localStorage (temporary state)
- `assessment-context.tsx` preference can remain in localStorage (UI state)
