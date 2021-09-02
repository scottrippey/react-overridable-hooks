# `react-overridable-hooks`

An easy way to mock custom React hooks. Especially useful for:

- Mocking a component's UI state or data in Storybook
- Mocking state for Unit testing
- Overriding hooks depending on context

```sh
npm install --save react-overridable-hooks
```

# Guide

Please see [GUIDE.md](./GUIDE.md) to see how to use `testableHook` to create **testable**, **mockable** components.


# API

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [`overridableHook` and `testableHook`](#overridablehook-and-testablehook)
- [`createHookOverridesProvider`](#createhookoverridesprovider)
  - [Using `defaults`](#using-defaults)
  - [Using `help` mode](#using-help-mode)
- [More Examples](#more-examples)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## `overridableHook` and `testableHook`

Creates an overridable version of a hook.

```tsx
// Counter.jsx
import { overridableHook } from "react-overridable-hooks";

// A custom hook, wrapped so it can be overridden
export const useCounter = overridableHook(() => {
  const [ count, setCount ] = React.useState(0);
  const increment = () => setCount((c) => c + 1);
  return { count, increment };
});

// A component uses the hook normally:
export const Counter = () => {
  const { count, increment } = useCounter();
  return <div>
    Count: {count}
    <button onClick={increment}> Increment</button>
  </div>;
}
```

The `overridableHook` and `testableHook` signatures are identical.  
The only difference is that a `testableHook` is only overridable when the following environment variables are set:

- `NODE_ENV=test` (the default for Jest)
- `STORYBOOK=true` (the default for Storybook)
- `TESTABLE_HOOKS_ENABLED=true` (manually set by you)

Otherwise, the original function is simply returned.
This means:

- These hooks are overridable in **unit tests** and **Storybook**.
- These hooks **cannot** be overridden in **development** or **production**.
- Therefore, there is **zero** performance overhead in production!

## `createHookOverridesProvider`

An overridable hook behaves normally, until we override it using a `HookOverrides` provider that we create
using `createHookOverridesProvider`.

For example, we can mock the hook's value in **Storybook**:

```jsx
// Counter.stories.jsx
import { createHookOverridesProvider } from 'react-overridable-hooks';
import { useCounter } from './Counter';

const HookOverrides = createHookOverridesProvider({ useCounter })

export const NormalCounter = () => (
  <Counter/> // renders "Count: 0"
);

export const WithBigValue = () => (
  <HookOverrides useCounter={() => ({ count: 999, increment: action('increment') })}>
    <Counter/> <!-- renders "Count: 999" -->
  </HookOverrides>
);
```

And we can mock the hook's value in **Unit Tests**:

```jsx
// Counter.test.jsx
describe('Counter', () => {
  const HookOverrides = createHookOverridesProvider({ useCounter })
  it("should show the count", () => {
    const mockState = { count: 99, increment: jest.fn() };
    const wrapper = ({ children }) => (
      <HookOverrides useCounter={() => mockState}>{children}</HookOverrides>
    );

    render(<Counter/>, { wrapper })

    expect(screen.getByText("Count: 99")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Increment"));
    expect(state.increment).toHaveBeenCalledTimes(1)
  });
});
```

### Using `defaults`
You can specify default overrides to `createHookOverridesProvider`:

```jsx
const HookOverrides = createHookOverridesProvider(
  { useCounter },
  { defaults: { useCounter: () => ({ count: 999, increment: action('increment')}) } }
);
```
You can then use the provider without specifying the override each time:
```jsx
export const WithDefaults = () => (
  <HookOverrides>
    <Counter /> <!-- renders "Count: 999" -->
  </HookOverrides>
)
```

### Using `help` mode

When rendering components, it can sometimes be tricky to determine what overridable hooks can be overridden.  Enabling the `help` property will help you identify all overridable hooks that are being rendered.

```jsx
export const WithDefaults = () => (
  <HookOverrides help>
    <Counter /> <!-- Logs react-overridable-hooks: register "useCounter" by adding it to createOverridesProvider({  }) -->
  </HookOverrides>
)
```

The `help` option will log all these missing hooks to the console, making it easy to configure things correctly.

## More Examples

- Storybook Examples: [./examples/Counter.stories.tsx](./examples/Counter.stories.tsx)
- Unit Test Examples: [./examples/Counter.test.tsx](./examples/Counter.test.tsx)
