# `react-overridable-hooks`

An easy way to override hooks!  Useful for:
- Testing
- Storybook
- Mocking in development


### Setup

Install via NPM `npm install --save react-overridable-hooks`  

# API

## `overridableHook`
`const [ hookWrapper, OverrideProvider ] = overridableHook(hook);`  

Wraps a hook, so that it can be overridden.

By default, the hook wrapper is identical to the hook, and should be used in its place.
When an `OverrideProvider` is present, it will override the hook, and supply its own value.

#### Example: `Counter.jsx`

```tsx
import { overridableHook } from "react-overridable-hooks";

// A normal custom hook:
function useCounterHook(initial = 0) {
  const [count, setCount] = React.useState(initial);
  const increment = () => setCount((c) => c + 1);
  return { count, increment };
}

// An overridable version of the hook:
export const [useCounter, CounterProvider] = overridableHook(useCounterHook);

// A component that uses the hook:
export const Counter = ({ initial }) => {
  const { count, increment } = useCounter(initial);
  return <div>
    Count: {count}
    <button onClick={increment}> Increment </button>
  </div>;
} 
```

The `useCounter` hook, and the `<Counter />` component, will work normally without any other modifications.  

However, we now have the ability to optionally use the `<CounterProvider value={...}>` to override the hook's value with our own value.  We can use this provider in tests, Storybook, or even local development.  Here's an example:

#### Example usage: `Counter.stories.jsx`
```jsx
import { Counter, CounterProvider } from './Counter';

const increment = () => console.log('increment');

export const WithMockValues = <>
  We can provide a static value:
  <CounterProvider value={{ count: 99, increment }}>
    <Counter /> Renders "Count: 99"
  </CounterProvider>
  
  or a dynamic value:
  <CounterProvider value={(initial) => { count: initial * 1000, increment }}>
    <Counter initial={5} /> Renders "Count: 5000"
    <Counter initial={6} /> Renders "Count: 6000"
  </CounterProvider>
  
  or even no value (uses actual hook):
  <CounterProvider>
    <Counter /> - Renders "Count: 0"
  </CounterProvider>
</>;
```

#### More Examples
More examples can be found in [./examples](./examples)


### Using ONLY for tests, but not production

If you only want to use overridable hooks for tests, but not in production code, there is a `enabled` option that can be set to `false`:

```jsx
const [ useCounter, CounterMockProvider ] = overridableHook(useCounterHook, {
  enabled: process.env.NODE_ENV === "test" 
});
```
With `enabled: false`, the hook will NOT be wrapped at all; it will be returned as-is (`useCounter === useCounterHook`).  This ensures there is no performance overhead in production code, and the OverrideProvider can only be used in tests.

#### `testableHook`

This is such a common pattern, that a utility method is available, `testableHook`, that performs the same `NODE_ENV` check:
```js
import { testableHook } from 'react-overridable-hooks';

const [ useCounter, CounterMockProvider ] = testableHook(useCounterHook);
// In production, useCounter === useCounterHook
```
