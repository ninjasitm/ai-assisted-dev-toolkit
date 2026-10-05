const assert = require('node:assert/strict');
const { readFileSync, readdirSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');

// Explicit pre-migration fixtures, shared by the identical repo/monorepo agents.
// Body expectations include every newline and the existing snippet reference.
const fixtures = {
  'admin-portal': [
    'Admin Portal Specialist',
    'Build administrator portals with RBAC, system dashboards, reporting, analytics, and operational tooling.',
    'Build administrator portals with RBAC, system dashboards, reporting, analytics, and operational tooling. Specializes in admin frameworks and monitoring ecosystem tools.',
  ],
  'api-specialist': [
    'API Specialist',
    'Design and implement API architecture, documentation, and developer experience.',
    'Design and implement API architecture, documentation, and developer experience. Use for REST design, GraphQL, OpenAPI specs, SDK generation, API versioning, and integration patterns.',
  ],
  'backend-architect': [
    'Backend Architect',
    'Design APIs, databases, and server-side architecture.',
    'Design APIs, databases, and server-side architecture. Use for scalable backend systems, data modeling, caching strategies, system design, and infrastructure decisions.',
  ],
  documenter: [
    'Documenter',
    'Analyze codebases and create comprehensive documentation.',
    'Analyze codebases and create comprehensive documentation. Use for AGENTS.md, README files, API docs, architecture documentation, and onboarding guides.',
  ],
  'feature-builder': [
    'Feature Builder — Coordinator',
    'Coordinate end-to-end feature development using subagents for planning, implementation, and review.',
    'Coordinate end-to-end feature development using subagents for planning, implementation, and review. Orchestrates the full development lifecycle.',
  ],
  'frontend-developer': [
    'Frontend Developer',
    'Build user interfaces, implement components, handle state management, and optimize frontend performance.',
    'Build user interfaces, implement components, handle state management, and optimize frontend performance. Use for responsive, accessible, and performant web applications.',
  ],
  green: [
    'Green Agent (TDD — Make Tests Pass)',
    'Write minimal code to make failing tests pass. Part of the TDD red-green-refactor cycle.',
  ],
  implementer: [
    'Implementer Agent',
    'Implement code changes for a specific task. Follow TDD, write tests alongside code, and self-review before reporting completion.',
  ],
  planner: [
    'Planner Agent',
    'Break down feature requests into implementation tasks. Read specifications, analyze codebase patterns, and produce structured plans with dependencies.',
  ],
  red: [
    'Red Agent (TDD — Write Failing Tests)',
    'Write failing tests that define expected behavior. Part of the TDD red-green-refactor cycle.',
  ],
  refactor: [
    'Refactor Agent (TDD — Improve Code Quality)',
    'Improve code quality and structure while keeping all tests passing. Part of the TDD red-green-refactor cycle.',
  ],
  researcher: [
    'Researcher Agent',
    'Research codebase patterns, dependencies, and technical context. Analyze code structure, find relevant examples, and report findings without making changes.',
  ],
  reviewer: [
    'Reviewer Agent',
    'Review code changes for correctness, code quality, security, and adherence to project patterns.',
    'Review code changes for correctness, code quality, security, and adherence to project patterns. Provide actionable feedback with specific file and line references. Use immediately after writing or modifying code, or as a quality gate in orchestrated workflows.',
  ],
  tdd: [
    'TDD Coordinator Agent',
    'Implement a feature using test-driven development with red-green-refactor cycle.',
    'Implement a feature using test-driven development with red-green-refactor cycle. Coordinates specialized subagents for writing failing tests, implementing code, and refactoring.',
  ],
};

for (const layout of ['repo', 'monorepo']) {
  const directory = path.join(__dirname, '..', 'src', layout, '.opencode', 'agents');

  test(`${layout}: exact native agent inventory`, () => {
    assert.deepEqual(readdirSync(directory).sort(), Object.keys(fixtures).map(name => `${name}.md`).sort());
  });

  for (const [name, [title, summary, description = summary]] of Object.entries(fixtures)) {
    test(`${layout}: ${name} preserves instructions and native V2 settings`, () => {
      const source = readFileSync(path.join(directory, `${name}.md`), 'utf8');
      const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(source);
      assert.ok(match, 'agent must have Markdown YAML frontmatter');

      const coordinator = name === 'feature-builder' || name === 'tdd';
      const readOnly = name === 'researcher' || name === 'reviewer';
      const rules = [
        ['edit', readOnly ? 'deny' : 'allow'],
        ['shell', name === 'researcher' ? 'deny' : 'allow'],
      ];
      if (coordinator) rules.push(['subagent', 'allow']);

      // Exact YAML expectations validate nesting, ordered native rules, and the
      // absence of legacy fields or added model/security settings without a parser.
      const frontmatter = [
        `description: ${JSON.stringify(description)}`,
        'mode: subagent',
        'request:',
        '  body:',
        `    temperature: ${coordinator ? '0.3' : '0.1'}`,
        'permissions:',
        ...rules.flatMap(([action, effect]) => [
          `  - action: ${action}`,
          '    resource: "*"',
          `    effect: ${effect}`,
        ]),
      ].join('\n');
      assert.equal(match[1], frontmatter);
      const body = `\n# ${title}\n\n${summary}\n\n@.claude/agents-snippets/${name}.md\n`;
      assert.deepEqual(Buffer.from(match[2]), Buffer.from(body), 'Markdown body must remain byte-for-byte unchanged');
    });
  }
}
