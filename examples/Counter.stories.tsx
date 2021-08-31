import React from "react";
import { action } from "@storybook/addon-actions";
import { Counter, useCounter } from "./Counter";
import { createOverridesProvider } from "../src/new/overridableHook";

export default { title: "Counter Example" };

const increment = action("increment");

const CounterProvider = createOverridesProvider({ useCounter });

export const NormalBehavior = () => (
  <>
    <p>
      The `useCounter` hook behaves normally when no Provider is used:
      <br />
      <Counter /> Renders "Count: 0"
      <br />
      <Counter initial={10} /> Renders "Count: 10"
    </p>
    <p>
      or when no Override is provided:
      <CounterProvider>
        <br />
        <Counter /> Renders "Count: 0"
      </CounterProvider>
    </p>
  </>
);

export const WithOverrides = () => (
  <>
    <p>
      We can override the hook with a mock:
      <CounterProvider useCounter={() => ({ count: 99, increment })}>
        <br />
        <Counter /> Renders "Count: 99"
        <br />
        <Counter initial={10} /> Renders "Count: 99"
      </CounterProvider>
    </p>
    <p>
      no matter how deep the hook is nested:
      <CounterProvider useCounter={() => ({ count: 99, increment })}>
        <br />
        <NestedCounter /> Renders "Count: 99"
      </CounterProvider>
    </p>
  </>
);

function NestedCounter() {
  return <Counter />;
}
