import { ref, onMounted } from 'vue';
import api from '../../services/api';
import { useToast } from 'vue-toastification';
import R2Browser from './R2Browser.jsx';

export default {
  name: 'ClientSettings',
  setup() {
    const toast = useToast();
    const activeTab = ref('storage');
    const loading = ref(false);
    const saving = ref(false);
    const ccrLoading = ref(false);
    const ccrSaving = ref(false);
    const storageLoading = ref(false);
    const storageSaving = ref(false);
    const storageMode = ref('s3_only');
    const ccr = ref({ chatCCR: 0.5, voiceCCR: 0.5 });
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

    const fetchCCR = async () => {
      try {
        ccrLoading.value = true;
        const res = await api.request('/client/settings/ccr-rates');
        if (res?.data) ccr.value = res.data;
      } catch (e) {
        toast.error(e?.message || 'Failed to load CCR rates');
      } finally {
        ccrLoading.value = false;
      }
    };

    const saveCCR = async () => {
      try {
        ccrSaving.value = true;
        await api.request('/client/settings/ccr-rates', {
          method: 'PUT',
          body: ccr.value
        });
        toast.success('CCR rates updated successfully');
      } catch (e) {
        toast.error(e?.message || 'Failed to save CCR rates');
      } finally {
        ccrSaving.value = false;
      }
    };

    const fetchStorageMode = async () => {
      try {
        storageLoading.value = true;
        const res = await api.request('/client/settings/storage-mode');
        if (res?.data) storageMode.value = res.data.storageMode;
      } catch (e) {
        toast.error(e?.message || 'Failed to load storage settings');
      } finally {
        storageLoading.value = false;
      }
    };

    const saveStorageMode = async () => {
      try {
        storageSaving.value = true;
        await api.request('/client/settings/storage-mode', {
          method: 'PUT',
          body: { storageMode: storageMode.value }
        });
        toast.success('Storage mode updated successfully');
      } catch (e) {
        toast.error(e?.message || 'Failed to save storage mode');
      } finally {
        storageSaving.value = false;
      }
    };

    onMounted(() => { fetchConfig(); fetchCCR(); fetchStorageMode(); });

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

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: '#f3f4f6', padding: '4px', borderRadius: '10px', width: 'fit-content' }}>
          {[
            { id: 'storage', label: '🗄️ Storage' },
            { id: 'r2browser', label: '📂 R2 Files' },
            { id: 'ccr', label: '💬 CCR Rates' },
            { id: 'astrology', label: '🔮 Astrology' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { activeTab.value = tab.id; }}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '13px',
                background: activeTab.value === tab.id ? '#fff' : 'transparent',
                color: activeTab.value === tab.id ? '#6366f1' : '#6b7280',
                boxShadow: activeTab.value === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div class="row g-4">

          {/* R2 Browser Tab */}
          {activeTab.value === 'r2browser' && (
            <div class="col-12">
              <div class="card shadow-sm border-0">
                <div class="card-body">
                  <R2Browser />
                </div>
              </div>
            </div>
          )}

          {/* Storage Settings Tab */}
          {activeTab.value === 'storage' && (
          <div class="col-12 col-xl-9">
            <div class="card shadow-sm border-0">
              <div class="card-header bg-white border-0 pt-4 pb-0">
                <div class="d-flex align-items-center gap-2 mb-1">
                  <span style={{ fontSize: '22px' }}>🗄️</span>
                  <h4 class="mb-0 fw-bold">Storage Settings</h4>
                </div>
                <p class="text-muted mb-3" style={{ fontSize: '14px' }}>
                  Choose where uploaded files (images, audio, video, documents) are stored.
                  <strong> R2</strong> is Cloudflare backup storage — no egress charges.
                </p>
              </div>
              <div class="card-body pt-2">
                {storageLoading.value ? (
                  <div class="text-muted">Loading storage settings...</div>
                ) : (
                  <>
                    <div class="row g-3">
                      {[
                        {
                          value: 's3_only',
                          icon: '☁️',
                          label: 'AWS S3 Only',
                          desc: 'All files go to Amazon S3. Default mode.',
                          badge: 'Primary',
                          badgeColor: '#0d6efd'
                        },
                        {
                          value: 'r2_only',
                          icon: '🔶',
                          label: 'Cloudflare R2 Only',
                          desc: 'All files go to Cloudflare R2. No egress fees.',
                          badge: 'Cost Saving',
                          badgeColor: '#f97316'
                        },
                        {
                          value: 'both',
                          icon: '🔁',
                          label: 'Both (S3 + R2)',
                          desc: 'Files upload to S3 first, then backup to R2 automatically.',
                          badge: 'Recommended',
                          badgeColor: '#16a34a'
                        }
                      ].map((opt) => (
                        <div class="col-md-4" key={opt.value}>
                          <div
                            onClick={() => { storageMode.value = opt.value; }}
                            style={{
                              border: `2px solid ${storageMode.value === opt.value ? opt.badgeColor : '#e5e7eb'}`,
                              borderRadius: '12px',
                              padding: '20px 16px',
                              cursor: 'pointer',
                              background: storageMode.value === opt.value ? `${opt.badgeColor}10` : '#fff',
                              transition: 'all 0.2s',
                              height: '100%'
                            }}
                          >
                            <div class="d-flex align-items-start gap-3">
                              <div style={{ fontSize: '28px', lineHeight: 1 }}>{opt.icon}</div>
                              <div style={{ flex: 1 }}>
                                <div class="d-flex align-items-center gap-2 mb-1">
                                  <span class="fw-bold" style={{ fontSize: '15px' }}>{opt.label}</span>
                                  <span style={{
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    padding: '2px 8px',
                                    borderRadius: '999px',
                                    background: `${opt.badgeColor}20`,
                                    color: opt.badgeColor
                                  }}>{opt.badge}</span>
                                </div>
                                <p class="text-muted mb-2" style={{ fontSize: '13px', lineHeight: '1.4' }}>{opt.desc}</p>
                                <div class="d-flex align-items-center gap-2">
                                  <div style={{
                                    width: '18px',
                                    height: '18px',
                                    borderRadius: '50%',
                                    border: `2px solid ${storageMode.value === opt.value ? opt.badgeColor : '#d1d5db'}`,
                                    background: storageMode.value === opt.value ? opt.badgeColor : 'transparent',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                  }}>
                                    {storageMode.value === opt.value && (
                                      <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#fff' }} />
                                    )}
                                  </div>
                                  <span style={{ fontSize: '13px', color: storageMode.value === opt.value ? opt.badgeColor : '#9ca3af', fontWeight: 600 }}>
                                    {storageMode.value === opt.value ? 'Selected' : 'Select'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Info box */}
                    <div class="mt-4 p-3 rounded-3" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                      <div class="d-flex gap-2">
                        <span style={{ fontSize: '16px' }}>💡</span>
                        <div style={{ fontSize: '13px', color: '#166534' }}>
                          {storageMode.value === 's3_only' && <span><strong>S3 Only:</strong> Files stored only on AWS S3. If S3 goes down, files will be unavailable.</span>}
                          {storageMode.value === 'r2_only' && <span><strong>R2 Only:</strong> Files stored only on Cloudflare R2. Zero egress fees. Good for cost saving.</span>}
                          {storageMode.value === 'both' && <span><strong>Both:</strong> Files upload to S3 first (fast response), then automatically backed up to R2. Best for reliability.</span>}
                        </div>
                      </div>
                    </div>

                    <div class="mt-4 d-flex justify-content-end">
                      <button
                        class="btn btn-primary px-4"
                        onClick={saveStorageMode}
                        disabled={storageSaving.value}
                      >
                        {storageSaving.value ? 'Saving...' : 'Save Storage Settings'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          )}

          {/* CCR Rates Card */}
          {activeTab.value === 'ccr' && (
          <div class="col-12 col-xl-9">
            <div class="card shadow-sm border-0">
              <div class="card-header bg-white border-0 pt-4">
                <h4 class="mb-1 fw-bold">Credit Charge Rates (CCR)</h4>
                <p class="text-muted mb-0">Set how many credits are deducted per chat message and per second of voice call.</p>
              </div>
              <div class="card-body">
                {ccrLoading.value ? (
                  <div class="text-muted">Loading CCR rates...</div>
                ) : (
                  <>
                    <div class="row g-3">
                      <div class="col-md-6">
                        <label class="form-label fw-semibold">Chat CCR <span class="text-muted fw-normal">(credits per message)</span></label>
                        <div class="input-group">
                          <span class="input-group-text">💬</span>
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            class="form-control"
                            value={ccr.value.chatCCR}
                            onInput={(e) => { ccr.value.chatCCR = Number(e.target.value || 0); }}
                          />
                          <span class="input-group-text">credits</span>
                        </div>
                        <div class="form-text">Deducted from user on every chat message sent.</div>
                      </div>
                      <div class="col-md-6">
                        <label class="form-label fw-semibold">Voice CCR <span class="text-muted fw-normal">(credits per 10 seconds)</span></label>
                        <div class="input-group">
                          <span class="input-group-text">🎙️</span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            class="form-control"
                            value={ccr.value.voiceCCR}
                            onInput={(e) => { ccr.value.voiceCCR = Number(e.target.value || 0); }}
                          />
                          <span class="input-group-text">credits/10s</span>
                        </div>
                        <div class="form-text">Deducted every 10 seconds during voice call. Default: 20 credits.</div>
                      </div>
                    </div>
                    <div class="mt-4 d-flex justify-content-end">
                      <button class="btn btn-primary px-4" onClick={saveCCR} disabled={ccrSaving.value}>
                        {ccrSaving.value ? 'Saving...' : 'Save CCR Rates'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          )}

          {/* Astrology Tools Card */}
          {activeTab.value === 'astrology' && (
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
          )}
        </div>
      </div>
    );
  }
};
