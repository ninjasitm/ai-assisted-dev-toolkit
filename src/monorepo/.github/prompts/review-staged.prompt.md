---
model: gpt-5-codex
---

Review the current staged files and provide a detailed code review based on the following criteria:

1. **Changed files**

   - For each change identify the context and reason for the modification.
   - Summarize any potential issues or improvements related to the changes.

2. **Code Quality & Best Practices**

   - Adherence to [Language/Framework] coding conventions.
   - Use of clear and descriptive variable/function names.
   - Modularity and separation of concerns.
   - Absence of code smells (e.g., duplicate code, long methods).

3. **Potential Issues**

   - Identification of potential bugs or edge cases.
   - Security vulnerabilities.
   - Performance bottlenecks.

4. **Suggested Improvements**
   - Provide actionable suggestions for improvement with explanations.

**Output Format**

- Concise summary of review findings.
- Inline comments for specific code suggestions.
- Categorize findings by severity (e.g., Critical, High Priority, Medium Priority).
- Table or checklist of PR comments with resolution plans with a 99.9% confidence level that the resolutions will be effective.
