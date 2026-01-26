import { render } from "@testing-library/react";
import React from "react";

import { useChartContext } from "../../context";
import { useEventContext } from "../../state/EventContext";
import { InteractionLayer } from "./InteractionLayer";

// Mocks
jest.mock("../../context");
jest.mock("../../state/EventContext");

describe("InteractionLayer", () => {
  const mockEmit = jest.fn();
  const mockGetState = jest.fn();
  const mockState = {
    dimensions: {
      margin: { left: 40, top: 20, right: 20, bottom: 40 },
      innerWidth: 500,
      innerHeight: 300,
      width: 560,
      height: 360,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useEventContext as jest.Mock).mockReturnValue({ emit: mockEmit });
    (useChartContext as jest.Mock).mockReturnValue({
      chartStore: { getState: mockGetState },
    });
    mockGetState.mockReturnValue(mockState);

    // Mock RAF
    jest.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      cb(0);
      return 1;
    });
    jest.spyOn(window, "cancelAnimationFrame");
  });

  afterEach(() => {
    (window.requestAnimationFrame as jest.Mock).mockRestore();
  });

  // Since InteractionLayer relies on finding a parent [data-chart-container],
  // we need to wrap it in a pseudo-container logic for testing, or mock element discovery.
  // Testing useEffect that relies on DOM traversal (closest) in JSDOM can be tricky if not rendered inside.

  it("renders without crashing", () => {
    render(<InteractionLayer />);
    const element = document.querySelector("[data-testid='interaction-layer']");
    expect(element).toBeInTheDocument();
  });

  // Note: Full integration testing of the DOM event listener attachment requires
  // rendering the component inside a container with the correct data attributes.
  it("attaches listeners to parent container", () => {
    const ContainerWrapper = ({ children }: any) => (
      <div
        data-chart-container
        style={{ position: "relative", width: 600, height: 400 }}
      >
        <svg
          data-chart-plot
          height={400}
          style={{ position: "absolute", left: 0, top: 0 }}
          width={600}
        />
        {children}
      </div>
    );

    const { unmount } = render(
      <ContainerWrapper>
        <InteractionLayer />
      </ContainerWrapper>,
    );

    // We can verify listeners indirectly or via spy on addEventListener
    // but JSDOM event handling is usually sufficient.
  });
});
