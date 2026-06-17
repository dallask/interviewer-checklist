import type { Section } from './types.js';

export const environmentSection: Section = {
  id: 'environment',
  label: 'Dev Environment',
  icon: '🐳',
  items: [
    {
      id: 'ddev',
      name: 'DDEV',
      desc: 'Docker-based local dev — Nginx-FPM, MariaDB, PHP 8.3',
      tag: 'Local Dev',
      questions: [
        {
          q: 'What are the main DDEV commands used daily (start, stop, exec, ssh, logs)?',
          level: 'novice',
        },
        {
          q: 'How do you add a custom service (e.g., Redis) to a DDEV project via docker-compose override?',
          level: 'advanced',
        },
        {
          q: 'How does DDEV handle wildcard hostnames for multisite?',
          level: 'advanced',
        },
        {
          q: 'How do you increase PHP memory or timeout limits in DDEV?',
          level: 'advanced',
        },
        {
          q: 'How does ddev auth ssh work for Acquia access?',
          level: 'advanced',
        },
        {
          q: 'How do you add a custom command and a post-start hook in .ddev/config.yaml?',
          level: 'advanced',
        },
        {
          q: 'How do you debug a DDEV networking or TLS-certificate issue when the site will not resolve?',
          level: 'expert',
        },
        { q: 'What is DDEV?', level: 'novice' },
        { q: 'What does ddev start do?', level: 'novice' },
        { q: 'How do you import a database into DDEV?', level: 'intermediate' },
        {
          q: 'How do you run drush and composer inside DDEV?',
          level: 'intermediate',
        },
        {
          q: 'How do you change PHP or database versions in DDEV?',
          level: 'intermediate',
        },
        {
          q: 'How would you standardise DDEV config across a team and CI?',
          level: 'expert',
        },
        {
          q: 'How do you add and wire a custom service (Redis/Solr) and persist its data?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'docker',
      name: 'Docker',
      desc: 'Container runtime underlying DDEV',
      tag: 'Infrastructure',
      questions: [
        {
          q: 'What is the difference between an image and a container?',
          level: 'novice',
        },
        {
          q: 'How does docker-compose.yaml differ from docker-compose.override.yaml in DDEV?',
          level: 'advanced',
        },
        {
          q: 'How do you read logs from a running DDEV container?',
          level: 'intermediate',
        },
        {
          q: 'When would you write a custom web-build Dockerfile in DDEV?',
          level: 'intermediate',
        },
        {
          q: 'How do you exec into a running container and inspect its environment variables?',
          level: 'intermediate',
        },
        { q: 'What is a container?', level: 'novice' },
        {
          q: 'How do you reduce image size with multi-stage builds and layer caching?',
          level: 'advanced',
        },
        {
          q: 'How do bind mounts and named volumes differ, and when do you use each?',
          level: 'advanced',
        },
        {
          q: 'How would you debug a container that exits immediately on startup?',
          level: 'expert',
        },
        {
          q: 'How do you manage secrets in containers without baking them into images?',
          level: 'expert',
        },
        {
          q: 'How would you design a reproducible local-and-CI environment with Compose?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'nginx',
      name: 'Nginx-FPM',
      desc: 'Web server configured in DDEV',
      tag: 'Web Server',
      questions: [
        {
          q: 'What is FastCGI and how does Nginx-FPM work together?',
          level: 'intermediate',
        },
        {
          q: 'How do you configure a custom Nginx location block in DDEV?',
          level: 'intermediate',
        },
        {
          q: 'What Drupal-specific Nginx directives are important for performance?',
          level: 'advanced',
        },
        { q: 'What is a web server?', level: 'novice' },
        { q: 'What role does Nginx play in a Drupal stack?', level: 'novice' },
        { q: 'What is FastCGI / PHP-FPM?', level: 'novice' },
        {
          q: 'How do you serve static files efficiently in Nginx?',
          level: 'intermediate',
        },
        {
          q: 'How do you write rewrite rules for Drupal clean URLs?',
          level: 'advanced',
        },
        {
          q: 'How do you configure caching headers and gzip/brotli?',
          level: 'advanced',
        },
        {
          q: 'How would you tune Nginx and PHP-FPM worker/pool sizing under load?',
          level: 'expert',
        },
        {
          q: 'How do you debug 502/504 errors between Nginx and FPM?',
          level: 'expert',
        },
        {
          q: 'How would you add rate limiting and basic WAF rules in Nginx?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'mariadb',
      name: 'MariaDB 10.11',
      desc: 'Relational database in local dev and on Acquia',
      tag: 'Database',
      questions: [
        {
          q: 'How do you import and export a database in DDEV?',
          level: 'intermediate',
        },
        {
          q: 'What are the key differences between MariaDB and MySQL relevant to Drupal?',
          level: 'novice',
        },
        {
          q: 'How do you run a slow query log in DDEV for performance debugging?',
          level: 'advanced',
        },
        {
          q: 'What is the DDEV db service connection info (host, port, credentials)?',
          level: 'novice',
        },
        {
          q: 'How do you read an EXPLAIN plan to diagnose a slow Drupal query?',
          level: 'advanced',
        },
        { q: 'What is a relational database?', level: 'novice' },
        {
          q: 'How do you connect to the DDEV database from an external client?',
          level: 'intermediate',
        },
        {
          q: 'How do you back up and restore a MariaDB database?',
          level: 'intermediate',
        },
        {
          q: 'How do you add an index and verify it is actually used?',
          level: 'advanced',
        },
        {
          q: 'How would you diagnose and fix a deadlock or lock contention?',
          level: 'expert',
        },
        {
          q: 'How do you tune key MariaDB settings (buffer pool, etc.) for Drupal?',
          level: 'expert',
        },
        {
          q: 'How would you plan a zero-downtime schema change on a large table?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'xdebug',
      name: 'Xdebug',
      desc: 'PHP step debugger toggled via DDEV',
      tag: 'Debugging',
      questions: [
        {
          q: 'How do you enable and disable Xdebug in DDEV?',
          level: 'advanced',
        },
        {
          q: 'How do you configure PHPStorm or VS Code to connect to the DDEV Xdebug listener?',
          level: 'advanced',
        },
        {
          q: 'What is the performance impact of running Xdebug and how do you mitigate it?',
          level: 'advanced',
        },
        {
          q: "What is Xdebug's profiling mode and how do you analyze a cachegrind file?",
          level: 'advanced',
        },
        {
          q: 'How do you configure a path mapping so breakpoints resolve correctly inside DDEV?',
          level: 'intermediate',
        },
        { q: 'What is a debugger?', level: 'novice' },
        { q: 'What is a breakpoint?', level: 'novice' },
        { q: 'What is step-through debugging?', level: 'novice' },
        {
          q: 'How do you start a debugging session from the browser?',
          level: 'intermediate',
        },
        {
          q: 'How do you inspect variables and the call stack while paused?',
          level: 'intermediate',
        },
        {
          q: 'How would you debug a request that only fails in a queue worker or Drush context?',
          level: 'expert',
        },
        {
          q: 'How do you profile and read a cachegrind file to find a bottleneck?',
          level: 'expert',
        },
        {
          q: 'How would you debug code in a container using remote path mapping?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'acquia',
      name: 'Acquia Cloud / ACSF',
      desc: 'Managed Drupal hosting and multi-site factory',
      tag: 'Hosting',
      questions: [
        {
          q: 'What is Acquia Cloud Site Factory (ACSF) and how does it manage multiple Drupal sites?',
          level: 'novice',
        },
        {
          q: 'How do you deploy code to Acquia (git push to Acquia remote)?',
          level: 'intermediate',
        },
        {
          q: 'How does the Acquia connector module work?',
          level: 'intermediate',
        },
        {
          q: 'What is the role of acquia/drupal-recommended-settings in this project?',
          level: 'novice',
        },
        {
          q: "How do you use Acquia's on-demand environments (ODEs) for testing?",
          level: 'advanced',
        },
        {
          q: 'How would you design a code, config, and content promotion workflow across Acquia dev/stage/prod?',
          level: 'expert',
        },
        { q: 'What is managed Drupal hosting?', level: 'novice' },
        {
          q: 'How do you deploy code to an Acquia environment?',
          level: 'intermediate',
        },
        {
          q: 'How do you use Acquia Cloud Hooks to run tasks on deploy?',
          level: 'advanced',
        },
        {
          q: 'How do you safely copy databases and files between Acquia environments?',
          level: 'advanced',
        },
        {
          q: 'How would you design a CI/CD pipeline that deploys to Acquia with config import and cache clears?',
          level: 'expert',
        },
        {
          q: 'How do you manage secrets and per-environment settings on Acquia?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'nodejs',
      name: 'Node.js / npm',
      desc: 'JS runtime for the frontend build pipeline',
      tag: 'Runtime',
      questions: [
        {
          q: 'How do you manage the Node.js version in DDEV?',
          level: 'intermediate',
        },
        {
          q: 'What is the purpose of package-lock.json and when should you commit it?',
          level: 'novice',
        },
        {
          q: 'How do npm workspaces or nested packages affect the build?',
          level: 'advanced',
        },
        {
          q: 'How do you audit and fix npm dependency vulnerabilities?',
          level: 'intermediate',
        },
        {
          q: 'How do you pin and switch Node versions per project so local matches CI?',
          level: 'advanced',
        },
        { q: 'What is Node.js?', level: 'novice' },
        { q: 'What is npm?', level: 'novice' },
        {
          q: 'What is the difference between dependencies and devDependencies?',
          level: 'intermediate',
        },
        {
          q: 'How do you audit and remediate npm vulnerabilities?',
          level: 'advanced',
        },
        {
          q: 'How would you guarantee reproducible installs across dev and CI (lockfile, npm ci)?',
          level: 'expert',
        },
        {
          q: "How do you debug a native module that fails to build on a teammate's machine?",
          level: 'expert',
        },
        {
          q: 'How would you reduce node_modules bloat and install time in a large project?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'multisite',
      name: 'Drupal Multisite',
      desc: 'Wildcard local hostnames in DDEV',
      tag: 'Architecture',
      questions: [
        {
          q: 'How does Drupal multisite work (sites/ directory, site URI detection)?',
          level: 'advanced',
        },
        {
          q: 'How does DDEV handle wildcard additional_hostnames for multisite?',
          level: 'advanced',
        },
        {
          q: 'How do you share config between multisites vs keep it separate?',
          level: 'advanced',
        },
        {
          q: 'How does ACSF differ from a traditional Drupal multisite setup?',
          level: 'advanced',
        },
        {
          q: 'How do you share code while isolating database and config across many sites at scale?',
          level: 'expert',
        },
        { q: 'What is Drupal multisite?', level: 'novice' },
        {
          q: 'What is shared (code) versus separate (database) in a multisite?',
          level: 'novice',
        },
        { q: 'What is the sites.php file for?', level: 'novice' },
        {
          q: 'How do you add a new site to a multisite setup?',
          level: 'intermediate',
        },
        {
          q: 'How do you run Drush against a specific site?',
          level: 'intermediate',
        },
        {
          q: 'How do you handle per-site settings.php?',
          level: 'intermediate',
        },
        {
          q: 'How would you operate hundreds of sites efficiently (deploys, updates)?',
          level: 'expert',
        },
        {
          q: "How do you isolate one site's failure from the others?",
          level: 'expert',
        },
      ],
    },
  ],
};
