# Design Document: Better Auth System

## Overview

This design document outlines the implementation of a comprehensive authentication system for the MySATPrep platform using the Better Auth library. The system integrates Google OAuth and email/password authentication with PostgreSQL for data persistence, Redux Toolkit for state management, and provides seamless migration of existing localStorage data to the database for authenticated users.

### Goals

- Implement secure authentication using Better Auth with Google OAuth and email/password support
- Integrate PostgreSQL database for persistent user data storage
- Implement Redux Toolkit for centralized state management
- Migrate existing localStorage data (user profiles, practice statistics, sessions, bookmarks, vocabularies) to database
- Maintain backward compatibility for unauthenticated users
- Implement backend caching for improved performance
- Ensure type safety throughout with TypeScript

### Non-Goals

- Social authentication beyond Google OAuth (Facebook, GitHub, etc.)
- Password reset functionality (deferred to phase 2)
- Email verification (deferred to phase 2)
- Two-factor authentication
- Advanced role-based access control (RBAC)
- Real-time data synchronization across devices

## Architecture

### High-Level System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        UI[React Components]
        Redux[Redux Store]
        LocalStorage[localStorage]
    end

    subgraph "API Layer"
        AuthAPI["/api/auth/*<br/>Better Auth Endpoints"]
        UserAPI["/api/user/*<br/>User Data Endpoints"]
        MigrationAPI["/api/user/migrate-data<br/>Migration Service"]
    end

    subgraph "Data Layer"
        Cache[Cache Layer<br/>In-Memory LRU]
        DB[(PostgreSQL<br/>Database)]
    end

    subgraph "External Services"
        GoogleOAuth[Google OAuth]
    end

    UI --> Redux
    UI --> LocalStorage
    Redux --> AuthAPI
    Redux --> UserAPI
    AuthAPI --> GoogleOAuth
    AuthAPI --> DB
    UserAPI --> Cache
    Cache --> DB
    MigrationAPI --> DB
    Redux --> MigrationAPI
```

### Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant UI
    participant Redux
    participant BetterAuth
    participant Google
    participant DB

    User->>UI: Click "Sign in with Google"
    UI->>BetterAuth: Initiate OAuth flow
    BetterAuth->>Google: Redirect to consent
    Google->>User: Show consent screen
    User->>Google: Approve
    Google->>BetterAuth: Return auth code
    BetterAuth->>DB: Create/update user record
    BetterAuth->>Redux: Update auth state
    Redux->>UI: Render authenticated state
```

### Data Synchronization Flow

```mermaid
sequenceDiagram
    participant User
    participant UI
    participant Redux
    participant API
    participant Cache
    participant DB

    User->>UI: Perform action (e.g., answer question)
    UI->>Redux: Dispatch update action
    Redux->>API: POST /api/user/statistics
    API->>Cache: Invalidate cache
    API->>DB: Update statistics
    DB->>API: Success
    API->>Redux: Return updated data
    Redux->>UI: Update UI with new data
```

### Migration Flow

```mermaid
sequenceDiagram
    participant User
    participant UI
    participant Redux
    participant MigrationAPI
    participant DB
    participant LocalStorage

    User->>UI: Login successfully
    UI->>LocalStorage: Check for data
    LocalStorage->>UI: Return data
    UI->>User: Show import prompt
    User->>UI: Accept import
    UI->>LocalStorage: Read all data
    LocalStorage->>Redux: Send data
    Redux->>MigrationAPI: POST /api/user/migrate-data
    MigrationAPI->>DB: Begin transaction
    MigrationAPI->>DB: Insert profile data
    MigrationAPI->>DB: Insert statistics
    MigrationAPI->>DB: Insert sessions
    MigrationAPI->>DB: Insert bookmarks
    MigrationAPI->>DB: Insert collections
    MigrationAPI->>DB: Commit transaction
    DB->>MigrationAPI: Success
    MigrationAPI->>Redux: Return summary
    Redux->>UI: Show success message
```

## Components and Interfaces

### Redux State Structure

The Redux store will be organized into slices following Redux Toolkit best practices:

```typescript
// Global Redux State Shape
interface RootState {
  auth: AuthState;
  userData: UserDataState;
}

// Authentication Slice
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
  sessionChecked: boolean; // Track if session was verified
}

interface User {
  id: string;
  email: string;
  name: string | null;
  provider: "google" | "email";
  createdAt: string;
}

// User Data Slice
interface UserDataState {
  profile: UserProfile | null;
  statistics: PracticeStatistics;
  sessions: PracticeSession[];
  bookmarks: SavedQuestion[];
  collections: SavedCollection[];
  vocabulary: VocabularyProgress | null;
  preferences: UserPreferences | null;
  loading: {
    profile: boolean;
    statistics: boolean;
    sessions: boolean;
    bookmarks: boolean;
    collections: boolean;
    vocabulary: boolean;
  };
  error: string | null;
}
```

### Redux Actions and Thunks

