# Requirements Document

## Introduction

This feature adds Bluebook question external IDs to the main hero component's reducer state management. Currently, the component fetches Bluebook math and reading/writing question external IDs from the lookup API but doesn't store them in the reducer state, making them unavailable for use throughout the component lifecycle. This enhancement will integrate these external IDs into the existing state management system for better data persistence and accessibility.

## Requirements

### Requirement 1

**User Story:** As a developer, I want the Bluebook question external IDs to be stored in the reducer state, so that they can be accessed and used throughout the component lifecycle without refetching.

#### Acceptance Criteria

1. WHEN the lookup API call succeeds THEN the system SHALL store the math live items external IDs in the reducer state
2. WHEN the lookup API call succeeds THEN the system SHALL store the reading/writing live items external IDs in the reducer state
3. WHEN the reducer state is updated with Bluebook external IDs THEN the system SHALL maintain the existing state structure and functionality
4. WHEN an error occurs during the lookup API call THEN the system SHALL handle the error gracefully without breaking the existing functionality

### Requirement 2

**User Story:** As a developer, I want the Bluebook external IDs state to be properly typed, so that TypeScript provides accurate type checking and IntelliSense support.

#### Acceptance Criteria

1. WHEN defining the state interface THEN the system SHALL include properly typed fields for Bluebook math external IDs
2. WHEN defining the state interface THEN the system SHALL include properly typed fields for Bluebook reading/writing external IDs
3. WHEN defining reducer actions THEN the system SHALL include typed actions for setting Bluebook external IDs
4. WHEN the reducer processes Bluebook ID actions THEN the system SHALL maintain type safety throughout the state updates

### Requirement 3

**User Story:** As a developer, I want the Bluebook external IDs to be accessible in the component, so that they can be used for further processing or passed to child components.

#### Acceptance Criteria

1. WHEN the Bluebook external IDs are stored in state THEN the system SHALL make them accessible through the state object
2. WHEN the component renders THEN the system SHALL provide access to both math and reading/writing external IDs
3. WHEN the external IDs are needed by child components THEN the system SHALL allow them to be passed as props
4. WHEN the external IDs are updated THEN the system SHALL trigger appropriate re-renders of dependent components
