import { ref } from 'vue';

const SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'
];

export default {
  name: 'HoroscopeView',
  props: {
    userId: { type: String, required: true },
    api: { type: Object, required: true },
    token: { type: String, required: true }
  },
  setup(props) {
    const sign = ref('aries');
    const loading = ref(false);
    const error = ref(null);
    const daily = ref(null);
    const monthly = ref(null);

    const fetchDaily = async () => {
      try {
        loading.value = true;
        error.value = null;
        daily.value = null;
        const res = await props.api.post(
          `/client/users/${props.userId}/horoscope/daily/${sign.value}`,
          { timezone: 5.5 },
          { token: props.token }
        );
        daily.value = res?.data?.data || res?.data;
      } catch (e) {
        error.value = e?.message || 'Failed to fetch daily horoscope';
      } finally {
        loading.value = false;
      }
    };

    const fetchMonthly = async () => {
      try {
        loading.value = true;
        error.value = null;
        monthly.value = null;
        const res = await props.api.post(
          `/client/users/${props.userId}/horoscope/monthly/${sign.value}`,
          { timezone: 5.5 },
          { token: props.token }
        );
        monthly.value = res?.data?.data || res?.data;
      } catch (e) {
        error.value = e?.message || 'Failed to fetch monthly horoscope';
      } finally {
        loading.value = false;
      }
    };

    return () => (
      <div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 180px' }}>
            <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Sun sign</label>
            <select
              value={sign.value}
              onChange={(e) => (sign.value = e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.75rem',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                background: 'white'
              }}
            >
              {SIGNS.map(s => (
                <option key={s} value={s}>{s.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchDaily}
            disabled={loading.value}
            style={{
              padding: '0.7rem 0.9rem',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: 'white',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Daily
          </button>

          <button
            onClick={fetchMonthly}
            disabled={loading.value}
            style={{
              padding: '0.7rem 0.9rem',
              borderRadius: '12px',
              border: '1px solid #c7d2fe',
              background: '#eef2ff',
              color: '#3730a3',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Monthly
          </button>
        </div>

        {error.value && (
          <div style={{ padding: '0.9rem', borderRadius: '12px', background: '#fef3c7', border: '1px dashed #f59e0b', color: '#92400e', fontWeight: 600 }}>
            {error.value}
          </div>
        )}

        {loading.value && (
          <div style={{ color: '#64748b', fontWeight: 600 }}>Loading...</div>
        )}

        {daily.value && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ fontWeight: 800, marginBottom: '0.5rem', color: '#1e293b' }}>Daily result</div>
            <pre style={{ whiteSpace: 'pre-wrap', background: '#0b1020', color: '#e5e7eb', padding: '1rem', borderRadius: '12px', fontSize: '0.85rem' }}>
              {JSON.stringify(daily.value, null, 2)}
            </pre>
          </div>
        )}

        {monthly.value && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ fontWeight: 800, marginBottom: '0.5rem', color: '#1e293b' }}>Monthly result</div>
            <pre style={{ whiteSpace: 'pre-wrap', background: '#0b1020', color: '#e5e7eb', padding: '1rem', borderRadius: '12px', fontSize: '0.85rem' }}>
              {JSON.stringify(monthly.value, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  }
};