```typescript
// Auth Slice Actions
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      /* ... */
    },
    clearUser: (state) => {
      /* ... */
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      /* ... */
    },
    setError: (state, action: PayloadAction<string>) => {
      /* ... */
    },
    setSessionChecked: (state, action: PayloadAction<boolean>) => {
      /* ... */
    },
  },
});

// Async Thunks
export const loginWithGoogle = createAsyncThunk(/* ... */);
export const loginWithEmail = createAsyncThunk(/* ... */);
export const registerWithEmail = createAsyncThunk(/* ... */);
export const logout = createAsyncThunk(/* ... */);
export const checkSession = createAsyncThunk(/* ... */);

// User Data Slice Actions
const userDataSlice = createSlice({
  name: "userData",
  initialState,
  reducers: {
    setProfile: (state, action: PayloadAction<UserProfile>) => {
      /* ... */
    },
    updateStatistics: (state, action: PayloadAction<PracticeStatistics>) => {
      /* ... */
    },
    addSession: (state, action: PayloadAction<PracticeSession>) => {
      /* ... */
    },
    addBookmark: (state, action: PayloadAction<SavedQuestion>) => {
      /* ... */
    },
    removeBookmark: (state, action: PayloadAction<string>) => {
      /* ... */
    },
    // ... other reducers
  },
});

// Async Thunks
export const fetchUserData = createAsyncThunk(/* ... */);
export const updateUserProfile = createAsyncThunk(/* ... */);
export const updateUserStatistics = createAsyncThunk(/* ... */);
export const migrateLocalStorageData = createAsyncThunk(/* ... */);
```

### Redux Selectors

```typescript
// Auth Selectors (with memoization)
export const selectIsAuthenticated = (state: RootState) =>
  state.auth.isAuthenticated;
export const selectUser = (state: RootState) => state.auth.user;
export const selectAuthLoading = (state: RootState) => state.auth.loading;
export const selectAuthError = (state: RootState) => state.auth.error;

// User Data Selectors
export const selectUserProfile = (state: RootState) => state.userData.profile;
export const selectUserStatistics = (state: RootState) =>
  state.userData.statistics;
export const selectUserSessions = (state: RootState) => state.userData.sessions;
export const selectUserBookmarks = (state: RootState) =>
  state.userData.bookmarks;
export const selectUserCollections = (state: RootState) =>
  state.userData.collections;

// Computed Selectors (memoized with reselect)
export const selectUserLevel = createSelector([selectUserProfile], (profile) =>
  profile ? calculateLevel(profile.totalXP) : 0,
);

export const selectAccuracy = createSelector([selectUserProfile], (profile) => {
  if (!profile || profile.questionsAnswered === 0) return 0;
  return (profile.correctAnswers / profile.questionsAnswered) * 100;
});
```

### Better Auth Configuration

```typescript
// lib/auth.ts
import { betterAuth } from "better-auth";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const auth = betterAuth({
  database: {
    provider: "postgres",
    pool: pool,
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.NEXT_PUBLIC_BASE_URL!,
});

export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
```

### API Route Structure

#### Authentication Routes (Better Auth)

- `POST /api/auth/sign-in/email` - Email/password sign in
- `POST /api/auth/sign-up/email` - Email/password registration
- `GET /api/auth/sign-in/google` - Initiate Google OAuth
- `GET /api/auth/callback/google` - Google OAuth callback
- `POST /api/auth/sign-out` - Sign out
- `GET /api/auth/session` - Get current session

#### User Data Routes

- `GET /api/user/data` - Fetch all user data
- `PUT /api/user/profile` - Update user profile
- `PUT /api/user/statistics` - Update practice statistics
- `POST /api/user/sessions` - Create practice session
- `PUT /api/user/sessions/:id` - Update practice session
- `GET /api/user/sessions` - Get practice sessions
- `POST /api/user/bookmarks` - Add bookmark
- `DELETE /api/user/bookmarks/:id` - Remove bookmark
- `GET /api/user/bookmarks` - Get all bookmarks
- `POST /api/user/collections` - Create collection
- `PUT /api/user/collections/:id` - Update collection
- `DELETE /api/user/collections/:id` - Delete collection
- `GET /api/user/collections` - Get all collections
- `PUT /api/user/vocabulary` - Update vocabulary progress
- `PUT /api/user/preferences` - Update user preferences

#### Migration Route

- `POST /api/user/migrate-data` - Migrate localStorage to database

### API Request/Response Formats

#### GET /api/user/data

**Response:**

```typescript
{
  success: true,
  data: {
    profile: UserProfile | null,
    statistics: PracticeStatistics,
    sessions: PracticeSession[],
    bookmarks: SavedQuestion[],
    collections: SavedCollection[],
    vocabulary: VocabularyProgress | null,
    preferences: UserPreferences | null
  }
}
```

#### PUT /api/user/profile

**Request:**

```typescript
{
  totalXP?: number,
  questionsAnswered?: number,
  correctAnswers?: number,
  incorrectAnswers?: number,
  xpHistory?: XPTransaction[]
}
```

**Response:**

```typescript
{
  success: true,
  data: UserProfile
}
```

#### POST /api/user/migrate-data

**Request:**

```typescript
{
  profile: UserProfile,
  statistics: PracticeStatistics,
  sessions: PracticeSession[],
  bookmarks: SavedQuestion[],
  collections: SavedCollection[],
  vocabulary: VocabularyProgress,
  preferences: UserPreferences
}
```

**Response:**

```typescript
{
  success: true,
  message: string,
  summary: {
    profileMigrated: boolean,
    statisticsMigrated: boolean,
    sessionsMigrated: number,
    bookmarksMigrated: number,
    collectionsMigrated: number,
    vocabularyMigrated: boolean,
    preferencesMigrated: boolean
  }
}
```

### UI Component Architecture

