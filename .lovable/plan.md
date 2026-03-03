

## Diagnosis

The root cause is a **React hooks crash** in `News.tsx`:

```
Error: Rendered more hooks than during the previous render.
    at News (src/pages/News.tsx:161:38)
```

**Why it happens:** Lines 179-198 have an early `return` when `selectedArticle` is set. When a user navigates to the article detail and then back, the hook count changes between renders. Even though no explicit hooks exist after line 179, React's HMR + the preview environment triggers this error, crashing the entire component tree — which is why the page appears blank with no data on mobile.

The red wifi icon is a secondary symptom: when the component crashes and remounts, the `RealtimeStatusIndicator`'s Supabase channel cycles through `CLOSED` → reconnecting states.

## Fix Plan

### 1. `src/pages/News.tsx` — Remove early return, use conditional rendering

The early `return` at line 179 must be converted to conditional rendering so the component always executes the same code path with the same hooks:

- Move `handlePullToRefresh` declaration before line 179 (before the early return)
- Replace the early `return` with a conditional: wrap both the article-detail view and the main feed view in a ternary inside a single `return`
- This ensures hooks are always called in the same order regardless of `selectedArticle` state

Structure becomes:
```tsx
// All hooks and handlers declared above...
const handlePullToRefresh = async () => { await refetch(); };

// Single return with conditional rendering
return selectedArticle ? (
  <div>...article detail...</div>
) : (
  <PullToRefresh ...>...main feed...</PullToRefresh>
);
```

### 2. No other files need changes

The `PullToRefresh` and `SwipeableTabs` components are correct. The service worker, caching layer, and data fetching are all working (network requests show 200 with data). The only issue is the hooks crash preventing the component from rendering.

---

**1 file changed.** This is the minimal, correct fix.

