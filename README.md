# `react-overridable-hooks`

An easy way to override hooks!  Useful for:
- Testing
- Storybook
- Mocking in development


### Setup

Install via NPM `npm install --save react-overridable-hooks`  

### Example

`Counter.jsx`
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

However, we now have the ability to optionally use the `<CounterProvider value=...>` to override the hook's value with our own value.  We can use this provider in tests, Storybook, or even local development.

#### Example with unit tests ()

#### Example with Storybook
`Counter.story.jsx`
```tsx
import { Counter, CounterProvider } from './Counter';

const increment = action("increment");
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
  
  or even no value (uses actual hook)
  <CounterProvider>
    <Counter /> - Renders "Count: 0"
  </CounterProvider>
</>;
```
