// Supabase client initialization and small helpers
// NOTE: The anon key is safe for client-side use. Do not expose service keys.

(function() {
  const SUPABASE_URL = "https://otmpwjhrmezhwrgtapqn.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90bXB3amhybWV6aHdyZ3RhcHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNTY0MDQsImV4cCI6MjA3NzkzMjQwNH0.GaTcBeMWjvUOU3UwSS-ltaEpETzvXZ8-umOxNK3LpGQ";

  if (!window.supabase) {
    console.error('Supabase JS not loaded. Check CDN script tag.');
    return;
  }

  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  window.sb = client;

  // Buckets (assume they already exist and are public)
  const ENTRY_IMAGES_BUCKET = 'entry-images';
  const PROFILE_AVATARS_BUCKET = 'profile-avatars';
  window.SB_BUCKETS = { ENTRY_IMAGES_BUCKET, PROFILE_AVATARS_BUCKET };

  // Helper: get current user id (uid)
  window.sbUid = async function() {
    const { data } = await client.auth.getUser();
    return data?.user?.id || null;
  };

  // Helper: fetch or create profile for current user
  window.sbEnsureProfile = async function(defaultName) {
    const { data: userData } = await client.auth.getUser();
    const user = userData?.user;
    if (!user) return null;
    // Tentar buscar por id (padrão do template do Supabase), depois por user_id
    let prof = null;
    try {
      const respId = await client
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .limit(1)
        .maybeSingle();
      prof = respId.data || null;
      if (prof) return prof;
    } catch {}
    try {
      const respUid = await client
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();
      prof = respUid.data || null;
      if (prof) return prof;
    } catch {}

    // Se não existir, criar com upsert usando id por padrão; sem onConflict para evitar coluna inexistente
    const baseName = defaultName || (user.email || '').split('@')[0];
    let created = null;
    let lastErr = null;
    // Tentar com id
    try {
      const { data, error } = await client
        .from('profiles')
        .upsert({ id: user.id, name: baseName })
        .select()
        .maybeSingle();
      if (!error && data) return data;
      lastErr = error;
    } catch (e) { lastErr = e; }
    // Fallback: tentar com user_id
    try {
      const { data, error } = await client
        .from('profiles')
        .upsert({ user_id: user.id, name: baseName })
        .select()
        .maybeSingle();
      if (!error && data) return data;
      lastErr = error;
    } catch (e) { lastErr = e; }
    console.warn('Failed to create profile:', lastErr);
    return null;
  };

  // Helper: upload file to a bucket and return public URL
  window.sbUploadPublic = async function(bucket, path, file, options) {
    const { data: up, error } = await client.storage.from(bucket).upload(path, file, { upsert: true, ...options });
    if (error) {
      console.warn('Upload failed:', error);
      return null;
    }
    const { data: pub } = client.storage.from(bucket).getPublicUrl(path);
    return pub?.publicUrl || null;
  };

  // Helper: get public URL (if file already exists)
  window.sbPublicUrl = function(bucket, path) {
    const { data } = client.storage.from(bucket).getPublicUrl(path);
    return data?.publicUrl || null;
  };

  // Helper: parse a public storage URL into bucket and path
  window.sbParsePublicUrl = function(url) {
    if (typeof url !== 'string') return null;
    const m = url.match(/\/storage\/v1\/object\/public\/([^\/]+)\/(.+)/);
    if (!m) return null;
    return { bucket: m[1], path: m[2] };
  };

  // Helper: remove a single file by its public URL
  window.sbRemovePublicUrl = async function(url) {
    const info = window.sbParsePublicUrl(url);
    if (!info) return false;
    const { error } = await client.storage.from(info.bucket).remove([info.path]);
    if (error) {
      console.warn('Falha ao remover arquivo do Storage:', error, url);
      return false;
    }
    return true;
  };

  // Helper: remove many public URLs efficiently (grouped per bucket)
  window.sbRemovePublicUrls = async function(urls) {
    const groups = {};
    (urls || []).forEach(u => {
      const info = window.sbParsePublicUrl(u);
      if (!info) return;
      groups[info.bucket] = groups[info.bucket] || [];
      groups[info.bucket].push(info.path);
    });
    const buckets = Object.keys(groups);
    for (const b of buckets) {
      const { error } = await client.storage.from(b).remove(groups[b]);
      if (error) console.warn('Falha ao remover arquivos do Storage:', b, error);
    }
  };
})();