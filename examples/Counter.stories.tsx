import React from "react";
import { action } from "@storybook/addon-actions";
import { Counter, CounterProvider } from "./Counter";

export default { title: "Counter Example" };

const increment = action("increment");

export const WithStaticValue = (
  <>
    We can provide a static value:
    <CounterProvider value={{ count: 99, increment }}>
      <Counter /> Renders "Count: 99"
    </CounterProvider>
  </>
);

export const WithDynamicValue = (
  <>
    or a dynamic value:
    <CounterProvider
      value={(initial = 0) => ({ count: initial * 1000, increment })}
    >
      <Counter initial={5} /> Renders "Count: 5000"
      <Counter initial={6} /> Renders "Count: 6000"
    </CounterProvider>
  </>
);

export const WithNoValue = (
  <>
    or even no value (uses actual hook):
    <Counter /> Renders "Count: 0"
    <CounterProvider>
      <Counter /> Renders "Count: 0"
    </CounterProvider>
  </>
);
