# `react-overridable-hooks`

An easy way to mock a custom React hook.  Especially useful for:
- Mocking state in Storybook
- Unit testing

```sh
npm install --save react-overridable-hooks
```

# `overridableHook`

Creates an overridable version of a hook.  

```tsx
import { overridableHook } from "react-overridable-hooks";

// A normal custom hook:
function useCounterHook() {
  const [ count, setCount ] = React.useState(0);
  const increment = () => setCount((c) => c + 1);
  return { count, increment };
}

// An overridable version of the hook:
export const [ useCounter, CounterOverride ] = overridableHook(useCounterHook);

// A component uses the hook normally:
export const Counter = () => {
  const { count, increment } = useCounter();
  return <div>
    Count: {count}
    <button onClick={increment}> Increment </button>
  </div>;
}
```

We can mock the hook's value in **Storybook**:
```jsx
export const NormalCounter = () => (
  <Counter /> // renders "Count: 0"
);
export const WithBigValue = () => (
  <CounterOverride value={{ count: 999, increment: action('increment') }}>
    <Counter /> <!-- renders "Count: 999" -->
  </CounterOverride>
);
```

We can mock the hook's value in **Unit Tests**:
```jsx
describe('Counter', () => {
  it("should show the count", () => {
    const state = { count: 99, increment: jest.fn() };
    const wrapper = ({ children }) => (
      <CounterOverride value={value}>{children}</CounterOverride>
    );
    
    render(<Counter />, { wrapper })
    
    expect(screen.getByText("Count: 99")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Increment"));
    expect(state.increment).toHaveBeenCalledTimes(1)
  });
});
```

# `testableHook`
```jsx
import { testableHook } from 'react-overridable-hooks';

export const [ useCounter, CounterOverride ] = testableHook(useCounterHook);
```

Same syntax as `overridableHook`, but hooks are only overridable when:  
- `NODE_ENV=test` or  
- `TESTABLE_HOOKS_ENABLED=true`

This means:

- Hooks **cannot** be overridden in **development** or **production**.
- Hooks **must** be overridden in **tests**

This ensures zero-performance overhead in production (because `useCounter === useCounterHook`) while still making your components testable.

To use this with Storybook, be sure to enable testable hooks in your `package.json` like:

```json
{
  "scripts": {
    "storybook": "TESTABLE_HOOKS_ENABLED=true storybook"
  }
}
```

## More Examples
- Storybook Examples: [./examples/Counter.stories.tsx](./examples/Counter.stories.tsx)
- Unit Test Examples: [./examples/Counter.test.tsx](./examples/Counter.test.tsx)
