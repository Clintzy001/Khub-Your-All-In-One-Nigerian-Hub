const TermsPage = () => (
  <div className="container py-12 max-w-3xl">
    <h1 className="text-3xl font-bold text-foreground mb-6">Terms & Conditions</h1>
    <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-2">1. Acceptance of Terms</h2>
        <p>By accessing and using Khub, you agree to be bound by these Terms & Conditions. If you do not agree, please do not use our platform.</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-2">2. User Accounts</h2>
        <p>Users must provide accurate information during registration. Each user is responsible for maintaining the confidentiality of their account credentials. Khub reserves the right to suspend or delete accounts that violate our policies.</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-2">3. Escrow Payment System</h2>
        <p>All payments are processed through our secure escrow system. Funds are held until the buyer confirms receipt of goods or services. Sellers receive payment only after successful delivery confirmation.</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-2">4. Seller & Service Provider Verification</h2>
        <p>Sellers, drivers, agents, and job posters must complete KYC verification and maintain a monthly subscription to remain verified on the platform. Unverified accounts have limited visibility.</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-2">5. Prohibited Activities</h2>
        <p>Users must not engage in fraud, sell counterfeit goods, make payments outside the platform, harass other users, or violate any applicable Nigerian laws.</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-2">6. Payment Outside the Platform</h2>
        <p className="font-medium text-warning">⚠️ CAUTION: Making payments outside the Khub platform voids all protections. Khub is not responsible for any losses incurred from transactions conducted outside our escrow system.</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-2">7. Governing Law</h2>
        <p>These terms are governed by the laws of the Federal Republic of Nigeria.</p>
      </section>
    </div>
  </div>
);

export default TermsPage;
