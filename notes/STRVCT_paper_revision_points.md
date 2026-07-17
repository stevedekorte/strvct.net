# STRVCT Paper — Revision Points

Handoff notes for revising *Closing the Usability Gap in Naked Objects*. Each item says **what to change**, **where**, and—where relevant—**a caveat to keep** (objections the paper should preempt rather than ignore). Several items revise existing content, not just add to it.

---

## A. Bibliography and related work (the meta-reviewer's core complaint)

1. **Fix the reference list.** Many works cited in prose are missing from References (Norman 1988; Gentner & Stevens 1983; Nielsen 1994 and 2006; Pernice 2017; Wertheimer 1923; Koffka 1935; UsiXML; shadcn, MUI, Ant Design; Retool, Appsmith, OutSystems). Add proper entries for every in-text citation. The thin bibliography was the explicit reason given for the borderline review.

2. **Engage the automatic-/model-based-UI-generation literature.** §9 currently jumps from naked objects to IFML/UsiXML and component frameworks. Add and distinguish from model-based UI development (MBUID) and adaptive UI generation—most importantly **SUPPLE (Gajos & Weld)**, which automatically generates usable interfaces and directly pressure-tests the "narrow design space" hypothesis. Reviewers said novelty can't be assessed without this comparison; the conceptual-novelty claims (narrow space, the primitive set) are exactly the ones that only hold relative to prior art.

3. **Relate to concept design / legible-software work.** Cite and distinguish from Daniel Jackson's concept design (*The Essence of Software*, 2021) and Meng & Jackson, "What You See Is What It Does" (Onward! 2025). It is adjacent "structure-first / legibility" work and the nearest neighbor in the same venue; positioning against it strengthens the novelty story.

---

## B. The narrow-design-space argument — tighten and make honest

4. **Acknowledge the partial circularity.** §3 scopes out dashboards, canvases, games, timelines, then declares the remainder narrow. State plainly that "narrow" is partly true-by-construction, and argue why the scoped-in class is still large and important rather than letting the framing do the work silently. Pre-empting this is stronger than having a reviewer raise it.

5. **Separate two distinct claims that the paper currently conflates:**
   - *Coverage claim* (well-supported): most informational UIs decompose into tiles / stacks / master-detail. Measure this by **screens or domain classes**.
   - *Preference claim* (the headline, weaker): uniform generation is **preferable**, not merely sufficient. This leans on a **value** measure, not a count, and is currently unmeasured.
   State which claim each passage is making. Don't let "tiny % of UI code" silently stand in for "tiny % of UI value."

6. **Add the "residue: product vs periphery" framing.** The honest test for any non-conforming surface is not "does a residue exist" (it always does) but "is the residue the product or the periphery?" Consumer apps often put disproportionate value in a few non-conforming surfaces (feed ranking, editor canvas, map, charts) even when those are a small fraction of screen count. The navigation *shell* is master-detail almost everywhere; the differentiator is often the custom view. Use this to bound the claim precisely.

7. **Use the "you can't do everything with X" analogy and rebut it.** The mouse won by owning the bulk-of-value tasks while ceding a permanent residue (text entry, shortcuts). "Not universal" was wrongly deployed as "not valuable." Frame Strvct the same way—and note the symmetric honest limit: "you can't do everything with X" *is* decisive when the part X can't do is the whole point (e.g., a competitive-programming editor). So the question is always residue-as-product vs residue-as-periphery.

8. **Strengthen the Miller Columns story (§4.4 and related work).** Recursive, orientation-flexible, auto-collapsing master-detail is now dominant on phone/watch/small-screen UIs—often a single column at a time, which is literally the paper's narrow-viewport collapse behavior. Small viewports *enforce* the narrowness rather than designers choosing it. This is real-world evidence for the thesis decades before the paper, and it sharpens the contribution: not discovering the pattern (NeXTSTEP had it) but making it recursive, orientation-flexible, and the *generated default*.

---

## C. Case study updates (§8)

9. **Update the custom-view count.** The chat view is no longer custom—it has been generalized into the framework. Revise the table and the "3 custom views" figure accordingly. Chat was always the borderline case (a message list + header/footer input ≈ master-detail-plus-footer); the genuinely graphical residue is the 3D dice roller and the battle map.