```
src/components/auth/
├── SignInModal.tsx          # Main sign-in modal
├── SignUpModal.tsx          # Registration modal
├── GoogleSignInButton.tsx   # Google OAuth button
├── EmailPasswordForm.tsx    # Email/password form
├── UserMenu.tsx             # User dropdown menu
├── AuthGuard.tsx            # Route protection HOC
└── MigrationPrompt.tsx      # localStorage import prompt
```

**Component Hierarchy:**

```
App Layout
└── Redux Provider
    └── Auth Check (on mount)
        ├── Unauthenticated
        │   └── Continue with localStorage
        └── Authenticated
            ├── Fetch user data from API
            ├── Check for localStorage data
            │   └── Show MigrationPrompt (if needed)
            └── Populate Redux store
```

## Data Models

### Database Schema

#### users table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  provider VARCHAR(50) NOT NULL, -- 'google' or 'email'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_provider ON users(provider);
```

#### user_profiles table

```sql
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 0,
  questions_answered INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  incorrect_answers INTEGER DEFAULT 0,
  last_activity TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  xp_history JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_level ON user_profiles(level);
CREATE INDEX idx_user_profiles_total_xp ON user_profiles(total_xp);
```

**xp_history JSONB structure:**

```typescript
[
  {
    questionId: string,
    change: number,
    reason: "correct_answer" | "incorrect_answer",
    timestamp: string,
    scoreBandRange: number,
  },
];
```

#### practice_statistics table

```sql
CREATE TABLE practice_statistics (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assessment VARCHAR(50) NOT NULL, -- 'SAT', 'PSAT/NMSQT', 'PSAT'
  answered_questions JSONB DEFAULT '[]'::jsonb,
  answered_questions_detailed JSONB DEFAULT '[]'::jsonb,
  statistics JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, assessment)
);

CREATE INDEX idx_practice_statistics_user_id ON practice_statistics(user_id);
CREATE INDEX idx_practice_statistics_assessment ON practice_statistics(assessment);
```

**answered_questions JSONB structure:**

```typescript
["question-id-1", "question-id-2", ...]
```

**answered_questions_detailed JSONB structure:**

```typescript
[
  {
    questionId: string,
    difficulty: 'E' | 'M' | 'H',
    isCorrect: boolean,
    timeSpent: number,
    timestamp: string,
    selectedAnswer?: string,
    plainQuestion?: PlainQuestionType
  }
]
```

**statistics JSONB structure:**

```typescript
{
  "primary_class_cd": {
    "skill_cd": {
      "question-id": {
        time: number,
        answer: string,
        isCorrect: boolean,
        external_id?: string,
        ibn?: string,
        plainQuestion?: PlainQuestionType
      }
    }
  }
}
```

#### practice_sessions table

```sql
CREATE TABLE practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  session_data JSONB NOT NULL,
  status VARCHAR(50) NOT NULL, -- 'not_started', 'in_progress', 'completed', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_practice_sessions_user_id ON practice_sessions(user_id);
CREATE INDEX idx_practice_sessions_session_id ON practice_sessions(session_id);
CREATE INDEX idx_practice_sessions_status ON practice_sessions(status);
CREATE INDEX idx_practice_sessions_created_at ON practice_sessions(created_at DESC);
```

**session_data JSONB structure:**

```typescript
{
  sessionId: string,
  timestamp: string,
  status: SessionStatus,
  practiceSelections: PracticeSelections,
  currentQuestionStep: number,
  questionAnswers: { [questionId: string]: string | null },
  questionTimes: { [questionId: string]: number },
  answeredQuestionDetails: AnsweredQuestionDetail[],
  questionCorrectChoices?: { [questionId: string]: string[] },
  totalQuestions: number,
  answeredQuestions: string[],
  averageTimePerQuestion: number,
  totalTimeSpent: number,
  totalXPReceived?: number
}
```

#### saved_questions table

```sql
CREATE TABLE saved_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assessment VARCHAR(50) NOT NULL,
  question_id VARCHAR(255) NOT NULL,
  external_id VARCHAR(255),
  ibn VARCHAR(255),
  plain_question JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, question_id)
);

CREATE INDEX idx_saved_questions_user_id ON saved_questions(user_id);
CREATE INDEX idx_saved_questions_question_id ON saved_questions(question_id);
CREATE INDEX idx_saved_questions_assessment ON saved_questions(assessment);
CREATE INDEX idx_saved_questions_timestamp ON saved_questions(timestamp DESC);
```

**plain_question JSONB structure:** Stores the full PlainQuestionType object

#### saved_collections table

```sql
CREATE TABLE saved_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  collection_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  question_ids JSONB DEFAULT '[]'::jsonb,
  question_details JSONB DEFAULT '[]'::jsonb,
  color VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_saved_collections_user_id ON saved_collections(user_id);
