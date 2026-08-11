export interface LegalPage {
  slug: string;
  title: string;
  subtitle: string;
  bodyHtml: string;
}

export const LEGAL_PAGES: Record<string, LegalPage> = {
  "privacy-policy": {
    slug: "privacy-policy",
    title: "Privacy Policy",
    subtitle: "Last updated: August 2026",
    bodyHtml: `
      <p>This policy explains what information Event Nu collects, how we use it, and the choices you have. It applies to eventnu.et and the Event Nu platform.</p>

      <h2>1. What we collect</h2>
      <ul>
        <li><strong>Account information.</strong> Name, email address, phone number, and password when you create an account. When you verify your email, we send you a one-time verification code.</li>
        <li><strong>Event information.</strong> Details that organizers submit when listing an event — including title, description, dates, venue, and pricing.</li>
        <li><strong>Ticketing and reservation data.</strong> Names, contact details, and ticket/reservation records for events that use Event Nu for check-in.</li>
        <li><strong>Community content.</strong> Experience posts, likes, and saved events. Content you post publicly — such as experience posts and their photos — is visible to other users.</li>
        <li><strong>Usage data.</strong> Basic analytics such as pages visited and how you reached the site.</li>
      </ul>

      <h2>2. How we use it</h2>
      <ul>
        <li>To operate the platform: publish events, process tickets and reservations, and enable check-in.</li>
        <li>To verify accounts and communicate with you about events you attend or organize, and about platform updates.</li>
        <li>To show you the events you saved and the posts you made.</li>
        <li>To improve the product and understand how people use it.</li>
        <li>To prevent fraud, abuse, and content that violates our Community Guidelines.</li>
      </ul>

      <h2>3. Payments</h2>
      <p>Payments for paid events are processed by third-party providers such as Telebirr, CBE Birr, Chapa, and card networks. We do not store full card numbers on our own systems.</p>

      <h2>4. What we share</h2>
      <ul>
        <li><strong>Event organizers</strong> see the names and contact details of people who buy tickets or reserve spots for their own events.</li>
        <li><strong>Service providers</strong> that help us run the platform (hosting, analytics, payments) may process data on our behalf.</li>
        <li><strong>Legal requirements.</strong> We may share data when required by Ethiopian law or a valid legal request.</li>
      </ul>

      <h2>5. Retention</h2>
      <p>We keep information as long as needed to operate the platform and comply with legal obligations. You can ask us to delete your account and associated data by emailing the address below.</p>

      <h2>6. Your choices</h2>
      <ul>
        <li>You can edit or remove information tied to your account.</li>
        <li>You can delete experience posts you have created, and unsave events at any time.</li>
        <li>You can unsubscribe from non-transactional emails at any time.</li>
        <li>You can contact us to request access to, correction of, or deletion of your personal data.</li>
      </ul>

      <h2>7. Community content</h2>
      <p>Experience posts, photos, likes, and saved-event lists you create on Event Nu are considered public content. If you post a photo, it is uploaded to secure storage and displayed publicly on the platform. You can remove your own posts at any time from your profile.</p>

      <h2>8. Contact</h2>
      <p>Questions about this policy? Email us at event.nua@gmail.com.</p>
    `,
  },
  "terms-of-service": {
    slug: "terms-of-service",
    title: "Terms of Service",
    subtitle: "Last updated: August 2026",
    bodyHtml: `
      <p>These terms govern your use of eventnu.et and the Event Nu platform. By using the platform you agree to these terms.</p>

      <h2>1. Using Event Nu</h2>
      <p>Event Nu helps people discover events and helps organizers list and manage them. You must be at least 13 years old to create an account. By signing up you confirm you have read and agreed to these terms and our Privacy Policy.</p>

      <h2>2. Accounts and security</h2>
      <ul>
        <li>Keep your password confidential and do not share your account.</li>
        <li>You must verify your email address to use all features, such as liking, saving, and posting experiences.</li>
        <li>You are responsible for activity that happens under your account.</li>
      </ul>

      <h2>3. Organizer responsibilities</h2>
      <ul>
        <li>Provide accurate information about your events, including dates, times, venues, and pricing.</li>
        <li>Ensure your events are lawful and do not infringe on the rights of others.</li>
        <li>Honor ticket sales, reservations, and refund policies you set.</li>
        <li>Obtain any permissions needed to host your event at the stated venue.</li>
      </ul>
      <p>Event Nu may remove listings that violate these responsibilities or our Community Guidelines.</p>

      <h2>4. Attendee responsibilities</h2>
      <ul>
        <li>Use your own name when buying tickets or reserving spots.</li>
        <li>Not resell tickets at inflated prices unless the organizer allows it.</li>
        <li>Follow venue rules and event-specific requirements.</li>
      </ul>

      <h2>5. User-generated content</h2>
      <p>Experience posts you write, and any photos you attach to them, are yours, but you grant Event Nu a non-exclusive license to display them on the platform. Keep posts respectful and truthful: do not post content that is unlawful, harassing, defamatory, or otherwise prohibited by our Community Guidelines. You may delete your own posts at any time.</p>

      <h2>6. Tickets and refunds</h2>
      <p>Tickets purchased for paid events are issued by the organizer. Refund and exchange policies are set by each organizer and communicated on the event page. Contact the organizer directly for refund requests.</p>

      <h2>7. Intellectual property</h2>
      <p>Event listings and their content belong to the organizers who submit them. The Event Nu name, logo, and platform software are owned by Event Nu.</p>

      <h2>8. Disclaimers</h2>
      <p>The platform is provided "as is" and "as available." We make no guarantees that the service will be uninterrupted or error-free, and we are not responsible for events listed by third-party organizers.</p>

      <h2>9. Limitation of liability</h2>
      <p>To the maximum extent permitted by law, Event Nu is not liable for indirect or consequential damages arising from your use of the platform or from attendance at events listed on it.</p>

      <h2>10. Changes</h2>
      <p>We may update these terms from time to time. Significant changes will be noted on this page.</p>

      <h2>11. Contact</h2>
      <p>Questions about these terms? Email us at event.nua@gmail.com.</p>
    `,
  },
  "community-guidelines": {
    slug: "community-guidelines",
    title: "Community Guidelines",
    subtitle: "Last updated: August 2026",
    bodyHtml: `
      <p>Event Nu works best when listings are accurate, honest, and respectful. These guidelines apply to everyone using the platform.</p>

      <h2>1. Be honest about events</h2>
      <ul>
        <li>Only list real events you have permission to list.</li>
        <li>Post accurate dates, times, locations, and prices.</li>
        <li>Do not use misleading titles, images, or descriptions.</li>
        <li>Use real poster images for your event.</li>
      </ul>

      <h2>2. Be respectful</h2>
      <ul>
        <li>Do not post content that is unlawful, harassing, or hateful.</li>
        <li>Do not impersonate other people or organizations.</li>
        <li>Do not share others' personal information without consent.</li>
      </ul>

      <h2>3. No spam</h2>
      <ul>
        <li>Do not create duplicate listings for the same event.</li>
        <li>Do not use Event Nu to advertise products or services unrelated to events.</li>
        <li>Do not buy or sell accounts, likes, or reservations.</li>
      </ul>

      <h2>4. Tickets</h2>
      <ul>
        <li>Do not resell Event Nu tickets at inflated prices unless the organizer allows it.</li>
        <li>Buy only tickets you intend to use, or cancel reservations you cannot attend.</li>
      </ul>

      <h2>5. Enforcement</h2>
      <p>We may remove listings, cancel reservations, or suspend accounts that violate these guidelines. If you see something that breaks them, report it by emailing event.nua@gmail.com.</p>
    `,
  },
};

export const LEGAL_PAGE_SLUGS = Object.keys(LEGAL_PAGES);
