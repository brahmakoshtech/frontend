import { ref, onMounted, computed } from 'vue';
import { RouterLink } from 'vue-router';
import api from '../../services/api.js';

export default {
  name: 'ClientOverview',
  setup() {
    const stats = ref(null);
    const loading = ref(true);
    const error = ref(null);

    const fetchDashboard = async () => {
      try {
        loading.value = true;
        error.value = null;
        const res = await api.getClientDashboard();
        stats.value = res.data;
      } catch (err) {
        error.value = err.message || 'Failed to load dashboard';
      } finally {
        loading.value = false;
      }
    };

    onMounted(fetchDashboard);

    const growthUp = computed(() => (stats.value?.growthPct ?? 0) >= 0);

    const renderBarChart = (data, color) => {
      if (!data || data.length === 0) return null;
      const maxVal = Math.max(...data.map(d => d.count), 1);
      const w = 420, h = 100, barW = 40, gap = 20;
      const totalW = data.length * (barW + gap) - gap;
      const startX = (w - totalW) / 2;
      return (
        <svg viewBox={`0 0 ${w} ${h + 28}`} style={{ width: '100%', height: '130px' }}>
          {data.map((d, i) => {
            const barH = Math.max(4, Math.round((d.count / maxVal) * h));
            const x = startX + i * (barW + gap);
            const y = h - barH;
            return (
              <g key={d.month}>
                <rect x={x} y={y} width={barW} height={barH} rx="4" fill={color} opacity="0.85" />
                <text x={x + barW / 2} y={h + 16} textAnchor="middle" fontSize="11" fill="#9ca3af">{d.month}</text>
                {d.count > 0 && <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize="10" fill={color} fontWeight="600">{d.count}</text>}
              </g>
            );
          })}
        </svg>
      );
    };

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
            <p style={{ color: '#ef4444', margin: '0 0 1rem' }}>{error.value}</p>
            <button onClick={fetchDashboard} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.5rem 1.5rem', cursor: 'pointer' }}>Retry</button>
          </div>
        );
      }

      const d = stats.value;
      const pct = d?.growthPct ?? 0;

      const kpiCards = [
        {
          label: 'Total Users', value: d?.totalUsers ?? 0,
          sub: `${d?.activeUsers ?? 0} active`,
          accent: '#6366f1', bg: '#eef2ff',
          icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        },
        {
          label: 'Active Users', value: d?.activeUsers ?? 0,
          sub: `${d?.inactiveUsers ?? 0} inactive`,
          accent: '#10b981', bg: '#d1fae5',
          icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        },
        {
          label: 'New Users This Month', value: d?.newUsersThisMonth ?? 0,
          sub: `vs ${d?.newUsersLastMonth ?? 0} last month`,
          trend: pct,
          accent: '#0ea5e9', bg: '#e0f2fe',
          icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
        },
        {
          label: 'Total Partners', value: d?.totalPartners ?? 0,
          sub: `${d?.activePartners ?? 0} active`,
          accent: '#f59e0b', bg: '#fef3c7',
          icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        }
      ];

      return (
        <div style={{ fontFamily: "'Inter', sans-serif" }}>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#111827', margin: 0 }}>Overview</h1>
              <p style={{ color: '#6b7280', margin: '0.25rem 0 0', fontSize: '0.875rem' }}>
                {d?.clientInfo?.businessName && <span style={{ fontWeight: 600, color: '#6366f1' }}>{d.clientInfo.businessName} · </span>}
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            {kpiCards.map(card => (
              <div key={card.label} style={{ background: '#fff', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ background: card.bg, color: card.accent, padding: '0.6rem', borderRadius: '10px', display: 'flex' }}>
                    {card.icon}
                  </div>
                  {card.trend !== undefined && (
                    <span style={{ color: card.trend >= 0 ? '#10b981' : '#ef4444', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        {card.trend >= 0 ? <polyline points="18,15 12,9 6,15" /> : <polyline points="6,9 12,15 18,9" />}
                      </svg>
                      {Math.abs(card.trend)}%
                    </span>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', lineHeight: 1.1 }}>{card.value.toLocaleString()}</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginTop: '0.25rem' }}>{card.label}</div>
                  <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '0.15rem' }}>{card.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts + Recent Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>

            {/* User Growth Chart */}
            <div style={{ background: '#fff', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #f3f4f6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: 0 }}>User Registrations</h3>
                  <p style={{ fontSize: '0.78rem', color: '#9ca3af', margin: '0.2rem 0 0' }}>Last 6 months</p>
                </div>
                <span style={{ background: '#eef2ff', color: '#6366f1', fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.7rem', borderRadius: '20px' }}>Monthly</span>
              </div>
              {d?.userGrowth?.length
                ? renderBarChart(d.userGrowth, '#6366f1')
                : <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem 0', fontSize: '0.875rem' }}>No data yet</p>
              }
            </div>

            {/* User Status Breakdown */}
            <div style={{ background: '#fff', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #f3f4f6' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: '0 0 1.25rem' }}>User Status</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  { label: 'Active Users', value: d?.activeUsers ?? 0, total: d?.totalUsers ?? 1, color: '#10b981' },
                  { label: 'Inactive Users', value: d?.inactiveUsers ?? 0, total: d?.totalUsers ?? 1, color: '#ef4444' },
                  { label: 'New This Month', value: d?.newUsersThisMonth ?? 0, total: d?.totalUsers ?? 1, color: '#6366f1' },
                ].map(item => (
                  <div key={item.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.875rem', color: '#374151', fontWeight: 500 }}>{item.label}</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111827' }}>{item.value}</span>
                    </div>
                    <div style={{ height: '8px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${item.total > 0 ? Math.round((item.value / item.total) * 100) : 0}%`, background: item.color, borderRadius: '4px', transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Partner stats */}
              <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #f3f4f6' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', margin: '0 0 0.75rem' }}>Partners</h4>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1, background: '#fef3c7', borderRadius: '10px', padding: '0.75rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#d97706' }}>{d?.totalPartners ?? 0}</div>
                    <div style={{ fontSize: '0.75rem', color: '#92400e', fontWeight: 500 }}>Total</div>
                  </div>
                  <div style={{ flex: 1, background: '#d1fae5', borderRadius: '10px', padding: '0.75rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#059669' }}>{d?.activePartners ?? 0}</div>
                    <div style={{ fontSize: '0.75rem', color: '#065f46', fontWeight: 500 }}>Active</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Users */}
          <div style={{ background: '#fff', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #f3f4f6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: 0 }}>Recent Users</h3>
              <RouterLink to="/client/users" style={{ fontSize: '0.8rem', color: '#6366f1', textDecoration: 'none', fontWeight: 500 }}>View all →</RouterLink>
            </div>
            {d?.recentUsers?.length
              ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {d.recentUsers.map(u => (
                    <div key={u._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#f9fafb', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#eef2ff', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>
                          {(u.profile?.name || u.email || '?')[0].toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '220px' }}>{u.profile?.name || u.email}</div>
                          <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{new Date(u.createdAt).toLocaleDateString('en-IN')}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '20px', background: u.isActive ? '#d1fae5' : '#fee2e2', color: u.isActive ? '#059669' : '#dc2626', whiteSpace: 'nowrap' }}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  ))}
                </div>
              )
              : <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem 0', fontSize: '0.875rem' }}>No users yet</p>
            }
          </div>

        </div>
      );
    };
  }
};
