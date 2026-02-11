## 2024-05-23 - Link Component Security and UX
**Learning:** Users often manually add `target="_blank"` to Links without realizing they need `rel="noopener noreferrer"` for security (reverse tabnabbing).
**Action:** The Link component now dynamically enforces `rel="noopener noreferrer"` whenever `target="_blank"` is detected (either via `isExternal` prop or manual `target` prop), merging it with any user-provided `rel` values. This protects users by default without requiring them to remember security headers.