CREATE INDEX idx_saved_collections_collection_id ON saved_collections(collection_id);
CREATE INDEX idx_saved_collections_created_at ON saved_collections(created_at DESC);
```

**question_ids JSONB structure:**

```typescript
["question-id-1", "question-id-2", ...]
```

**question_details JSONB structure:**

```typescript
[
  {
    questionId: string,
    externalId?: string,
    ibn?: string,
    plainQuestion?: PlainQuestionType
  }
]
```

#### vocabulary_progress table

```sql
CREATE TABLE vocabulary_progress (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  progress_data JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vocabulary_progress_user_id ON vocabulary_progress(user_id);
```

**progress_data JSONB structure:** Stores the full vocabulary progress object from localStorage

#### user_preferences table

```sql
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  preferences_data JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
```

**preferences_data JSONB structure:** Stores user preferences like theme, sound settings, etc.

### TypeScript Type Definitions

**Core Authentication Types:**

```typescript
// lib/types/auth.ts
export interface User {
  id: string;
  email: string;
  name: string | null;
  provider: "google" | "email";
  createdAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
  sessionChecked: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name?: string;
}
```

**User Data Types:**

```typescript
// lib/types/userData.ts
import {
  UserProfileWithHistory,
  PracticeStatistics,
  PracticeSession,
  PlainQuestionType,
} from "@/types";

export interface SavedQuestion {
  id?: string;
  userId?: string;
  assessment: string;
  questionId: string;
  externalId: string | null;
  ibn: string | null;
  plainQuestion: PlainQuestionType | null;
  timestamp: string;
}

export interface SavedCollection {
  id?: string;
  userId?: string;
  collectionId: string;
  name: string;
  description?: string;
  questionIds: string[];
  questionDetails: Array<{
    questionId: string;
    externalId?: string;
    ibn?: string;
    plainQuestion?: PlainQuestionType;
  }>;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VocabularyProgress {
  [key: string]: any; // Vocabulary progress structure
}

export interface UserPreferences {
  theme?: "light" | "dark" | "system";
  soundEnabled?: boolean;
  notifications?: boolean;
  [key: string]: any;
}

export interface UserData {
  profile: UserProfileWithHistory | null;
  statistics: PracticeStatistics;
  sessions: PracticeSession[];
  bookmarks: SavedQuestion[];
  collections: SavedCollection[];
  vocabulary: VocabularyProgress | null;
  preferences: UserPreferences | null;
}
```

**API Types:**

```typescript
// lib/types/api.ts
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface MigrationPayload {
  profile: UserProfileWithHistory;
  statistics: PracticeStatistics;
  sessions: PracticeSession[];
  bookmarks: SavedQuestion[];
  collections: SavedCollection[];
  vocabulary: VocabularyProgress;
  preferences: UserPreferences;
}

export interface MigrationSummary {
  profileMigrated: boolean;
  statisticsMigrated: boolean;
  sessionsMigrated: number;
  bookmarksMigrated: number;
  collectionsMigrated: number;
  vocabularyMigrated: boolean;
  preferencesMigrated: boolean;
}
```

## Caching Strategy

### Cache Implementation

The system will use an in-memory LRU (Least Recently Used) cache for backend data caching.

**Cache Configuration:**

```typescript
// lib/cache.ts
import { LRUCache } from "lru-cache";

interface CacheConfig {
  max: number;
  ttl: number; // milliseconds
}

const cacheConfigs: Record<string, CacheConfig> = {
  userProfile: { max: 1000, ttl: 5 * 60 * 1000 }, // 5 minutes
  practiceStatistics: { max: 1000, ttl: 5 * 60 * 1000 },
  practiceSessions: { max: 500, ttl: 10 * 60 * 1000 }, // 10 minutes
  savedQuestions: { max: 500, ttl: 10 * 60 * 1000 },
  savedCollections: { max: 500, ttl: 10 * 60 * 1000 },
};

export const userProfileCache = new LRUCache<string, any>(
  cacheConfigs.userProfile,
);
export const statisticsCache = new LRUCache<string, any>(
  cacheConfigs.practiceStatistics,
);
export const sessionsCache = new LRUCache<string, any>(
  cacheConfigs.practiceSessions,
);
export const bookmarksCache = new LRUCache<string, any>(
  cacheConfigs.savedQuestions,
);
export const collectionsCache = new LRUCache<string, any>(
  cacheConfigs.savedCollections,
);
```

### Cache Invalidation

**Cache invalidation occurs when:**

- User profile is updated → invalidate `userProfile:${userId}`
- Practice statistics are updated → invalidate `statistics:${userId}:${assessment}`
- Practice session is created/updated → invalidate `sessions:${userId}`
- Bookmark is added/removed → invalidate `bookmarks:${userId}`
- Collection is created/updated/deleted → invalidate `collections:${userId}`

**Cache key patterns:**

- User Profile: `userProfile:${userId}`
- Statistics: `statistics:${userId}:${assessment}`
- Sessions: `sessions:${userId}`
- Bookmarks: `bookmarks:${userId}`
- Collections: `collections:${userId}`

### Cache Utilities

```typescript
// lib/cache.ts (continued)
export function getCacheKey(
  type: string,
  userId: string,
  ...rest: string[]
): string {
  return [type, userId, ...rest].join(":");
}

export function invalidateUserCache(userId: string): void {
  userProfileCache.delete(getCacheKey("userProfile", userId));
  // Invalidate all assessment statistics
  ["SAT", "PSAT/NMSQT", "PSAT"].forEach((assessment) => {
    statisticsCache.delete(getCacheKey("statistics", userId, assessment));
  });
  sessionsCache.delete(getCacheKey("sessions", userId));
  bookmarksCache.delete(getCacheKey("bookmarks", userId));
  collectionsCache.delete(getCacheKey("collections", userId));
}

export async function getCachedOrFetch<T>(
  cache: LRUCache<string, T>,
  key: string,
  fetcher: () => Promise<T>,
): Promise<T> {
  const cached = cache.get(key);
  if (cached !== undefined) {
    return cached;
  }

  const data = await fetcher();
  cache.set(key, data);
  return data;
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property Reflection

After analyzing all acceptance criteria, I've identified several areas of redundancy that can be consolidated:

**Authentication Verification Redundancy:**

- Requirements 6.2, 7.2, 8.11, 8.14 all test that endpoints verify authentication
- These can be combined into one property: "All protected endpoints require authentication"

**Session State Redundancy:**

- Requirements 2.4, 3.6 both test session establishment after successful auth
- Requirements 10.3, 10.4, 10.5 all test behavior when session is valid
- These can be combined into properties about session lifecycle

**Data Persistence Redundancy:**

- Requirements 6.4-6.9 all test that migration inserts data into specific tables
- These are all part of the migration atomicity property and can be tested together

**Redux Update Redundancy:**

- Requirements 2.5, 3.7, 13.8 all test Redux updates after successful operations
- These can be combined into one property about Redux synchronization

**Error Handling Redundancy:**

- Requirements 2.6, 3.8, 3.9, 13.9, 18.1-18.9 all test error handling
- These can be grouped into properties about error responses by category

**Cache Behavior Redundancy:**

- Requirements 9.6, 9.7, 9.8, 9.9 describe the complete cache flow
- These can be tested as a single cache round-trip property

After reflection, the following properties provide unique validation value:

### Property 1: OAuth User Record Creation

_For any_ successful Google OAuth authentication, the system should create a user record in the database if one doesn't exist, or retrieve the existing record if the user has authenticated before.

**Validates: Requirements 2.3**

### Property 2: Session Establishment After Authentication

_For any_ successful authentication (Google OAuth or email/password), the system should establish a valid user session and update the Redux store with authenticated user information.

**Validates: Requirements 2.4, 2.5, 3.6, 3.7**

### Property 3: OAuth Error Handling

_For any_ failed OAuth attempt, the system should display a descriptive error message to the user without establishing a session.

**Validates: Requirements 2.6**

### Property 4: Email Validation on Registration

_For any_ registration attempt, the system should validate that the provided email conforms to standard email format (contains @, valid domain structure).

**Validates: Requirements 3.3**

### Property 5: Password Strength Validation

_For any_ registration attempt, the system should reject passwords shorter than 8 characters and accept passwords of 8 or more characters.

**Validates: Requirements 3.4**

### Property 6: User Record Creation on Registration

_For any_ successful email/password registration, the system should create a unique user record in the database with the provided email and hashed password.

**Validates: Requirements 3.5**

### Property 7: Duplicate Email Rejection

_For any_ registration attempt with an email that already exists in the database, the system should return a descriptive error message without creating a duplicate record.

**Validates: Requirements 3.8**

### Property 8: Invalid Credentials Error

_For any_ sign-in attempt with credentials that don't match an existing user record, the system should return an error message without establishing a session.

**Validates: Requirements 3.9**

### Property 9: Authentication State Persistence

_For any_ authenticated user, after a page refresh, the system should verify the session is still valid and restore the authentication state in Redux if valid, or clear the state if invalid/expired.

**Validates: Requirements 4.5, 10.2, 10.3, 10.6**

### Property 10: Protected Endpoint Authentication

_For any_ request to a protected endpoint (`/api/user/*`), the system should verify the user is authenticated and return 401 Unauthorized if not.

**Validates: Requirements 6.2, 6.12, 7.2, 7.12, 8.11, 8.14**

### Property 11: Migration Data Validation

_For any_ migration request, the system should validate the structure of incoming localStorage data and return 400 Bad Request with validation details if the data is malformed.

**Validates: Requirements 6.3, 6.13**

### Property 12: Migration Atomicity

_For any_ migration operation, either all data types (profile, statistics, sessions, bookmarks, collections, vocabulary, preferences) should be successfully inserted into the database, or if any insertion fails, all changes should be rolled back via database transaction.

**Validates: Requirements 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.11**

### Property 13: Migration Response Summary

_For any_ successful migration operation, the response should include a summary object containing boolean flags for each data type migrated and counts for array-based data (sessions, bookmarks, collections).

**Validates: Requirements 6.10**

### Property 14: User Data Fetch Completeness

_For any_ authenticated user requesting their data via `/api/user/data`, the response should contain all seven data categories (profile, statistics, sessions, bookmarks, collections, vocabulary, preferences) even if some are null or empty structures.

**Validates: Requirements 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10**

### Property 15: Empty Data Structures for New Users

_For any_ authenticated user with no existing database records, the `/api/user/data` endpoint should return empty data structures (empty arrays for sessions/bookmarks/collections, null for profile/vocabulary/preferences, empty objects for statistics) rather than errors.

**Validates: Requirements 7.11**

### Property 16: Cache Invalidation on Update

_For any_ successful data update operation (profile, statistics, session, bookmark, collection, vocabulary, preferences), the system should invalidate the relevant cache entries before returning the response.

**Validates: Requirements 8.12, 9.9**

### Property 17: Updated Data in Response

_For any_ successful data update operation, the API response should contain the updated data reflecting the changes that were just persisted to the database.

**Validates: Requirements 8.13**

### Property 18: Cache-First Data Retrieval

_For any_ data fetch request, the system should check the cache first, return cached data if present and not expired, or query the database and populate the cache if cache miss occurs.

**Validates: Requirements 9.6, 9.7, 9.8**

### Property 19: Cache TTL Enforcement

_For any_ cached data entry, the data should be automatically evicted from cache after its TTL expires (5 minutes for profile/statistics, 10 minutes for sessions/bookmarks/collections).

**Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

### Property 20: LRU Cache Eviction

_For any_ cache that reaches its maximum size (1000 entries), when a new entry is added, the least recently used entry should be evicted to maintain the size limit.

**Validates: Requirements 9.10**

### Property 21: Session Validation on Refresh

_For any_ page refresh with an existing session cookie, the system should validate the session with Better Auth, fetch user data from the backend if valid, and populate the Redux userData slice.

**Validates: Requirements 10.4, 10.5**

### Property 22: Session Expiry Redirect

_For any_ request with an invalid or expired session, the system should clear the Redux authentication state and redirect the user to the login page.

**Validates: Requirements 10.7**

### Property 23: Migration Prompt Display Logic

_For any_ successful login, if the user's database is empty and localStorage contains user data, the system should display an import prompt; if the database already contains data, the prompt should not be displayed.

**Validates: Requirements 11.2, 11.3, 11.6**

### Property 24: Migration Service Invocation

_For any_ user acceptance of the migration prompt, the system should call the Migration Service API with the localStorage data; for any decline, the system should proceed without calling the API.

**Validates: Requirements 11.4, 11.5**

### Property 25: Unauthenticated localStorage Usage

_For any_ unauthenticated user, the system should use localStorage for all data persistence operations and should not make any API calls to user data endpoints.

**Validates: Requirements 12.1, 12.2, 12.3**

### Property 26: Authenticated Database Persistence

_For any_ authenticated user, when user data changes (profile updates, statistics updates, session saves, bookmark adds/removes, collection modifications, vocabulary updates, preference changes), the system should persist the changes to the database via API calls.

**Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7**

### Property 27: Redux Synchronization After Save

_For any_ successful data save operation, the Redux store should be updated with the latest data returned from the API to maintain synchronization between backend and frontend state.

**Validates: Requirements 13.8**

### Property 28: Save Error Notification

_For any_ failed data save operation, the system should display an error notification to the user indicating what data failed to save.

**Validates: Requirements 13.9**

### Property 29: Network Error Retry Logic

_For any_ data save operation that fails due to network error, the system should retry the operation up to 3 times before displaying an error to the user.

**Validates: Requirements 13.10**

### Property 30: Missing Environment Variable Error

_For any_ required environment variable (DATABASE_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, BETTER_AUTH_SECRET, NEXT_PUBLIC_BASE_URL) that is missing or undefined, the system should throw a configuration error with a clear message at startup.

**Validates: Requirements 15.7**

### Property 31: Logout Endpoint Invocation

_For any_ logout action initiated by the user, the system should call the Better Auth logout endpoint.

**Validates: Requirements 17.2**

### Property 32: Logout State Cleanup

_For any_ successful logout operation, the system should clear the user session, clear Redux authentication state, clear Redux userData state, redirect to home page, and display a success message.

**Validates: Requirements 17.3, 17.4, 17.5, 17.6, 17.7**

### Property 33: Error Logging and User Feedback

_For any_ authentication error, API error, network error, or validation error, the system should log the error to the console and display a user-friendly error message (not exposing internal details).

**Validates: Requirements 18.1, 18.2, 18.3, 18.4, 18.5**

### Property 34: HTTP Error Status Codes

_For any_ database connection failure, the system should return 503 Service Unavailable; for any invalid authentication token, return 401 Unauthorized; for any permission denial, return 403 Forbidden.

**Validates: Requirements 18.7, 18.8, 18.9**

### Property 35: Cache Response Time

_For any_ cached data query (cache hit), the system should return the data within 10 milliseconds.

**Validates: Requirements 19.6**

### Property 36: Authentication Flow Performance

_For any_ authentication flow (excluding OAuth redirect time), the system should complete the flow (session establishment, initial data fetch, Redux update) within 2 seconds.

**Validates: Requirements 19.7**

### Property 37: Migration Performance

_For any_ migration operation with typical user data size (< 100 sessions, < 500 bookmarks, < 50 collections), the system should complete the migration within 5 seconds.

**Validates: Requirements 19.8**

## Error Handling

### Error Categories and Handling Strategy

**Authentication Errors:**

- Invalid credentials → Display "Email or password is incorrect"
- Duplicate email on registration → Display "An account with this email already exists"
- OAuth failure → Display "Failed to authenticate with Google. Please try again"
- Session expired → Clear auth state, redirect to login, display "Your session has expired. Please sign in again"

**Validation Errors:**

- Invalid email format → Display "Please enter a valid email address"
- Weak password → Display "Password must be at least 8 characters"
- Invalid migration data → Return 400 with specific validation errors

**Network Errors:**

- Connection timeout → Retry up to 3 times, then display "Network error. Please check your connection and try again"
- Server unavailable → Display "Service temporarily unavailable. Please try again later"

**Database Errors:**

- Connection failure → Return 503, display "Service temporarily unavailable"
- Transaction failure → Rollback, return 500, display "An error occurred. Please try again"
- Constraint violation → Return 400, display appropriate message

**API Errors:**

- 401 Unauthorized → Redirect to login
- 403 Forbidden → Display "You don't have permission to perform this action"
- 404 Not Found → Display "Resource not found"
- 500 Internal Server Error → Display "An unexpected error occurred. Please try again"

### Error Logging Strategy

```typescript
// lib/errorLogger.ts
export function logError(
  context: string,
  error: Error | unknown,
  metadata?: Record<string, any>,
): void {
  const errorDetails = {
    context,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
    ...metadata,
  };

  console.error("❌ Error:", errorDetails);

  // In production, send to error tracking service (e.g., Sentry)
  if (process.env.NODE_ENV === "production") {
    // sendToErrorTracking(errorDetails);
  }
}
```

### Error Boundaries

React Error Boundaries will be implemented to catch rendering errors:

```typescript
// components/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component<Props, State> {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logError('React Error Boundary', error, { errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

## Testing Strategy

### Testing Approach Overview

The testing strategy employs a dual approach combining traditional unit/integration tests with property-based tests for comprehensive coverage:

**Unit Tests** - Test specific examples, edge cases, and component behavior
**Property-Based Tests** - Validate universal properties across randomized inputs (100+ iterations)

### Testing Frameworks and Libraries

- **Test Runner:** Jest (Next.js default)
- **React Testing:** React Testing Library
- **Property-Based Testing:** fast-check
- **API Testing:** MSW (Mock Service Worker)
- **E2E Testing:** Playwright
- **Database Testing:** PostgreSQL test container or in-memory database

### Property-Based Testing Configuration

All property tests will be tagged with comments linking to design properties:

```typescript
// Format: Feature: better-auth-system, Property {number}: {property title}

it("validates email format on registration", () => {
  // Feature: better-auth-system, Property 4: Email Validation on Registration
  fc.assert(
    fc.property(fc.emailAddress(), (email) => {
      const result = validateEmail(email);
      expect(result.isValid).toBe(true);
    }),
    { numRuns: 100 },
  );
});
```

### Test Organization

```
src/
├── __tests__/
│   ├── unit/
│   │   ├── auth/
│   │   │   ├── betterAuthConfig.test.ts
│   │   │   ├── emailValidation.test.ts
│   │   │   ├── passwordValidation.test.ts
│   │   │   └── sessionManagement.test.ts
│   │   ├── redux/
│   │   │   ├── authSlice.test.ts
│   │   │   ├── userDataSlice.test.ts
│   │   │   └── selectors.test.ts
│   │   ├── cache/
│   │   │   ├── cacheOperations.test.ts
│   │   │   └── lruEviction.test.ts
│   │   └── utils/
│   │       ├── errorLogger.test.ts
│   │       └── localStorage.test.ts
│   ├── integration/
│   │   ├── api/
│   │   │   ├── authRoutes.test.ts
│   │   │   ├── userDataRoutes.test.ts
│   │   │   └── migrationRoute.test.ts
│   │   ├── database/
│   │   │   ├── userOperations.test.ts
│   │   │   ├── migrationOperations.test.ts
│   │   │   └── transactionRollback.test.ts
│   │   └── cache/
│   │       ├── cacheIntegration.test.ts
│   │       └── cacheInvalidation.test.ts
│   ├── property/
│   │   ├── auth.property.test.ts
│   │   ├── validation.property.test.ts
│   │   ├── migration.property.test.ts
│   │   ├── cache.property.test.ts
│   │   └── dataSync.property.test.ts
│   └── e2e/
│       ├── authFlow.spec.ts
│       ├── migrationFlow.spec.ts
│       ├── dataSync.spec.ts
│       └── unauthenticatedFlow.spec.ts
```

### Unit Test Coverage

**Auth Module:**

- Email validation with valid/invalid formats
- Password strength validation (< 8 chars, = 8 chars, > 8 chars)
- Better Auth configuration initialization
- Session cookie handling

**Redux Module:**

- Auth slice reducers (setUser, clearUser, setLoading, setError)
- UserData slice reducers (all data type updates)
- Async thunks (mock API responses)
- Selectors (memoization verification)

**Cache Module:**

- Cache set/get operations
- TTL expiration
- LRU eviction when limit reached
- Cache key generation

**API Routes:**

- Request validation
- Authentication middleware
- Response formatting
- Error handling

### Integration Test Coverage

**API + Database:**

- User registration → database record creation
- User login → session establishment
- Data fetch → database query → cache population
- Data update → database update → cache invalidation
- Migration → transaction → all data inserted or rolled back

**Redux + API:**

- Login action → API call → Redux update
- Fetch data action → API call → Redux update
- Update data action → API call → Redux update

**Cache + Database:**

- Cache miss → database query → cache population
- Cache hit → return cached data (no database query)
- Cache expiration → database query on next fetch
- Cache invalidation → database query on next fetch

### Property-Based Test Coverage

**Property 4: Email Validation**

```typescript
fc.assert(
  fc.property(fc.emailAddress(), (email) => {
    const result = validateEmail(email);
    expect(result.isValid).toBe(true);
  }),
  { numRuns: 100 },
);
```

**Property 5: Password Strength**

```typescript
fc.assert(
  fc.property(fc.string({ minLength: 8, maxLength: 100 }), (password) => {
    const result = validatePassword(password);
    expect(result.isValid).toBe(true);
  }),
  { numRuns: 100 },
);
```

**Property 12: Migration Atomicity**

```typescript
fc.assert(
  fc.property(generateUserData(), async (userData) => {
    const result = await migrateData(userData);
    // Either all data types migrated or none
    const allSuccess = Object.values(result.summary).every(
      (v) => v === true || v > 0,
    );
    const allFailed = Object.values(result.summary).every(
      (v) => v === false || v === 0,
    );
    expect(allSuccess || allFailed).toBe(true);
  }),
  { numRuns: 100 },
);
```

**Property 18: Cache-First Retrieval**

```typescript
fc.assert(
  fc.property(fc.uuid(), async (userId) => {
    // First call should query database
    const result1 = await fetchUserProfile(userId);
    const dbCallCount1 = getDatabaseCallCount();

    // Second call should use cache
    const result2 = await fetchUserProfile(userId);
    const dbCallCount2 = getDatabaseCallCount();

    expect(result1).toEqual(result2);
    expect(dbCallCount2).toBe(dbCallCount1); // No additional DB call
  }),
  { numRuns: 100 },
);
```

**Property 20: LRU Cache Eviction**

```typescript
fc.assert(
  fc.property(
    fc.array(fc.record({ key: fc.string(), value: fc.anything() }), {
      minLength: 1001,
      maxLength: 1100,
    }),
    (entries) => {
      const cache = new LRUCache({ max: 1000 });

      // Add all entries
      entries.forEach((entry) => cache.set(entry.key, entry.value));

      // Cache size should never exceed 1000
      expect(cache.size).toBeLessThanOrEqual(1000);

      // Last 1000 entries should be in cache
      const last1000 = entries.slice(-1000);
      last1000.forEach((entry) => {
        expect(cache.has(entry.key)).toBe(true);
      });
    },
  ),
  { numRuns: 100 },
);
```

**Property 29: Network Error Retry**

```typescript
fc.assert(
  fc.property(
    fc.record({ userId: fc.uuid(), data: fc.anything() }),
    async (payload) => {
      let attemptCount = 0;
      mockApiCall.mockImplementation(() => {
        attemptCount++;
        throw new NetworkError("Connection failed");
      });

      await expect(updateUserData(payload)).rejects.toThrow();
      expect(attemptCount).toBe(3); // Should retry 3 times
    },
  ),
  { numRuns: 100 },
);
```

### End-to-End Test Scenarios

**Complete Authentication Flow:**

1. User visits app (unauthenticated)
2. Clicks "Sign in with Google"
3. Completes OAuth (mocked)
4. System creates user record
5. System establishes session
6. System fetches user data
7. Redux store updated
8. User sees authenticated dashboard

**Migration Flow:**

1. User signs in with existing localStorage data
2. System detects empty database
3. System shows migration prompt
4. User accepts migration
5. System migrates all data
6. System displays success message
7. Data is accessible from database

**Data Synchronization Flow:**

1. Authenticated user answers question
2. System updates statistics locally
3. System sends update to API
4. Cache is invalidated
5. Database is updated
6. Redux is updated
7. UI reflects new statistics

**Session Expiry Flow:**

1. User is authenticated
2. Session expires (time travel in test)
3. User tries to fetch data
4. System detects expired session
5. System clears auth state
6. System redirects to login
7. User sees login page

### Test Coverage Goals

- **Overall Code Coverage:** Minimum 80%
- **Auth Module:** Minimum 90%
- **API Routes:** Minimum 85%
- **Redux Slices:** Minimum 90%
- **Cache Layer:** Minimum 85%
- **Migration Service:** Minimum 90%

### Continuous Integration

Tests will run on every pull request and merge:

```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:property
      - run: npm run test:e2e
      - run: npm run test:coverage
```

---

## Implementation Notes

### Development Phases

**Phase 1: Foundation (Week 1)**

- Set up Better Auth with PostgreSQL
- Implement database schema and migrations
- Create basic API routes structure
- Set up Redux store with auth slice

**Phase 2: Authentication (Week 2)**

- Implement Google OAuth flow
- Implement email/password authentication
- Create authentication UI components
- Implement session management

**Phase 3: Data Layer (Week 3)**

- Implement user data API routes
- Implement cache layer
- Create database access layer
- Implement user data Redux slice

**Phase 4: Migration (Week 4)**

- Implement migration API endpoint
- Create migration UI (prompt, progress)
- Implement data validation
- Add transaction handling

**Phase 5: Integration & Polish (Week 5)**

- Connect all components
- Implement error handling
- Add loading states
- Performance optimization
- UI/UX refinements

**Phase 6: Testing (Week 6)**

- Write unit tests
- Write integration tests
- Write property-based tests
- Write E2E tests
- Achieve coverage goals

### Dependencies

**New Dependencies to Add:**

```json
{
  "dependencies": {
    "better-auth": "^latest",
    "@reduxjs/toolkit": "^2.0.0",
    "react-redux": "^9.0.0",
    "pg": "^8.11.0",
    "lru-cache": "^10.0.0"
  },
  "devDependencies": {
    "fast-check": "^3.15.0",
    "@playwright/test": "^1.40.0",
    "msw": "^2.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0"
  }
}
```

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mysatprep

# Better Auth
BETTER_AUTH_SECRET=your-secret-key-min-32-chars
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Database Migrations

Database schema will be managed with SQL migration files:

```sql
-- migrations/001_initial_schema.sql
-- Create all tables with proper indexes and constraints
-- (schema defined in Data Models section)
```

### Security Considerations

- All passwords hashed with bcrypt (handled by Better Auth)
- HTTPS enforced in production
- CSRF protection via Better Auth
- SQL injection prevention via parameterized queries
- XSS prevention via React's default escaping
- Environment variables never exposed to client
- Session cookies marked as httpOnly and secure

### Performance Considerations

- Database indexes on all foreign keys and frequently queried columns
- LRU cache to minimize database queries
- Debounced save operations (500ms) to batch updates
- Lazy loading of authentication modals
- Memoized Redux selectors to prevent unnecessary re-renders
- React.memo for expensive components

### Accessibility Considerations

- All form inputs have proper labels
- Error messages associated with form fields via aria-describedby
- Keyboard navigation support for all interactive elements
- Focus management in modals
- Loading states announced to screen readers
- Color contrast meets WCAG AA standards
