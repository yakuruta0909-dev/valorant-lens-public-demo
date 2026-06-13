# \# AGENTS.md

# 

# \## Goal

# 

# Build a VALORANT post-match analysis application.

# 

# Priority:

# 1\. MVP completion

# 2\. Riot compliance

# 3\. Stability

# 4\. New features

# 

# \## Rules

# 

# \- One phase at a time.

# \- Avoid unrelated refactors.

# \- Do not rewrite completed systems.

# \- Prefer extending existing architecture.

# 

# \## Riot Compliance

# 

# \- No live overlay.

# \- No in-match assistance.

# \- No real-time recommendations.

# \- No MMR estimation.

# \- No ELO estimation.

# \- No hidden rating estimation.

# \- No true rank estimation.

# \- No rank prediction.

# 

# \## Performance Indicator

# 

# PI is only a post-match self-performance indicator.

# 

# Other player information may only use

# VALORANT ranks visible after the match.

# 

# Never calculate hidden skill values.

# 

# \## Development

# 

# \- Mock before real API.

# \- Reuse existing storage.

# \- Reuse existing DataSource architecture.

# \- Run npm.cmd run build before reporting.

# 

# \## Reporting

# 

# Always report:

# 

# \- changed files

# \- storage changes

# \- build result

# \- next phase suggestion

