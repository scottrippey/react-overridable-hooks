import React from "react";
import { fireEvent, render } from "@testing-library/react";
import { Counter, useCounter } from "./Counter";
import { createHookOverridesProvider } from "../src/overridableHook";

describe("here's how to use createHookOverridesProvider to override the useCounter hook", () => {
  const CounterProvider = createHookOverridesProvider({ useCounter });

  it("should render with the overridden value", () => {
    const increment = jest.fn();
    const result = render(<Counter />, {
      wrapper: (p) => (
        <CounterProvider
          useCounter={() => ({ count: 999, increment })}
          {...p}
        />
      ),
    });

    expect(result.getByText("Count: 999")).toMatchInlineSnapshot(`
      <span>
        Count: 
        999
        <button>
          Increment
        </button>
      </span>
    `);

    fireEvent.click(result.getByText("Increment"));

    expect(increment).toHaveBeenCalled();
  });
});
