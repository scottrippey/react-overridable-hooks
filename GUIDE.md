# Guide

The goal of `react-overridable-hooks` is to help components that manage their own state to be easily **testable** and **mockable**.  

We're going to create a Storybook for an auto-complete search bar.
We want stories that show the various states, including:
- The default "empty" state
- Text entered, with "loading" state
- Text entered, with suggestions
- The "error" state

We'll start with this `SearchBar` component that manages its own state and data fetching:

```jsx
// SearchBar.jsx

const SearchBar = () => {
  // UI state:
  const [ search, setSearch ] = useState('');

  // Data state:
  const {
    result: suggestions,
    loading,
    error,
  } = useFetch('/suggestions', { params: { search } });
  
  // UI:
  return (
    <div>
      <input
        placeholder="Search"
        value={search}
        onChange={(ev) => setSearch(ev.currentTarget.value)}
      />
      <select multiple>
        {suggestions?.map((item) =>
          <option value={item} />
        )}
      </select>
      {loading && "..."}
      {error && "Something went wrong"}
    </div>
  )
}
```


## 1: Separation of UI and State

We start by refactoring this component, very slightly, to extract the "UI state" into a custom hook.  We'll also encapsulate the "Data state" in another hook.  And finally, we'll wrap both of these hooks with `testableHook`:

```jsx
// SearchBar.jsx
import { testableHook } from 'react-overridable-hooks';

export const useSearchBarState = testableHook(() => {
  // UI State:
  const [ search, setSearch ] = useState('');
  return { search, setSearch };
});

export const useSearchBarData = testableHook((search) => {
  // Data state:
  const {
    result: suggestions,
    loading,
    error,
  } = useFetch('/suggestions', { params: { search } });
  return { suggestions, loading, error };
});

const SearchBar = () => {
  const { search, setSearch } = useSearchBarState();
  const { suggestions, loading, error } = useSearchBarData(search);

  // UI: (stays the same)...
```

## 2: Stories that have it all under control

Now that our hooks are wrapped in `testableHook`, we can create stories that have total control over the UI state and Data state!

We can easily write stories for the 4 states we listed above. 

```jsx
// SearchBar.stories.jsx

import { createHookOverridesProvider } from 'react-overridable-hooks';
import { SearchBar, useSearchBarState, useSearchBarData } from './SearchBar';

export default { title: "SearchBar" };

const HookOverrides = createHookOverridesProvider({ useSearchBarState, useSearchBarData });

export const FilledState = () => (
  <HookOverrides
    useSearchBarState={() => ({ 
      search: "search text", 
      setSearch: action('setSearch'),
    })}
    useSearchBarData={(search) => ({ 
      suggestions: ["one"], 
      loading: false, 
      error: null,
    })}
  >
    <SearchBar />
  </HookOverrides>
);

export const EmptyState = () => (
  // Here, we don't override useSearchBarState, so the original hook will still be used,
  // This means that the user can still type search terms, and see some results.  
  <HookOverrides
    useSearchBarData={(search) => ({
      suggestions: ["suggestion 1", "suggestion 2", `suggestion ${search}`],
      loading: false,
      error: null,
    })}
  >
    <SearchBar />
  </HookOverrides>
);

export const LoadingState = () => (
  <HookOverrides
    useSearchBarState={() => ({ search: "search text", setSearch: action('setSearch') })}
    useSearchBarData={() => ({ suggestions: [], loading: true, error: null })}
  >
    <SearchBar />
  </HookOverrides>
);

export const ErrorState = () => (
  <HookOverrides
    useSearchBarState={() => ({ search: "search text", setSearch: action('setSearch') })}
    useSearchBarData={() => ({ suggestions: [], loading: false, error: new Error('Some Error') })}
  >
    <SearchBar />
  </HookOverrides>
);
```
And that's all there is to it!  Components that are self-contained, testable, and mockable.

## Act now, and you'll receive:

- **Strong types** - all hooks and overrides have full type safety.
- **Zero performance overhead** in production.  Outside of Storybook and test environments, the `testableHook` function simply returns the original function, unmodified.  No contexts needed.
- Works great with **nested components**. You can mock the state of any component, no matter how deeply nested it is.  No prop-drilling needed!
