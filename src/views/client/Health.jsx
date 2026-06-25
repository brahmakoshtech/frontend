import { ref, onMounted, onUnmounted } from 'vue';
import api from '../../services/api.js';

export default {
  name: 'ClientHealth',
  setup() {
    const health = ref(null);
    const apiHealth = ref(null);
    const loading = ref(true);
    const apiLoading = ref(false);
    const error = ref(null);
    const lastUpdated = ref(null);
    const activeTab = ref('system');
    const filterStatus = ref('all');
    let intervalId = null;

    const fetchHealth = async () => {
      try {
        error.value = null;
        const res = await api.get('/client/health');
        health.value = res.data.data;
        lastUpdated.value = new Date();
      } catch (err) {
        error.value = err.response?.data?.message || err.message || 'Failed to fetch health data';
      } finally {
        loading.value = false;
      }
    };

    const fetchApiHealth = async () => {
      try {
        apiLoading.value = true;
        const res = await api.get('/client/api-health');
        apiHealth.value = res.data.data;
      } catch (err) {
        apiHealth.value = { error: err.message };
      } finally {
        apiLoading.value = false;
      }
    };

    onMounted(() => {
      fetchHealth();
      intervalId = setInterval(fetchHealth, 30000);
    });

    onUnmounted(() => clearInterval(intervalId));

    const StatusBadge = ({ healthy, label }) => (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '5px',
        padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
        background: healthy ? '#d1fae5' : '#fee2e2',
        color: healthy ? '#059669' : '#dc2626'
      }}>
        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: healthy ? '#10b981' : '#ef4444', display: 'inline-block' }} />
        {label || (healthy ? 'Operational' : 'Down')}
      </span>
    );

    const MetricCard = ({ title, value, sub, icon, accent, bg }) => (
      <div style={{ background: '#fff', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #f3f4f6' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280' }}>{title}</span>
          <div style={{ background: bg, color: accent, padding: '0.5rem', borderRadius: '10px', display: 'flex' }}>
            {icon}
          </div>
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', lineHeight: 1.1 }}>{value}</div>
        {sub && <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '0.3rem' }}>{sub}</div>}
      </div>
    );

    const getStatusColor = (ep) => {
      if (!ep.healthy) return { bg: '#fef2f2', border: '#fecaca', dot: '#ef4444', text: '#dc2626' };
      if (ep.ms < 300) return { bg: '#f0fdf4', border: '#bbf7d0', dot: '#10b981', text: '#059669' };
      if (ep.ms < 1000) return { bg: '#fffbeb', border: '#fde68a', dot: '#f59e0b', text: '#d97706' };
      return { bg: '#fff7ed', border: '#fed7aa', dot: '#f97316', text: '#ea580c' };
    };

    const getHttpColor = (status) => {
      if (status === 0) return '#ef4444';
      if (status < 300) return '#10b981';
      if (status < 400) return '#3b82f6';
      if (status < 500) return '#f59e0b';
      return '#ef4444';
    };

    return () => {
      if (loading.value) {
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid #e5e7eb', borderTop: '3px solid #10b981', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ color: '#6b7280', margin: 0 }}>Checking system health...</p>
          </div>
        );
      }

      if (error.value) {
        return (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '2rem', textAlign: 'center' }}>
            <p style={{ color: '#ef4444', margin: '0 0 1rem' }}>{error.value}</p>
            <button onClick={fetchHealth} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.5rem 1.5rem', cursor: 'pointer' }}>Retry</button>
          </div>
        );
      }

      const d = health.value;
      const allHealthy = d.services.every(s => s.healthy);

      const filteredApis = apiHealth.value?.endpoints?.filter(ep => {
        if (filterStatus.value === 'healthy') return ep.healthy;
        if (filterStatus.value === 'failed') return !ep.healthy;
        return true;
      }) || [];

      return (
        <div style={{ fontFamily: "'Inter', sans-serif" }}>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#111827', margin: 0 }}>System Health</h1>
              <p style={{ color: '#6b7280', margin: '0.25rem 0 0', fontSize: '0.875rem' }}>
                Live status · Auto-refreshes every 30s
                {lastUpdated.value && ` · ${lastUpdated.value.toLocaleTimeString('en-IN')}`}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <StatusBadge healthy={allHealthy} label={allHealthy ? 'All Systems Operational' : 'Degraded'} />
              <button onClick={fetchHealth} style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                Refresh
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid #f3f4f6' }}>
            {[{ key: 'system', label: 'System Overview' }, { key: 'apis', label: 'API Monitor' }].map(tab => (
              <button
                key={tab.key}
                onClick={() => {
                  activeTab.value = tab.key;
                  if (tab.key === 'apis' && !apiHealth.value) fetchApiHealth();
                }}
                style={{
                  background: 'none', border: 'none', padding: '0.75rem 1.25rem', cursor: 'pointer',
                  fontSize: '0.9rem', fontWeight: 600,
                  color: activeTab.value === tab.key ? '#6366f1' : '#6b7280',
                  borderBottom: activeTab.value === tab.key ? '2px solid #6366f1' : '2px solid transparent',
                  marginBottom: '-2px', transition: 'all 0.15s'
                }}
              >{tab.label}</button>
            ))}
          </div>

          {/* ── SYSTEM TAB ── */}
          {activeTab.value === 'system' && (
            <div>
              {/* KPI Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                <MetricCard title="Server Uptime" value={d.server.uptime} sub={`Node ${d.server.nodeVersion} · ${d.server.env}`} accent="#10b981" bg="#d1fae5"
                  icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>} />
                <MetricCard title="Database" value={d.database.status} sub={`Host: ${d.database.host}`}
                  accent={d.database.healthy ? '#10b981' : '#ef4444'} bg={d.database.healthy ? '#d1fae5' : '#fee2e2'}
                  icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>} />
                <MetricCard title="Heap Used" value={`${d.memory.heapUsed} MB`} sub={`Total: ${d.memory.heapTotal} MB · RSS: ${d.memory.rss} MB`} accent="#f59e0b" bg="#fef3c7"
                  icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>} />
                <MetricCard title="Total Users" value={d.stats.totalUsers} sub={`${d.stats.activeUsers} active`} accent="#6366f1" bg="#eef2ff"
                  icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>} />
                <MetricCard title="New This Month" value={d.stats.newUsersThisMonth} sub="users joined" accent="#0ea5e9" bg="#e0f2fe"
                  icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>} />
              </div>

              {/* Services */}
              <div style={{ background: '#fff', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #f3f4f6', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: '0 0 1.25rem' }}>Services Status</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  {d.services.map(svc => (
                    <div key={svc.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', background: svc.healthy ? '#f0fdf4' : '#fef2f2', borderRadius: '12px', border: `1px solid ${svc.healthy ? '#bbf7d0' : '#fecaca'}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: svc.healthy ? '#10b981' : '#ef4444', boxShadow: svc.healthy ? '0 0 0 3px #bbf7d0' : '0 0 0 3px #fecaca' }} />
                        <span style={{ fontWeight: 600, color: '#111827', fontSize: '0.9rem' }}>{svc.name}</span>
                      </div>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: svc.healthy ? '#059669' : '#dc2626' }}>{svc.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Memory */}
              <div style={{ background: '#fff', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #f3f4f6' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: '0 0 1.25rem' }}>Memory Usage</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[
                    { label: 'Heap Used', value: d.memory.heapUsed, max: d.memory.heapTotal, color: '#6366f1' },
                    { label: 'Heap Total', value: d.memory.heapTotal, max: d.memory.rss, color: '#0ea5e9' },
                    { label: 'RSS', value: d.memory.rss, max: d.memory.rss, color: '#10b981' }
                  ].map(m => (
                    <div key={m.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.875rem', color: '#374151', fontWeight: 500 }}>{m.label}</span>
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111827' }}>{m.value} MB</span>
                      </div>
                      <div style={{ height: '8px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(100, Math.round((m.value / Math.max(m.max, 1)) * 100))}%`, background: m.color, borderRadius: '4px', transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── API MONITOR TAB ── */}
          {activeTab.value === 'apis' && (
            <div>
              {/* Scan Button + Summary */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {apiHealth.value?.summary && (
                    <>
                      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: '#059669' }}>
                        ✓ {apiHealth.value.summary.healthy} Healthy
                      </div>
                      <div style={{ background: apiHealth.value.summary.failed > 0 ? '#fef2f2' : '#f9fafb', border: `1px solid ${apiHealth.value.summary.failed > 0 ? '#fecaca' : '#e5e7eb'}`, borderRadius: '10px', padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: apiHealth.value.summary.failed > 0 ? '#dc2626' : '#9ca3af' }}>
                        ✗ {apiHealth.value.summary.failed} Failed
                      </div>
                      <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '10px', padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: '#6366f1' }}>
                        ⌀ {apiHealth.value.summary.avgMs}ms avg
                      </div>
                    </>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {apiHealth.value?.endpoints && (
                    <select
                      value={filterStatus.value}
                      onChange={e => filterStatus.value = e.target.value}
                      style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.45rem 0.75rem', fontSize: '0.875rem', color: '#374151', background: '#fff', cursor: 'pointer' }}
                    >
                      <option value="all">All APIs</option>
                      <option value="healthy">Healthy Only</option>
                      <option value="failed">Failed Only</option>
                    </select>
                  )}
                  <button
                    onClick={fetchApiHealth}
                    disabled={apiLoading.value}
                    style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.5rem 1.25rem', cursor: apiLoading.value ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', opacity: apiLoading.value ? 0.7 : 1 }}
                  >
                    {apiLoading.value
                      ? <><div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Scanning...</>
                      : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg> Run Scan</>
                    }
                  </button>
                </div>
              </div>

              {/* No data yet */}
              {!apiHealth.value && !apiLoading.value && (
                <div style={{ background: '#fff', borderRadius: '14px', padding: '4rem 2rem', textAlign: 'center', border: '1px solid #f3f4f6', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" style={{ margin: '0 auto 1rem', display: 'block' }}>
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                  <p style={{ color: '#9ca3af', margin: '0 0 1.25rem', fontSize: '0.95rem' }}>Click "Run Scan" to check all API endpoints</p>
                  <button onClick={fetchApiHealth} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.6rem 1.5rem', cursor: 'pointer', fontWeight: 600 }}>Run Scan</button>
                </div>
              )}

              {/* Loading skeleton */}
              {apiLoading.value && (
                <div style={{ background: '#fff', borderRadius: '14px', padding: '1.5rem', border: '1px solid #f3f4f6', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                  {[...Array(8)].map((_, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.9rem 0', borderBottom: i < 7 ? '1px solid #f9fafb' : 'none' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#e5e7eb', animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${i * 0.1}s` }} />
                      <div style={{ height: '14px', background: '#f3f4f6', borderRadius: '4px', width: `${150 + (i % 4) * 40}px`, animation: 'pulse 1.5s ease-in-out infinite' }} />
                      <div style={{ marginLeft: 'auto', height: '14px', background: '#f3f4f6', borderRadius: '4px', width: '60px', animation: 'pulse 1.5s ease-in-out infinite' }} />
                    </div>
                  ))}
                </div>
              )}

              {/* API Results Table */}
              {apiHealth.value?.endpoints && !apiLoading.value && (
                <div style={{ background: '#fff', borderRadius: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #f3f4f6', overflow: 'hidden' }}>
                  {/* Table Header */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr 80px 90px 100px', gap: '1rem', padding: '0.75rem 1.25rem', background: '#f9fafb', borderBottom: '1px solid #f3f4f6', fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <span>API Name</span>
                    <span>Endpoint</span>
                    <span>Status</span>
                    <span>Response</span>
                    <span>Health</span>
                  </div>

                  {filteredApis.length === 0 && (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>No APIs match the filter</div>
                  )}

                  {filteredApis.map((ep, idx) => {
                    const c = getStatusColor(ep);
                    return (
                      <div
                        key={ep.name}
                        style={{
                          display: 'grid', gridTemplateColumns: '2fr 3fr 80px 90px 100px',
                          gap: '1rem', padding: '0.9rem 1.25rem', alignItems: 'center',
                          borderBottom: idx < filteredApis.length - 1 ? '1px solid #f9fafb' : 'none',
                          background: ep.healthy ? '#fff' : '#fffafa',
                          transition: 'background 0.15s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: c.dot, flexShrink: 0, boxShadow: ep.healthy ? `0 0 0 2px ${c.border}` : 'none' }} />
                          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>{ep.name}</span>
                        </div>
                        <span style={{ fontSize: '0.78rem', color: '#6b7280', fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {ep.method} {ep.url}
                        </span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: getHttpColor(ep.status) }}>
                          {ep.status === 0 ? 'N/A' : ep.status}
                        </span>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: ep.ms < 300 ? '#059669' : ep.ms < 1000 ? '#d97706' : '#ea580c' }}>
                          {ep.ms}ms
                        </span>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          padding: '0.2rem 0.65rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700,
                          background: c.bg, color: c.text, border: `1px solid ${c.border}`
                        }}>
                          {ep.healthy ? ep.label : (ep.error ? 'Error' : 'Failed')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {apiHealth.value?.error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '1.5rem', color: '#dc2626', fontSize: '0.875rem', marginTop: '1rem' }}>
                  Scan failed: {apiHealth.value.error}
                </div>
              )}
            </div>
          )}

        </div>
      );
    };
  }
};
