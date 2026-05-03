const RefundPolicyPage = () => (
  <div className="container py-12 max-w-3xl">
    <h1 className="text-3xl font-bold text-foreground mb-6">Refund Policy</h1>
    <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-2">Escrow-Protected Purchases</h2>
        <p>All purchases on Khub are protected by our escrow system. Funds are only released to the seller after you confirm receipt and satisfaction with the product or service.</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-2">Refund Eligibility</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Item not received within the agreed delivery timeframe</li>
          <li>Item significantly different from the listing description</li>
          <li>Item damaged during shipping</li>
          <li>Seller fails to fulfill the order</li>
        </ul>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-2">Refund Process</h2>
        <p>To request a refund, open a dispute from your order page within 48 hours of delivery. Our customer care team will review and resolve disputes within 3-5 business days.</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-2">Non-Refundable</h2>
        <p>Payments made outside the Khub platform, digital goods after delivery, and services already rendered are not eligible for refunds.</p>
      </section>
    </div>
  </div>
);

export default RefundPolicyPage;
