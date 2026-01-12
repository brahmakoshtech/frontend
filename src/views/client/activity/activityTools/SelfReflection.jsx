import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeftIcon } from '@heroicons/vue/24/outline';

export default {
  name: 'SelfReflectionActivity',
  setup() {
    const router = useRouter();
    const goBack = () => router.push('/client/activity');
    return () => (
      <div class="container-fluid px-4">
        <div class="row"><div class="col-12">
        <div class="d-flex align-items-center gap-3 mb-4">
        <button class="btn btn-outline-secondary btn-sm rounded-pill px-3" onClick={goBack}>
        <ArrowLeftIcon style={{ width: '1rem', height: '1rem' }} class="me-1" />Back</button>
        <div><h1 class="mb-0 fw-bold">🤔 Self Reflection</h1><p class="text-muted mb-0">Inner contemplation</p></div></div>
        <div class="card border-0 shadow-sm rounded-4"><div class="card-body p-5 text-center">
        <div class="display-1 mb-3">🤔</div><h3 class="fw-bold mb-3">Self Reflection</h3>
        <p class="text-muted">Coming soon</p></div></div></div></div></div>
    );
  }
};