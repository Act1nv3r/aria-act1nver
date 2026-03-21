# ArIA by Actinver — Technical Solution Files

## How to use these files

1. In your project root, create the Cursor folders:
   ```
   mkdir -p .cursor/rules .context/prompts
   ```

2. Copy the files:
   ```
   cp cursor-rules/cursorrules.md .cursor/rules/
   cp context/*.md .context/
   cp context/prompts/*.md .context/prompts/
   ```

3. Open Cursor IDE. It will automatically read .cursor/rules/cursorrules.md

4. To execute a sprint, open the corresponding prompt file,
   copy its FULL content, and paste it in Cursor Agent Mode.

## File Map

```
cursor-rules/
  cursorrules.md          <- Main rules file (Cursor reads this automatically)

context/
  context.md              <- Business context (products, users, formulas)
  architecture.md         <- System architecture (diagrams, ADRs, security layers)
  conventions.md          <- Code conventions (naming, git, API, patterns)
  codebase-map.md         <- Complete file tree (~120 files with descriptions)
  security.md             <- Security policies (OWASP, Mexican regulations)
  testing-strategy.md     <- Testing pyramid (unit, integration, E2E, security)
  development-flow.md     <- Dev workflow (plan, code, test, review, deploy)
  sprint-plan.md          <- Index of all 27 prompts

  prompts/
    prompt-01.md          <- Sprint 0: Setup + Design System + 14 UI components + Login
    prompt-02.md          <- Sprint 1: Zustand store + Stepper + Layout
    prompt-03.md          <- Sprint 1: 6 diagnostic forms (RHF + Zod + InfoBoxes)
    prompt-04.md          <- Sprint 1: Dashboard + navigation
    prompt-05.md          <- Sprint 2: 6 calculation engines (TypeScript)
    prompt-06.md          <- Sprint 2: 12 interactive charts (Recharts)
    prompt-07.md          <- Sprint 2: Connect outputs to flow (real-time recalc)
    prompt-08.md          <- Sprint 3: Scenario simulator (5 sliders)
    prompt-09.md          <- Sprint 3: Results view + 5 recommendations
    prompt-10.md          <- Sprint 3: Client-side PDF + success screen
    prompt-11.md          <- Sprint 4: Voice capture (Deepgram STT streaming)
    prompt-12.md          <- Sprint 4: Claude Haiku NLU + Suggestion Pills
    prompt-13.md          <- Sprint 5A: Couple mode (dual layout + ownership)
    prompt-14.md          <- Sprint 5A: Household consolidation + triple results
    prompt-15.md          <- Sprint 5B: Financial Wrapped (7 PNG cards + ZIP)
    --- DEMO CHECKPOINT (Week 6) ---
    prompt-16.md          <- Sprint 6: Backend FastAPI + PostgreSQL + Docker
    prompt-17.md          <- Sprint 6-7: Auth JWT RS256 + CRUD with RLS
    prompt-18.md          <- Sprint 7: Diagnostic endpoints + Python engines
    prompt-19.md          <- Sprint 7: Connect frontend to real backend
    prompt-20.md          <- Sprint 7-8: Server PDFs (WeasyPrint) + Voice backend
    prompt-21.md          <- Sprint 8: Security tests + CI/CD pipeline
    prompt-22.md          <- Sprint 8-9: Simulator backend + scenarios
    prompt-23.md          <- Sprint 9: Admin panel
    prompt-24.md          <- Sprint 9-10: Client readonly view
    prompt-25.md          <- Sprint 10: Wrapped backend + referral tracking
    prompt-26.md          <- Sprint 10: Responsive + Performance + Accessibility
    prompt-27.md          <- Sprint 10: Production deploy (Hetzner + Cloudflare)
```
