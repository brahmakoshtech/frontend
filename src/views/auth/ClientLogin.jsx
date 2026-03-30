import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../../store/auth.js';
import api from '../../services/api.js';
import logo from '../../assets/logo.jpeg';
export default {
  name: 'ClientLogin',
  setup() {
    const router = useRouter();
    const { login } = useAuth();
    const email = ref('');
    const password = ref('');
    const loading = ref(false);
    const error = ref('');

    const handleLogin = async (e) => {
      e.preventDefault();
      loading.value = true;
      error.value = '';
      
      try {
        const response = await api.clientLogin(email.value, password.value);
        await login(email.value, password.value, 'client');
        // Wait a bit to ensure auth state is updated
        await new Promise(resolve => setTimeout(resolve, 100));
        router.push('/client/overview');
      } catch (err) {
        error.value = err.message || 'Login failed';
      } finally {
        loading.value = false;
      }
    };

    return () => (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: '#f3f4f6' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '3rem', width: '100%', maxWidth: '420px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <img src={logo} alt="Brahmakosh Logo" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', marginBottom: '1rem' }} />
            <h1 style={{ color: '#1f2937', fontSize: '1.6rem', fontWeight: '700', margin: '0' }}>Welcome to Brahmakosh Dashboard</h1>
          </div>
          {error.value && <div class="alert alert-danger">{error.value}</div>}
          <form onSubmit={handleLogin}>
            <div class="mb-3">
              <label class="form-label">Email</label>
              <input
                value={email.value}
                onInput={(e) => email.value = e.target.value}
                type="email"
                class="form-control"
                required
                placeholder="Enter client email"
              />
            </div>
            <div class="mb-3">
              <label class="form-label">Password</label>
              <input
                value={password.value}
                onInput={(e) => password.value = e.target.value}
                type="password"
                class="form-control"
                required
                placeholder="Enter password"
              />
            </div>
            <button type="submit" disabled={loading.value} class="btn btn-primary w-100">
              {loading.value ? 'Logging in...' : 'Login'}
            </button>
            <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#9ca3af', fontSize: '0.85rem' }}>
              Need help? <a href="mailto:brahmakoshtech@gmail.com" style={{ color: '#6366f1', textDecoration: 'none' }}>brahmakoshtech@gmail.com</a>
            </p>
          </form>
        </div>
      </div>
    );
  }
};


