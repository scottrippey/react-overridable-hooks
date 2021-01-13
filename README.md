# `react-overridable-hooks`

Makes it easy to override hooks, so that components can be easily tested.  This works well for unit tests and Storybook, by allowing you to mock out a deeply nested state.

In production, the hook isn't touched, so there's no performance overhead.

### Setup

Install via NPM `npm install --save react-overridable-hooks`  
When running Storybook or tests, ensure `NODE_ENV=test` is set.

### Example

`Counter.jsx`
```tsx
import { overridableHook } from "./overridableHook";

// A normal custom hook:
function useCounterHook(initial: number = 0) {
  const [count, setCount] = React.useState(initial);
  const increment = () => setCount((c) => c + 1);
  return { count, increment };
}
// An overridable version of the hook:
export const [useCounter, CounterProvider] = overridableHook(useCounterHook);

// A component that uses the hook
export const Counter = ({ initial }) => {
  const [ count, increment ] = useCounter(initial);
  return <div>
    Count: {count}
    <button onClick={increment}> Increment </button>
  </div>;
} 
```

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
