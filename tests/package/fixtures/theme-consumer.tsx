import { Button, DesignSystemProvider, ThemeScope } from "doom-design-system";
import { defineTheme } from "doom-design-system/theme";
import { captainTheme } from "doom-design-system/themes";

const custom = defineTheme({
  name: "consumer",
  extends: captainTheme,
  components: {
    Button: { variants: { primary: { label: { fontWeight: 600 } } } },
  },
});

export const valid = (
  <DesignSystemProvider theme={custom}>
    <ThemeScope overrides={{ roles: { brand: "green" } }}>
      <Button classNames={{ label: "consumer-label" }}>Buy</Button>
    </ThemeScope>
  </DesignSystemProvider>
);

// @ts-expect-error Core token names are fixed.
defineTheme({ name: "invalid", roles: { bordre: "red" } });
defineTheme({
  name: "invalid",
  // @ts-expect-error Unknown Button part.
  components: { Button: { parts: { mislabeled: { color: "green" } } } },
});
export const conflicting = (
  // @ts-expect-error Scope takes an explicit theme or inherited overrides.
  <ThemeScope overrides={{}} theme={custom}>
    Invalid
  </ThemeScope>
);
export const conflictingProvider = (
  // @ts-expect-error Object and legacy providers have mutually exclusive props.
  <DesignSystemProvider initialTheme="captain" theme={custom}>
    Invalid
  </DesignSystemProvider>
);
