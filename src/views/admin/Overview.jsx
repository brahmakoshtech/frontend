import { ref, onMounted, computed } from 'vue';
import { RouterLink } from 'vue-router';
import api from '../../services/api.js';

export default {
  name: 'AdminOverview',
  setup() {
    const stats = ref(null);
    const loading = ref(true);
    const error = ref(null);

    const fetchDashboard = async () => {
      try {
        loading.value = true;
        error.value = null;
        const response = await api.getAdminDashboard();
        stats.value = response.data;
      } catch (err) {
        error.value = err.message || 'Failed to load dashboard data';
      } finally {
        loading.value = false;
      }
    };

    onMounted(fetchDashboard);

    // User growth trend percentage vs last month
    const userGrowthPct = computed(() => {
      if (!stats.value) return 0;
      const last = stats.value.newUsersLastMonth || 0;
      const curr = stats.value.newUsersThisMonth || 0;
      if (last === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - last) / last) * 100);
    });

    // SVG bar chart helper
    const renderBarChart = (data, color) => {
      if (!data || data.length === 0) return null;
      const maxVal = Math.max(...data.map(d => d.count), 1);
      const w = 420, h = 120, barW = 40, gap = 20;
      const totalW = data.length * (barW + gap) - gap;
      const startX = (w - totalW) / 2;

      return (
        <svg viewBox={`0 0 ${w} ${h + 30}`} style={{ width: '100%', height: '150px' }}>
          {data.map((d, i) => {
            const barH = maxVal > 0 ? Math.max(4, Math.round((d.count / maxVal) * h)) : 4;
            const x = startX + i * (barW + gap);
            const y = h - barH;
            return (
              <g key={d.month}>
                <rect x={x} y={y} width={barW} height={barH} rx="4" fill={color} opacity="0.85" />
                <text x={x + barW / 2} y={h + 16} textAnchor="middle" fontSize="11" fill="#9ca3af">{d.month}</text>
                {d.count > 0 && (
                  <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize="10" fill={color} fontWeight="600">{d.count}</text>
                )}
              </g>
            );
          })}
        </svg>
      );
    };

    // Trend arrow icon
    const TrendIcon = ({ pct }) => {
      const up = pct >= 0;
      return (
        <span style={{ color: up ? '#10b981' : '#ef4444', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            {up
              ? <polyline points="18,15 12,9 6,15" />
              : <polyline points="6,9 12,15 18,9" />}
          </svg>
          {Math.abs(pct)}%
        </span>
      );
    };

    const kpiCards = computed(() => {
      if (!stats.value) return [];
      return [
        {
          label: 'Total Clients',
          value: stats.value.totalClients ?? 0,
          sub: `${stats.value.activeClients ?? 0} active`,
          icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" />
            </svg>
          ),
          accent: '#6366f1',
          bg: '#eef2ff'
        },
        {
          label: 'Total Users',
          value: stats.value.totalUsers ?? 0,
          sub: `${stats.value.activeUsers ?? 0} active`,
          icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          ),
          accent: '#0ea5e9',
          bg: '#e0f2fe'
        },
        {
          label: 'New Users This Month',
          value: stats.value.newUsersThisMonth ?? 0,
          sub: `vs ${stats.value.newUsersLastMonth ?? 0} last month`,
          trend: userGrowthPct.value,
          icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
          ),
          accent: '#10b981',
          bg: '#d1fae5'
        },
        {
          label: 'New Clients This Month',
          value: stats.value.newClientsThisMonth ?? 0,
          sub: 'onboarded this month',
          icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.36 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 17l.92-.08z" />
            </svg>
          ),
          accent: '#f59e0b',
          bg: '#fef3c7'
        }
      ];
    });

    return () => {
      if (loading.value) {
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid #e5e7eb', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ color: '#6b7280', margin: 0 }}>Loading dashboard...</p>
          </div>
        );
      }

      if (error.value) {
        return (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '2rem', textAlign: 'center' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" style={{ margin: '0 auto 1rem' }}>
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p style={{ color: '#ef4444', margin: '0 0 1rem' }}>{error.value}</p>
            <button onClick={fetchDashboard} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.5rem 1.5rem', cursor: 'pointer' }}>Retry</button>
          </div>
        );
      }

      return (
        <div style={{ fontFamily: "'Inter', sans-serif" }}>

          {/* Page Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#111827', margin: 0 }}>Overview</h1>
              <p style={{ color: '#6b7280', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

          </div>

          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            {kpiCards.value.map(card => (
              <div key={card.label} style={{ background: '#fff', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ background: card.bg, color: card.accent, padding: '0.6rem', borderRadius: '10px', display: 'flex' }}>
                    {card.icon}
                  </div>
                  {card.trend !== undefined && <TrendIcon pct={card.trend} />}
                </div>
                <div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', lineHeight: 1.1 }}>{card.value.toLocaleString()}</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginTop: '0.25rem' }}>{card.label}</div>
                  <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '0.15rem' }}>{card.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>

            {/* User Growth Chart */}
            <div style={{ background: '#fff', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #f3f4f6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: 0 }}>User Registrations</h3>
                  <p style={{ fontSize: '0.78rem', color: '#9ca3af', margin: '0.2rem 0 0' }}>Last 6 months</p>
                </div>
                <span style={{ background: '#e0f2fe', color: '#0ea5e9', fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.7rem', borderRadius: '20px' }}>Monthly</span>
              </div>
              {stats.value?.userGrowth?.length
                ? renderBarChart(stats.value.userGrowth, '#0ea5e9')
                : <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem 0', fontSize: '0.875rem' }}>No data yet</p>
              }
            </div>

            {/* Client Growth Chart */}
            <div style={{ background: '#fff', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #f3f4f6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: 0 }}>Client Onboarding</h3>
                  <p style={{ fontSize: '0.78rem', color: '#9ca3af', margin: '0.2rem 0 0' }}>Last 6 months</p>
                </div>
                <span style={{ background: '#eef2ff', color: '#6366f1', fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.7rem', borderRadius: '20px' }}>Monthly</span>
              </div>
              {stats.value?.clientGrowth?.length
                ? renderBarChart(stats.value.clientGrowth, '#6366f1')
                : <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem 0', fontSize: '0.875rem' }}>No data yet</p>
              }
            </div>
          </div>

          {/* Bottom Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>

            {/* Top Clients by Users */}
            <div style={{ background: '#fff', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #f3f4f6' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: '0 0 1.25rem' }}>Top Clients by Users</h3>
              {stats.value?.usersPerClient?.length
                ? (() => {
                    const maxU = Math.max(...stats.value.usersPerClient.map(c => c.userCount), 1);
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        {stats.value.usersPerClient.map((c, idx) => (
                          <div key={idx}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                              <span style={{ fontSize: '0.875rem', color: '#374151', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '70%' }}>{c.clientName}</span>
                              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111827' }}>{c.userCount}</span>
                            </div>
                            <div style={{ height: '6px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${(c.userCount / maxU) * 100}%`, background: 'linear-gradient(90deg, #6366f1, #818cf8)', borderRadius: '4px', transition: 'width 0.6s ease' }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()
                : <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem 0', fontSize: '0.875rem' }}>No client data yet</p>
              }
            </div>

            {/* Recent Clients */}
            <div style={{ background: '#fff', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #f3f4f6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: 0 }}>Recent Clients</h3>
                <RouterLink to="/admin/clients" style={{ fontSize: '0.8rem', color: '#6366f1', textDecoration: 'none', fontWeight: 500 }}>View all →</RouterLink>
              </div>
              {stats.value?.recentClients?.length
                ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {stats.value.recentClients.map(c => (
                      <div key={c._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#f9fafb', borderRadius: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#eef2ff', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>
                            {(c.businessName || c.email || '?')[0].toUpperCase()}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>{c.businessName || c.email}</div>
                            <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{new Date(c.createdAt).toLocaleDateString('en-IN')}</div>
                          </div>
                        </div>
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '20px', background: c.isActive ? '#d1fae5' : '#fee2e2', color: c.isActive ? '#059669' : '#dc2626', whiteSpace: 'nowrap' }}>
                          {c.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    ))}
                  </div>
                )
                : <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem 0', fontSize: '0.875rem' }}>No clients yet</p>
              }
            </div>

          </div>
        </div>
      );
    };
  }
};
