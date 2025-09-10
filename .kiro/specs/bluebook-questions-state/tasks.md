# Implementation Plan

- [x] 1. Extend state interface and types for Bluebook external IDs

  - Add `BluebookExternalIds` interface definition with proper typing
  - Extend `MainHeroState` interface to include `bluebookExternalIds` property
  - Add new action types to `MainHeroAction` union type for managing Bluebook external IDs
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 2. Update reducer to handle Bluebook external ID actions

  - Add reducer cases for `SET_BLUEBOOK_MATH_IDS`, `SET_BLUEBOOK_READING_IDS`, `SET_BLUEBOOK_IDS`, and `RESET_BLUEBOOK_IDS` actions
  - Implement proper state updates that maintain immutability
  - Ensure existing reducer functionality remains unchanged
  - _Requirements: 1.3, 2.4_

- [x] 3. Update initial state to include Bluebook external IDs

  - Modify the initial state object to include empty arrays for `mathLiveItems` and `readingLiveItems`
  - Ensure the initial state matches the extended interface structure
  - _Requirements: 1.1, 1.2_

- [x] 4. Integrate external ID state updates in API call handler

  - Modify the `handleApplyFilter` function to dispatch Bluebook external IDs to state after successful lookup API call
  - Extract `mathLiveItems` and `readingLiveItems` from the lookup response
  - Dispatch the external IDs using the new reducer actions
  - Maintain existing error handling without breaking functionality
  - _Requirements: 1.1, 1.2, 1.4_

- [x] 5. Make Bluebook external IDs accessible in component

  - Ensure the external IDs are available through the state object for component usage
  - Verify that the external IDs can be accessed and used within the component
  - Test that the external IDs are properly typed and provide IntelliSense support
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 6. Add unit tests for new reducer functionality
  - Write tests for new action types to verify correct state updates
  - Test that existing reducer functionality is not affected by the changes
  - Test edge cases like empty arrays and undefined values
  - Verify type safety and proper error handling
  - _Requirements: 1.3, 2.4_