10. **Describe the generalization pipeline explicitly, and own what it implies.** The workflow is: write a custom view → recognize the general pattern → promote it into the framework. This reframes "custom view count" as a **pipeline-stage metric** (how much hasn't been generalized *yet*), not a fixed residue. State honestly that this makes "3 of ~90" partly a function of developer effort/skill (reinforcing the existing single-developer caveat), and that it makes the narrow-space hypothesis benignly self-fulfilling—the residue grinds down toward a graphical floor (WebGL/canvas) almost regardless of where the "true" boundary is. The open empirical question to name: is there a hard floor well above zero, or does it keep shrinking?

---

## D. Adoption vs coverage (Discussion / §10)

11. **Make the central distinction explicit: coverage was never the binding constraint—switch cost is.** The pointer analogy is strong on coverage but the paper's headline is really an *adoption* claim. The mouse had a near-zero relearning tax; Strvct's is not zero (giving up the React ecosystem, component-library commons, per-screen control). "Most UIs fit the patterns" can be fully true and still not yield pointer-style adoption.

12. **Position the LLM/economic argument as the decisive lever.** It is the first force that changes the *adoption* math rather than the *coverage* math: as development becomes agent-mediated, the bespoke-UI path must also expose, document, and keep-in-sync a tool surface per mutable type (cost grows with the model and rots against it), while a derived architecture pays it once. Reframe the value proposition from "consistent UIs + lower view maintenance" (resistible) to "natively agent-operable and stays that way for free" (hard for React+bespoke to match without converging on the same architecture).

13. **Add a candid account of non-technical resistance.** Some bespoke UI variation is motivational—status/signaling, not user-goal-driven ("your simpler design doesn't look as *impressive*"). A uniform generated UI removes the canvas on which sophistication is performed, which is simultaneously a feature (kills inconsistency) and a source of social resistance. Predict **uneven adoption**: viable where buyer and user are aligned and the UI isn't graded as a craft object (internal tools, line-of-business, solo-developer products); hard in design-led consumer orgs and agencies. Keep the honest counter: sometimes elaborate design is a real experiment, and structurally forbidding it forbids the occasional real discovery—but argue that's the minority case.

14. **Frame status-quo deference carefully (optional, Discussion).** Distinguish Chesterton's-fence humility (epistemic; satisfiable by finding the reason) from relearning-resistance (motivational; unfalsifiable, hides behind the fence). The "existence implies fitness" intuition is only valid when the selection loop measured the right thing (user goals) rather than familiarity/status. Keep balanced: a convention's existence is *weak* evidence of merit—not zero. (Use lightly; this is context, not a core contribution.)

---

## E. Runtime AI operability and extensibility (strengthen §7.1; likely a new subsection)

15. **Sharpen the AI claim from "AI-legible" to "AI-operable *within the runtime*."** Static schema export (fetch schema, submit patch) only lowers the cost of bolting an assistant on. The stronger, distinguishing claim: the agent operates the **live object graph** through the same validation, notification, and sync pathways a human uses—so there is no separate AI surface that can drift out of sync. This is the eliminate-the-translation-layer thesis applied a second time (model↔agent, mirroring model↔view). Make this symmetry explicit.

16. **Add AI-*extensibility* as a distinct, larger claim.** Because every layer reads from slot annotations rather than hand-authored per-type code, an agent can **add new model objects at runtime** that are immediately full citizens—views, persistence, sync, i18n, and their own AI-operable surface—with no build step and no human wiring. Creation and operation close into a single loop. Distinguish clearly from operability: operability moves within a fixed type space; extensibility enlarges the space of what the app *is*. Frame as "write the model, get the app" → "the running app writes its own model."

17. **State the safety boundary honestly.** Operating within declared types treats the type system as a fixed contract; minting types lets the agent mint the contract. Pose the design problem this creates: a **declared, immutable floor**—a core of types/invariants the runtime AI can build *on* but not *alter*—so self-extension is unbounded in the application layer while the trust-establishing layer stays fixed. Note the annotation bridge is the natural seam to draw that line.

---

## F. Security as an architectural consequence (new §7 subsection; this is a strong, under-claimed point)

18. **Lead with the strongest, non-obvious point: naked objects eliminates a trust boundary, not just code.** View/UI code is the least confinable surface in the browser (DOM access, origin authority, the home of XSS/injection). Model objects confine cleanly; views can't be sandboxed the same way because touching the DOM is their job. Deriving views from trusted framework code means an untrusted party (an agent, a plugin) supplies **data + metadata, never DOM-touching code or a script context**—so "extending the UI" becomes *model*, confinable by the same mechanisms as everything else. The layer naked objects eliminates wasn't just a maintenance cost; it was an attack surface.

19. **Specify the isolation + authority primitives for runtime-created model objects.** Two distinct primitives for two distinct problems:
    - **Web workers = isolation**: new model code runs with no ambient DOM/graph/persistence access except via an explicit channel.
    - **Capabilities = authority**: new objects get exactly the references granted, not the ambient authority of their creator.
    Reframe the "immutable floor" from item 17 as **the set of capabilities the runtime declines to grant**—a cleaner invariant than enumerating forbidden actions. Note that slot metadata is already halfway to a capability descriptor (who may read/write/persist/AI-operate a slot), so the annotation bridge is where authority can be expressed declaratively.

20. **Keep two security caveats so the claim survives review:**
    - **Coverage-bounded protection.** The guarantee is only as wide as the derivation reaches. The moment a genuine custom view is needed (the WebGL/canvas residue), DOM-touching code returns and the hole reopens. The win is *shrinking the surface to that residue*, not closing it.
    - **Concentrated trust root.** The framework's rendering path becomes the single thing everyone trusts; it must treat all model-supplied data as hostile and rigorously output-encode (no unescaped string reaching `innerHTML`, no slot value silently interpreted as a URL or handler). Frame the upside as the recurring structural advantage: **auditable once, centrally** vs. auditable per-component, forever. This is the line to lead with for a security reviewer—not "no UI code is safer" in the abstract, but "the trust boundary is now a single narrow declarative chokepoint we can verify."
    - Be candid that capability discipline is hard to retrofit: it leaks the moment any existing API assumes ambient authority. Present the path as clear (known primitives, declarative seam, understood failure modes), not as solved.

---

## Suggested structural outcome

- **§3**: add the circularity acknowledgment (4), the two-claims split (5), residue-as-product-vs-periphery (6), and the pointer analogy (7).
- **§4.4 / §9**: strengthen Miller Columns with the small-screen vindication (8); expand related work with MBUID/SUPPLE (2) and concept design (3); fix references (1).
- **§7**: sharpen 7.1 into operability-within-runtime (15); add AI-extensibility (16) and the immutable-floor problem (17); add a security subsection (18–20).
- **§8**: update the case study table and narrative (9, 10).
- **§10**: add adoption-vs-coverage (11), the LLM lever as decisive (12), and the candid resistance account (13); optionally the Chesterton's-fence framing (14).
