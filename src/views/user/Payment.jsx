import { ref, onMounted, computed, nextTick } from 'vue';
import api from '../../services/api.js';

export default {
  name: 'UserPayment',
  setup() {
    const amount = ref('');
    const loading = ref(false);
    const paying = ref(false);
    const elementReady = ref(false);
    const error = ref(null);
    const success = ref(null);
    const clientSecret = ref(null);
    const stripeInstance = ref(null);
    const elementsInstance = ref(null);
    const paymentElement = ref(null);
    const paymentMountEl = ref(null);
    let stripePromise = null;

    const amountNum = computed(() => parseFloat(amount.value) || 0);

    // Loaded from backend
    const publishableKey = ref('');
    const minAmountUnits = ref(500);        // ₹500 default until config loads
    const creditsPerUnit = ref(2);         // 1 rupee = 2 credits (default)
    const plans = ref([]);                 // [{ amount, credits }]
    const selectedPlanAmount = ref(null);  // rupees
    const loadingPlans = ref(false);

    const effectiveAmount = computed(() => {
      if (selectedPlanAmount.value) return selectedPlanAmount.value;
      return amountNum.value;
    });

    const creditsDisplay = computed(() => {
      const amt = effectiveAmount.value;
      if (!amt || amt <= 0) return '—';
      return Math.floor(amt * creditsPerUnit.value);
    });

    const canPay = computed(() => effectiveAmount.value >= minAmountUnits.value && !paying.value);
    const canSubmitPayment = computed(
      () =>
        !!clientSecret.value &&
        !!stripeInstance.value &&
        !!elementsInstance.value &&
        !!paymentElement.value &&
        !!paymentMountEl.value &&
        elementReady.value &&
        !paying.value
    );
    const methodChoice = ref('auto'); // 'auto' | 'wallet' | 'card'

    const loadStripe = async (pk) => {
      const key = pk || publishableKey.value || import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
      if (!key) return null;
      if (stripePromise) return stripePromise;
      const { loadStripe: load } = await import('@stripe/stripe-js');
      stripePromise = load(key);
      return stripePromise;
    };

    const initPayment = async () => {
      if (!clientSecret.value) return;
      error.value = null;
      elementReady.value = false;
      console.log('[Payment] initPayment', {
        clientSecret: !!clientSecret.value,
        methodChoice: methodChoice.value,
      });

      try {
        // Ensure DOM has rendered the payment mount container
        await nextTick();
        // Wait one frame in case the DOM node was replaced by re-render
        await new Promise((r) => requestAnimationFrame(r));

        if (!paymentMountEl.value) {
          throw new Error('Payment form container not ready. Please try again.');
        }

        // If re-initializing, always unmount old element first
        if (paymentElement.value) {
          try { paymentElement.value.unmount(); } catch (_) {}
          paymentElement.value = null;
        }
        elementsInstance.value = null;

        const stripe = await loadStripe(publishableKey.value);
        if (!stripe) {
          error.value = 'Stripe not configured. Missing publishable key from backend.';
          return;
        }
        stripeInstance.value = stripe;

        const paymentElementOptsBase = {
          layout: 'tabs',
        };
        let paymentMethodOrder;
        if (methodChoice.value === 'wallet') {
          paymentMethodOrder = ['apple_pay', 'google_pay', 'link', 'card'];
        } else if (methodChoice.value === 'card') {
          paymentMethodOrder = ['card', 'apple_pay', 'google_pay', 'link'];
        }

        const elements = stripe.elements({
          clientSecret: clientSecret.value,
          appearance: { theme: 'stripe' },
        });
        elementsInstance.value = elements;
        const paymentElementOpts = paymentMethodOrder
          ? { ...paymentElementOptsBase, paymentMethodOrder }
          : paymentElementOptsBase;
        const paymentEl = elements.create('payment', paymentElementOpts);
        paymentEl.on('ready', () => {
          elementReady.value = true;
        });
        paymentEl.on('loaderror', (evt) => {
          console.error('[Payment] Payment Element loaderror', evt);
          elementReady.value = false;
          error.value = evt?.error?.message || 'Failed to load payment form (Stripe session error)';
        });
        paymentEl.mount(paymentMountEl.value);
        paymentElement.value = paymentEl;
      } catch (e) {
        console.error('[Payment] initPayment error', e);
        error.value = e?.message || 'Failed to initialize payment form';
        elementReady.value = false;
        // If element failed to mount, keep clientSecret but prevent submit
      }
    };

    const createIntent = async () => {
      if (!canPay.value) return;
      console.log('[Payment] createIntent start', {
        amount: amountNum.value,
        planAmount: selectedPlanAmount.value,
        methodChoice: methodChoice.value,
      });
      loading.value = true;
      error.value = null;
      success.value = null;
      clientSecret.value = null;
      elementReady.value = false;
      if (paymentElement.value) {
        try {
          paymentElement.value.unmount();
        } catch (_) {}
        paymentElement.value = null;
      }
      elementsInstance.value = null;
      try {
        const body = selectedPlanAmount.value
          ? { planAmount: selectedPlanAmount.value }
          : { amount: amountNum.value };

        const res = await api.request('/user/payment/create-intent', {
          method: 'POST',
          body,
        });
        if (!res?.success || !res?.clientSecret) throw new Error(res?.message || 'Failed to create payment');
        console.log('[Payment] createIntent success', {
          clientSecret: !!res.clientSecret,
          amountUnits: res.amountUnits,
          credits: res.credits,
        });
        clientSecret.value = res.clientSecret;
        if (res.publishableKey) publishableKey.value = res.publishableKey;
        stripePromise = null;
        await loadStripe(res.publishableKey || publishableKey.value);
        await initPayment();
      } catch (e) {
        console.error('[Payment] createIntent error', e);
        error.value = e?.message || 'Failed to initialize payment';
      } finally {
        loading.value = false;
      }
    };

    const handleSubmit = async () => {
      if (!canSubmitPayment.value) {
        error.value = 'Payment form is not ready yet. Please wait a moment and try again.';
        return;
      }
      paying.value = true;
      error.value = null;
      try {
        const stripe = await stripeInstance.value;
        const baseUrl = window.location.origin + window.location.pathname;
        console.log('[Payment] handleSubmit confirmPayment', {
          returnUrl: baseUrl,
          methodChoice: methodChoice.value,
        });
        const { error: submitError } = await stripe.confirmPayment({
          elements: elementsInstance.value,
          confirmParams: {
            return_url: baseUrl,
            payment_method_data: {
              billing_details: { name: 'Credits Purchase' },
            },
          },
        });
        if (submitError) {
          console.error('[Payment] confirmPayment error', submitError);
          error.value = submitError.message || 'Payment failed';
        }
      } catch (e) {
        console.error('[Payment] handleSubmit exception', e);
        error.value = e?.message || 'Payment failed';
      } finally {
        paying.value = false;
      }
    };

    const processReturnFromStripe = async () => {
      const params = new URLSearchParams(window.location.search);
      const paymentIntentId = params.get('payment_intent');
      const status = params.get('redirect_status');
      if (!paymentIntentId || status !== 'succeeded') return;
      console.log('[Payment] processReturnFromStripe', {
        paymentIntentId,
        status,
      });
      loading.value = true;
      error.value = null;
      try {
        const res = await api.request('/user/payment/confirm', {
          method: 'POST',
          body: { paymentIntentId },
        });
        if (res?.success) {
          success.value = `Added ${res.data?.creditsAdded || 0} credits. New balance: ${res.data?.newBalance || 0}`;
        } else {
          error.value = res?.message || 'Failed to add credits';
        }
        window.history.replaceState({}, '', window.location.pathname);
      } catch (e) {
        console.error('[Payment] processReturnFromStripe error', e);
        error.value = e?.message || 'Failed to add credits';
      } finally {
        loading.value = false;
      }
    };

    const loadConfigAndPlans = async () => {
      try {
        loadingPlans.value = true;
        const [configRes, plansRes] = await Promise.all([
          api.request('/user/payment/config', { method: 'GET' }),
          api.request('/user/payment/plans', { method: 'GET' }),
        ]);

        if (configRes?.success) {
          if (configRes.minAmountUnits) minAmountUnits.value = configRes.minAmountUnits;
          if (configRes.mode) console.log('[Payment] backend mode', configRes.mode);
        }

        if (plansRes?.success) {
          creditsPerUnit.value = plansRes.data?.creditsPerUnit || creditsPerUnit.value;
          plans.value = Array.isArray(plansRes.data?.plans) ? plansRes.data.plans : [];
        }
      } catch (e) {
        console.error('[Payment] loadConfigAndPlans error', e);
      } finally {
        loadingPlans.value = false;
      }
    };

    onMounted(() => {
      loadConfigAndPlans();
      processReturnFromStripe();
    });

    const card = {
      background: '#fff',
      borderRadius: '16px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    };

    return () => (
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '1.5rem' }}>
        <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>
          Recharge Credits
        </h1>
        <p style={{ margin: '0 0 1.5rem', color: '#6b7280', fontSize: '0.9rem' }}>
          Add credits to your account using Apple Pay or card. Works on web and mobile.
        </p>

        {error.value && (
          <div style={{ ...card, padding: '0.85rem', marginBottom: '1rem', borderColor: '#fecaca', background: '#fff5f5', color: '#991b1b' }}>
            {error.value}
          </div>
        )}
        {success.value && (
          <div style={{ ...card, padding: '0.85rem', marginBottom: '1rem', borderColor: '#bbf7d0', background: '#f0fdf4', color: '#166534' }}>
            {success.value}
          </div>
        )}

        <div style={{ ...card, padding: '1.5rem' }}>
          <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
            {['auto', 'wallet', 'card'].map((mode) => {
              const labels = {
                auto: 'Auto (Stripe)',
                wallet: 'Apple / Google Pay',
                card: 'Card only',
              };
              const active = methodChoice.value === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    methodChoice.value = mode;
                    console.log('[Payment] methodChoice set', { mode });
                    if (clientSecret.value) {
                      // Recreate element with new ordering
                      if (paymentElement.value) {
                        try { paymentElement.value.unmount(); } catch (_) {}
                        paymentElement.value = null;
                      }
                      initPayment();
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '0.4rem 0.5rem',
                    borderRadius: '999px',
                    border: active ? '1px solid #111827' : '1px solid #d1d5db',
                    background: active ? '#111827' : '#f9fafb',
                    color: active ? '#ffffff' : '#374151',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {labels[mode]}
                </button>
              );
            })}
          </div>
          {/* Static plans */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
            {plans.value.map((p) => {
              const active = selectedPlanAmount.value === p.amount;
              return (
                <button
                  key={p.amount}
                  type="button"
                  onClick={() => {
                    selectedPlanAmount.value = p.amount;
                    amount.value = String(p.amount);
                    console.log('[Payment] plan selected', p);
                  }}
                  style={{
                    padding: '0.75rem 0.9rem',
                    borderRadius: '10px',
                    border: active ? '1px solid #111827' : '1px solid #e5e7eb',
                    background: active ? '#111827' : '#f9fafb',
                    color: active ? '#ffffff' : '#111827',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>₹{p.amount}</div>
                  <div style={{ fontSize: '0.75rem', color: active ? '#e5e7eb' : '#6b7280' }}>
                    {p.credits} credits
                  </div>
                </button>
              );
            })}
          </div>

          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.5rem' }}>
            Custom Amount (₹)
          </label>
          <input
            type="number"
            min={minAmountUnits.value}
            step="1"
            value={amount.value}
            onInput={(e) => (amount.value = e.target.value)}
            placeholder={`e.g. ${minAmountUnits.value}`}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              border: '1px solid #d1d5db',
              fontSize: '1rem',
              boxSizing: 'border-box',
            }}
          />
          <p style={{ margin: '0.5rem 0 1rem', fontSize: '0.8rem', color: '#6b7280' }}>
            1 ₹ = {creditsPerUnit.value} credits. You will receive <strong>{creditsDisplay.value}</strong> credits.
            {' '}Min ₹{minAmountUnits.value}.
          </p>

          {!clientSecret.value ? (
            <button
              disabled={!canPay.value || loading.value}
              onClick={createIntent}
              style={{
                width: '100%',
                padding: '0.85rem 1.25rem',
                borderRadius: '10px',
                border: 'none',
                background: canPay.value && !loading.value ? '#111827' : '#9ca3af',
                color: 'white',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: canPay.value && !loading.value ? 'pointer' : 'not-allowed',
              }}
            >
              {loading.value ? 'Loading...' : 'Continue to Payment'}
            </button>
          ) : (
            <>
              <div ref={paymentMountEl} style={{ marginBottom: '1rem' }} />
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => {
                    clientSecret.value = null;
                    elementReady.value = false;
                    if (paymentElement.value) {
                      try { paymentElement.value.unmount(); } catch (_) {}
                    }
                    paymentElement.value = null;
                    elementsInstance.value = null;
                    error.value = null;
                  }}
                  style={{
                    flex: 1,
                    padding: '0.85rem',
                    borderRadius: '10px',
                    border: '1px solid #d1d5db',
                    background: '#fff',
                    color: '#374151',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  disabled={!canSubmitPayment.value}
                  onClick={handleSubmit}
                  style={{
                    flex: 1,
                    padding: '0.85rem 1.25rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: canSubmitPayment.value ? '#111827' : '#9ca3af',
                    color: 'white',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    cursor: canSubmitPayment.value ? 'pointer' : 'not-allowed',
                  }}
                >
                  {paying.value ? 'Processing...' : `Pay ₹${Number(effectiveAmount.value || 0).toFixed(0)}`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  },
};
