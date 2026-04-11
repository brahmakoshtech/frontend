import { ref, onMounted, computed, watch } from 'vue';
import api from '../../services/api.js';
import { useAuth } from '../../store/auth.js';

const sym = (currency) => ({ INR: '₹', USD: '$', AED: 'AED ' }[currency] || '');
const fmtMajor = (minor, currency) => {
  const m = Number(minor) / 100;
  return `${sym(currency)}${m.toFixed(2)}`;
};

export default {
  name: 'ClientSubscriptionPlans',
  setup() {
    const { userRole } = useAuth();
    const plans = ref([]);
    const clients = ref([]);
    const selectedOwnerId = ref('');
    const loading = ref(false);
    const saving = ref(false);
    const error = ref(null);
    const editingId = ref(null);
    const showForm = ref(false);

    const form = ref({
      name: '',
      description: '',
      currency: 'INR',
      mrpMajor: '',
      offerMajor: '',
      creditsPerGrant: '',
      billingType: 'one_time',
      billingInterval: 'month',
      yearlyExtraCredits: '0',
      featuresText: '',
      imageUrl: '',
      payModel: 'premium',
      isEnabled: true,
      sortOrder: '0',
    });

    const isAdmin = computed(
      () => userRole.value === 'admin' || userRole.value === 'super_admin'
    );

    const ownerReady = computed(() => !isAdmin.value || !!selectedOwnerId.value);

    const loadClients = async () => {
      if (!isAdmin.value) return;
      try {
        const res = await api.getClients();
        const list = res?.data?.clients || [];
        clients.value = Array.isArray(list) ? list : [];
        if (clients.value.length && !selectedOwnerId.value) {
          selectedOwnerId.value = clients.value[0]._id;
        }
      } catch (e) {
        console.error('[SubscriptionPlans] loadClients', e);
      }
    };

    const fetchPlans = async () => {
      if (!ownerReady.value) return;
      loading.value = true;
      error.value = null;
      try {
        const params = {};
        if (isAdmin.value) params.ownerClientId = selectedOwnerId.value;
        const res = await api.getClientSubscriptionPlans(params);
        plans.value = res?.data?.plans || [];
      } catch (e) {
        error.value = e?.message || 'Failed to load plans';
        plans.value = [];
      } finally {
        loading.value = false;
      }
    };

    watch(selectedOwnerId, () => {
      if (isAdmin.value) fetchPlans();
    });

    const resetForm = () => {
      editingId.value = null;
      form.value = {
        name: '',
        description: '',
        currency: 'INR',
        mrpMajor: '',
        offerMajor: '',
        creditsPerGrant: '',
        billingType: 'one_time',
        billingInterval: 'month',
        yearlyExtraCredits: '0',
        featuresText: '',
        imageUrl: '',
        payModel: 'premium',
        isEnabled: true,
        sortOrder: '0',
      };
    };

    const openCreate = () => {
      resetForm();
      showForm.value = true;
    };

    const openEdit = (p) => {
      editingId.value = p._id;
      form.value = {
        name: p.name || '',
        description: p.description || '',
        currency: p.currency || 'INR',
        mrpMajor: String((Number(p.mrpMinorUnits) || 0) / 100),
        offerMajor: String((Number(p.offerPriceMinorUnits) || 0) / 100),
        creditsPerGrant: String(p.creditsPerGrant ?? ''),
        billingType: p.billingType || 'one_time',
        billingInterval: p.billingInterval || 'month',
        yearlyExtraCredits: String(p.yearlyExtraCredits ?? 0),
        featuresText: Array.isArray(p.features) ? p.features.join('\n') : '',
        imageUrl: p.imageUrl || '',
        payModel: p.payModel || 'premium',
        isEnabled: p.isEnabled !== false,
        sortOrder: String(p.sortOrder ?? 0),
      };
      showForm.value = true;
    };

    const toMinor = (majorStr) => Math.round(parseFloat(majorStr || '0') * 100);

    const submitForm = async (e) => {
      e?.preventDefault?.();
      if (!ownerReady.value) {
        alert('Select a client first');
        return;
      }
      const mrpMinorUnits = toMinor(form.value.mrpMajor);
      const offerPriceMinorUnits = toMinor(form.value.offerMajor);
      const creditsPerGrant = parseInt(form.value.creditsPerGrant, 10);
      if (!form.value.name.trim()) {
        alert('Name is required');
        return;
      }
      if (!Number.isFinite(creditsPerGrant) || creditsPerGrant < 0) {
        alert('Credits must be a non-negative integer');
        return;
      }
      if (form.value.billingType === 'recurring' && offerPriceMinorUnits < 1) {
        alert('Recurring plans need a positive offer price (Stripe)');
        return;
      }

      const body = {
        name: form.value.name.trim(),
        description: form.value.description || '',
        currency: form.value.currency,
        mrpMinorUnits,
        offerPriceMinorUnits,
        creditsPerGrant,
        billingType: form.value.billingType,
        billingInterval: form.value.billingType === 'recurring' ? form.value.billingInterval : undefined,
        yearlyExtraCredits: parseInt(form.value.yearlyExtraCredits, 10) || 0,
        features: form.value.featuresText
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        imageUrl: form.value.imageUrl || '',
        payModel: form.value.payModel,
        isEnabled: !!form.value.isEnabled,
        sortOrder: parseInt(form.value.sortOrder, 10) || 0,
      };

      if (isAdmin.value) body.ownerClientId = selectedOwnerId.value;

      saving.value = true;
      try {
        if (editingId.value) {
          await api.updateClientSubscriptionPlan(editingId.value, body);
        } else {
          await api.createClientSubscriptionPlan(body);
        }
        showForm.value = false;
        resetForm();
        await fetchPlans();
      } catch (err) {
        alert(err?.message || 'Save failed');
      } finally {
        saving.value = false;
      }
    };

    const toggleEnabled = async (p) => {
      try {
        await api.updateClientSubscriptionPlan(p._id, { isEnabled: !p.isEnabled });
        await fetchPlans();
      } catch (err) {
        alert(err?.message || 'Update failed');
      }
    };

    const removePlan = async (p) => {
      if (!confirm(`Delete plan "${p.name}"?`)) return;
      try {
        await api.deleteClientSubscriptionPlan(p._id);
        await fetchPlans();
      } catch (err) {
        alert(err?.message || 'Delete failed');
      }
    };

    onMounted(async () => {
      await loadClients();
      await fetchPlans();
    });

    return () => (
      <div class="card">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <h1 class="card-title mb-0">Subscription &amp; credit plans</h1>
            <button type="button" class="btn btn-primary" onClick={openCreate} disabled={!ownerReady.value}>
              New plan
            </button>
          </div>
          <p class="text-muted small mb-4">
            One-time packs use Stripe PaymentIntent. Recurring plans create a Stripe price on save. Amounts below are in
            major units ({sym('INR')} / $ / AED); they are stored as minor units on the server.
          </p>

          {isAdmin.value && (
            <div class="row g-2 mb-4">
              <div class="col-md-6">
                <label class="form-label">Manage plans for client</label>
                <select
                  class="form-select"
                  value={selectedOwnerId.value}
                  onChange={(e) => {
                    selectedOwnerId.value = e.target.value;
                  }}
                >
                  {clients.value.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.businessName || c.email} ({c.clientId || c._id})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {error.value && <div class="alert alert-danger">{error.value}</div>}

          {loading.value ? (
            <p>Loading…</p>
          ) : (
            <div class="table-responsive">
              <table class="table table-sm align-middle">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Price</th>
                    <th>Credits</th>
                    <th>Enabled</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {plans.value.map((p) => (
                    <tr key={p._id}>
                      <td>
                        <strong>{p.name}</strong>
                        <div class="small text-muted">{p.payModel}</div>
                      </td>
                      <td>
                        {p.billingType === 'recurring' ? (
                          <span>
                            Recurring / {p.billingInterval}
                          </span>
                        ) : (
                          'One-time'
                        )}
                      </td>
                      <td>
                        {fmtMajor(p.offerPriceMinorUnits, p.currency)}
                        {Number(p.mrpMinorUnits) > Number(p.offerPriceMinorUnits) && (
                          <span class="text-muted text-decoration-line-through ms-1">{fmtMajor(p.mrpMinorUnits, p.currency)}</span>
                        )}
                      </td>
                      <td>{p.creditsGranted ?? p.creditsPerGrant}</td>
                      <td>
                        <div class="form-check form-switch">
                          <input
                            class="form-check-input"
                            type="checkbox"
                            checked={p.isEnabled}
                            onChange={() => toggleEnabled(p)}
                          />
                        </div>
                      </td>
                      <td class="text-end">
                        <button type="button" class="btn btn-sm btn-outline-secondary me-1" onClick={() => openEdit(p)}>
                          Edit
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-danger" onClick={() => removePlan(p)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!plans.value.length && <p class="text-muted">No plans yet. Create one to sell credits.</p>}
            </div>
          )}

          {showForm.value && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(15,23,42,0.35)',
                zIndex: 1050,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
              }}
            >
              <div
                class="bg-white rounded shadow"
                style={{ maxWidth: '520px', width: '100%', maxHeight: '90vh', overflow: 'auto' }}
              >
                <form class="p-4" onSubmit={submitForm}>
                  <h5 class="mb-3">{editingId.value ? 'Edit plan' : 'New plan'}</h5>
                  <div class="mb-2">
                    <label class="form-label">Name *</label>
                    <input class="form-control" value={form.value.name} onInput={(e) => (form.value.name = e.target.value)} required />
                  </div>
                  <div class="mb-2">
                    <label class="form-label">Description</label>
                    <textarea class="form-control" rows="2" value={form.value.description} onInput={(e) => (form.value.description = e.target.value)} />
                  </div>
                  <div class="row g-2 mb-2">
                    <div class="col-6">
                      <label class="form-label">Currency</label>
                      <select
                        class="form-select"
                        value={form.value.currency}
                        onChange={(e) => (form.value.currency = e.target.value)}
                      >
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="AED">AED</option>
                      </select>
                    </div>
                    <div class="col-6">
                      <label class="form-label">Sort order</label>
                      <input class="form-control" type="number" value={form.value.sortOrder} onInput={(e) => (form.value.sortOrder = e.target.value)} />
                    </div>
                  </div>
                  <div class="row g-2 mb-2">
                    <div class="col-6">
                      <label class="form-label">MRP (major)</label>
                      <input class="form-control" type="number" step="0.01" min="0" value={form.value.mrpMajor} onInput={(e) => (form.value.mrpMajor = e.target.value)} />
                    </div>
                    <div class="col-6">
                      <label class="form-label">Offer price (major) *</label>
                      <input class="form-control" type="number" step="0.01" min="0" value={form.value.offerMajor} onInput={(e) => (form.value.offerMajor = e.target.value)} required />
                    </div>
                  </div>
                  <div class="mb-2">
                    <label class="form-label">Credits per grant *</label>
                    <input class="form-control" type="number" min="0" value={form.value.creditsPerGrant} onInput={(e) => (form.value.creditsPerGrant = e.target.value)} required />
                  </div>
                  <div class="row g-2 mb-2">
                    <div class="col-6">
                      <label class="form-label">Billing</label>
                      <select
                        class="form-select"
                        value={form.value.billingType}
                        onChange={(e) => (form.value.billingType = e.target.value)}
                      >
                        <option value="one_time">One-time pack</option>
                        <option value="recurring">Recurring subscription</option>
                      </select>
                    </div>
                    {form.value.billingType === 'recurring' && (
                      <div class="col-6">
                        <label class="form-label">Interval</label>
                        <select
                          class="form-select"
                          value={form.value.billingInterval}
                          onChange={(e) => (form.value.billingInterval = e.target.value)}
                        >
                          <option value="month">Monthly</option>
                          <option value="year">Yearly</option>
                        </select>
                      </div>
                    )}
                  </div>
                  {form.value.billingType === 'recurring' && form.value.billingInterval === 'year' && (
                    <div class="mb-2">
                      <label class="form-label">Extra credits (yearly bonus)</label>
                      <input class="form-control" type="number" min="0" value={form.value.yearlyExtraCredits} onInput={(e) => (form.value.yearlyExtraCredits = e.target.value)} />
                    </div>
                  )}
                  <div class="mb-2">
                    <label class="form-label">Features (one per line)</label>
                    <textarea class="form-control" rows="3" value={form.value.featuresText} onInput={(e) => (form.value.featuresText = e.target.value)} />
                  </div>
                  <div class="mb-2">
                    <label class="form-label">Image URL</label>
                    <input class="form-control" value={form.value.imageUrl} onInput={(e) => (form.value.imageUrl = e.target.value)} />
                  </div>
                  <div class="row g-2 mb-3">
                    <div class="col-6">
                      <label class="form-label">Pay model</label>
                      <select class="form-select" value={form.value.payModel} onChange={(e) => (form.value.payModel = e.target.value)}>
                        <option value="premium">Premium</option>
                        <option value="freemium">Freemium</option>
                      </select>
                    </div>
                    <div class="col-6 d-flex align-items-end">
                      <div class="form-check">
                        <input
                          class="form-check-input"
                          type="checkbox"
                          checked={form.value.isEnabled}
                          id="sp-enabled"
                          onChange={(e) => (form.value.isEnabled = e.target.checked)}
                        />
                        <label class="form-check-label" for="sp-enabled">
                          Enabled (visible in storefront)
                        </label>
                      </div>
                    </div>
                  </div>
                  <div class="d-flex gap-2 justify-content-end">
                    <button
                      type="button"
                      class="btn btn-outline-secondary"
                      onClick={() => {
                        showForm.value = false;
                        resetForm();
                      }}
                    >
                      Cancel
                    </button>
                    <button type="submit" class="btn btn-primary" disabled={saving.value}>
                      {saving.value ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  },
};
