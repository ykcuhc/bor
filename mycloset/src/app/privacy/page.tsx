import type { Metadata } from 'next';
import PrivacyToC from './PrivacyToC';

export const metadata: Metadata = {
  title: 'Privacy Policy — Miova',
  description:
    "Read Miova's Privacy Policy to understand how we collect, use, and protect your personal data on Kuwait's digital marketplace.",
  openGraph: {
    title: 'Privacy Policy — Miova',
    description:
      "Miova's Privacy Policy covering data collection, use, security, and your rights as a user of the platform.",
  },
};

// ─── Reusable section wrapper ─────────────────────────────────────────────────

function Section({
  id, num, title, children,
}: {
  id: string; num: number; title: string; children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-24">
      <h2
        id={`${id}-heading`}
        className="text-lg font-bold text-gray-900 dark:text-white font-[family-name:var(--font-heading)] mb-4 pb-2 border-b border-gray-100 dark:border-gray-800"
      >
        {num}. {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-gray-700 dark:text-gray-300 leading-7 text-[0.9375rem]">
      {children}
    </p>
  );
}

function Ul({ children }: { children: React.ReactNode }) {
  return <ul className="space-y-2 pl-1">{children}</ul>;
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3 text-gray-700 dark:text-gray-300 leading-7 text-[0.9375rem]">
      <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-brand-400 dark:bg-brand-500 flex-shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </li>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-[0.9375rem] font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      {children}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12">
      {/* Skip-to-content */}
      <a
        href="#privacy-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-brand-600 focus:text-white focus:text-sm focus:font-semibold"
      >
        Skip to main content
      </a>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Page header */}
        <header className="mb-10">
          <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-widest mb-2">
            Legal
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white font-[family-name:var(--font-heading)]">
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            <span className="font-medium text-gray-600 dark:text-gray-300">Effective date:</span>{' '}
            [Insert Date]
            {' · '}
            <span className="font-medium text-gray-600 dark:text-gray-300">Last updated:</span>{' '}
            [Insert Date]
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-2xl">
            Please read this Privacy Policy carefully. It explains how Miova collects,
            uses, and protects your personal data.
          </p>
        </header>

        {/* Two-column layout: ToC + article */}
        <div className="lg:grid lg:grid-cols-[232px_1fr] lg:gap-12 lg:items-start">

          {/* Table of Contents (client component) */}
          <PrivacyToC />

          {/* Main content */}
          <article id="privacy-content" className="space-y-12 min-w-0">

            {/* 1. Introduction */}
            <Section id="section-1" num={1} title="Introduction">
              <P>
                Miova (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) operates a digital marketplace platform
                that connects users, vendors, and service providers. We are committed to protecting
                your privacy and ensuring that your personal data is handled in a safe, transparent,
                and lawful manner.
              </P>
              <P>
                This Privacy Policy explains how we collect, use, store, share, and protect your
                information when you use our website, mobile application, and related services
                (collectively, the &ldquo;Platform&rdquo;).
              </P>
              <P>
                By using Miova, you agree to the terms of this Privacy Policy.
              </P>
            </Section>

            {/* 2. Information We Collect */}
            <Section id="section-2" num={2} title="Information We Collect">
              <P>We collect the following categories of information:</P>

              <SubSection title="2.1 Information You Provide Directly">
                <Ul>
                  <Li>Full name</Li>
                  <Li>Email address</Li>
                  <Li>Phone number</Li>
                  <Li>Billing and shipping addresses</Li>
                  <Li>Account login credentials</Li>
                  <Li>Profile information (for users and vendors)</Li>
                  <Li>Business details (for vendor accounts, including trade license where applicable)</Li>
                  <Li>Customer support communications</Li>
                </Ul>
              </SubSection>

              <SubSection title="2.2 Transaction Information">
                <Ul>
                  <Li>Order history</Li>
                  <Li>Payment status (note: we do not store full card details)</Li>
                  <Li>Refund and return requests</Li>
                  <Li>Delivery details</Li>
                </Ul>
              </SubSection>

              <SubSection title="2.3 Automatically Collected Information">
                <Ul>
                  <Li>IP address</Li>
                  <Li>Device type and operating system</Li>
                  <Li>Browser type</Li>
                  <Li>Location data (if enabled)</Li>
                  <Li>App usage data (pages visited, clicks, time spent)</Li>
                  <Li>Cookies and tracking technologies</Li>
                </Ul>
              </SubSection>

              <SubSection title="2.4 Vendor-Specific Data">
                <Ul>
                  <Li>Store performance metrics</Li>
                  <Li>Product listings and inventory data</Li>
                  <Li>Ratings and reviews</Li>
                </Ul>
              </SubSection>
            </Section>

            {/* 3. How We Use Your Information */}
            <Section id="section-3" num={3} title="How We Use Your Information">
              <P>We use your data to:</P>
              <Ul>
                <Li>Create and manage user accounts</Li>
                <Li>Process orders and payments</Li>
                <Li>Enable vendor operations on the platform</Li>
                <Li>Provide customer support</Li>
                <Li>Improve platform performance and user experience</Li>
                <Li>Prevent fraud and ensure platform security</Li>
                <Li>Send important updates (orders, policies, account alerts)</Li>
                <Li>Personalize content and recommendations</Li>
                <Li>Comply with legal obligations in Kuwait and applicable regulations</Li>
              </Ul>
            </Section>

            {/* 4. Sharing of Information */}
            <Section id="section-4" num={4} title="Sharing of Information">
              <P>We may share your data with:</P>

              <SubSection title="4.1 Service Providers">
                <Ul>
                  <Li>Payment processors</Li>
                  <Li>Delivery and logistics companies</Li>
                  <Li>Cloud storage providers</Li>
                  <Li>Customer support tools</Li>
                </Ul>
              </SubSection>

              <SubSection title="4.2 Vendors">
                <P>
                  Order details necessary to fulfill purchases (e.g., name, address, contact number).
                </P>
              </SubSection>

              <SubSection title="4.3 Legal Authorities">
                <P>We may disclose information if required by:</P>
                <Ul>
                  <Li>Kuwaiti law</Li>
                  <Li>Court orders</Li>
                  <Li>Regulatory obligations</Li>
                  <Li>Fraud investigations</Li>
                </Ul>
              </SubSection>

              <SubSection title="4.4 Business Transfers">
                <P>
                  If Miova undergoes a merger, acquisition, or asset sale, user data may be
                  transferred as part of that transaction.
                </P>
              </SubSection>
            </Section>

            {/* 5. Cookies and Tracking Technologies */}
            <Section id="section-5" num={5} title="Cookies and Tracking Technologies">
              <P>Miova uses cookies and similar technologies to:</P>
              <Ul>
                <Li>Keep users logged in</Li>
                <Li>Remember preferences</Li>
                <Li>Analyze traffic and usage</Li>
                <Li>Improve platform functionality</Li>
              </Ul>
              <P>
                Users can control cookie settings through their browser, but disabling cookies
                may affect platform performance.
              </P>
            </Section>

            {/* 6. Data Storage and Security */}
            <Section id="section-6" num={6} title="Data Storage and Security">
              <P>
                We implement appropriate technical and organizational measures to protect your
                data, including:
              </P>
              <Ul>
                <Li>Encryption of sensitive data</Li>
                <Li>Secure server infrastructure</Li>
                <Li>Access controls and authentication</Li>
                <Li>Regular security monitoring</Li>
              </Ul>
              <P>
                However, no system is 100% secure, and we cannot guarantee absolute security
                of your data.
              </P>
            </Section>

            {/* 7. Data Retention */}
            <Section id="section-7" num={7} title="Data Retention">
              <P>We retain personal data only as long as necessary for:</P>
              <Ul>
                <Li>Providing services</Li>
                <Li>Legal compliance</Li>
                <Li>Dispute resolution</Li>
                <Li>Business operations</Li>
              </Ul>
              <P>After this period, data is securely deleted or anonymized.</P>
            </Section>

            {/* 8. Your Rights */}
            <Section id="section-8" num={8} title="Your Rights">
              <P>Depending on applicable laws, you may have the right to:</P>
              <Ul>
                <Li>Access your personal data</Li>
                <Li>Correct inaccurate information</Li>
                <Li>Request deletion of your data</Li>
                <Li>Withdraw consent for marketing</Li>
                <Li>Object to certain processing activities</Li>
              </Ul>
              <P>Requests can be made through our support channels.</P>
            </Section>

            {/* 9. Children's Privacy */}
            <Section id="section-9" num={9} title="Children's Privacy">
              <P>
                Miova does not knowingly collect data from individuals under the age of 18.
                If we become aware that such data has been collected, we will take steps to
                delete it.
              </P>
            </Section>

            {/* 10. Third-Party Links */}
            <Section id="section-10" num={10} title="Third-Party Links">
              <P>
                The Platform may contain links to third-party websites. We are not responsible
                for the privacy practices of these external sites.
              </P>
            </Section>

            {/* 11. International Data Transfers */}
            <Section id="section-11" num={11} title="International Data Transfers">
              <P>
                Your data may be processed or stored outside Kuwait where our service providers
                operate. We ensure appropriate safeguards are in place for such transfers.
              </P>
            </Section>

            {/* 12. Changes to This Privacy Policy */}
            <Section id="section-12" num={12} title="Changes to This Privacy Policy">
              <P>
                We may update this Privacy Policy from time to time. Updates will be posted on
                this page with a revised &ldquo;Last Updated&rdquo; date. Continued use of Miova indicates
                acceptance of the updated policy.
              </P>
            </Section>

            {/* 13. Contact Us */}
            <Section id="section-13" num={13} title="Contact Us">
              <P>For questions or requests regarding this Privacy Policy:</P>
              <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-6 space-y-2">
                <p className="font-semibold text-gray-900 dark:text-white text-[0.9375rem]">
                  Miova Support Team
                </p>
                <p className="text-gray-700 dark:text-gray-300 text-[0.9375rem]">
                  <span className="font-medium text-gray-900 dark:text-gray-100">Email:</span>{' '}
                  [Insert Email]
                </p>
                <p className="text-gray-700 dark:text-gray-300 text-[0.9375rem]">
                  <span className="font-medium text-gray-900 dark:text-gray-100">Phone:</span>{' '}
                  [Insert Phone Number]
                </p>
                <p className="text-gray-700 dark:text-gray-300 text-[0.9375rem]">
                  <span className="font-medium text-gray-900 dark:text-gray-100">Address:</span>{' '}
                  [Insert Company Address]
                </p>
              </div>
            </Section>

          </article>
        </div>
      </div>
    </div>
  );
}
