import type { Section } from './types.js';

export const aiSection: Section = {
  id: 'ai',
  label: 'AI & Tooling',
  icon: '🤖',
  items: [
    {
      id: 'claude-code',
      name: 'Claude / Claude Code',
      desc: 'Anthropic AI assistant and agentic CLI for the codebase',
      tag: 'AI Assistant',
      questions: [
        {
          q: 'What is Claude Code and how does it differ from using Claude in a chat interface?',
          level: 'novice',
        },
        {
          q: 'How do you install and authenticate Claude Code in a project?',
          level: 'intermediate',
        },
        {
          q: 'What is the difference between Claude Opus, Sonnet, and Haiku and when do you choose each?',
          level: 'novice',
        },
        {
          q: 'How does Claude Code read and navigate a codebase — what does it index?',
          level: 'intermediate',
        },
        {
          q: 'What are the main Claude Code CLI commands (ask, run, review, etc.)?',
          level: 'novice',
        },
        {
          q: 'How do you give Claude Code access to run shell commands safely in a project?',
          level: 'advanced',
        },
        {
          q: "How do you scope Claude Code's file and shell access and review its changes before committing?",
          level: 'advanced',
        },
        {
          q: 'How do you give Claude Code project context via CLAUDE.md and guides?',
          level: 'intermediate',
        },
        {
          q: "How do you review and constrain Claude Code's edits before merging?",
          level: 'advanced',
        },
        {
          q: 'How would you integrate an agentic CLI into CI for review/refactors safely?',
          level: 'expert',
        },
        {
          q: 'How do you prevent prompt-injection from repository content affecting an agent?',
          level: 'expert',
        },
        {
          q: 'How would you measure the ROI and quality of agentic coding on a team?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'claude-md',
      name: 'CLAUDE.md',
      desc: 'Project-level AI execution guide and task classifier',
      tag: 'AI Config',
      questions: [
        {
          q: 'What is CLAUDE.md and why does the project use it instead of inline prompts?',
          level: 'novice',
        },
        {
          q: 'How does the task classifier in CLAUDE.md route different request types to different guides?',
          level: 'intermediate',
        },
        {
          q: 'What are the CRITICAL RULES section and why are they ordered at the top?',
          level: 'novice',
        },
        {
          q: 'How do GUIDE IMPORTS work — what guides exist and what do they cover?',
          level: 'intermediate',
        },
        {
          q: "How does the Complexity Guide (Simple / Medium / High) change Claude's behavior?",
          level: 'advanced',
        },
        {
          q: 'How would you update CLAUDE.md when a new technology or pattern is added to the project?',
          level: 'advanced',
        },
        {
          q: 'What belongs in CLAUDE.md versus an imported guide, and how do you keep it concise?',
          level: 'intermediate',
        },
        { q: 'What is CLAUDE.md?', level: 'novice' },
        {
          q: 'How does a task classifier in CLAUDE.md route different requests?',
          level: 'advanced',
        },
        {
          q: 'How would you keep CLAUDE.md from bloating while staying useful?',
          level: 'expert',
        },
        {
          q: 'How do you test that CLAUDE.md actually changes model behaviour?',
          level: 'expert',
        },
        {
          q: 'How would you structure guide imports for a large multi-team repo?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'claude-hooks',
      name: 'Claude Hooks',
      desc: 'SessionStart / PreToolUse automation in .claude/settings.json',
      tag: 'AI Config',
      questions: [
        {
          q: 'What hook types does Claude Code support (SessionStart, PreToolUse, PostToolUse)?',
          level: 'intermediate',
        },
        {
          q: 'What does the SessionStart hook do in this project (loading .env variables)?',
          level: 'novice',
        },
        {
          q: 'How does the PreToolUse hook on Edit|Write work and what does protect-files.sh check?',
          level: 'intermediate',
        },
        {
          q: 'How do you write a hook command that returns a systemMessage to Claude?',
          level: 'intermediate',
        },
        {
          q: 'What is the difference between a hook returning an error vs blocking tool use?',
          level: 'novice',
        },
        {
          q: 'How do you debug a hook that is silently failing?',
          level: 'advanced',
        },
        { q: 'What is a Claude Code hook?', level: 'novice' },
        {
          q: 'How does a PreToolUse hook block or allow an action?',
          level: 'advanced',
        },
        {
          q: 'How do you load environment variables on session start via a hook?',
          level: 'advanced',
        },
        {
          q: 'How would you design hooks that protect sensitive files from agent edits?',
          level: 'expert',
        },
        { q: 'How do you debug a hook that silently fails?', level: 'expert' },
        {
          q: 'How would you audit everything an agent did during a session?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'mcp-protocol',
      name: 'Model Context Protocol (MCP)',
      desc: 'Open standard for connecting AI assistants to tools and data',
      tag: 'Protocol',
      questions: [
        {
          q: 'What problem does MCP solve compared to one-off API integrations per AI tool?',
          level: 'intermediate',
        },
        {
          q: 'What are the three MCP primitives: Tools, Resources, and Prompts?',
          level: 'novice',
        },
        {
          q: 'What transport modes does MCP support (stdio, HTTP/SSE, Streamable HTTP)?',
          level: 'intermediate',
        },
        {
          q: 'How does an MCP client (Claude Code) discover and call tools exposed by a server?',
          level: 'intermediate',
        },
        {
          q: 'How does authentication work for remote MCP servers (Authorization header, tokens)?',
          level: 'intermediate',
        },
        {
          q: 'What is the MCP SDK (@modelcontextprotocol/sdk) and how do you define a tool with it?',
          level: 'advanced',
        },
        {
          q: 'How do you secure an MCP server exposed to an AI client (auth, least-privilege tools, auditing)?',
          level: 'expert',
        },
        { q: 'What is the Model Context Protocol?', level: 'novice' },
        {
          q: 'What problem does MCP solve versus bespoke per-tool integrations?',
          level: 'novice',
        },
        {
          q: "How does an MCP client discover and call a server's tools?",
          level: 'advanced',
        },
        {
          q: 'What transports does MCP support and when do you use each?',
          level: 'advanced',
        },
        {
          q: 'How would you secure a remote MCP server (auth, least privilege, audit)?',
          level: 'expert',
        },
        {
          q: 'How do you stop a malicious tool or result from manipulating the model?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'mcp-ds',
      name: 'Custom DS Component MCP',
      desc: 'emulsify-compound MCP server for AI component discovery',
      tag: 'MCP Server',
      questions: [
        {
          q: 'What tools does the emulsify-compound MCP server expose (search, get, list)?',
          level: 'intermediate',
        },
        {
          q: 'How is the component registry (registry.json) structured and consumed by the MCP?',
          level: 'intermediate',
        },
        {
          q: 'How do you start the MCP server — stdio mode vs HTTP mode?',
          level: 'intermediate',
        },
        {
          q: 'How does the fuzzy-match search algorithm in the MCP server work?',
          level: 'intermediate',
        },
        {
          q: 'How would you add a new tool (e.g., list-deprecated) to the existing MCP server?',
          level: 'intermediate',
        },
        {
          q: 'How is the MCP server registered in .mcp.json so Claude Code auto-connects to it?',
          level: 'advanced',
        },
        {
          q: 'How do you version the component registry so the MCP keeps returning accurate results after refactors?',
          level: 'advanced',
        },
        { q: 'What is a custom MCP server?', level: 'novice' },
        { q: 'What does the component-registry MCP expose?', level: 'novice' },
        { q: 'What is the registry.json file?', level: 'novice' },
        {
          q: 'How do you run the server in stdio versus HTTP mode?',
          level: 'advanced',
        },
        {
          q: 'How would you version the registry so results stay accurate after refactors?',
          level: 'expert',
        },
        {
          q: 'How do you secure and rate-limit a shared MCP server?',
          level: 'expert',
        },
        {
          q: 'How would you test and monitor an MCP server in production?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'mcp-context7',
      name: 'Context7 MCP',
      desc: 'Remote MCP providing up-to-date library documentation',
      tag: 'MCP Server',
      questions: [
        {
          q: "What does Context7 MCP provide that Claude's training data cannot?",
          level: 'novice',
        },
        {
          q: 'How is Context7 configured in .mcp.json (URL, auth token, headers)?',
          level: 'intermediate',
        },
        {
          q: 'How do you use Context7 inside a Claude Code session to look up a specific library version?',
          level: 'intermediate',
        },
        {
          q: 'What are the security considerations of sending code queries to an external MCP endpoint?',
          level: 'expert',
        },
        { q: 'What does Context7 provide?', level: 'novice' },
        { q: "Why use it over the model's training data?", level: 'novice' },
        {
          q: 'How do you configure Context7 in .mcp.json?',
          level: 'intermediate',
        },
        {
          q: 'How do you look up a specific library version during a session?',
          level: 'advanced',
        },
        {
          q: 'How do you handle stale or wrong docs from the source?',
          level: 'advanced',
        },
        {
          q: 'How do you limit what queries are sent to an external service?',
          level: 'advanced',
        },
        {
          q: 'What are the security and privacy implications of an external docs MCP?',
          level: 'expert',
        },
        {
          q: 'How would you self-host an equivalent for proprietary code?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'mcp-figma',
      name: 'Figma MCP',
      desc: 'Figma integration allowing AI to read design files directly',
      tag: 'MCP Server',
      questions: [
        {
          q: 'What does the Figma MCP allow Claude to do with a Figma file URL?',
          level: 'novice',
        },
        {
          q: 'How is the Figma MCP token scoped and kept secure?',
          level: 'intermediate',
        },
        {
          q: 'How would you use the Figma MCP to extract design token values directly into code?',
          level: 'intermediate',
        },
        {
          q: 'What are the rate-limit and privacy considerations when using the Figma MCP?',
          level: 'expert',
        },
        { q: 'What does the Figma MCP let an AI do?', level: 'novice' },
        { q: 'What is a Figma access token?', level: 'novice' },
        {
          q: 'How do you point the Figma MCP at a specific file or frame?',
          level: 'intermediate',
        },
        {
          q: 'How do you extract token values from Figma into code via the MCP?',
          level: 'advanced',
        },
        {
          q: 'How do you keep the token scoped and secure?',
          level: 'advanced',
        },
        {
          q: 'How do you handle rate limits when reading large files?',
          level: 'advanced',
        },
        {
          q: 'What are the privacy implications of sending design data to an MCP?',
          level: 'expert',
        },
        {
          q: 'How would you automate design-to-code sync safely in CI?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'mcp-jira',
      name: 'Jira MCP (Atlassian)',
      desc: 'Atlassian MCP for reading and creating Jira issues via AI',
      tag: 'MCP Server',
      questions: [
        {
          q: 'What Jira actions does the Atlassian MCP expose (search, get issue, create, comment)?',
          level: 'intermediate',
        },
        {
          q: 'How is the Atlassian MCP authenticated using a Bearer token from the environment?',
          level: 'intermediate',
        },
        {
          q: 'How would you ask Claude to create a Jira subtask from a code review comment?',
          level: 'intermediate',
        },
        {
          q: 'How do you scope the Atlassian MCP to a specific Jira project to avoid accidental writes?',
          level: 'expert',
        },
        { q: 'What is Jira?', level: 'novice' },
        { q: 'What is the Atlassian MCP?', level: 'novice' },
        { q: 'What actions does it expose?', level: 'novice' },
        {
          q: 'How do you authenticate the MCP with a scoped token?',
          level: 'advanced',
        },
        {
          q: 'How do you create a Jira issue from a code-review finding?',
          level: 'advanced',
        },
        {
          q: 'How do you restrict the MCP to one project to avoid accidental writes?',
          level: 'advanced',
        },
        {
          q: 'How would you stop an agent from making unintended bulk changes in Jira?',
          level: 'expert',
        },
        {
          q: 'How do you audit agent-initiated Jira actions?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'codemie',
      name: 'Codemie (EPAM)',
      desc: 'EPAM AI code assistant platform backed by Claude models',
      tag: 'AI Platform',
      questions: [
        {
          q: 'What is Codemie and how does it differ from using the Anthropic API directly?',
          level: 'novice',
        },
        {
          q: 'Which Claude models are configured for Codemie in this project (Sonnet, Haiku, Opus)?',
          level: 'intermediate',
        },
        {
          q: 'What is the "ai-run-sso" provider and how does SSO authentication flow work?',
          level: 'intermediate',
        },
        {
          q: 'How does the Codemie project ID tie into usage tracking and billing?',
          level: 'intermediate',
        },
        {
          q: 'How do you switch between Codemie profiles (e.g., different models per environment)?',
          level: 'intermediate',
        },
        {
          q: 'What are the data residency and privacy implications of routing requests through Codemie?',
          level: 'expert',
        },
        { q: 'What is Codemie?', level: 'novice' },
        {
          q: 'How does Codemie relate to the underlying Claude models?',
          level: 'novice',
        },
        {
          q: 'How does SSO authentication flow work for Codemie?',
          level: 'advanced',
        },
        {
          q: 'How do you switch models or profiles per environment?',
          level: 'advanced',
        },
        {
          q: 'How does the project ID tie into usage tracking and billing?',
          level: 'advanced',
        },
        {
          q: 'What are the data-residency and privacy implications of routing through Codemie?',
          level: 'expert',
        },
        {
          q: 'How would you fall back if Codemie is unavailable?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'codemie-guides',
      name: 'Codemie Architecture Guides',
      desc: '.codemie/guides — architecture, development, and testing patterns for AI',
      tag: 'AI Config',
      questions: [
        {
          q: 'What is the purpose of the .codemie/guides directory vs CLAUDE.md?',
          level: 'novice',
        },
        {
          q: 'What does the architecture guide cover that Claude should always read first?',
          level: 'novice',
        },
        {
          q: 'How does the component-patterns guide define Twig/SCSS/JS conventions for AI output?',
          level: 'intermediate',
        },
        {
          q: 'How does the drupal-integration guide help AI correctly map components to Drupal structures?',
          level: 'intermediate',
        },
        {
          q: 'How do you update a guide when a new pattern is established in the project?',
          level: 'intermediate',
        },
        {
          q: 'How do AI guides reduce hallucination and enforce project-specific constraints?',
          level: 'expert',
        },
        { q: 'What are the .codemie/guides?', level: 'novice' },
        { q: 'How do the guides differ from CLAUDE.md?', level: 'advanced' },
        {
          q: 'How does an architecture guide steer AI output?',
          level: 'advanced',
        },
        {
          q: 'How do you update a guide when a new pattern emerges?',
          level: 'advanced',
        },
        {
          q: 'How would you keep guides authoritative and prevent drift from the codebase?',
          level: 'expert',
        },
        {
          q: 'How do guides reduce hallucination and enforce project constraints?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'prompt-engineering',
      name: 'Prompt Engineering',
      desc: 'Structured prompting, context management, and AI workflow patterns',
      tag: 'AI Practices',
      questions: [
        {
          q: 'What makes a good prompt for a code-generation task vs a debugging task?',
          level: 'advanced',
        },
        {
          q: 'How do you provide sufficient context to Claude without exceeding the context window?',
          level: 'intermediate',
        },
        {
          q: 'What is the difference between zero-shot, few-shot, and chain-of-thought prompting?',
          level: 'novice',
        },
        {
          q: 'How does the CLAUDE.md task classifier act as a meta-prompt to improve consistency?',
          level: 'intermediate',
        },
        {
          q: 'How do you write a prompt that enforces BEM naming and atomic design conventions?',
          level: 'intermediate',
        },
        {
          q: "What strategies help when Claude generates code that doesn't match the project's patterns?",
          level: 'advanced',
        },
        {
          q: 'How do you constrain generated code to project patterns using examples and explicit acceptance criteria?',
          level: 'advanced',
        },
        { q: 'What is a prompt?', level: 'novice' },
        {
          q: 'What is the difference between zero-shot and few-shot prompting?',
          level: 'novice',
        },
        {
          q: 'How would you design prompts that reliably enforce architecture and coding standards?',
          level: 'expert',
        },
        {
          q: 'How do you manage the context window for large-codebase tasks?',
          level: 'expert',
        },
        {
          q: 'How would you evaluate and iterate on prompt quality systematically?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'ai-workflow',
      name: 'AI Development Workflow',
      desc: 'Day-to-day practices for AI-assisted Drupal/DS development',
      tag: 'AI Practices',
      questions: [
        {
          q: 'How do you use Claude Code to scaffold a new Emulsify component end-to-end?',
          level: 'advanced',
        },
        {
          q: 'How do you review AI-generated Twig/SCSS for security and correctness before committing?',
          level: 'intermediate',
        },
        {
          q: "How do you handle a situation where Claude's suggestion conflicts with Drupal coding standards?",
          level: 'intermediate',
        },
        {
          q: 'What tasks in this project are good candidates for AI automation vs requiring human judgment?',
          level: 'intermediate',
        },
        {
          q: 'How do you use the Component Registry MCP to ask Claude "does a button component already exist"?',
          level: 'intermediate',
        },
        {
          q: 'How do you keep AI-generated code consistent with the design token system?',
          level: 'advanced',
        },
        {
          q: 'How do you measure whether AI assistance improves throughput and quality without weakening review rigor?',
          level: 'expert',
        },
        {
          q: 'What does AI-assisted development look like day to day?',
          level: 'novice',
        },
        {
          q: 'Where is AI most and least useful in a Drupal workflow?',
          level: 'novice',
        },
        {
          q: 'What should a human always review in AI output?',
          level: 'novice',
        },
        {
          q: 'How do you scaffold a component end-to-end with AI and then verify it?',
          level: 'advanced',
        },
        {
          q: "How would you measure AI's impact on throughput and quality without weakening review?",
          level: 'expert',
        },
        {
          q: 'How do you prevent over-reliance and skill erosion on a team?',
          level: 'expert',
        },
      ],
    },
  ],
};
