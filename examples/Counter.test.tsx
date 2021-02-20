import React from "react";
import { render, fireEvent } from "@testing-library/react";
import { Counter, CounterProvider } from "./Counter";

describe("testableHook", () => {
  describe("Counter", () => {
    it("should render with the overridden value", () => {
      const increment = jest.fn();
      const result = render(<Counter />, {
        wrapper: (p) => (
          <CounterProvider value={{ count: 999, increment }} {...p} />
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
});
