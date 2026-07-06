import type { Metadata } from 'next';
import TermsToC from './TermsToC';

export const metadata: Metadata = {
  title: 'Terms & Conditions — Miova',
  description:
    'Read the Terms and Conditions governing your use of Miova, Kuwait\'s multi-vendor marketplace for fashion, electronics, beauty, and more.',
  openGraph: {
    title: 'Terms & Conditions — Miova',
    description:
      'Terms and Conditions governing access to and use of the Miova marketplace platform in Kuwait.',
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
  return (
    <ul className="space-y-2 pl-1">
      {children}
    </ul>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3 text-gray-700 dark:text-gray-300 leading-7 text-[0.9375rem]">
      <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-brand-400 dark:bg-brand-500 flex-shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </li>
  );
}

// Term . definition pairs used in Section 2
function DefList({ items }: { items: { term: string; def: string }[] }) {
  return (
    <dl className="space-y-3">
      {items.map(({ term, def }) => (
        <div key={term} className="sm:grid sm:grid-cols-[180px_1fr] sm:gap-4">
          <dt className="font-semibold text-gray-900 dark:text-gray-100 text-[0.9375rem] leading-7">
            {term}.
          </dt>
          <dd className="text-gray-700 dark:text-gray-300 leading-7 text-[0.9375rem] mt-0.5 sm:mt-0">
            {def}
          </dd>
        </div>
      ))}
    </dl>
  );
}

// Bold "Sub-heading: text" row used in Section 23
function MiscItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <p className="text-gray-700 dark:text-gray-300 leading-7 text-[0.9375rem]">
      <strong className="font-semibold text-gray-900 dark:text-gray-100">{label}:</strong>{' '}
      {children}
    </p>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12">
      {/* Skip-to-content */}
      <a
        href="#terms-content"
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
            Terms &amp; Conditions
          </h1>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            <span className="font-medium text-gray-600 dark:text-gray-300">Effective date:</span>{' '}
            [Insert Date]
            {' · '}
            <span className="font-medium text-gray-600 dark:text-gray-300">Last updated:</span>{' '}
            [Insert Date]
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-2xl">
            Please read these Terms &amp; Conditions carefully before using the Miova platform.
            They form a legally binding agreement between you and Miova.
          </p>
        </header>

        {/* Two-column layout: ToC + article */}
        <div className="lg:grid lg:grid-cols-[232px_1fr] lg:gap-12 lg:items-start">

          {/* Table of Contents (client component) */}
          <TermsToC />

          {/* ── Main article ────────────────────────────────────────────── */}
          <article
            id="terms-content"
            className="space-y-10 max-w-[720px]"
            aria-label="Terms and Conditions"
          >

            {/* 1 */}
            <Section id="section-1" num={1} title="Introduction">
              <P>
                These Terms &amp; Conditions (the &ldquo;Agreement&rdquo;) govern access to and use of Miova, an online
                multi-vendor marketplace operating in the State of Kuwait through its website, mobile applications, and
                any associated services (collectively, the &ldquo;Platform&rdquo;). Miova connects Buyers with Vendors,
                being Individual Sellers, Registered Businesses, Official Brand Stores, and Authorized Distributors, to
                facilitate the discovery, listing, sale, and purchase of products.
              </P>
              <P>
                By creating an account, browsing the Platform, placing an Order, operating a storefront, or otherwise
                using any part of the Platform, you confirm that you have read, understood, and agree to be bound by
                this Agreement, together with any policy referenced herein, including the Privacy Policy, the Vendor
                Agreement, the Returns &amp; Refunds Policy, and the Community &amp; Content Guidelines, each of which
                is incorporated into this Agreement by reference. If you do not agree with any part of this Agreement,
                you must discontinue use of the Platform immediately.
              </P>
              <P>
                This Agreement applies equally to Buyers and Vendors unless a provision expressly states that it applies
                to one category only. Where a conflict arises between this Agreement and a category-specific policy, the
                category-specific policy shall govern to the extent of the conflict, and this Agreement shall govern in
                all other respects.
              </P>
            </Section>

            {/* 2 */}
            <Section id="section-2" num={2} title="Definitions">
              <P>
                For the purposes of this Agreement, the following terms have the meanings set out below. Terms defined
                in the singular include the plural and vice versa, unless the context requires otherwise.
              </P>
              <DefList items={[
                { term: 'Platform',               def: 'the Miova website, mobile applications, application programming interfaces, and any related tools, dashboards, or services made available by Miova.' },
                { term: 'Miova',                  def: 'the operator of the Platform, its officers, employees, affiliates, and authorized representatives.' },
                { term: 'User',                   def: 'any person who accesses or uses the Platform, whether as a Buyer, Vendor, or visitor.' },
                { term: 'Buyer',                  def: 'a User who browses, orders, or purchases products through the Platform.' },
                { term: 'Vendor',                 def: 'a User approved by Miova to list and sell products through a storefront on the Platform, including Individual Sellers, Registered Businesses, Official Brand Stores, and Authorized Distributors.' },
                { term: 'Individual Seller',      def: 'a natural person selling products in a personal capacity, subject to applicable Kuwaiti trading and licensing requirements.' },
                { term: 'Registered Business',    def: 'a Vendor operating under a valid commercial license or registration issued by the competent authorities in Kuwait or another jurisdiction where lawfully permitted to trade into Kuwait.' },
                { term: 'Official Brand Store',   def: 'a storefront operated directly by, or with the documented authorization of, the owner of the brand or trademark represented.' },
                { term: 'Authorized Distributor', def: 'a Vendor holding documented authorization from a brand owner or manufacturer to distribute or resell specified products.' },
                { term: 'Account',                def: 'the registered profile through which a User accesses the Platform, including login credentials and associated data.' },
                { term: 'Listing',                def: 'a product page created by a Vendor, including its description, images, pricing, and availability.' },
                { term: 'Order',                  def: 'a request submitted by a Buyer to purchase one or more products from a Listing.' },
                { term: 'Payout',                 def: 'the transfer of proceeds due to a Vendor following completed sales, net of applicable Fees.' },
                { term: 'Content',                def: 'text, images, video, ratings, reviews, messages, or other material submitted to or displayed on the Platform by a User.' },
                { term: 'Fees',                   def: 'commissions, service charges, subscription charges, or other amounts payable to Miova as described in Section 10.' },
                { term: 'Applicable Law',         def: 'the laws, regulations, and binding decrees in force in the State of Kuwait, including any mandatory consumer protection provisions.' },
              ]} />
            </Section>

            {/* 3 */}
            <Section id="section-3" num={3} title="Acceptance of Terms">
              <P>
                This Agreement forms a legally binding contract between you and Miova. Registration of an Account,
                continued browsing of the Platform following notice of an update, placement of an Order, or activation
                of a storefront each independently constitutes acceptance of this Agreement in its then-current form.
              </P>
              <P>
                If you are accessing the Platform on behalf of a company, establishment, or other legal entity, you
                represent and warrant that you hold the authority to bind that entity to this Agreement, and references
                to &ldquo;you&rdquo; in such cases include that entity.
              </P>
              <P>
                You must not use the Platform if you lack the legal capacity to enter into binding contracts under
                Applicable Law, or if you have previously been suspended or removed from the Platform by Miova, unless
                expressly reinstated in writing.
              </P>
            </Section>

            {/* 4 */}
            <Section id="section-4" num={4} title="Eligibility & Account Registration">
              <P>
                Access to the Platform as a registered User is limited to individuals who are at least twenty-one (21)
                years of age, being the legal age of majority in the State of Kuwait, or who otherwise possess full
                legal capacity to contract under Applicable Law. Miova reserves the right to request proof of age or
                identity at any time and to suspend or terminate any Account where such proof is not provided or raises
                reasonable doubt.
              </P>
              <P>
                Registration requires the submission of accurate and current information, which may include full name,
                civil identification details, contact information, and, for Vendors, additional verification
                documentation appropriate to the Vendor category:
              </P>
              <Ul>
                <Li>Individual Sellers: a valid civil identification document and, where required by Applicable Law, evidence of any necessary trade permit.</Li>
                <Li>Registered Businesses: a valid commercial license or company registration, and identification of the authorized signatory.</Li>
                <Li>Official Brand Stores: documentary evidence of ownership of, or authorization to operate under, the relevant brand or trademark.</Li>
                <Li>Authorized Distributors: a written authorization letter from the brand owner or manufacturer confirming the right to distribute or resell the relevant products.</Li>
              </Ul>
              <P>
                Each User may maintain only one Account, except where Miova expressly authorizes multiple Accounts for
                legitimate business purposes. You are responsible for maintaining the confidentiality of your login
                credentials and for all activity conducted through your Account. You must notify Miova immediately of
                any unauthorized use of your Account or any other suspected breach of security. Miova is not liable for
                any loss arising from your failure to safeguard your credentials.
              </P>
              <P>
                Miova reserves the right, at its sole discretion, to refuse registration, request additional
                verification, or decline to activate an Account or storefront, including where Miova is unable to
                confirm the accuracy of submitted information.
              </P>
            </Section>

            {/* 5 */}
            <Section id="section-5" num={5} title="User Responsibilities">
              <P>As a User of the Platform, you agree to:</P>
              <Ul>
                <Li>provide true, accurate, and current information when registering, ordering, or communicating on the Platform;</Li>
                <Li>use the Platform only for lawful purposes and in accordance with this Agreement and Applicable Law;</Li>
                <Li>communicate with Vendors and other Users respectfully, and refrain from harassment, threats, or abusive conduct;</Li>
                <Li>complete payment for Orders placed in good faith and refrain from placing fraudulent, speculative, or abusive Orders;</Li>
                <Li>submit reviews and ratings that reflect a genuine experience with the product or Vendor concerned;</Li>
                <Li>refrain from attempting to circumvent Platform fees by arranging payment for a Platform-originated transaction outside the Platform;</Li>
                <Li>cooperate reasonably with Miova in connection with any investigation into suspected misuse of the Platform.</Li>
              </Ul>
              <P>
                You are solely responsible for any content you submit and for any consequences of your use of the
                Platform, including any transaction entered into with a Vendor.
              </P>
            </Section>

            {/* 6 */}
            <Section id="section-6" num={6} title="Vendor Responsibilities">
              <P>
                Vendors are independent parties who use the Platform to market and sell their own products. In addition
                to the obligations in Section 5, each Vendor agrees to:
              </P>
              <Ul>
                <Li>maintain all licenses, registrations, and permits required to lawfully offer and sell its products in Kuwait, and to keep such documentation current with Miova;</Li>
                <Li>ensure that all products offered are lawful, genuine, and, where applicable, comply with Kuwaiti safety, labelling, expiry, and import standards;</Li>
                <Li>accurately represent product origin, condition, and any brand affiliation, and refrain from listing counterfeit, replica, or unauthorized branded goods;</Li>
                <Li>process, prepare, and hand over Orders within the timelines communicated on the Platform, and maintain adequate stock accuracy to avoid overselling;</Li>
                <Li>provide responsive and reasonable customer service, including timely responses to Buyer messages and complaints;</Li>
                <Li>honor the pricing, promotions, and availability displayed on the Platform at the time an Order is placed;</Li>
                <Li>comply with all applicable tax obligations, including registration and remittance of value added tax or other levies where required by Kuwaiti law;</Li>
                <Li>for Official Brand Stores and Authorized Distributors, maintain valid authorization from the relevant brand owner for the duration of the storefront&rsquo;s operation and provide evidence of such authorization upon request.</Li>
              </Ul>
              <P>
                Vendors remain solely responsible for the quality, safety, legality, and accuracy of the products and
                Listings they publish, and for fulfilling their obligations to Buyers under the underlying contract of
                sale.
              </P>
            </Section>

            {/* 7 */}
            <Section id="section-7" num={7} title="Marketplace Role">
              <P>
                Miova operates the Platform as a technology intermediary that enables Vendors to list and sell products
                directly to Buyers. Miova is not the manufacturer, importer, owner, or seller of any product listed by
                a Vendor, and does not take title to Vendor inventory at any point in the transaction unless expressly
                stated otherwise for a specific Listing clearly identified as sold directly by Miova.
              </P>
              <P>
                Each Order gives rise to a contract of sale directly between the Buyer and the relevant Vendor. Miova
                is not a party to that contract and does not guarantee the existence, quality, safety, legality, or
                fitness for purpose of any product listed. References on the Platform to Miova &ldquo;selling&rdquo; or
                &ldquo;shipping&rdquo; a product describe the facilitation of the transaction and logistics on the
                Vendor&rsquo;s behalf and do not alter the identity of the contracting seller.
              </P>
              <P>
                Nothing in this Agreement creates a partnership, joint venture, agency, franchise, or employment
                relationship between Miova and any Vendor. Vendors do not have authority to bind Miova to any
                obligation and must not represent themselves as agents or employees of Miova.
              </P>
            </Section>

            {/* 8 */}
            <Section id="section-8" num={8} title="Product Listings & Accuracy">
              <P>
                Vendors are solely responsible for the content of their Listings, including titles, descriptions,
                specifications, images, pricing, category placement, and stock availability. Listings must be accurate,
                not misleading, and must not omit information that a reasonable Buyer would consider material to a
                purchasing decision.
              </P>
              <P>
                Miova may, but is not obliged to, review, edit, reclassify, or remove any Listing that it reasonably
                believes is inaccurate, prohibited, infringing, or otherwise in breach of this Agreement, without prior
                notice to the Vendor. Approval or continued display of a Listing by Miova does not constitute an
                endorsement of its accuracy or a warranty regarding the underlying product.
              </P>
              <P>
                Vendors must promptly update Listings to reflect changes in price, availability, or specification, and
                must honor confirmed Orders based on the information displayed at the time of purchase, save for
                manifest pricing or system errors, which Miova or the Vendor may correct in accordance with the Returns
                &amp; Refunds Policy.
              </P>
            </Section>

            {/* 9 */}
            <Section id="section-9" num={9} title="Orders, Payments & Transactions">
              <P>
                An Order is submitted when a Buyer completes the checkout process on the Platform. A binding contract
                of sale is formed between the Buyer and the relevant Vendor upon the Vendor&rsquo;s acceptance of the
                Order, which may occur automatically upon payment confirmation unless the Listing states that acceptance
                requires manual confirmation.
              </P>
              <P>
                All prices displayed on the Platform are in Kuwaiti Dinar (KWD) unless stated otherwise, and are
                inclusive of any applicable taxes unless expressly stated to be exclusive. Miova accepts payment through
                the methods made available on the Platform from time to time, which may include payment cards, KNET,
                digital wallets, and, where offered by a Vendor, cash on delivery.
              </P>
              <P>
                Payments are processed through licensed third-party payment service providers. By submitting payment
                details, you authorize Miova and its payment processors to charge the applicable amount for your Order,
                including product price, delivery charges, and applicable taxes. Miova is not responsible for delays or
                failures caused by a payment processor, issuing bank, or telecommunications provider.
              </P>
              <P>
                Miova may cancel or decline to process any Order where fraud, error, or a violation of this Agreement
                is reasonably suspected, or where a product has become unavailable, and will notify the Buyer and
                process any applicable refund without undue delay.
              </P>
            </Section>

            {/* 10 */}
            <Section id="section-10" num={10} title="Fees & Commissions">
              <P>
                Vendors pay Miova a commission on each completed sale, calculated as a percentage of the sale value and
                determined by product category as set out in the Vendor Agreement and the Vendor dashboard made
                available upon onboarding. Miova may also charge Vendors a subscription, listing, or storefront
                activation fee, and may pass through payment processing charges levied by third-party payment
                providers, in each case as disclosed to the Vendor prior to the fee becoming payable.
              </P>
              <P>
                Fees are deducted from sale proceeds prior to Payout, and Vendors receive an itemized statement of Fees
                through the Vendor dashboard. Miova may adjust its Fee structure from time to time and will provide
                Vendors with reasonable advance notice of any change, which will take effect for Orders placed after
                the effective date stated in the notice.
              </P>
              <P>
                Payouts are made to the Vendor&rsquo;s registered bank account on the payout cycle communicated at
                onboarding, subject to completion of the applicable return or cancellation window, successful delivery
                confirmation, and resolution of any pending dispute concerning the relevant Order. Miova may withhold
                or offset a Payout to the extent necessary to cover refunds, chargebacks, penalties, or amounts owed
                by the Vendor under this Agreement.
              </P>
            </Section>

            {/* 11 */}
            <Section id="section-11" num={11} title="Shipping & Delivery">
              <P>
                Products may be delivered by a Vendor&rsquo;s own logistics arrangements or through a delivery partner
                integrated with the Platform. Estimated delivery timelines displayed on the Platform are indicative and
                may vary due to product availability, location, customs procedures, or circumstances beyond the
                reasonable control of Miova or the Vendor.
              </P>
              <P>
                Risk of loss or damage to a product passes to the Buyer upon delivery to the address specified in the
                Order, or upon collection where the Buyer has selected a pickup option. Delivery charges, where
                applicable, are disclosed to the Buyer prior to checkout.
              </P>
              <P>
                Where a product is shipped from outside Kuwait, the Buyer may be responsible for applicable customs
                duties, import taxes, or clearance procedures in addition to the price displayed at checkout, unless
                the Listing states that such charges are included.
              </P>
              <P>
                If a delivery attempt fails due to an incorrect address, unavailability of the Buyer, or refusal to
                accept delivery, Miova or the Vendor may charge a reasonable re-delivery fee or, where redelivery is
                not feasible, cancel the Order subject to the Returns &amp; Refunds Policy.
              </P>
            </Section>

            {/* 12 */}
            <Section id="section-12" num={12} title="Returns, Refunds & Cancellations">
              <P>
                Buyers may request cancellation of an Order at any time before it has been dispatched by the Vendor,
                subject to any category-specific restrictions disclosed on the Listing. Once an Order has been
                dispatched, cancellation is treated as a return request.
              </P>
              <P>
                Buyers may request a return within seven (7) days of delivery where the product received is defective,
                materially not as described, or incorrect, unless a longer period is offered by the Vendor or required
                by Applicable Law. The product must be returned in the condition in which it was received, together
                with original packaging and accessories, save where the defect makes this impossible.
              </P>
              <P>The following categories are not eligible for return except where defective on arrival or as otherwise required by Applicable Law:</P>
              <Ul>
                <Li>perishable goods, and products with a limited shelf life once opened;</Li>
                <Li>cosmetics, personal care, and intimate apparel where hygiene seals have been broken;</Li>
                <Li>custom-made, personalized, or made-to-order products;</Li>
                <Li>digital products, vouchers, and gift cards once activated or redeemed.</Li>
              </Ul>
              <P>
                Approved refunds are issued to the original payment method within a commercially reasonable period
                following the Vendor&rsquo;s or Miova&rsquo;s confirmation of the return, and may be net of any
                non-refundable delivery charges where the return is not due to a Vendor or Platform error. Vendors may
                offer return terms more favorable to Buyers than those set out in this Section, which will apply in
                place of the baseline terms above.
              </P>
            </Section>

            {/* 13 */}
            <Section id="section-13" num={13} title="Reviews & User Content">
              <P>
                Users may submit reviews, ratings, photographs, messages, and other Content on the Platform. By
                submitting Content, you grant Miova a worldwide, royalty-free, non-exclusive, sublicensable license to
                host, display, reproduce, and use that Content in connection with operating, promoting, and improving
                the Platform, for as long as the Content remains available on the Platform and for a reasonable period
                thereafter for archival and legal purposes.
              </P>
              <P>
                Reviews must reflect a genuine experience with the product or Vendor. Vendors and Users must not
                submit, solicit, exchange, or incentivize fake, misleading, or manipulated reviews, and must disclose
                any material connection between the reviewer and the Vendor where a review is solicited.
              </P>
              <P>
                Miova may remove, hide, or decline to publish Content that is unlawful, defamatory, infringing,
                discriminatory, or otherwise in breach of this Agreement, and may disclose Content where required by
                Applicable Law or a competent authority. You remain solely responsible for the Content you submit and
                warrant that you hold all rights necessary to submit it.
              </P>
            </Section>

            {/* 14 */}
            <Section id="section-14" num={14} title="Prohibited Activities & Items">
              <P>
                Users must not use the Platform to engage in, and Vendors must not list products that facilitate, any
                of the following:
              </P>
              <Ul>
                <Li>counterfeit, replica, or unauthorized branded products, or products infringing any third party&rsquo;s intellectual property rights;</Li>
                <Li>firearms, ammunition, explosives, and weapons of any kind not lawfully tradeable in Kuwait;</Li>
                <Li>alcohol, narcotics, controlled substances, and any product whose sale is prohibited under Kuwaiti law;</Li>
                <Li>stolen goods, or goods with tampered or removed identification, batch, or serial markings;</Li>
                <Li>hazardous, flammable, or restricted materials that do not comply with applicable safety and transport regulations;</Li>
                <Li>gambling services, adult or sexually explicit material, and products exploiting or endangering minors;</Li>
                <Li>protected or endangered wildlife and any product derived from such species where prohibited by law;</Li>
                <Li>fraudulent conduct, including manipulation of reviews, prices, or Platform algorithms, and creation of multiple Accounts to evade a suspension.</Li>
              </Ul>
              <P>
                Miova reserves the right to remove any Listing or Content, suspend or terminate any Account, withhold
                Payouts, and report conduct to the competent Kuwaiti authorities where it reasonably believes this
                Section has been breached.
              </P>
            </Section>

            {/* 15 */}
            <Section id="section-15" num={15} title="Intellectual Property">
              <P>
                The Platform, including its software, design, layout, trademarks, logos, and all associated
                intellectual property, is owned by or licensed to Miova and is protected under Kuwaiti and
                international intellectual property laws. Except for the limited right to access and use the Platform
                in accordance with this Agreement, no rights in the Platform are transferred to Users.
              </P>
              <P>
                Vendors retain ownership of the product images, descriptions, and other Content they upload, subject
                to the license granted to Miova under Section 13. Each Vendor represents and warrants that its
                Listings and Content do not infringe any third party&rsquo;s trademark, copyright, patent, or other
                proprietary right, and that it holds any necessary brand authorization for products marketed under a
                third-party brand.
              </P>
              <P>
                Any User who believes that Content on the Platform infringes their intellectual property rights may
                submit a notice to Miova identifying the Content and the basis for the claim. Miova may remove or
                disable access to Content subject to a credible infringement notice pending investigation, without
                liability to the Vendor or User who submitted it.
              </P>
            </Section>

            {/* 16 */}
            <Section id="section-16" num={16} title="Privacy & Data Usage">
              <P>
                Miova collects and processes personal data in connection with operating the Platform, including account
                registration, order fulfilment, payment processing, and customer support, in accordance with its
                Privacy Policy and Applicable Law, including Kuwait&rsquo;s data protection and electronic
                transactions regulations. The Privacy Policy, available on the Platform, sets out in detail the
                categories of data collected, the purposes of processing, retention practices, and the rights
                available to Users.
              </P>
              <P>
                By using the Platform, you consent to the collection, processing, and, where necessary for order
                fulfilment or delivery, sharing of your data with Vendors, logistics partners, and payment processors
                strictly for the purposes of completing your transaction. The Privacy Policy forms part of, and is
                incorporated by reference into, this Agreement.
              </P>
            </Section>

            {/* 17 */}
            <Section id="section-17" num={17} title="Account Suspension & Termination">
              <P>
                Miova may suspend or terminate any Account, or restrict access to any feature of the Platform, with or
                without prior notice, where Miova reasonably believes that: this Agreement has been breached; the
                Account has been used fraudulently or unlawfully; information provided at registration is false or has
                become inaccurate; a Vendor&rsquo;s licensing or brand authorization has lapsed; or such action is
                necessary to protect Miova, other Users, or the integrity of the Platform.
              </P>
              <P>
                Upon suspension or termination, any Orders already confirmed will be handled in accordance with this
                Agreement and the applicable return and refund provisions, and any Payout due to a Vendor will be
                released after deduction of amounts owed to Miova or Buyers and after any applicable review period. A
                User may close their Account at any time by submitting a request through the Platform, subject to the
                completion of pending Orders and obligations.
              </P>
              <P>
                Sections of this Agreement that by their nature are intended to survive termination, including
                provisions relating to intellectual property, limitation of liability, indemnification, and dispute
                resolution, remain in effect after an Account is closed, suspended, or terminated.
              </P>
            </Section>

            {/* 18 */}
            <Section id="section-18" num={18} title="Limitation of Liability">
              <P>
                The Platform is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. Miova does
                not warrant that the Platform will be uninterrupted, error-free, or secure, and does not warrant the
                quality, safety, legality, or fitness for purpose of products listed by Vendors, except to the extent
                Miova has expressly identified itself as the seller of a specific Listing.
              </P>
              <P>
                To the maximum extent permitted by Applicable Law, Miova shall not be liable for any indirect,
                incidental, special, or consequential loss, or for loss of profits, business, or data, arising from
                use of the Platform, a transaction with a Vendor, or reliance on Content displayed on the Platform.
                Miova&rsquo;s aggregate liability to any User in connection with this Agreement shall not exceed the
                total Fees or amounts paid by that User to Miova in the twelve (12) months preceding the event giving
                rise to the claim.
              </P>
              <P>
                Nothing in this Agreement excludes or limits liability for fraud, willful misconduct, gross negligence,
                or any liability that cannot lawfully be excluded or limited under Applicable Law, including mandatory
                consumer protection rights available to Buyers under Kuwaiti law.
              </P>
            </Section>

            {/* 19 */}
            <Section id="section-19" num={19} title="Indemnification">
              <P>
                You agree to indemnify and hold harmless Miova, its officers, employees, and affiliates from and
                against any claim, liability, damage, loss, or expense, including reasonable legal fees, arising out of
                or in connection with: your breach of this Agreement; your use or misuse of the Platform; any Content
                or Listing you submit; any product you list, sell, or purchase through the Platform; or your violation
                of any Applicable Law or third-party right.
              </P>
              <P>
                Miova reserves the right to assume the exclusive defense and control of any matter otherwise subject to
                indemnification by a User, in which case the User agrees to cooperate with Miova in asserting any
                available defense.
              </P>
            </Section>

            {/* 20 */}
            <Section id="section-20" num={20} title="Dispute Resolution">
              <P>
                Disputes between a Buyer and a Vendor arising from an Order should, in the first instance, be raised
                through the Platform&rsquo;s messaging and customer support tools, and Miova may assist in mediating a
                resolution between the parties, without assuming responsibility for the underlying transaction.
              </P>
              <P>
                Any dispute between a User and Miova arising out of or in connection with this Agreement shall first be
                submitted in writing to Miova&rsquo;s customer support for good-faith resolution. If the dispute is not
                resolved within thirty (30) days of notification, either party may refer the matter to the competent
                courts of the State of Kuwait in accordance with Section 21, or, where the parties separately agree in
                writing, to arbitration seated in Kuwait under rules mutually agreed by the parties.
              </P>
              <P>
                Nothing in this Section prevents a Buyer from exercising any right of recourse available under
                mandatory Kuwaiti consumer protection law before the competent regulatory authority.
              </P>
            </Section>

            {/* 21 */}
            <Section id="section-21" num={21} title="Governing Law">
              <P>
                This Agreement and any dispute or claim arising out of or in connection with it, including its
                formation, shall be governed by and construed in accordance with the laws of the State of Kuwait,
                without regard to conflict of law principles. Subject to Section 20, the courts of Kuwait shall have
                exclusive jurisdiction to settle any dispute arising out of or in connection with this Agreement.
              </P>
              <P>
                Where this Agreement is made available in both Arabic and English, the Arabic version shall prevail in
                the event of any inconsistency, to the extent required by Applicable Law.
              </P>
            </Section>

            {/* 22 */}
            <Section id="section-22" num={22} title="Changes to Terms">
              <P>
                Miova may amend this Agreement from time to time to reflect changes in its services, legal or
                regulatory requirements, or operational practices. Miova will post the updated Agreement on the
                Platform and update the effective date accordingly. For material changes, Miova will provide at least
                fifteen (15) days&rsquo; advance notice through the Platform, by email, or by other reasonable means
                before the change takes effect.
              </P>
              <P>
                Continued use of the Platform after the effective date of an updated Agreement constitutes acceptance
                of the changes. If you do not agree to an updated Agreement, you must stop using the Platform and,
                where applicable, close your Account before the change takes effect.
              </P>
            </Section>

            {/* 23 */}
            <Section id="section-23" num={23} title="Miscellaneous">
              <div className="space-y-3">
                <MiscItem label="Entire Agreement">
                  This Agreement, together with the policies incorporated by reference, constitutes the entire
                  agreement between you and Miova regarding use of the Platform and supersedes any prior
                  understanding on the subject.
                </MiscItem>
                <MiscItem label="Severability">
                  If any provision of this Agreement is held invalid or unenforceable under Applicable Law, that
                  provision shall be enforced to the maximum extent permissible, and the remaining provisions shall
                  remain in full force and effect.
                </MiscItem>
                <MiscItem label="No Waiver">
                  A failure by Miova to enforce any right or provision of this Agreement shall not constitute a
                  waiver of that right or provision.
                </MiscItem>
                <MiscItem label="Assignment">
                  Miova may assign or transfer its rights and obligations under this Agreement, including in
                  connection with a merger, acquisition, or sale of assets, without your consent. Users may not
                  assign their rights or obligations under this Agreement without Miova&rsquo;s prior written
                  consent.
                </MiscItem>
                <MiscItem label="Relationship of the Parties">
                  Nothing in this Agreement creates a partnership, joint venture, agency, or employment relationship
                  between Miova and any User or Vendor.
                </MiscItem>
                <MiscItem label="Force Majeure">
                  Miova shall not be liable for any delay or failure to perform resulting from causes beyond its
                  reasonable control, including natural disasters, governmental action, labor disputes, or
                  disruption to telecommunications or payment networks.
                </MiscItem>
                <MiscItem label="Electronic Communications">
                  You consent to receive communications from Miova electronically, including by email, SMS, or
                  in-app notification, and agree that such communications satisfy any legal requirement that
                  communications be in writing.
                </MiscItem>
                <MiscItem label="Language">
                  This Agreement is prepared in English for general use across the Platform; where an Arabic
                  version is published, Section 21 shall govern in the event of any inconsistency.
                </MiscItem>
                <MiscItem label="Headings">
                  Section headings are included for convenience only and do not affect the interpretation of this
                  Agreement.
                </MiscItem>
                <MiscItem label="Contact">
                  Questions regarding this Agreement may be directed to Miova&rsquo;s customer support channels
                  made available on the Platform.
                </MiscItem>
              </div>
            </Section>

            {/* Bottom nav */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-8 flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
              <a href="/privacy" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Privacy Policy</a>
              <a href="/refunds" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Returns &amp; Refunds Policy</a>
              <a href="/cookies" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Cookie Policy</a>
              <a href="/contact" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Contact Support</a>
            </div>

          </article>
        </div>
      </div>
    </div>
  );
}
