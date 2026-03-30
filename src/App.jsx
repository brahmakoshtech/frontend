import { onMounted } from 'vue';
import { RouterView, useRouter } from 'vue-router';

export default {
  name: 'App',
  setup() {
    const router = useRouter();

    // Ensure dash subdomain root loads client dashboard page.
    onMounted(() => {
      const host = window.location.hostname || '';
      const path = window.location.pathname || '/';
      if (host.includes('dash.brahmakosh.com') && (path === '/' || path === '')) {
        router.replace('/client/overview');
      }
    });

    return () => <RouterView />;
  }
};