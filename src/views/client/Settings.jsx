import { ref, onMounted } from 'vue';
import api from '../../services/api';
import { useToast } from 'vue-toastification';

export default {
  name: 'ClientSettings',
  setup() {
    const toast = useToast();
    const loading = ref(false);
    const saving = ref(false);
    const config = ref({
      enabled: false,
      currency: 'INR',
      pricing: {
        kundaliMini: 199,
        kundaliBasic: 499,
        kundaliPro: 699,
        matchMaking: 499
      }
    });

    const fetchConfig = async () => {
      try {
        loading.value = true;
        const res = await api.request('/client/settings/astrology-tools');
        if (res?.data) config.value = res.data;
      } catch (e) {
        toast.error(e?.message || 'Failed to load settings');
      } finally {
        loading.value = false;
      }
    };

    const saveConfig = async () => {
      try {
        saving.value = true;
        await api.request('/client/settings/astrology-tools', {
          method: 'PUT',
          body: config.value
        });
        toast.success('Astrology settings updated');
      } catch (e) {
        toast.error(e?.message || 'Failed to save settings');
      } finally {
        saving.value = false;
      }
    };

    onMounted(fetchConfig);

    const priceField = (label, key) => (
      <div class="col-md-6">
        <label class="form-label fw-semibold">{label}</label>
        <div class="input-group">
          <span class="input-group-text">{config.value.currency || 'INR'}</span>
          <input
            type="number"
            min="0"
            class="form-control"
            value={config.value.pricing[key]}
            onInput={(e) => { config.value.pricing[key] = Number(e.target.value || 0); }}
          />
        </div>
      </div>
    );

    return () => (
      <div class="container-fluid">
        <div class="row">
          <div class="col-12 col-xl-9">
            <div class="card shadow-sm border-0">
              <div class="card-header bg-white border-0 pt-4">
                <h4 class="mb-1 fw-bold">Astrology Tools Settings</h4>
                <p class="text-muted mb-0">Enable/disable Horoscope & Kundali reports and manage plan pricing.</p>
              </div>
              <div class="card-body">
                {loading.value ? (
                  <div class="text-muted">Loading settings...</div>
                ) : (
                  <>
                    <div class="d-flex align-items-center justify-content-between p-3 rounded-3 border mb-4">
                      <div>
                        <div class="fw-semibold">Enable Astrology Tools</div>
                        <div class="text-muted small">If disabled, users will not see Horoscope/Reports section.</div>
                      </div>
                      <div class="form-check form-switch m-0">
                        <input
                          class="form-check-input"
                          type="checkbox"
                          role="switch"
                          checked={config.value.enabled}
                          onChange={(e) => { config.value.enabled = e.target.checked; }}
                          style={{ width: '3rem', height: '1.5rem' }}
                        />
                      </div>
                    </div>

                    <div class="mb-3">
                      <label class="form-label fw-semibold">Currency</label>
                      <input
                        type="text"
                        class="form-control"
                        value={config.value.currency}
                        onInput={(e) => { config.value.currency = (e.target.value || 'INR').toUpperCase(); }}
                      />
                    </div>

                    <div class="row g-3">
                      {priceField('Kundali Mini Plan', 'kundaliMini')}
                      {priceField('Kundali Basic Plan', 'kundaliBasic')}
                      {priceField('Kundali Pro Plan', 'kundaliPro')}
                      {priceField('Match Making Plan', 'matchMaking')}
                    </div>

                    <div class="mt-4 d-flex justify-content-end">
                      <button class="btn btn-primary px-4" onClick={saveConfig} disabled={saving.value}>
                        {saving.value ? 'Saving...' : 'Save Settings'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
};
