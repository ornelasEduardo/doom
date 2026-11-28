import React from "react";

import { Card } from "../../../Card/Card";
import { Text } from "../../../Text/Text";

export const DefaultTooltip = (data: any) => {
  if (!data) {
    return null;
  }

  // Handle simple value/label pairs or complex objects
  const label = data.label || data.x || "Value";
  const value = data.value || data.y || "";

  return (
    <Card
      style={{
        padding: "0.5rem 0.75rem",
        minWidth: "7.5rem",
        pointerEvents: "none",
        display: "flex",
        flexDirection: "column",
        gap: "0.25rem",
      }}
    >
      <Text as="p" style={{ color: "var(--muted-foreground)" }} variant="h6">
        {label}
      </Text>
      <Text style={{ fontWeight: 600 }} variant="body">
        {value}
      </Text>
    </Card>
  );
};
