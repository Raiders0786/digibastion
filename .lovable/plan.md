

## Bug Fix: Mobile Threat Intel Page Not Showing Data

After thorough code analysis, the issue is caused by the interaction between two mobile-only wrapper components: `PullToRefresh` and `SwipeableTabs`. Both use framer-motion gesture handlers that conflict with each other and with normal page scrolling on mobile devices.

### Root Causes Identified

**1. `PullToRefresh` uses `overflow-hidden` on mobile** (line 73)
The outer `div.relative.overflow-hidden` clips content on mobile. While this shouldn't prevent body-level scrolling in theory, combined with framer-motion's gesture system it creates a scenario where content can become invisible or unscrollable on certain mobile browsers.

**2. `PullToRefresh` scrollTop check is broken** (line 34, 43)
`containerRef` is placed on the inner `motion.div` which has no `overflow-y: auto/scroll`. Its `scrollTop` is always 0. This means `isPulling` is set to `true` on EVERY touch gesture, causing the pull-to-refresh animation to interfere with normal scrolling.

**3. `SwipeableTabs` animation state can get stuck** (lines 40-52, 61-73)
The `handlePanEnd` function sets `opacity: 0.5` mid-animation. If the component re-renders during the animation or an error occurs, the content gets stuck at reduced opacity, making it appear invisible.

**4. Nested framer-motion drag handlers conflict**
`PullToRefresh` uses `onPan` for vertical gestures while `SwipeableTabs` uses `drag="x"` for horizontal. Both capture touch/pointer events on mobile, creating a deadlock where neither vertical scrolling nor content display works reliably.

### Fix Plan

#### File 1: `src/components/mobile/PullToRefresh.tsx`
- Change `overflow-hidden` to `overflow-x-hidden` on the outer div (allows vertical content to flow)
- Fix scrollTop check to use `window.scrollY` or `document.documentElement.scrollTop` instead of the non-scrollable containerRef (so pull-to-refresh only activates when the page is scrolled to the very top)
- Add a guard so pan handlers don't interfere with normal scrolling

#### File 2: `src/components/mobile/SwipeableTabs.tsx`
- Add `initial={{ x: 0, opacity: 1 }}` to the motion.div to prevent stuck animation states
- Add `dragPropagation={false}` to prevent drag events from leaking to PullToRefresh
- Wrap the `handlePanEnd` animation sequence in try/catch to prevent stuck states on error

These are targeted fixes to the two mobile-only components causing the conflict. No changes to the News page, data fetching, or any other component needed.

