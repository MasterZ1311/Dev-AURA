# The Standard of Constructive Code Reviews

> **Difficulty**: Intermediate  
> **Target Outcome**: Review pull requests with rigor and empathy, upholding code quality without blocking progress unnecessarily.

---

## Code Review Principles

Code reviews function as a knowledge transfer and quality control mechanism, not an adversarial gate.

### Prefix Annotations:
- **`[Blocking]`**: Critical logic flaw, security vulnerability, data loss risk.
- **`[Nit]` or `[Non-blocking]`**: Minor naming or style preference; author's discretion to address.
- **`[Question]`**: Seeking clarification on implementation details.
- **`[Praise]`**: Recognizing clean abstractions, elegant solutions, or thorough test coverage.

### Review Comment Comparison:

| Suboptimal (Ambiguous / Dismissive) | Standard (Specific & Actionable) |
| :--- | :--- |
| "This is slow." | `[Blocking]` "Since `userList` can scale to 10k elements, nested `.find()` within `.map()` introduces an $O(N^2)$ traversal. Indexing into a `Map` reduces this to $O(N)$." |
| "Change variable name." | `[Nit]` "Consider renaming this to `isSessionActive` for clarity with existing session handlers." |
| "LGTM" (to a 2,000-line change) | Request scoped breakdown or review in structured stages. |
| (Silent approval on great work) | `[Praise]` "Clean extraction of the reducer logic and thorough edge-case tests." |

---

## Contributor Challenges
- [ ] PR Author response etiquette guide (addressing complex critique professionally).
- [ ] Asynchronous review checklists for distributed teams.
