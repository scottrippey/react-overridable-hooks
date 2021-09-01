import React, { Component } from "react";
import { action } from "@storybook/addon-actions";
import { Counter, useCounter } from "./Counter";
import { createHookOverridesProvider } from "../src/overridableHook";

export default { title: "Counter Example" };

const increment = action("increment");

const CounterProvider = createHookOverridesProvider({ useCounter });

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
      <CounterProvider useCounter={(initial) => ({ count: 99, increment })}>
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

const EmptyProvider = createHookOverridesProvider({});
export const UsingHelp = () => (
  <>
    <p>
      When the `help` property is used, missing overrides will throw an error:
      <ShowErrors>
        <EmptyProvider help>
          <br />
          <Counter /> Renders an error!
        </EmptyProvider>
      </ShowErrors>
      <ShowErrors>
        <CounterProvider help>
          <br />
          <Counter /> Renders an error!
        </CounterProvider>
      </ShowErrors>
    </p>
  </>
);

const CounterProviderWithDefaults = createHookOverridesProvider(
  { useCounter },
  { defaults: { useCounter: () => ({ count: 99, increment }) } }
);
export const UsingDefaults = () => (
  <>
    <CounterProviderWithDefaults>
      <br />
      <Counter /> Renders "Count: 99"
    </CounterProviderWithDefaults>
  </>
);

class ShowErrors extends Component {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return <pre>{this.state.error.stack}</pre>;
    }
    return <>{this.props.children}</>;
  }
}
