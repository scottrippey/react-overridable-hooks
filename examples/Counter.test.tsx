import React from "react";
import { fireEvent, render } from "@testing-library/react";
import { Counter, useCounter } from "./Counter";
import { createOverridesProvider } from "../src/new/overridableHook";

describe("here's how to use createOverridesProvider to override the useCounter hook", () => {
  const CounterProvider = createOverridesProvider({ useCounter });

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
      <div>
        Count: 
        999
        <button>
           Increment 
        </button>
      </div>
    `);

    fireEvent.click(result.getByText("Increment"));

    expect(increment).toHaveBeenCalled();
  });
});
