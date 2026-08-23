/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";

describe("Simple Test", () => {
  it("should render", () => {
    render(<div>Hello</div>);
    expect(screen.getByText("Hello")).toBeTruthy();
  });
});
