import { ref } from 'vue';

export default {
  name: 'AdminSupport',
  setup() {
    const openFaq = ref(null);

    const faqs = [
      {
        q: 'How do I create a new client?',
        a: 'Go to the Clients section from the sidebar and click "Add Client". Fill in the required business and personal details, then submit.'
      },
      {
        q: 'How do I reset a client\'s password?',
        a: 'Navigate to Clients, find the client, and use the Login button to access their account. Password reset can be handled from the client settings.'
      },
      {
        q: 'How do I manage AI Prompts?',
        a: 'Go to the Prompts section in the sidebar. You can view and edit all AI prompts used across the platform.'
      },
      {
        q: 'How do credits work?',
        a: 'Credits are assigned to users by clients. Each AI interaction (chat/voice) deducts credits based on the configured rate (CCR). Admins can view credit usage in the Credits section.'
      },
      {
        q: 'How do I configure AI API keys?',
        a: 'Go to Settings from the sidebar. You can set the OpenAI and Gemini API keys at the app level, or per-client level.'
      },
      {
        q: 'How do I view payment logs?',
        a: 'Navigate to the Payments section from the sidebar to see all payment transactions and logs.'
      }
    ];

    const contacts = [
      {
        label: 'Email Support',
        value: 'contact@brahmakosh.com',
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
          </svg>
        )
      },
      {
        label: 'Phone Support',
        value: '+91 99729 68390',
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.36 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 17l1 -.08z"/>
          </svg>
        )
      },
      {
        label: 'Platform',
        value: 'brahmakosh.com',
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
        )
      }
    ];

    const quickLinks = [
      { label: 'Manage Clients', path: '/admin/clients', color: '#6366f1', bg: '#eef2ff' },
      { label: 'AI Agents', path: '/admin/ai-agents', color: '#0ea5e9', bg: '#e0f2fe' },
      { label: 'Settings', path: '/admin/settings', color: '#10b981', bg: '#d1fae5' },
      { label: 'Payments', path: '/admin/payments', color: '#f59e0b', bg: '#fef3c7' }
    ];

    return () => (
      <div style={{ fontFamily: "'Inter', sans-serif" }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#111827', margin: 0 }}>Support</h1>
          <p style={{ color: '#6b7280', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>Help center & platform documentation</p>
        </div>

        {/* Top Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>

          {/* Quick Links */}
          <div style={{ background: '#fff', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #f3f4f6' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: '0 0 1.25rem' }}>Quick Navigation</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {quickLinks.map(link => (
                <a key={link.path} href={link.path} style={{ background: link.bg, color: link.color, borderRadius: '10px', padding: '0.9rem 1rem', textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'opacity 0.2s' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12,5 19,12 12,19"/>
                  </svg>
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Contact Info */}
          <div style={{ background: '#fff', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #f3f4f6' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: '0 0 1.25rem' }}>Contact Information</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {contacts.map(c => (
                <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                  <div style={{ background: '#eef2ff', color: '#6366f1', padding: '0.55rem', borderRadius: '9px', display: 'flex', flexShrink: 0 }}>
                    {c.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.1rem' }}>{c.label}</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>{c.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div style={{ background: '#fff', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #f3f4f6' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: '0 0 1.25rem' }}>Frequently Asked Questions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {faqs.map((faq, idx) => (
              <div key={idx} style={{ border: '1px solid #f3f4f6', borderRadius: '10px', overflow: 'hidden' }}>
                <button
                  onClick={() => openFaq.value = openFaq.value === idx ? null : idx}
                  style={{ width: '100%', background: openFaq.value === idx ? '#f9fafb' : '#fff', border: 'none', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', textAlign: 'left' }}
                >
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#111827' }}>{faq.q}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" style={{ flexShrink: 0, transform: openFaq.value === idx ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                    <polyline points="6,9 12,15 18,9"/>
                  </svg>
                </button>
                {openFaq.value === idx && (
                  <div style={{ padding: '0 1.25rem 1rem', background: '#f9fafb', fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.6 }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    );
  }
};
