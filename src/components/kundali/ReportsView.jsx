import { ref, onMounted } from 'vue';

const sampleMatchPayload = {
  m_day: 23,
  m_month: 11,
  m_year: 1985,
  m_hour: 12,
  m_min: 40,
  m_lat: 28.7041,
  m_lon: 77.1025,
  m_tzone: 5.5,
  f_day: 24,
  f_month: 6,
  f_year: 1983,
  f_hour: 17,
  f_min: 5,
  f_lat: 30.9,
  f_lon: 75.8573,
  f_tzone: 5.5
};

export default {
  name: 'ReportsView',
  props: {
    userId: { type: String, required: true },
    api: { type: Object, required: true },
    token: { type: String, required: true }
  },
  setup(props) {
    const active = ref('kundali'); // kundali | match
    const loading = ref(false);
    const error = ref(null);

    const kundaliResult = ref(null);
    const matchResult = ref(null);
    const matchJson = ref(JSON.stringify(sampleMatchPayload, null, 2));
    const history = ref([]);
    const historyLoading = ref(false);
    const historyError = ref(null);

    const loadHistory = async () => {
      try {
        historyLoading.value = true;
        historyError.value = null;
        const res = await props.api.request(
          `/client/users/${props.userId}/reports/kundali/history`,
          { token: props.token }
        );
        history.value = res?.items || [];
      } catch (e) {
        historyError.value = e?.message || 'Failed to load report history';
      } finally {
        historyLoading.value = false;
      }
    };

    const generateKundali = async (reportType) => {
      try {
        loading.value = true;
        error.value = null;
        kundaliResult.value = null;
        const res = await props.api.post(
          `/client/users/${props.userId}/reports/kundali/${reportType}`,
          { language: 'en' },
          { token: props.token }
        );
        kundaliResult.value = res?.data || null;
        await loadHistory();
      } catch (e) {
        error.value = e?.message || 'Failed to generate kundali PDF';
      } finally {
        loading.value = false;
      }
    };

    const generateMatchMaking = async () => {
      try {
        loading.value = true;
        error.value = null;
        matchResult.value = null;
        let payload;
        try {
          payload = JSON.parse(matchJson.value);
        } catch {
          throw new Error('Match payload must be valid JSON');
        }

        const res = await props.api.post(
          `/client/users/${props.userId}/reports/match-making`,
          payload,
          { token: props.token }
        );
        matchResult.value = res?.data || null;
      } catch (e) {
        error.value = e?.message || 'Failed to generate match making report';
      } finally {
        loading.value = false;
      }
    };

    const tabBtn = (id, label) => (
      <button
        onClick={() => (active.value = id)}
        style={{
          flex: 1,
          padding: '0.7rem',
          borderRadius: '12px',
          border: 'none',
          fontWeight: 800,
          cursor: 'pointer',
          background: active.value === id ? 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)' : '#f1f5f9',
          color: active.value === id ? 'white' : '#334155'
        }}
      >
        {label}
      </button>
    );

    onMounted(() => {
      loadHistory();
    });

    const downloadReport = async (reportId) => {
      try {
        const res = await props.api.request(
          `/client/users/${props.userId}/reports/kundali/${reportId}/download`,
          { token: props.token }
        );
        const url = res?.url;
        if (url) {
          window.open(url, '_blank');
        }
      } catch (e) {
        error.value = e?.message || 'Failed to generate download link';
      }
    };

    return () => (
      <div>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          {tabBtn('kundali', 'Kundali PDF')}
          {tabBtn('match', 'Match Making')}
        </div>

        {error.value && (
          <div style={{ padding: '0.9rem', borderRadius: '12px', background: '#fee2e2', border: '1px dashed #ef4444', color: '#991b1b', fontWeight: 700, marginBottom: '1rem' }}>
            {error.value}
          </div>
        )}

        {loading.value && (
          <div style={{ color: '#64748b', fontWeight: 700, marginBottom: '1rem' }}>Loading...</div>
        )}

        {active.value === 'kundali' && (
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              {['mini', 'basic', 'pro'].map(rt => (
                <button
                  key={rt}
                  onClick={() => generateKundali(rt)}
                  disabled={loading.value}
                  style={{
                    padding: '0.7rem 0.9rem',
                    borderRadius: '12px',
                    border: '1px solid #bbf7d0',
                    background: '#ecfdf5',
                    color: '#065f46',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Generate {rt.toUpperCase()}
                </button>
              ))}
            </div>

            {/* History list */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.5rem', color: '#0f172a' }}>
                Generated reports
              </div>
              {historyLoading.value && (
                <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Loading history...</div>
              )}
              {historyError.value && (
                <div style={{ color: '#b91c1c', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{historyError.value}</div>
              )}
              {!historyLoading.value && !historyError.value && history.value.length === 0 && (
                <div style={{ color: '#64748b', fontSize: '0.85rem' }}>No reports generated yet.</div>
              )}
              {!historyLoading.value && history.value.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {history.value.map((item) => (
                    <div
                      key={item._id}
                      style={{
                        padding: '0.75rem 0.85rem',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        background: '#f8fafc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', textTransform: 'uppercase' }}>
                          {item.reportType}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                          {new Date(item.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <button
                        onClick={() => downloadReport(item._id)}
                        style={{
                          padding: '0.45rem 0.75rem',
                          borderRadius: '999px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                          color: 'white',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                          cursor: 'pointer'
                        }}
                      >
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {kundaliResult.value && (
              <div style={{ marginTop: '1rem' }}>
                <div style={{ fontWeight: 800, marginBottom: '0.5rem', color: '#1e293b' }}>Response</div>
                {kundaliResult.value?.data?.pdf_url && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <a
                      href={kundaliResult.value.data.pdf_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontWeight: 800, color: '#2563eb', textDecoration: 'underline' }}
                    >
                      Open generated PDF
                    </a>
                  </div>
                )}
                <pre style={{ whiteSpace: 'pre-wrap', background: '#0b1020', color: '#e5e7eb', padding: '1rem', borderRadius: '12px', fontSize: '0.85rem' }}>
                  {JSON.stringify(kundaliResult.value, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {active.value === 'match' && (
          <div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700, marginBottom: '0.5rem' }}>
              Paste payload JSON
            </div>
            <textarea
              value={matchJson.value}
              onInput={(e) => (matchJson.value = e.target.value)}
              rows={14}
              style={{
                width: '100%',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '0.75rem',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                fontSize: '0.85rem'
              }}
            />
            <div style={{ marginTop: '0.75rem' }}>
              <button
                onClick={generateMatchMaking}
                disabled={loading.value}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
                  color: 'white',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Generate report
              </button>
            </div>

            {matchResult.value && (
              <div style={{ marginTop: '1rem' }}>
                <div style={{ fontWeight: 800, marginBottom: '0.5rem', color: '#1e293b' }}>Response</div>
                <pre style={{ whiteSpace: 'pre-wrap', background: '#0b1020', color: '#e5e7eb', padding: '1rem', borderRadius: '12px', fontSize: '0.85rem' }}>
                  {JSON.stringify(matchResult.value, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
};

