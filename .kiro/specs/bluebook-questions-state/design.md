# Design Document

## Overview

This design outlines the integration of Bluebook question external IDs into the existing reducer state management system in the main hero component. The feature will extend the current `MainHeroState` interface and `mainHeroReducer` to store and manage the external IDs returned from the lookup API, making them accessible throughout the component lifecycle.

## Architecture

The solution follows the existing reducer pattern used in the component, maintaining consistency with the current state management approach. The design extends the current architecture without breaking existing functionality.

### Current State Structure

The existing `MainHeroState` interface manages filter selections, questions, loading states, and error handling. The new design will add Bluebook external IDs as additional state properties.

### Data Flow

1. User applies filters → API calls are made (existing flow)
2. Lookup API call succeeds → Bluebook external IDs are extracted
3. External IDs are dispatched to reducer → State is updated
4. External IDs become available throughout component → Can be used by child components or further processing

## Components and Interfaces

### State Interface Extension

The `MainHeroState` interface will be extended to include:

```typescript
interface MainHeroState {
  // ... existing properties
  bluebookExternalIds: {
    mathLiveItems: string[];
    readingLiveItems: string[];
  };
}
```

### Reducer Actions Extension

New action types will be added to the `MainHeroAction` union type:

```typescript
type MainHeroAction =
  // ... existing actions
  | { type: "SET_BLUEBOOK_MATH_IDS"; payload: string[] }
  | { type: "SET_BLUEBOOK_READING_IDS"; payload: string[] }
  | {
      type: "SET_BLUEBOOK_IDS";
      payload: { mathLiveItems: string[]; readingLiveItems: string[] };
    }
  | { type: "RESET_BLUEBOOK_IDS" };
```

### Reducer Cases Extension

The `mainHeroReducer` will handle the new action types:

```typescript
case "SET_BLUEBOOK_MATH_IDS":
  return {
    ...state,
    bluebookExternalIds: {
      ...state.bluebookExternalIds,
      mathLiveItems: action.payload
    }
  };

case "SET_BLUEBOOK_READING_IDS":
  return {
    ...state,
    bluebookExternalIds: {
      ...state.bluebookExternalIds,
      readingLiveItems: action.payload
    }
  };

case "SET_BLUEBOOK_IDS":
  return {
    ...state,
    bluebookExternalIds: action.payload
  };

case "RESET_BLUEBOOK_IDS":
  return {
    ...state,
    bluebookExternalIds: {
      mathLiveItems: [],
      readingLiveItems: []
    }
  };
```

## Data Models

### Bluebook External IDs Structure

Based on the lookup API response and type definitions:

```typescript
interface BluebookExternalIds {
  mathLiveItems: string[];
  readingLiveItems: string[];
}
```

The external IDs are arrays of strings representing unique identifiers for Bluebook questions, separated by subject (Math and Reading/Writing).

### Initial State

The initial state will include the new Bluebook external IDs:

```typescript
const initialState: MainHeroState = {
  // ... existing initial state properties
  bluebookExternalIds: {
    mathLiveItems: [],
    readingLiveItems: [],
  },
};
```

## Error Handling

### API Error Scenarios

1. **Lookup API Failure**: If the lookup API call fails, the existing error handling will manage the failure without affecting the Bluebook external IDs state.

2. **Partial Data**: If the lookup API returns partial data (e.g., only math IDs), the reducer will handle setting individual arrays while preserving the other.

3. **Invalid Data Structure**: Type checking will ensure that only valid string arrays are accepted for the external IDs.

### Error Recovery

- Failed lookup API calls will not reset existing Bluebook external IDs
- The component will continue to function normally even if Bluebook external IDs are not available
- Error states will be managed through the existing error handling mechanism

## Testing Strategy

### Unit Tests

1. **Reducer Tests**:

   - Test new action types update state correctly
   - Test that existing functionality remains unaffected
   - Test edge cases (empty arrays, undefined values)

2. **Component Integration Tests**:

   - Test that external IDs are properly dispatched after successful API calls
   - Test that external IDs are accessible in component state
   - Test error scenarios don't break existing functionality

3. **Type Safety Tests**:
   - Verify TypeScript compilation with new interfaces
   - Test that invalid payloads are caught at compile time

### Integration Tests

1. **API Integration**:

   - Test successful lookup API call updates external IDs
   - Test failed lookup API call doesn't break component
   - Test partial data scenarios

2. **State Management**:
   - Test that external IDs persist through component re-renders
   - Test that external IDs are reset when appropriate
   - Test that external IDs can be passed to child components

### Manual Testing

1. **User Flow Testing**:

   - Apply filters and verify external IDs are populated
   - Change filters and verify external IDs are updated appropriately
   - Test error scenarios through network throttling

2. **Performance Testing**:
   - Verify no performance regression with additional state properties
   - Test memory usage with large external ID arrays

## Implementation Considerations

### Backward Compatibility

The design maintains full backward compatibility with existing functionality. All existing state properties, actions, and reducer logic remain unchanged.

### Performance Impact

The addition of external ID arrays to state will have minimal performance impact:

- Arrays are typically small (hundreds of IDs at most)
- No additional API calls are introduced
- State updates follow existing patterns

### Future Extensibility

The design allows for future enhancements:

- Additional external ID types can be easily added
- External IDs can be used for question filtering or matching
- Integration with other components is straightforward through props

### Code Organization

The implementation will follow the existing code organization patterns:

- State interface extensions in the same file
- Reducer action types added to existing union type
- Reducer cases added to existing switch statement
- API integration in existing async function
