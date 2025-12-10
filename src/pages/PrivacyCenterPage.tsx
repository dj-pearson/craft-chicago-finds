/**
 * Privacy Center Page
 * Central hub for all privacy-related actions
 */

import { Helmet } from 'react-helmet-async';
import { PrivacyCenter } from '@/components/privacy/PrivacyCenter';

export default function PrivacyCenterPage() {
  return (
    <>
      <Helmet>
        <title>Privacy Center | CraftLocal</title>
        <meta
          name="description"
          content="Manage your privacy settings, export your data, or request data deletion. Exercise your GDPR and CCPA rights."
        />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <PrivacyCenter />
      </div>
    </>
  );
}
