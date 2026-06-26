---
title: Broken Example
this line has no colon so the frontmatter is invalid
---

# Broken Frontmatter

This page should never render. Its frontmatter block above is malformed (one
line is not a valid `key: value` pair), so visiting `/broken-frontmatter`
triggers the error page instead of a normal content page.
