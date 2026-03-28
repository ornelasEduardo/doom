#!/bin/bash
# Reads PreToolUse input from stdin.
# If a doom component file is being edited, outputs a reminder to keep the skill doc in sync.

INPUT=$(cat)

FILE=$(echo "$INPUT" | python3 -c "
import json, sys
try:
    d = json.load(sys.stdin)
    print(d.get('file_path') or d.get('path') or '')
except Exception:
    print('')
" 2>/dev/null || echo "")

if [[ "$FILE" =~ components/([A-Z][^/]+)/.*\.(tsx|scss|ts)$ ]]; then
  COMPONENT="${BASH_REMATCH[1]}"
  COMPONENT_LOWER=$(echo "$COMPONENT" | tr '[:upper:]' '[:lower:]')
  SKILL_DOC=".agents/skills/doom-design-system/components/${COMPONENT_LOWER}.md"

  if [ -f "$SKILL_DOC" ]; then
    echo "doom-sync: editing $COMPONENT — after making changes, verify $SKILL_DOC is still accurate. Update the props table, usage examples, or notes if the component API changed."
  else
    echo "doom-sync: editing $COMPONENT — no skill doc found at $SKILL_DOC. Create it after finishing your changes (follow the format of any existing component doc)."
  fi
fi
