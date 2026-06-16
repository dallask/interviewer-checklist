import type { Section } from './types.js';

export const integrationsSection: Section = {
  id: 'integrations',
  label: 'Integrations',
  icon: '🔗',
  items: [
    {
      id: 'aws',
      name: 'AWS SDK (PHP)',
      desc: 'S3, SES, and other AWS services',
      tag: 'Cloud',
      questions: [
        {
          q: 'How do you authenticate with AWS in a Drupal/PHP context?',
          level: 'intermediate',
        },
        {
          q: 'How do you upload a file to S3 using the AWS SDK?',
          level: 'intermediate',
        },
        {
          q: 'How do you configure credentials safely (IAM roles vs env vars)?',
          level: 'intermediate',
        },
        {
          q: 'How do you use SES for transactional email sending?',
          level: 'intermediate',
        },
        {
          q: 'How do you stream large S3 uploads/downloads without exhausting PHP memory?',
          level: 'expert',
        },
        { q: 'What is AWS S3?', level: 'novice' },
        { q: 'What is AWS SES?', level: 'novice' },
        { q: 'What is an IAM role?', level: 'novice' },
        {
          q: 'How do you offload Drupal file storage to S3?',
          level: 'advanced',
        },
        {
          q: 'How do you sign and serve private S3 objects?',
          level: 'advanced',
        },
        {
          q: 'How do you send transactional email through SES from Drupal?',
          level: 'advanced',
        },
        {
          q: 'How would you stream large uploads to S3 without exhausting PHP memory?',
          level: 'expert',
        },
        {
          q: 'How do you handle credential rotation and least-privilege IAM in production?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'googleapi',
      name: 'Google API Client',
      desc: 'Google services integration',
      tag: '3rd Party',
      questions: [
        {
          q: 'How do you authenticate with the Google API using a service account?',
          level: 'advanced',
        },
        {
          q: 'What is the Google consent screen and when is it required?',
          level: 'expert',
        },
        {
          q: 'How do you make a paginated API call with the Google PHP client?',
          level: 'intermediate',
        },
        {
          q: 'How do you cache and refresh Google API tokens to stay within rate limits?',
          level: 'advanced',
        },
        { q: 'What is the Google API Client?', level: 'novice' },
        { q: 'What is the OAuth consent screen?', level: 'novice' },
        { q: 'What is a service account?', level: 'novice' },
        {
          q: 'How do you authenticate a server-to-server Google API call?',
          level: 'intermediate',
        },
        {
          q: 'How do you make a basic request with the Google PHP client?',
          level: 'intermediate',
        },
        {
          q: 'How do you handle pagination and quotas on a large API pull?',
          level: 'advanced',
        },
        {
          q: 'How would you cache and refresh tokens and back off on rate limits at scale?',
          level: 'expert',
        },
        {
          q: 'How do you secure and rotate service-account keys?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'facebook',
      name: 'Facebook PHP Business SDK',
      desc: 'Meta Graph API for ads and business tools',
      tag: '3rd Party',
      questions: [
        {
          q: 'How does the Facebook Graph API access token lifecycle work?',
          level: 'expert',
        },
        {
          q: 'How do you make a Graph API call using the PHP Business SDK?',
          level: 'intermediate',
        },
        {
          q: 'What is a Page Access Token vs a User Access Token?',
          level: 'expert',
        },
        { q: 'What is the Graph API?', level: 'novice' },
        { q: 'What is an access token?', level: 'novice' },
        { q: 'What is an app and a page in Meta terms?', level: 'novice' },
        {
          q: 'How do you make a basic Graph API call with the PHP SDK?',
          level: 'intermediate',
        },
        {
          q: 'How do you detect and handle token expiry?',
          level: 'intermediate',
        },
        {
          q: 'How do you exchange a short-lived token for a long-lived one?',
          level: 'advanced',
        },
        {
          q: 'How do you handle Graph API versioning and deprecations?',
          level: 'advanced',
        },
        {
          q: 'How do you debug a permissions or scope error?',
          level: 'advanced',
        },
        {
          q: 'How would you securely store app secrets and verify incoming webhooks at scale?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'mailchimp',
      name: 'MailChimp',
      desc: 'Email marketing integration via drupal/mailchimp',
      tag: 'Email',
      questions: [
        {
          q: 'How do you subscribe a Drupal user to a MailChimp audience list?',
          level: 'intermediate',
        },
        {
          q: 'How do you use merge tags and how are they mapped from Drupal fields?',
          level: 'intermediate',
        },
        {
          q: 'How do you handle MailChimp webhook events in Drupal?',
          level: 'advanced',
        },
        {
          q: 'How do you handle a failed or duplicate subscribe request gracefully?',
          level: 'intermediate',
        },
        { q: 'What is MailChimp used for?', level: 'novice' },
        { q: 'What is an audience/list?', level: 'novice' },
        { q: 'What is a merge field?', level: 'novice' },
        {
          q: 'How do you sync Drupal user data to MailChimp reliably?',
          level: 'advanced',
        },
        {
          q: 'How do you handle webhook events such as unsubscribe?',
          level: 'advanced',
        },
        {
          q: 'How would you keep large lists in sync without hitting API limits?',
          level: 'expert',
        },
        {
          q: 'How do you handle consent/GDPR and unsubscribes correctly?',
          level: 'expert',
        },
        {
          q: 'How would you debug state drift between Drupal and MailChimp?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'gtm',
      name: 'Google Tag Manager / Adobe Launch',
      desc: 'Tag management for analytics and tracking',
      tag: 'Analytics',
      questions: [
        {
          q: 'What is the difference between GTM and Adobe Launch architecturally?',
          level: 'novice',
        },
        {
          q: 'How does drupal/google_tag embed the GTM snippet?',
          level: 'intermediate',
        },
        {
          q: 'How do you test that a tag fires correctly using GTM preview mode?',
          level: 'intermediate',
        },
        {
          q: 'How does drupal/adobe_launch handle the DTM/Launch script injection?',
          level: 'intermediate',
        },
        {
          q: 'How do you push a custom dataLayer event from Drupal/JS and verify it fires in GTM preview?',
          level: 'advanced',
        },
        { q: 'What is a tag manager?', level: 'novice' },
        { q: 'What is the dataLayer?', level: 'novice' },
        {
          q: 'How do you fire a tag on a custom event and verify it in preview?',
          level: 'advanced',
        },
        {
          q: 'How do you avoid duplicate or inconsistent tracking across pages?',
          level: 'advanced',
        },
        {
          q: 'How would you handle consent (a CMP) and conditional tag firing for privacy laws?',
          level: 'expert',
        },
        {
          q: 'How do you keep GTM and Adobe Launch implementations consistent?',
          level: 'expert',
        },
        {
          q: 'How would you debug tags that fire locally but not in production?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'algolia',
      name: 'Algolia Places',
      desc: 'Address autocomplete in Webform fields',
      tag: 'Search',
      questions: [
        { q: 'What does the Algolia Places library provide?', level: 'novice' },
        {
          q: 'How is Algolia Places loaded as a Drupal library in the project?',
          level: 'intermediate',
        },
        {
          q: 'How do you restrict the Places widget to a specific country?',
          level: 'intermediate',
        },
        { q: 'What is Algolia Places?', level: 'novice' },
        { q: 'What does address autocomplete provide?', level: 'novice' },
        {
          q: 'How do you add Algolia Places to a webform field?',
          level: 'intermediate',
        },
        {
          q: 'How do you restrict autocomplete results to a country or region?',
          level: 'advanced',
        },
        {
          q: 'Algolia Places is deprecated — how would you choose and integrate an alternative?',
          level: 'advanced',
        },
        {
          q: 'How do you store structured address data captured from the widget?',
          level: 'advanced',
        },
        {
          q: 'How would you debounce and cache autocomplete requests to control cost?',
          level: 'expert',
        },
        {
          q: 'How do you handle client-side API key exposure safely?',
          level: 'expert',
        },
        {
          q: 'How would you migrate to a different geocoding provider with minimal disruption?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'leaflet',
      name: 'Leaflet / Geolocation',
      desc: 'Interactive maps via drupal/leaflet and drupal/geolocation',
      tag: 'Maps',
      questions: [
        {
          q: 'How do you add a Leaflet map to a Drupal Views output?',
          level: 'intermediate',
        },
        {
          q: 'What is a geofield and how is geographic data stored?',
          level: 'intermediate',
        },
        {
          q: 'How do you add a custom map tile provider to drupal/leaflet?',
          level: 'intermediate',
        },
        {
          q: 'What is the difference between drupal/leaflet and drupal/geolocation?',
          level: 'novice',
        },
        {
          q: 'How do you cluster a large number of markers for performance on a Leaflet map?',
          level: 'intermediate',
        },
        { q: 'What is Leaflet?', level: 'novice' },
        { q: 'What is a map tile provider?', level: 'novice' },
        {
          q: 'How do you render a Views result as Leaflet markers?',
          level: 'advanced',
        },
        {
          q: 'How do you store geographic data using a geofield?',
          level: 'advanced',
        },
        {
          q: 'How do you add a custom tile layer to a Leaflet map?',
          level: 'advanced',
        },
        {
          q: 'How would you render thousands of points performantly (clustering, vector tiles)?',
          level: 'expert',
        },
        {
          q: 'How do you handle tile-provider rate limits and keys in production?',
          level: 'expert',
        },
        {
          q: 'How would you make an interactive map accessible?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'recaptcha',
      name: 'reCAPTCHA / Honeypot',
      desc: 'Spam and bot protection on forms',
      tag: 'Security',
      questions: [
        {
          q: 'What is the difference between reCAPTCHA v2 and v3?',
          level: 'novice',
        },
        {
          q: 'How does the honeypot technique work to catch bots?',
          level: 'intermediate',
        },
        {
          q: 'How do you configure drupal/recaptcha on a Webform?',
          level: 'intermediate',
        },
        {
          q: 'How do you test form protection locally without triggering reCAPTCHA blocks?',
          level: 'intermediate',
        },
        {
          q: 'How do you tune reCAPTCHA v3 score thresholds and fall back where Google is blocked (privacy/region)?',
          level: 'expert',
        },
        { q: 'What is a CAPTCHA?', level: 'novice' },
        { q: 'What is the honeypot technique?', level: 'novice' },
        { q: 'How do you add reCAPTCHA to a webform?', level: 'advanced' },
        {
          q: 'How do you choose between reCAPTCHA v2 and v3?',
          level: 'advanced',
        },
        {
          q: 'How do you test protected forms locally without getting blocked?',
          level: 'advanced',
        },
        {
          q: 'How would you tune v3 thresholds and handle false positives for real users?',
          level: 'expert',
        },
        {
          q: 'How do you provide a fallback where Google is blocked (privacy/regions)?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'symfonymailer',
      name: 'Symfony Mailer',
      desc: 'Transactional email via drupal/symfony_mailer',
      tag: 'Email',
      questions: [
        {
          q: 'How do you configure SMTP transport in drupal/symfony_mailer?',
          level: 'intermediate',
        },
        {
          q: 'How do you create a custom email template using Twig?',
          level: 'intermediate',
        },
        {
          q: 'How does Mailpit intercept emails in local DDEV development?',
          level: 'intermediate',
        },
        {
          q: 'How do you test HTML email rendering across email clients?',
          level: 'intermediate',
        },
        {
          q: 'How do you configure SPF/DKIM-aligned sending and handle bounces and complaints?',
          level: 'advanced',
        },
        { q: 'What is transactional email?', level: 'novice' },
        { q: 'What is SMTP?', level: 'novice' },
        { q: 'What is Symfony Mailer?', level: 'novice' },
        {
          q: 'How do you build an HTML email template with Twig?',
          level: 'advanced',
        },
        {
          q: 'How do you intercept email locally with Mailpit?',
          level: 'advanced',
        },
        {
          q: 'How would you configure SPF/DKIM/DMARC-aligned sending and handle bounces?',
          level: 'expert',
        },
        {
          q: 'How do you ensure deliverability and avoid spam folders at scale?',
          level: 'expert',
        },
        {
          q: 'How would you debug email that sends successfully but never arrives?',
          level: 'expert',
        },
      ],
    },
  ],
};
