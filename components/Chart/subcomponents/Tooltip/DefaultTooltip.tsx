import React from "react";

import { Card } from "../../../Card/Card";
import { Text } from "../../../Text/Text";

export const DefaultTooltip = (data: any) => {
  if (!data) return null;

  // Handle simple value/label pairs or complex objects
  const label = data.label || data.x || "Value";
  const value = data.value || data.y || "";

  return (
    <Card style={{ padding: "8px 12px", minWidth: 120, pointerEvents: "none" }}>
      <Text
        style={{ marginBottom: 4, color: "var(--text-secondary)" }}
        variant="h6"
      >
        {label}
      </Text>
      <Text variant="body" style={{ fontWeight: 600 }}>
        {value}
      </Text>
    </Card>
  );
};
