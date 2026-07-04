# Redux Store Structure

This directory contains the Redux Toolkit store configuration for the Better Auth System feature.

## Overview

The Redux store manages two main slices:

- **auth**: Authentication state (user, loading, errors)
- **userData**: User-specific data (profile, statistics, sessions, bookmarks, collections, vocabulary, preferences)

## File Structure

```
src/lib/redux/
├── slices/
│   ├── authSlice.ts       # Authentication state management
│   └── userDataSlice.ts   # User data state management
├── store.ts               # Redux store configuration
├── Provider.tsx           # Redux Provider component for Next.js
├── hooks.ts               # Typed Redux hooks
├── selectors.ts           # Memoized selectors
└── index.ts               # Centralized exports
```

## Usage

### 1. Wrap your app with ReduxProvider

In your root layout (`app/layout.tsx`):

```tsx
import { ReduxProvider } from "@/lib/redux";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  );
}
```

### 2. Use typed hooks in components

```tsx
"use client";

import { useAppSelector, useAppDispatch } from "@/lib/redux/hooks";
import { setUser, clearUser } from "@/lib/redux";
import { selectIsAuthenticated, selectUser } from "@/lib/redux/selectors";

function MyComponent() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);

  // Dispatch actions
  const handleLogin = (userData) => {
    dispatch(setUser(userData));
  };

  const handleLogout = () => {
    dispatch(clearUser());
  };

  return (
    <div>
      {isAuthenticated ? <p>Welcome, {user?.name}!</p> : <p>Please log in</p>}
    </div>
  );
}
```

### 3. Using selectors

Selectors provide a clean way to access state:

```tsx
import { useAppSelector } from "@/lib/redux/hooks";
import {
  selectUserProfile,
  selectUserLevel,
  selectUserAccuracy,
  selectBookmarkCount,
} from "@/lib/redux/selectors";

function ProfileComponent() {
  const profile = useAppSelector(selectUserProfile);
  const level = useAppSelector(selectUserLevel);
  const accuracy = useAppSelector(selectUserAccuracy);
  const bookmarkCount = useAppSelector(selectBookmarkCount);

  return (
    <div>
      <p>Level: {level}</p>
      <p>Accuracy: {accuracy}%</p>
      <p>Bookmarks: {bookmarkCount}</p>
    </div>
  );
}
```

## Available Actions

### Auth Actions

- `setUser(user)` - Set authenticated user
- `clearUser()` - Clear user and mark as unauthenticated
- `setLoading(boolean)` - Set authentication loading state
- `setError(string | null)` - Set authentication error
- `setSessionChecked(boolean)` - Mark session as checked

### User Data Actions

#### Profile

- `setProfile(profile)` - Set user profile
- `updateProfile(partialProfile)` - Update specific profile fields

#### Statistics

- `setStatistics(statistics)` - Set practice statistics
- `updateStatistics(statistics)` - Update specific statistics

#### Sessions

- `setSessions(sessions[])` - Set practice sessions
- `addSession(session)` - Add new session
- `updateSession(session)` - Update existing session

#### Bookmarks

- `setBookmarks(bookmarks[])` - Set bookmarks
- `addBookmark(bookmark)` - Add new bookmark
- `removeBookmark(questionId)` - Remove bookmark by ID

#### Collections

- `setCollections(collections[])` - Set collections
- `addCollection(collection)` - Add new collection
- `updateCollection(collection)` - Update existing collection
- `removeCollection(collectionId)` - Remove collection by ID

#### Vocabulary & Preferences

- `setVocabulary(vocabulary)` - Set vocabulary progress
- `updateVocabulary(vocabulary)` - Update vocabulary progress
- `setPreferences(preferences)` - Set user preferences
- `updatePreferences(preferences)` - Update user preferences

#### Utility

- `setDataLoading({ dataType, loading })` - Set loading for specific data type
- `setDataError(error)` - Set error message
- `clearUserData()` - Clear all user data (on logout)

## Available Selectors

### Auth Selectors

- `selectIsAuthenticated` - Check if user is authenticated
- `selectUser` - Get user object
- `selectAuthLoading` - Get auth loading state
- `selectAuthError` - Get auth error
- `selectSessionChecked` - Check if session was verified

### User Data Selectors

- `selectUserProfile` - Get user profile
- `selectUserStatistics` - Get practice statistics
- `selectUserSessions` - Get practice sessions
- `selectUserBookmarks` - Get bookmarks
- `selectUserCollections` - Get collections
- `selectUserVocabulary` - Get vocabulary progress
- `selectUserPreferences` - Get user preferences
- `selectUserDataLoading` - Get loading states
- `selectUserDataError` - Get error message

### Computed Selectors (Memoized)

- `selectUserLevel` - Calculate user level from XP
- `selectUserAccuracy` - Calculate user accuracy percentage
- `selectBookmarkCount` - Get total bookmarks
- `selectCollectionCount` - Get total collections
- `selectSessionCount` - Get total sessions
- `selectIsAnyDataLoading` - Check if any data is loading
- `selectBookmarksByAssessment(assessment)` - Get bookmarks for specific assessment
- `selectCollectionById(id)` - Get collection by ID
- `selectRecentSessions(count)` - Get recent N sessions

## Type Safety

All actions and selectors are fully typed. TypeScript will provide autocomplete and type checking:

```tsx
// Type-safe dispatch
dispatch(
  setUser({
    id: "123",
    email: "user@example.com",
    name: "John Doe",
    provider: "google",
    createdAt: new Date().toISOString(),
  }),
);

// Type-safe selector
const user = useAppSelector(selectUser);
// user is typed as User | null
```

## Next Steps

After setting up the Redux store, you'll need to:

1. Integrate with Better Auth for authentication
2. Create API routes for user data operations
3. Implement data fetching and updating logic
4. Add migration logic for localStorage to database
5. Implement session checking on app initialization

See the design document for complete implementation details.
