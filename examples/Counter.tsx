import React from "react";
import { overridableHook } from "../src/overridableHook";

// A normal custom hook:
export function useCounterHook(initial = 0) {
  const [count, setCount] = React.useState(initial);
  const increment = () => setCount((c) => c + 1);
  return { count, increment };
}

// An overridable version of the hook:
export const [useCounter, CounterProvider] = overridableHook(useCounterHook);

// A component that uses the hook:
export const Counter = ({ initial = 0 }) => {
  const { count, increment } = useCounter(initial);
  return (
    <div>
      Count: {count}
      <button onClick={increment}> Increment </button>
    </div>
  );
};
