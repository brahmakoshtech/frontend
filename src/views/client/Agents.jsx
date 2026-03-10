import { ref, onMounted, computed } from 'vue';
import api from '../../services/api.js';

export default {
  name: 'ClientAgents',
  setup() {
    const loading = ref(false);
    const saving = ref(false);
    const error = ref(null);
    const success = ref(null);

    const agents = ref([]);
    const voices = ref([]);

    const form = ref({
      name: '',
      description: '',
      voiceName: '',
      systemPrompt: '',
      isActive: true,
    });

    const canSubmit = computed(() => {
      return (
        form.value.name.trim().length > 0 &&
        form.value.voiceName.trim().length > 0 &&
        form.value.systemPrompt.trim().length > 0
      );
    });

    const loadVoices = async () => {
      const res = await api.request('/voice-config', { method: 'GET' });
      voices.value = res?.data || res?.data?.data || res?.data || [];
      // Normalize shape from backend: { success, count, data: [...] }
      if (res?.success && Array.isArray(res?.data)) {
        voices.value = res.data;
      } else if (res?.success && Array.isArray(res?.data?.data)) {
        voices.value = res.data.data;
      } else if (res?.success && Array.isArray(res?.data)) {
        voices.value = res.data;
      } else if (res?.success && Array.isArray(res?.data?.data)) {
        voices.value = res.data.data;
      } else if (res?.success && Array.isArray(res?.data)) {
        voices.value = res.data;
      }

      // Backend voice-config returns { success, count, data }
      if (res?.success && Array.isArray(res?.data)) {
        voices.value = res.data;
      }
      if (res?.success && Array.isArray(res?.data?.data)) {
        voices.value = res.data.data;
      }

      // Default select first voice
      if (!form.value.voiceName && voices.value.length > 0) {
        form.value.voiceName = voices.value[0].name;
      }
    };

    const loadAgents = async () => {
      const res = await api.request('/client/agents', { method: 'GET' });
      agents.value = res?.data || [];
    };

    const refresh = async () => {
      loading.value = true;
      error.value = null;
      try {
        await Promise.all([loadVoices(), loadAgents()]);
      } catch (e) {
        error.value = e.message || 'Failed to load agents';
      } finally {
        loading.value = false;
      }
    };

    const createAgent = async () => {
      if (!canSubmit.value) return;
      saving.value = true;
      error.value = null;
      success.value = null;

      try {
        const payload = {
          name: form.value.name.trim(),
          description: form.value.description.trim(),
          voiceName: form.value.voiceName,
          systemPrompt: form.value.systemPrompt.trim(),
          isActive: !!form.value.isActive,
        };

        await api.request('/client/agents', { method: 'POST', body: payload });

        success.value = 'Agent created successfully';
        form.value.name = '';
        form.value.description = '';
        form.value.systemPrompt = '';
        form.value.isActive = true;
        await loadAgents();
      } catch (e) {
        error.value = e.message || 'Failed to create agent';
      } finally {
        saving.value = false;
      }
    };

    const toggleAgent = async (agentId) => {
      try {
        await api.request(`/client/agents/${agentId}/toggle`, { method: 'PATCH', body: {} });
        await loadAgents();
      } catch (e) {
        error.value = e.message || 'Failed to toggle agent';
      }
    };

    onMounted(refresh);

    const cardStyle = {
      background: 'white',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
    };

    return () => (
      <div style={{ display: 'grid', gap: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>Agents</h1>
            <p style={{ margin: '0.25rem 0 0', color: '#6b7280' }}>
              Create AI agent presets (voice + system prompt). Mobile users can select an agent and the voice agent will respond using that configuration.
            </p>
          </div>
          <button
            class="btn btn-outline"
            disabled={loading.value}
            onClick={refresh}
            style={{
              padding: '0.6rem 0.9rem',
              borderRadius: '10px',
              border: '1px solid #d1d5db',
              background: '#fff',
              cursor: loading.value ? 'not-allowed' : 'pointer',
            }}
          >
            Refresh
          </button>
        </div>

        {error.value && (
          <div style={{ ...cardStyle, padding: '0.9rem', borderColor: '#fecaca', background: '#fff5f5', color: '#991b1b' }}>
            {error.value}
          </div>
        )}
        {success.value && (
          <div style={{ ...cardStyle, padding: '0.9rem', borderColor: '#bbf7d0', background: '#f0fdf4', color: '#166534' }}>
            {success.value}
          </div>
        )}

        <div style={{ ...cardStyle, padding: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#111827' }}>Create Agent</h2>
          <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'grid', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.85rem', color: '#374151', fontWeight: 600 }}>Name *</label>
              <input
                value={form.value.name}
                onInput={(e) => (form.value.name = e.target.value)}
                placeholder="e.g., Krishna Guidance Agent"
                style={{ padding: '0.65rem 0.75rem', borderRadius: '10px', border: '1px solid #d1d5db' }}
              />
            </div>

            <div style={{ display: 'grid', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.85rem', color: '#374151', fontWeight: 600 }}>Voice *</label>
              <select
                value={form.value.voiceName}
                onChange={(e) => (form.value.voiceName = e.target.value)}
                style={{ padding: '0.65rem 0.75rem', borderRadius: '10px', border: '1px solid #d1d5db', background: 'white' }}
              >
                {voices.value.map((v) => (
                  <option value={v.name}>
                    {v.displayName || v.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginTop: '1rem', display: 'grid', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.85rem', color: '#374151', fontWeight: 600 }}>Description</label>
            <input
              value={form.value.description}
              onInput={(e) => (form.value.description = e.target.value)}
              placeholder="Optional short description"
              style={{ padding: '0.65rem 0.75rem', borderRadius: '10px', border: '1px solid #d1d5db' }}
            />
          </div>

          <div style={{ marginTop: '1rem', display: 'grid', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.85rem', color: '#374151', fontWeight: 600 }}>System Prompt *</label>
            <textarea
              value={form.value.systemPrompt}
              onInput={(e) => (form.value.systemPrompt = e.target.value)}
              rows={6}
              placeholder="Write the system prompt that controls how the agent responds..."
              style={{
                padding: '0.75rem',
                borderRadius: '10px',
                border: '1px solid #d1d5db',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <input
              type="checkbox"
              checked={form.value.isActive}
              onChange={(e) => (form.value.isActive = e.target.checked)}
            />
            <span style={{ color: '#374151' }}>Active</span>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <button
              disabled={!canSubmit.value || saving.value}
              onClick={createAgent}
              style={{
                padding: '0.7rem 1rem',
                borderRadius: '10px',
                border: '1px solid #111827',
                background: saving.value ? '#374151' : '#111827',
                color: 'white',
                cursor: !canSubmit.value || saving.value ? 'not-allowed' : 'pointer',
              }}
            >
              {saving.value ? 'Creating...' : 'Create Agent'}
            </button>
          </div>
        </div>

        <div style={{ ...cardStyle, padding: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#111827' }}>Existing Agents</h2>
          {loading.value ? (
            <p style={{ marginTop: '0.75rem', color: '#6b7280' }}>Loading...</p>
          ) : agents.value.length === 0 ? (
            <p style={{ marginTop: '0.75rem', color: '#6b7280' }}>No agents created yet.</p>
          ) : (
            <div style={{ marginTop: '0.75rem', display: 'grid', gap: '0.75rem' }}>
              {agents.value.map((a) => (
                <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '0.9rem', background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '1rem' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                        <div style={{ fontWeight: 800, color: '#111827' }}>{a.name}</div>
                        <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '999px', background: a.isActive ? '#dcfce7' : '#fee2e2', color: a.isActive ? '#166534' : '#991b1b' }}>
                          {a.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                        <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '999px', background: '#eef2ff', color: '#3730a3' }}>
                          {a.voiceName}
                        </span>
                      </div>
                      {a.description ? (
                        <div style={{ marginTop: '0.25rem', color: '#6b7280' }}>{a.description}</div>
                      ) : null}
                      <div style={{ marginTop: '0.5rem', color: '#111827', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
                        <span style={{ color: '#6b7280' }}>Prompt:</span> {a.systemPrompt}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                      <button
                        onClick={() => toggleAgent(a._id)}
                        style={{
                          padding: '0.55rem 0.75rem',
                          borderRadius: '10px',
                          border: '1px solid #d1d5db',
                          background: '#fff',
                          cursor: 'pointer',
                        }}
                      >
                        {a.isActive ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
};

