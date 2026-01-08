import { ref, onMounted } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { useAuth } from '../../store/auth.js';
import api from '../../services/api.js';

export default {
  name: 'UserLogin',
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
        // Login will handle API call and token storage
        await login(email.value, password.value, 'user');
        // Redirect to mobile dashboard (chat/voice features)
        // Token is stored synchronously in login(), so navigation should work immediately
        router.push('/mobile/user/dashboard');
      } catch (err) {
        error.value = err.message || 'Login failed';
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      // Only load once
      if (!window.google?.accounts?.id) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
      }
      setTimeout(initGoogle, 400); // Delay for script load
    });
 
    function initGoogle() {
      if (!window.google || !window.google.accounts) return;
      window.google.accounts.id.initialize({
        client_id: '449350149768-a1a1qn8siakh4hq7tejj60ri81c6hh85.apps.googleusercontent.com',
        callback: handleGoogleCredential,
      });
      window.google.accounts.id.renderButton(
        document.getElementById('g_id_signin'),
        { theme: 'outline', size: 'large', width: 340 }
      );
    }
 
    async function handleGoogleCredential(response) {
      loading.value = true;
      error.value = '';
      try {
        const { data } = await api.post('/api/auth/user/google', {
          idToken: response.credential,
        });
        localStorage.setItem('token_user', data.data.token);
        router.push('/mobile/user/dashboard');
      } catch (e) {
        error.value = e.response?.data?.message || 'Google login failed';
      } finally {
        loading.value = false;
      }
    }

    return () => (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '3rem', width: '100%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)' }}>
          <h1 style={{ textAlign: 'center', marginBottom: '2rem', color: '#1f2937', fontSize: '2rem' }}>User Login</h1>
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
                placeholder="Enter user email"
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
            <p style={{ textAlign: 'center', marginTop: '1rem', marginBottom: '0.5rem' }}>
              <RouterLink to="/user/forgot-password" style={{ color: '#6366f1', textDecoration: 'none', fontSize: '0.9rem' }}>
                Forgot Password?
              </RouterLink>
            </p>
            <p style={{ textAlign: 'center', marginTop: '1rem', color: '#6b7280' }}>
              Don't have an account?{' '}
              <RouterLink to="/mobile/user/register" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 'bold' }}>
                Register
              </RouterLink>
            </p>
          </form>
          <div id="g_id_signin"></div>
        </div>
        
      </div>
    );
  }
};


