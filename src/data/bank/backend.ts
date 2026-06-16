import type { Section } from './types.js';

export const backendSection: Section = {
  id: 'backend',
  label: 'Backend',
  icon: '⚙️',
  items: [
    {
      id: 'drupal',
      name: 'Drupal 10',
      desc: 'Core CMS — content modeling, routing, rendering, APIs',
      tag: 'CMS',
      questions: [
        {
          q: 'Explain the Drupal entity system — what is an entity type vs a bundle?',
          level: 'intermediate',
        },
        {
          q: "How does Drupal's routing system work (routes.yml, controllers, access checks)?",
          level: 'intermediate',
        },
        {
          q: 'When should you use a hook vs an event subscriber vs a plugin?',
          level: 'advanced',
        },
        {
          q: 'What is the Drupal service container and how do you inject services?',
          level: 'advanced',
        },
        {
          q: "Explain Drupal's render pipeline from controller to final HTML output.",
          level: 'advanced',
        },
        {
          q: 'What is the difference between config entities and content entities?',
          level: 'novice',
        },
        {
          q: 'How do you build a custom field formatter versus a field widget — when do you need each?',
          level: 'advanced',
        },
        {
          q: 'How do cache contexts, tags, and max-age compose to make a render array both cacheable and correct?',
          level: 'expert',
        },
        { q: 'What is a content type in Drupal?', level: 'novice' },
        { q: 'What is a node?', level: 'novice' },
        {
          q: 'How do you create a field and attach it to a content type?',
          level: 'intermediate',
        },
        {
          q: 'How would you model content for reuse across multiple sites?',
          level: 'expert',
        },
        {
          q: 'How do you design a decoupled/headless Drupal architecture and what are the trade-offs?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'php',
      name: 'PHP 8.3',
      desc: 'Server-side language with typed properties and readonly classes',
      tag: 'Language',
      questions: [
        {
          q: 'What new features in PHP 8.x are most relevant to Drupal development?',
          level: 'intermediate',
        },
        {
          q: 'What are readonly classes and how do they improve data integrity?',
          level: 'expert',
        },
        {
          q: 'How do union types and intersection types improve type safety?',
          level: 'expert',
        },
        {
          q: 'What is the difference between named arguments and regular positional arguments?',
          level: 'novice',
        },
        {
          q: 'How do you use fibers in PHP 8.1+ and when are they applicable?',
          level: 'expert',
        },
        {
          q: 'How do you use constructor property promotion in a Drupal service class?',
          level: 'intermediate',
        },
        {
          q: 'How do PHP 8.1 enums (including backed enums) help model states in Drupal?',
          level: 'advanced',
        },
        {
          q: 'What is the difference between an interface and an abstract class in PHP?',
          level: 'novice',
        },
        {
          q: 'What is type juggling and how does declare(strict_types=1) help?',
          level: 'novice',
        },
        {
          q: 'How do you use traits to share behaviour across classes?',
          level: 'intermediate',
        },
        {
          q: 'How do generators (yield) reduce memory use on large datasets?',
          level: 'advanced',
        },
        {
          q: 'What are PHP 8 attributes and where does Drupal use them?',
          level: 'advanced',
        },
      ],
    },
    {
      id: 'composer',
      name: 'Composer 2',
      desc: 'PHP dependency manager handling Drupal core, modules, patches',
      tag: 'Package Mgr',
      questions: [
        {
          q: 'What is the difference between require and require-dev?',
          level: 'novice',
        },
        {
          q: 'How does cweagans/composer-patches apply patches and what happens on failure?',
          level: 'advanced',
        },
        {
          q: 'What is wikimedia/composer-merge-plugin used for in this project?',
          level: 'novice',
        },
        {
          q: 'How do you handle a Drupal module that is not on packagist?',
          level: 'intermediate',
        },
        {
          q: 'What does --no-dev flag do and when is it used?',
          level: 'novice',
        },
        {
          q: 'How do you resolve a version conflict between two contrib modules requiring incompatible dependencies?',
          level: 'expert',
        },
        {
          q: 'How do you update a single package without updating everything?',
          level: 'intermediate',
        },
        {
          q: 'How do you read and interpret composer.lock?',
          level: 'intermediate',
        },
        {
          q: 'How do version constraints (^, ~, ranges) resolve, and how do you debug a failed resolve?',
          level: 'advanced',
        },
        {
          q: 'How do you set up a local path or VCS repository for a private module?',
          level: 'advanced',
        },
        {
          q: 'How would you split a project into Composer packages/monorepo and manage versions?',
          level: 'expert',
        },
        {
          q: 'How do you audit and remediate supply-chain risk in Composer dependencies?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'drush',
      name: 'Drush 13',
      desc: 'Drupal CLI — cache clear, migrations, updates, SQL operations',
      tag: 'CLI',
      questions: [
        {
          q: 'What are the most common Drush commands you use daily?',
          level: 'novice',
        },
        {
          q: 'How do you run a migration with Drush and check its status?',
          level: 'advanced',
        },
        {
          q: 'How does drush sql:sanitize work and why is it important?',
          level: 'advanced',
        },
        {
          q: 'How do you use Drush aliases to run commands on remote environments?',
          level: 'intermediate',
        },
        {
          q: 'What does drush updatedb do and when should you run it?',
          level: 'advanced',
        },
        {
          q: 'How do you write a custom Drush command with arguments and options?',
          level: 'advanced',
        },
        { q: 'What is Drush?', level: 'novice' },
        { q: 'What does drush cr do?', level: 'novice' },
        {
          q: 'How do you run a one-off snippet with drush php:eval or php:script?',
          level: 'intermediate',
        },
        {
          q: 'How do you export and import config with Drush?',
          level: 'intermediate',
        },
        {
          q: 'How would you script a safe production deploy sequence (updb, cim, cr)?',
          level: 'expert',
        },
        {
          q: 'How do you batch a Drush command over millions of entities without timeouts?',
          level: 'expert',
        },
        {
          q: 'How would you debug a Drush command that works locally but fails on Acquia?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'jsonapi',
      name: 'JSON:API',
      desc: 'Headless API layer with drupal/jsonapi_extras',
      tag: 'API',
      questions: [
        {
          q: "How does Drupal's JSON:API expose entities as resources?",
          level: 'intermediate',
        },
        {
          q: 'How do you filter, sort, and paginate a JSON:API collection request?',
          level: 'intermediate',
        },
        {
          q: 'What are sparse fieldsets and how do you use them for performance?',
          level: 'advanced',
        },
        {
          q: 'How does drupal/jsonapi_extras let you rename or disable resources and fields?',
          level: 'intermediate',
        },
        {
          q: 'How do you handle authentication for JSON:API requests?',
          level: 'advanced',
        },
        {
          q: 'How do you prevent over-fetching and N+1 include explosions on a large JSON:API resource graph?',
          level: 'expert',
        },
        { q: 'What is JSON:API?', level: 'novice' },
        { q: "What is a 'resource' in JSON:API?", level: 'novice' },
        { q: 'What does an include parameter do?', level: 'novice' },
        {
          q: 'How do you secure JSON:API so only intended resources and fields are exposed?',
          level: 'advanced',
        },
        {
          q: 'How would you cache and scale JSON:API for a high-traffic decoupled frontend?',
          level: 'expert',
        },
        {
          q: 'How do you design filtering/pagination to avoid expensive queries on huge collections?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'restapi',
      name: 'REST API',
      desc: 'Drupal REST module with openapi docs',
      tag: 'API',
      questions: [
        {
          q: 'How do you create a custom REST resource plugin in Drupal?',
          level: 'intermediate',
        },
        {
          q: 'What is the difference between GET, POST, PATCH, and DELETE in Drupal REST?',
          level: 'advanced',
        },
        {
          q: 'How does drupal/openapi_rest generate API documentation?',
          level: 'intermediate',
        },
        {
          q: 'How do you configure authentication formats for REST endpoints?',
          level: 'intermediate',
        },
        { q: 'What is REST?', level: 'novice' },
        {
          q: 'How does Drupal core REST differ from JSON:API?',
          level: 'novice',
        },
        { q: 'What is a REST resource endpoint?', level: 'novice' },
        {
          q: 'How do you version a custom REST API in Drupal?',
          level: 'advanced',
        },
        {
          q: 'How do you control serialization/normalization of a complex entity?',
          level: 'advanced',
        },
        {
          q: 'How would you design rate limiting and auth for a public Drupal REST API?',
          level: 'expert',
        },
        {
          q: 'How do you keep backward compatibility as the API evolves?',
          level: 'expert',
        },
        { q: 'How would you contract-test a REST API in CI?', level: 'expert' },
      ],
    },
    {
      id: 'paragraphs',
      name: 'Paragraphs',
      desc: 'Flexible content modeling with revisions',
      tag: 'Content',
      questions: [
        {
          q: 'How do you create a new Paragraph type and attach it to a content type?',
          level: 'intermediate',
        },
        {
          q: 'How do nested paragraphs work and what are the performance implications?',
          level: 'advanced',
        },
        {
          q: 'How does the Paragraphs revision system work?',
          level: 'advanced',
        },
        {
          q: 'How do you theme a Paragraph type using Twig templates?',
          level: 'intermediate',
        },
        {
          q: 'What is drupal/paragraphs_viewmode and when would you use it?',
          level: 'advanced',
        },
        {
          q: 'How do you keep render and query cost bounded when paragraphs are deeply nested?',
          level: 'advanced',
        },
        { q: 'What is a Paragraph in Drupal?', level: 'novice' },
        { q: 'How do Paragraphs differ from a normal field?', level: 'novice' },
        {
          q: 'What is the difference between Paragraphs and blocks?',
          level: 'novice',
        },
        {
          q: 'How do you add a Paragraph reference field to a content type?',
          level: 'intermediate',
        },
        {
          q: 'How would you model a flexible page builder with Paragraphs while keeping editor UX sane?',
          level: 'expert',
        },
        {
          q: 'How do you migrate legacy body HTML into structured Paragraphs?',
          level: 'expert',
        },
        {
          q: 'How would you bound performance for pages with hundreds of nested paragraphs?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'lightning',
      name: 'Lightning Distribution',
      desc: "Acquia's Drupal starter: API, Layout, Media, Workflow sub-profiles",
      tag: 'Profile',
      questions: [
        {
          q: 'What are the four Lightning sub-profiles and what does each provide?',
          level: 'novice',
        },
        {
          q: 'How do you extend a Lightning sub-profile with custom config?',
          level: 'intermediate',
        },
        {
          q: 'How does Lightning Workflow implement content moderation states?',
          level: 'advanced',
        },
        {
          q: 'What is the Lightning Media library and how does it differ from core Media?',
          level: 'intermediate',
        },
        { q: 'What is the Lightning distribution?', level: 'novice' },
        {
          q: 'What is a Drupal distribution or install profile?',
          level: 'novice',
        },
        {
          q: 'How do you install a site from the Lightning profile?',
          level: 'intermediate',
        },
        {
          q: "How do you customise or disable parts of Lightning you don't need?",
          level: 'advanced',
        },
        {
          q: 'How do you keep a Lightning-based site updatable over time?',
          level: 'advanced',
        },
        {
          q: 'How would you migrate off a deprecated distribution onto vanilla core?',
          level: 'expert',
        },
        {
          q: 'How do you reconcile distribution-provided config with your own config management?',
          level: 'expert',
        },
        {
          q: 'What are the long-term maintenance risks of building on a distribution?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'layoutbuilder',
      name: 'Layout Builder',
      desc: 'In-place layout editor with restrictions and styles',
      tag: 'Content',
      questions: [
        {
          q: 'What is the difference between layout overrides and default layouts?',
          level: 'novice',
        },
        {
          q: 'How do drupal/layout_builder_restrictions limit available blocks per section?',
          level: 'advanced',
        },
        {
          q: 'How does drupal/layout_builder_styles add CSS classes to sections and blocks?',
          level: 'intermediate',
        },
        {
          q: 'How does Layout Builder ST (scheduled translations) work?',
          level: 'intermediate',
        },
        {
          q: 'What are the performance considerations when using Layout Builder at scale?',
          level: 'expert',
        },
        {
          q: 'How do you provide custom Layout Builder layouts as plugins with their own Twig templates?',
          level: 'expert',
        },
        { q: 'What is Layout Builder?', level: 'novice' },
        {
          q: 'What is the difference between a section and a block in Layout Builder?',
          level: 'novice',
        },
        {
          q: "How do you enable Layout Builder for a content type's view mode?",
          level: 'intermediate',
        },
        {
          q: 'How do you provide custom inline and reusable blocks to Layout Builder?',
          level: 'advanced',
        },
        {
          q: 'How do you control which blocks and layouts editors can use?',
          level: 'advanced',
        },
        {
          q: 'How would you govern Layout Builder at scale to prevent inconsistent, unmaintainable pages?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'webform',
      name: 'Webform',
      desc: 'Advanced form builder for Drupal',
      tag: 'Module',
      questions: [
        {
          q: 'How do you create a webform handler to process submissions?',
          level: 'intermediate',
        },
        {
          q: 'How do you build a multi-step webform with conditional logic?',
          level: 'intermediate',
        },
        {
          q: 'How do you programmatically alter a webform element?',
          level: 'intermediate',
        },
        {
          q: 'How do you export webform submissions to CSV?',
          level: 'intermediate',
        },
        { q: 'What is the Webform module?', level: 'novice' },
        { q: 'What is a webform element?', level: 'novice' },
        { q: 'What is a webform handler?', level: 'novice' },
        {
          q: 'How do you build conditional #states logic across multiple elements?',
          level: 'advanced',
        },
        {
          q: 'How do you push a submission to an external API via a handler?',
          level: 'advanced',
        },
        {
          q: "How do you theme a webform's markup and confirmation page?",
          level: 'advanced',
        },
        {
          q: 'How would you handle very high submission volume and spam at scale?',
          level: 'expert',
        },
        {
          q: 'How do you manage PII in submissions (encryption, retention, GDPR)?',
          level: 'expert',
        },
        {
          q: 'How would you version and deploy webform config across environments safely?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'searchapi',
      name: 'Search API',
      desc: 'Pluggable search framework for Drupal',
      tag: 'Module',
      questions: [
        {
          q: 'What are the components of a Search API setup (server, index, views)?',
          level: 'novice',
        },
        {
          q: 'What are processors and how do they affect indexing and querying?',
          level: 'advanced',
        },
        {
          q: 'How do you expose a Search API index as a Views data source?',
          level: 'intermediate',
        },
        {
          q: 'How do you configure faceted search with Better Exposed Filters?',
          level: 'advanced',
        },
        {
          q: 'How do you debug why a specific node is missing from a Search API index?',
          level: 'advanced',
        },
        { q: 'What is Search API?', level: 'novice' },
        {
          q: 'What is the difference between a server and an index?',
          level: 'novice',
        },
        {
          q: 'How do you add a field to an index and reindex?',
          level: 'intermediate',
        },
        {
          q: 'How do you expose a Search API index to Views?',
          level: 'intermediate',
        },
        {
          q: 'How would you tune relevance and boosting for a Solr-backed index?',
          level: 'expert',
        },
        {
          q: 'How do you keep an index consistent under heavy content churn?',
          level: 'expert',
        },
        {
          q: 'How would you scale search for multilingual, multi-site content?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'migrate',
      name: 'Migrate (Drupal)',
      desc: 'migrate_plus, migrate_tools, migrate_source_csv',
      tag: 'Module',
      questions: [
        {
          q: 'What are the three mandatory plugin types in a Drupal migration?',
          level: 'novice',
        },
        {
          q: 'How do you write a migration YAML for importing CSV data?',
          level: 'advanced',
        },
        {
          q: 'How do you run migrations incrementally and handle rollbacks?',
          level: 'advanced',
        },
        {
          q: 'What is the migrate_map table and what does it store?',
          level: 'intermediate',
        },
        {
          q: 'How do you handle migrations with entity references between two content types?',
          level: 'advanced',
        },
        {
          q: 'How do you write a custom migrate process plugin and a source plugin for a non-standard API?',
          level: 'expert',
        },
        { q: 'What is the Migrate API used for?', level: 'novice' },
        {
          q: 'What are source, process, and destination plugins?',
          level: 'novice',
        },
        {
          q: 'How do you run and roll back a migration with Drush?',
          level: 'intermediate',
        },
        {
          q: 'How do you map a source field to a destination field?',
          level: 'intermediate',
        },
        {
          q: 'How would you orchestrate dependent migrations with references and run them idempotently?',
          level: 'expert',
        },
        {
          q: 'How do you migrate continuously from a live source without creating duplicates?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'configsplit',
      name: 'Config Split / Ignore',
      desc: 'Per-environment config management',
      tag: 'Config',
      questions: [
        {
          q: 'How does drupal/config_split separate config by environment?',
          level: 'intermediate',
        },
        {
          q: 'How do you activate a config split in settings.php?',
          level: 'intermediate',
        },
        {
          q: 'What is drupal/config_ignore used for and how does it differ from config_split?',
          level: 'intermediate',
        },
        {
          q: 'How do you export and import config with split enabled?',
          level: 'intermediate',
        },
        {
          q: 'What problem does configuration management solve in Drupal?',
          level: 'novice',
        },
        { q: 'What is config_split?', level: 'novice' },
        { q: 'What is config_ignore?', level: 'novice' },
        {
          q: 'How do you set up a dev-only split for modules like devel and kint?',
          level: 'advanced',
        },
        {
          q: 'How do you keep secrets out of exported config?',
          level: 'advanced',
        },
        {
          q: 'How do you handle config that differs per environment (e.g. API endpoints)?',
          level: 'advanced',
        },
        {
          q: 'How would you design a config workflow across many sites sharing a codebase?',
          level: 'expert',
        },
        {
          q: 'How do you resolve config import conflicts during deployment?',
          level: 'expert',
        },
        {
          q: "How would you debug 'active config differs from sync' errors on deploy?",
          level: 'expert',
        },
      ],
    },
    {
      id: 'memcache',
      name: 'Memcache',
      desc: 'Object caching via drupal/memcache',
      tag: 'Performance',
      questions: [
        {
          q: "How is Memcache configured as a cache backend in Drupal's settings.php?",
          level: 'intermediate',
        },
        {
          q: 'What is cache tag invalidation and how does it work with Memcache?',
          level: 'advanced',
        },
        {
          q: 'How does acquia/memcache-settings simplify Memcache configuration on Acquia?',
          level: 'intermediate',
        },
        {
          q: 'When would you NOT use Memcache as a cache bin?',
          level: 'intermediate',
        },
        {
          q: 'How do you avoid cache stampedes and degrade gracefully when Memcache is unavailable?',
          level: 'expert',
        },
        { q: 'What is caching and why does Drupal need it?', level: 'novice' },
        { q: 'What is Memcache?', level: 'novice' },
        {
          q: 'How does Memcache differ from the database cache backend?',
          level: 'novice',
        },
        {
          q: 'How do cache bins map to Memcache and which bins benefit most?',
          level: 'advanced',
        },
        {
          q: 'How do you monitor hit/miss ratios and evictions?',
          level: 'advanced',
        },
        {
          q: 'How would you size and shard Memcache for a high-traffic multisite?',
          level: 'expert',
        },
        {
          q: 'How do you prevent a thundering-herd/stampede on cold caches?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'saml',
      name: 'SimpleSAMLphp / SAML',
      desc: 'SSO via SAML 2.0 — simplesamlphp_auth + miniOrange',
      tag: 'Auth',
      questions: [
        {
          q: 'Explain the SAML 2.0 flow between Identity Provider and Service Provider.',
          level: 'intermediate',
        },
        {
          q: 'How is SimpleSAMLphp installed and symlinked into the Drupal docroot?',
          level: 'intermediate',
        },
        {
          q: 'How do you map IdP attributes to Drupal user fields?',
          level: 'intermediate',
        },
        {
          q: 'What is the difference between SP-initiated and IdP-initiated login?',
          level: 'novice',
        },
        {
          q: 'How do you troubleshoot a SAML authentication failure?',
          level: 'advanced',
        },
        {
          q: 'How do you implement Single Logout (SLO) and keep IdP/Drupal sessions in sync?',
          level: 'advanced',
        },
        { q: 'What is single sign-on (SSO)?', level: 'novice' },
        {
          q: 'What is the difference between an Identity Provider and a Service Provider?',
          level: 'novice',
        },
        {
          q: 'How do you map and transform IdP attributes into Drupal roles?',
          level: 'advanced',
        },
        {
          q: 'How would you support multiple IdPs/federation in one Drupal site?',
          level: 'expert',
        },
        {
          q: 'How do you rotate SAML certificates without downtime?',
          level: 'expert',
        },
        {
          q: 'How would you debug a failing assertion (signature, clock skew, audience)?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'oauth',
      name: 'OAuth 2.0',
      desc: 'Token-based auth via drupal/simple_oauth',
      tag: 'Auth',
      questions: [
        {
          q: 'What OAuth 2.0 grant types does drupal/simple_oauth support?',
          level: 'expert',
        },
        {
          q: 'How do access tokens and refresh tokens differ?',
          level: 'expert',
        },
        {
          q: 'How do you scope an OAuth client to limit API access?',
          level: 'expert',
        },
        {
          q: 'How does the Authorization Code flow work for a browser-based client?',
          level: 'expert',
        },
        {
          q: 'How do you securely store and rotate OAuth client secrets and token-signing keys in Drupal?',
          level: 'expert',
        },
        { q: 'What is OAuth 2.0 at a high level?', level: 'novice' },
        {
          q: 'What is the difference between authentication and authorization?',
          level: 'novice',
        },
        { q: 'What is a bearer token?', level: 'novice' },
        {
          q: 'How do you set up a simple_oauth consumer and issue a token?',
          level: 'intermediate',
        },
        {
          q: 'How do you protect a route so it requires a valid OAuth token?',
          level: 'intermediate',
        },
        {
          q: 'How do you test an OAuth-protected endpoint locally?',
          level: 'intermediate',
        },
        {
          q: 'How do you implement and validate scopes for fine-grained access?',
          level: 'advanced',
        },
        {
          q: 'How do you handle token expiry and refresh in a client?',
          level: 'advanced',
        },
        {
          q: 'How do you revoke tokens and consumers when they are compromised?',
          level: 'advanced',
        },
      ],
    },
    {
      id: 'ckeditor',
      name: 'CKEditor 4',
      desc: 'Rich text editor with custom plugins',
      tag: 'Editor',
      questions: [
        {
          q: 'How do you configure CKEditor toolbars and allowed formats in Drupal?',
          level: 'intermediate',
        },
        {
          q: 'How do you add a custom CKEditor plugin (e.g., autogrow, codemirror) in Drupal?',
          level: 'intermediate',
        },
        {
          q: 'What is the role of text formats and how do they relate to CKEditor configs?',
          level: 'novice',
        },
        {
          q: 'How do you embed a Drupal entity inside CKEditor using drupal/entity_embed?',
          level: 'intermediate',
        },
        {
          q: 'CKEditor 4 is end-of-life — what is your migration path to CKEditor 5 on Drupal 10, including custom plugins?',
          level: 'advanced',
        },
        { q: 'What is a WYSIWYG editor?', level: 'novice' },
        { q: 'What is a text format in Drupal?', level: 'novice' },
        {
          q: 'How do text formats and filters provide XSS protection?',
          level: 'advanced',
        },
        {
          q: 'How do you build a custom CKEditor plugin or toolbar button?',
          level: 'advanced',
        },
        {
          q: 'How would you migrate CKEditor 4 configs and custom plugins to CKEditor 5?',
          level: 'expert',
        },
        {
          q: 'How do you prevent markup/XSS issues while allowing rich editing?',
          level: 'expert',
        },
        {
          q: 'How would you provide safe structured embeds (media, entities) in the editor?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'pathauto',
      name: 'Pathauto / Redirect',
      desc: 'Automatic URL alias generation and redirect management',
      tag: 'Module',
      questions: [
        {
          q: 'How do you create a custom Pathauto pattern for a content type?',
          level: 'intermediate',
        },
        {
          q: 'How does Pathauto handle token replacement in path patterns?',
          level: 'intermediate',
        },
        {
          q: 'How do you programmatically create a redirect in Drupal?',
          level: 'intermediate',
        },
        {
          q: 'How do you bulk update aliases after changing a Pathauto pattern?',
          level: 'intermediate',
        },
        { q: 'What is a URL alias?', level: 'novice' },
        { q: 'What is Pathauto?', level: 'novice' },
        { q: 'What is the Redirect module for?', level: 'novice' },
        {
          q: 'How do you bulk-regenerate aliases after changing a pattern?',
          level: 'advanced',
        },
        {
          q: 'How do you avoid alias collisions across content types and languages?',
          level: 'advanced',
        },
        {
          q: 'How do you preserve old URLs with redirects when patterns change?',
          level: 'advanced',
        },
        {
          q: 'How would you manage aliases and redirects across a multilingual multisite at scale?',
          level: 'expert',
        },
        {
          q: 'How do you prevent redirect loops and long redirect chains?',
          level: 'expert',
        },
        {
          q: 'How would you migrate legacy URLs with 301s without harming SEO?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'metatag',
      name: 'Metatag / Schema.org',
      desc: 'SEO — meta tags, Open Graph, structured data',
      tag: 'SEO',
      questions: [
        {
          q: 'How do you configure default meta tags for a content type?',
          level: 'intermediate',
        },
        {
          q: 'How does drupal/schema_metatag generate structured data (JSON-LD)?',
          level: 'intermediate',
        },
        {
          q: 'How do you add a custom meta tag type as a plugin?',
          level: 'intermediate',
        },
        {
          q: 'How do you test that Open Graph tags render correctly?',
          level: 'intermediate',
        },
        {
          q: 'How do you set per-entity meta tags that override the content-type defaults?',
          level: 'intermediate',
        },
        { q: 'What is a meta tag?', level: 'novice' },
        { q: 'What is Open Graph?', level: 'novice' },
        { q: 'What is structured data (Schema.org)?', level: 'novice' },
        {
          q: 'How do you set defaults per content type and override them per entity?',
          level: 'advanced',
        },
        {
          q: 'How do you output JSON-LD with schema_metatag?',
          level: 'advanced',
        },
        { q: 'How do you use tokens inside meta tags?', level: 'advanced' },
        {
          q: 'How would you manage SEO metadata consistently across many sites and brands?',
          level: 'expert',
        },
        {
          q: 'How do you validate structured data and Open Graph at scale?',
          level: 'expert',
        },
        {
          q: 'How would you avoid duplicate or conflicting meta tags from multiple modules?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'tmgmt',
      name: 'TMGMT + XTM',
      desc: 'Translation management with XTM connector',
      tag: 'i18n',
      questions: [
        {
          q: 'What is a TMGMT job and how does content flow from source to translated?',
          level: 'novice',
        },
        {
          q: 'How do you configure the XTM provider plugin?',
          level: 'intermediate',
        },
        {
          q: "How does TMGMT interact with Drupal's Content Translation module?",
          level: 'intermediate',
        },
        {
          q: 'How do you handle translation of entity references?',
          level: 'intermediate',
        },
        { q: 'What is translation management?', level: 'novice' },
        { q: 'What is a translation provider in TMGMT?', level: 'novice' },
        {
          q: 'How do you configure a continuous translation workflow with a provider like XTM?',
          level: 'advanced',
        },
        {
          q: 'How do you handle translation of referenced entities and paragraphs?',
          level: 'advanced',
        },
        {
          q: 'How do you review and accept translations before publishing?',
          level: 'advanced',
        },
        {
          q: 'How would you scale translation across dozens of languages and sites?',
          level: 'expert',
        },
        {
          q: 'How do you keep source and translations in sync as content changes?',
          level: 'expert',
        },
        {
          q: 'How would you debug missing or partial translations in the pipeline?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'encrypt',
      name: 'Encryption (Key / Real AES)',
      desc: 'Field-level encryption via drupal/encrypt + real_aes',
      tag: 'Security',
      questions: [
        {
          q: 'How do you encrypt a field value using drupal/encrypt?',
          level: 'intermediate',
        },
        {
          q: 'What key providers does drupal/key support and which is appropriate for Acquia?',
          level: 'expert',
        },
        {
          q: 'What is the difference between drupal/real_aes and other encryption methods?',
          level: 'novice',
        },
        {
          q: 'How do you rotate encryption keys without losing existing data?',
          level: 'expert',
        },
        { q: 'What is encryption at rest?', level: 'novice' },
        {
          q: 'Why encrypt specific fields rather than the whole database?',
          level: 'novice',
        },
        {
          q: 'How do you set up an encryption profile in Drupal?',
          level: 'intermediate',
        },
        {
          q: 'How do you choose an appropriate key provider?',
          level: 'intermediate',
        },
        {
          q: 'How do you encrypt a field and accept the loss of search/sort on it?',
          level: 'advanced',
        },
        {
          q: 'How does key management integrate with Acquia or an external secret store?',
          level: 'advanced',
        },
        {
          q: 'What are the performance impacts of field-level encryption?',
          level: 'advanced',
        },
        {
          q: 'How would you rotate keys and re-encrypt existing data without downtime?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'symfony',
      name: 'Symfony Components',
      desc: 'Expression language, mailer, and PSR layers',
      tag: 'Framework',
      questions: [
        {
          q: 'Which Symfony components does Drupal 10 use under the hood?',
          level: 'advanced',
        },
        {
          q: "How does Symfony's dependency injection container work in Drupal?",
          level: 'advanced',
        },
        {
          q: 'What is the Symfony event dispatcher and how does Drupal use it?',
          level: 'advanced',
        },
        {
          q: 'How do you use symfony/expression-language in Drupal config (e.g., Rules)?',
          level: 'expert',
        },
        {
          q: 'How would you override or extend a core Drupal service using a decorator or service provider?',
          level: 'advanced',
        },
        { q: 'What is Symfony and how does Drupal use it?', level: 'novice' },
        { q: 'What is the service container?', level: 'novice' },
        { q: 'What is dependency injection?', level: 'novice' },
        {
          q: 'How do you define a service in a *.services.yml file?',
          level: 'intermediate',
        },
        {
          q: 'How do you subscribe to an event with an event subscriber?',
          level: 'intermediate',
        },
        {
          q: 'How do you inject a core service into your own class?',
          level: 'intermediate',
        },
        {
          q: 'How would you replace a core service with a decorator and what are the risks?',
          level: 'expert',
        },
        {
          q: 'How do you debug the compiled container and service instantiation problems?',
          level: 'expert',
        },
      ],
    },
  ],
};
