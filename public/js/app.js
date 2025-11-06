// Main Application Controller
class DiaryApp {
    constructor() {
        console.log('DiaryApp constructor chamado');
        this.entries = [];
        this.favorites = [];
        this.currentEntry = null;
        this.currentUser = null;
        this.tags = ['Trabalho', 'Reflexões', 'Viagem', 'Ideias', 'Pessoal'];
        this.autoSaveInterval = null;
        this.currentView = 'dashboard';
        
        this.init();
    }

    init() {
        this.loadTags(); // Carregar tags salvas
        this.setupEventListeners();
        this.loadTheme();
        this.checkAuth();
        this.setupAutoSave();
    }

    setupEventListeners() {
        // Theme toggle
        document.getElementById('themeToggle')?.addEventListener('click', () => this.toggleTheme());
        document.getElementById('themeToggleSettings')?.addEventListener('click', () => this.toggleTheme());
        
        // Navigation
        document.getElementById('newPageBtn')?.addEventListener('click', () => this.showEditor());
        document.getElementById('newPageTopBtn')?.addEventListener('click', () => this.showEditor());
        document.getElementById('favoritesBtn')?.addEventListener('click', () => this.showFavorites());
        document.getElementById('draftsBtn')?.addEventListener('click', () => this.showDashboard());
        document.getElementById('profileBtn')?.addEventListener('click', () => this.showProfile());
        document.getElementById('settingsBtn')?.addEventListener('click', () => this.showSettings());
        document.getElementById('logoutBtn')?.addEventListener('click', () => this.logout());
        
        // Editor
        document.getElementById('backToDashboard')?.addEventListener('click', () => this.showDashboard());
        document.getElementById('publishEntryBtn')?.addEventListener('click', () => this.publishEntry());
        document.getElementById('deleteEntryBtn')?.addEventListener('click', () => this.deleteEntry());

        // Cover image upload
        const coverArea = document.getElementById('coverImageArea');
        const coverInput = document.getElementById('coverImageInput');
        const coverPreviewEl = document.getElementById('coverImagePreview');
        coverArea?.addEventListener('click', () => {
            // Open upload only when no cover image is set
            if (coverPreviewEl && !coverPreviewEl.classList.contains('hidden')) return;
            coverInput?.click();
        });
        coverInput?.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            if (file) this.onCoverImageSelected(file);
        });

        // Enable cover reposition by dragging
        this.attachCoverDragListeners();

        // Images panel toggle & upload
        const imagesTabBtn = document.getElementById('imagesTabBtn');
        const imagesPanel = document.getElementById('imagesPanel');
        imagesTabBtn?.addEventListener('click', () => {
            imagesPanel?.classList.toggle('hidden');
        });

        // Images panel upload
        const imagesAddBtn = document.getElementById('imagesAddBtn');
        const imagesInput = document.getElementById('imagesInput');
        imagesAddBtn?.addEventListener('click', () => imagesInput?.click());
        imagesInput?.addEventListener('change', (e) => {
            const files = e.target.files;
            if (files && files.length) this.onImagesSelected(Array.from(files));
        });

        // Lightbox close handlers
        document.getElementById('lightboxClose')?.addEventListener('click', () => this.closeLightbox());
        document.getElementById('imageLightbox')?.addEventListener('click', (e) => {
            if (e.target && e.target.id === 'imageLightbox') this.closeLightbox();
        });
        
        // Search
        document.getElementById('searchInput')?.addEventListener('input', (e) => this.searchEntries(e.target.value));
        
        // Sort
        document.getElementById('sortSelect')?.addEventListener('change', (e) => this.sortEntries(e.target.value));
        
        // Profile
        document.getElementById('saveProfileBtn')?.addEventListener('click', () => this.saveProfile());
        document.getElementById('changePasswordBtn')?.addEventListener('click', () => this.changePassword());
        document.getElementById('profilePhotoInput')?.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            if (file) this.onProfilePhotoSelected(file);
        });
        document.getElementById('profilePhotoArea')?.addEventListener('click', () => {
            const input = document.getElementById('profilePhotoInput');
            input?.click();
        });
        
        // Settings
        document.getElementById('autoSaveToggle')?.addEventListener('change', (e) => this.toggleAutoSave(e.target.checked));
        document.getElementById('exportDataBtn')?.addEventListener('click', () => this.exportData());
        document.getElementById('clearAllDataBtn')?.addEventListener('click', () => this.clearAllData());
        
        // Password visibility toggles - revelar enquanto estiver pressionado
        document.querySelectorAll('.toggle-password').forEach(btn => {
            const targetId = btn.dataset.target;
            const input = document.getElementById(targetId);
            const icon = btn.querySelector('span');
            
            // Revelar senha quando segurar o botão
            btn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                input.type = 'text';
                icon.textContent = 'visibility_off';
            });
            
            btn.addEventListener('mouseup', () => {
                input.type = 'password';
                icon.textContent = 'visibility';
            });
            
            btn.addEventListener('mouseleave', () => {
                input.type = 'password';
                icon.textContent = 'visibility';
            });
            
            // Suporte para dispositivos móveis
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                input.type = 'text';
                icon.textContent = 'visibility_off';
            });
            
            btn.addEventListener('touchend', () => {
                input.type = 'password';
                icon.textContent = 'visibility';
            });
        });
        
        // Entry tags
        document.getElementById('entryTags')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                this.addTag(e.target.value.trim());
                e.target.value = '';
            }
        });
        
        // Word count
        document.getElementById('entryContent')?.addEventListener('input', () => this.updateWordCount());
        
        // Salvamento em tempo real - adicionar listeners para campos do editor
        this.setupRealTimeSave();
        
        // Visibility buttons
        document.querySelectorAll('.visibility-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setVisibility(e.target.dataset.visibility);
            });
        });
        
        // Tag buttons
        document.querySelectorAll('#tagsContainer button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterByTag(e.target.textContent.trim());
            });
        });
    }

    // Theme Management
    toggleTheme() {
        const html = document.documentElement;
        const isDark = html.classList.contains('dark');
        
        if (isDark) {
            html.classList.remove('dark');
            html.classList.add('light');
        } else {
            html.classList.remove('light');
            html.classList.add('dark');
        }
        
        localStorage.setItem('theme', isDark ? 'light' : 'dark');
        this.updateThemeIcon();
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.className = savedTheme;
        this.updateThemeIcon();
    }

    updateThemeIcon() {
        const isDark = document.documentElement.classList.contains('dark');
        const icons = document.querySelectorAll('#themeToggle span, #themeToggleSettings span');
        icons.forEach(icon => {
            icon.textContent = isDark ? 'light_mode' : 'dark_mode';
        });
    }

    // Authentication
    async checkAuth() {
        try {
            const { data } = await window.sb.auth.getUser();
            const user = data?.user;
            if (user) {
                // Garantir que o perfil exista e carregar dados
                const profile = await window.sbEnsureProfile((user.email || '').split('@')[0]);
                const cached = (() => { try { return JSON.parse(localStorage.getItem('currentUser') || 'null'); } catch { return null; } })();
                this.currentUser = {
                    id: user.id,
                    email: user.email,
                    // Preferir valores não vazios; se o perfil vier com string vazia, usar cache
                    name: (profile?.name || cached?.name || ''),
                    bio: (profile?.bio || cached?.bio || ''),
                    profilePhoto: (profile?.avatar_url || cached?.profilePhoto || '')
                };
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                this.showMainApp();
            } else {
                this.showLogin();
            }
        } catch (e) {
            console.error('Erro ao verificar auth:', e);
            this.showLogin();
        }
    }

    showLogin() {
        console.log('DiaryApp.showLogin() chamado');
        document.getElementById('loginScreen').classList.remove('hidden');
        document.getElementById('registerScreen').classList.add('hidden');
        document.getElementById('mainApp').classList.add('hidden');
    }

    showRegister() {
        console.log('DiaryApp.showRegister() chamado');
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('registerScreen').classList.remove('hidden');
        document.getElementById('mainApp').classList.add('hidden');
    }

    showMainApp() {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('registerScreen').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        document.getElementById('statusFooter').classList.remove('hidden');
        // Diagnóstico dos buckets de Storage ao entrar na aplicação
        this.verifyStorageBuckets();
        this.loadEntries();
        this.showDashboard();
    }

    async logout() {
        try { await window.sb.auth.signOut(); } catch {}
        localStorage.removeItem('currentUser');
        this.currentUser = null;
        this.entries = [];
        this.favorites = [];
        this.showLogin();
    }

    // View Management
    showDashboard() {
        this.hideAllViews();
        document.getElementById('dashboardView').classList.remove('hidden');
        this.currentView = 'dashboard';
        this.updateUIBasedOnView();
        this.loadEntries();
    }

    showEditor(entryId = null) {
        this.hideAllViews();
        document.getElementById('editorView').classList.remove('hidden');
        this.currentView = 'editor';
        
        if (entryId) {
            this.loadEntry(entryId);
        } else {
            this.createNewEntry();
        }
        this.setupRealTimeSave();
    }

    showFavorites() {
        this.hideAllViews();
        document.getElementById('favoritesView').classList.remove('hidden');
        this.currentView = 'favorites';
        this.updateUIBasedOnView();
        this.loadFavorites();
    }

    showProfile() {
        this.hideAllViews();
        document.getElementById('profileView').classList.remove('hidden');
        this.currentView = 'profile';
        this.updateUIBasedOnView();
        this.loadProfile();
    }

    showSettings() {
        this.hideAllViews();
        document.getElementById('settingsView').classList.remove('hidden');
        this.currentView = 'settings';
        this.updateUIBasedOnView();
    }

    // UI Management
    updateUIBasedOnView() {
        const searchInput = document.getElementById('searchInput');
        
        // Mostrar busca apenas em Favoritos e Rascunhos (Dashboard)
        const shouldShow = this.currentView === 'favorites' || this.currentView === 'dashboard';
        
        if (searchInput) {
            searchInput.closest('label').parentElement.parentElement.style.display = shouldShow ? 'flex' : 'none';
        }
    }

    hideAllViews() {
        document.getElementById('dashboardView').classList.add('hidden');
        document.getElementById('editorView').classList.add('hidden');
        document.getElementById('favoritesView').classList.add('hidden');
        document.getElementById('profileView').classList.add('hidden');
        document.getElementById('settingsView').classList.add('hidden');
    }

    // Entry Management
    createNewEntry() {
        this.currentEntry = {
            id: (crypto && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(),
            title: '',
            content: '',
            tags: [],
            coverImage: '',
            coverPosition: { x: 50, y: 50 },
            images: [],
            visibility: 'private',
            favorite: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.clearEditor();
    }

    loadEntry(entryId) {
        const entry = this.entries.find(e => e.id === entryId);
        if (entry) {
            this.currentEntry = { ...entry };
            this.populateEditor(entry);
        }
    }

    async saveEntry() {
        if (!this.currentEntry || !this.currentUser) return;

        // Atualizar dados do editor
        this.currentEntry.title = document.getElementById('entryTitle').value || 'Sem título';
        this.currentEntry.content = document.getElementById('entryContent').value;
        this.currentEntry.updatedAt = new Date().toISOString();

        const uid = this.currentUser.id;
        const payload = {
            id: this.currentEntry.id,
            user_id: uid,
            title: this.currentEntry.title,
            content: this.currentEntry.content,
            visibility: this.currentEntry.visibility || 'private',
            favorite: !!this.currentEntry.favorite,
            cover_image_url: this.currentEntry.coverImage || null
        };

        // Upsert entrada
        const { data: upserted, error } = await window.sb
            .from('entries')
            .upsert(payload, { onConflict: 'id' })
            .select()
            .single();
        if (error) {
            console.error('Falha ao salvar entrada:', error);
            this.showSaveStatus('Erro ao salvar');
            return;
        }

        // Atualizar posição da capa separadamente, ignorando erro se colunas não existirem
        try {
            const posX = (this.currentEntry.coverPosition?.x ?? 50);
            const posY = (this.currentEntry.coverPosition?.y ?? 50);
            await window.sb
              .from('entries')
              .update({ cover_pos_x: posX, cover_pos_y: posY })
              .eq('id', upserted.id)
              .eq('user_id', uid);
            // Cache local como fallback
            this.setCoverPosCache(upserted.id, { x: posX, y: posY });
        } catch (e) {
            // Alguns projetos podem não ter colunas cover_pos_x/cover_pos_y – seguimos sem falhar
            console.warn('Ignorando atualização de posição da capa (colunas ausentes?):', e);
            // Ainda assim, persistir localmente
            const posX = (this.currentEntry.coverPosition?.x ?? 50);
            const posY = (this.currentEntry.coverPosition?.y ?? 50);
            this.setCoverPosCache(this.currentEntry.id, { x: posX, y: posY });
        }

        // Garantir id oficial
        this.currentEntry.id = upserted.id;

        // Sincronizar tags
        await this.syncEntryTags(this.currentEntry.id, this.currentEntry.tags || []);
        // Sincronizar imagens (base64 temporário)
        await this.syncEntryImages(this.currentEntry.id, this.currentEntry.images || []);

        // Atualizar cache local de entries (renderização)
        const existingIndex = this.entries.findIndex(e => e.id === this.currentEntry.id);
        const merged = {
            ...this.currentEntry,
            visibility: upserted.visibility,
            favorite: upserted.favorite,
            coverImage: upserted.cover_image_url || '',
            coverPosition: this.getCoverPosCache(upserted.id) || { x: upserted.cover_pos_x ?? 50, y: upserted.cover_pos_y ?? 50 },
            createdAt: upserted.created_at,
            updatedAt: upserted.updated_at
        };
        if (existingIndex >= 0) this.entries[existingIndex] = merged; else this.entries.unshift(merged);

        this.showSaveStatus('Salvando...');
        setTimeout(() => { this.showSaveStatus('Salvo'); }, 500);
        if (this.currentView === 'dashboard') await this.loadEntries();
    }

    async publishEntry() {
        if (!this.currentEntry || !this.currentUser) return;
        // Publicar = tornar visível publicamente
        const uid = this.currentUser.id;
        const entryId = this.currentEntry.id;
        const { data, error } = await window.sb
            .from('entries')
            .update({ visibility: 'public' })
            .eq('id', entryId)
            .eq('user_id', uid)
            .select()
            .single();
        if (error) {
            console.error('Erro ao publicar entrada:', error);
            this.showSaveStatus('Erro ao publicar');
            return;
        }
        this.currentEntry.visibility = data.visibility || 'public';
        const idx = this.entries.findIndex(e => e.id === entryId);
        if (idx >= 0) this.entries[idx].visibility = this.currentEntry.visibility;
        this.showSaveStatus('Publicado');
        this.showDashboard();
    }

    async deleteEntry() {
        if (!this.currentEntry || !this.currentUser) return;
        const proceed = await this.showConfirm('Tem certeza que deseja excluir esta entrada?');
        if (!proceed) return;

        const entryId = this.currentEntry.id;
        const uid = this.currentUser.id;
        try {
            // Remover arquivos do Storage (capa + imagens)
            const toRemove = [];
            if (this.currentEntry.coverImage) toRemove.push(this.currentEntry.coverImage);
            const { data: imgs } = await window.sb
              .from('entry_images')
              .select('url')
              .eq('entry_id', entryId);
            (imgs || []).forEach(i => toRemove.push(i.url));
            await window.sbRemovePublicUrls(toRemove);

            // Remover dependências primeiro
            await window.sb.from('entry_images').delete().eq('entry_id', entryId);
            await window.sb.from('entry_tags').delete().eq('entry_id', entryId);
            const { error } = await window.sb
                .from('entries')
                .delete()
                .eq('id', entryId)
                .eq('user_id', uid);
            if (error) {
                console.error('Erro ao excluir entrada:', error);
                this.showToast('Erro ao excluir entrada');
                return;
            }
            this.entries = this.entries.filter(e => e.id !== entryId);
            this.showDashboard();
            await this.loadEntries();
            this.showToast('Entrada excluída');
        } catch (e) {
            console.error('Falha ao excluir entrada:', e);
            this.showToast('Erro ao excluir entrada');
        }
    }

    clearEditor() {
        document.getElementById('entryTitle').value = '';
        document.getElementById('entryContent').value = '';
        const container = document.getElementById('entryTagsContainer');
        container.innerHTML = '<input id="entryTags" class="min-w-[120px] flex-1 border-0 bg-transparent p-1 text-sm text-text-light dark:text-text-dark placeholder:text-placeholder-light dark:placeholder:text-placeholder-dark focus:ring-0" placeholder="Adicionar tag..."/>' +
            '<div id="tagSuggestions" class="absolute left-2 top-full mt-2 w-64 max-w-[calc(100%-1rem)] rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-background-dark shadow-lg hidden"></div>';
        this.attachTagInputListeners(document.getElementById('entryTags'));
        this.updateWordCount();

        // Reset cover image UI
        const coverPreview = document.getElementById('coverImagePreview');
        const coverPlaceholder = document.getElementById('coverImagePlaceholder');
        if (coverPreview && coverPlaceholder) {
            coverPreview.src = '';
            coverPreview.classList.add('hidden');
            coverPlaceholder.classList.remove('hidden');
        }

        // Reset images grid
        const imagesGrid = document.getElementById('imagesGrid');
        if (imagesGrid) imagesGrid.innerHTML = '';
    }

    populateEditor(entry) {
        document.getElementById('entryTitle').value = entry.title || '';
        document.getElementById('entryContent').value = entry.content || '';
        
        // Clear and populate tags
        const tagsContainer = document.getElementById('entryTagsContainer');
        tagsContainer.innerHTML = '';
        
        entry.tags?.forEach(tag => {
            this.addTagToEditor(tag);
        });
        
        // Add input back
        const input = document.createElement('input');
        input.id = 'entryTags';
        input.className = 'min-w-[120px] flex-1 border-0 bg-transparent p-1 text-sm text-text-light dark:text-text-dark placeholder:text-placeholder-light dark:placeholder:text-placeholder-dark focus:ring-0';
        input.placeholder = 'Adicionar tag...';
        tagsContainer.appendChild(input);
        
        // Add suggestions container
        const sugg = document.createElement('div');
        sugg.id = 'tagSuggestions';
        sugg.className = 'absolute left-2 top-full mt-2 w-64 max-w-[calc(100%-1rem)] rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-background-dark shadow-lg hidden';
        tagsContainer.appendChild(sugg);
        
        this.attachTagInputListeners(input);
        
        // Set visibility
        this.setVisibility(entry.visibility || 'private');
        
        // Render cover image
        const coverPreview = document.getElementById('coverImagePreview');
        const coverPlaceholder = document.getElementById('coverImagePlaceholder');
        if (coverPreview && coverPlaceholder) {
            if (entry.coverImage) {
                coverPreview.src = entry.coverImage;
                coverPreview.classList.remove('hidden');
                coverPlaceholder.classList.add('hidden');
                const pos = entry.coverPosition || { x: 50, y: 50 };
                coverPreview.style.objectPosition = `${pos.x}% ${pos.y}%`;
            } else {
                coverPreview.src = '';
                coverPreview.classList.add('hidden');
                coverPlaceholder.classList.remove('hidden');
            }
        }

        // Render images grid
        this.renderImagesGrid(entry.images || []);
        
        this.updateWordCount();
    }

    // Tags
    addTag(tagName) {
        if (!tagName || this.currentEntry.tags.includes(tagName)) return;
        
        this.currentEntry.tags.push(tagName);
        this.addTagToEditor(tagName);
        this.hideTagSuggestions();
        
        // Salvar tag no sistema de tags disponíveis
        if (!this.tags.includes(tagName)) {
            this.tags.push(tagName);
            this.saveTags(); // Salvar tags no localStorage
        }
    }

    attachTagInputListeners(input) {
        if (!input) return;
        input.addEventListener('input', (e) => {
            const q = e.target.value.trim();
            if (!q) {
                this.hideTagSuggestions();
                return;
            }
            this.renderTagSuggestions(q);
        });
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                const val = e.target.value.trim();
                if (!val) return;
                this.addTag(val);
                e.target.value = '';
            }
        });
        input.addEventListener('blur', () => {
            setTimeout(() => this.hideTagSuggestions(), 150);
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.hideTagSuggestions();
        });
    }

    renderTagSuggestions(query) {
        const sugg = document.getElementById('tagSuggestions');
        if (!sugg) return;
        const lower = query.toLowerCase();
        const existing = new Set(this.currentEntry?.tags || []);
        const matches = this.tags
            .filter(t => t.toLowerCase().includes(lower))
            .filter(t => !existing.has(t))
            .slice(0, 8);
        
        const items = matches.map(t => `
            <button type="button" class="w-full text-left px-3 py-2 text-sm hover:bg-subtle-light dark:hover:bg-subtle-dark" data-tag="${t}">
                ${t}
            </button>
        `);
        
        // Criar opção
        if (query && !this.tags.map(t => t.toLowerCase()).includes(lower)) {
            items.push(`
                <button type="button" class="w-full text-left px-3 py-2 text-sm text-primary hover:bg-primary/10" data-create="${query}">
                    Criar tag: ${query}
                </button>
            `);
        }
        
        if (items.length === 0) {
            sugg.classList.add('hidden');
            sugg.innerHTML = '';
            return;
        }
        sugg.innerHTML = items.join('');
        sugg.classList.remove('hidden');
        
        // Bind clicks
        sugg.querySelectorAll('[data-tag]').forEach(btn => {
            btn.addEventListener('click', () => {
                const tag = btn.getAttribute('data-tag');
                this.addTag(tag);
                const input = document.getElementById('entryTags');
                if (input) input.value = '';
            });
        });
        sugg.querySelectorAll('[data-create]').forEach(btn => {
            btn.addEventListener('click', () => {
                const tag = btn.getAttribute('data-create');
                this.addTag(tag);
                const input = document.getElementById('entryTags');
                if (input) input.value = '';
            });
        });
    }

    hideTagSuggestions() {
        const sugg = document.getElementById('tagSuggestions');
        if (sugg) {
            sugg.classList.add('hidden');
            sugg.innerHTML = '';
        }
    }

    addTagToEditor(tagName) {
        const tag = document.createElement('div');
        tag.className = 'flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-white dark:bg-background-dark pl-3 pr-3';
        tag.setAttribute('data-tag-name', tagName);
        tag.innerHTML = `
            <p class="text-sm font-medium">${tagName}</p>
            <button type="button" class="text-gray-400 hover:text-red-500" onclick="app.removeTag('${tagName}')">
                <span class="material-symbols-outlined text-sm">close</span>
            </button>
        `;
        
        const container = document.getElementById('entryTagsContainer');
        const input = container.querySelector('#entryTags');
        container.insertBefore(tag, input);
    }

    // Tags Management
    saveTags() {
        const key = `diaryTags_${this.currentUser?.id || 'guest'}`;
        localStorage.setItem(key, JSON.stringify(this.tags));
    }

    loadTags() {
        const key = `diaryTags_${this.currentUser?.id || 'guest'}`;
        const savedTags = localStorage.getItem(key);
        if (savedTags) {
            this.tags = JSON.parse(savedTags);
        } else {
            this.tags = ['Trabalho', 'Reflexões', 'Viagem', 'Ideias', 'Pessoal'];
        }
    }

    removeTag(tagName) {
        this.currentEntry.tags = this.currentEntry.tags.filter(tag => tag !== tagName);
        
        const tagsContainer = document.getElementById('entryTagsContainer');
        const tagEl = tagsContainer.querySelector(`[data-tag-name="${CSS.escape(tagName)}"]`);
        if (tagEl) tagEl.remove();

        // Persistir imediatamente a remoção de tag
        if (this.currentView === 'editor') {
            this.saveEntry();
        }
    }

    setVisibility(visibility) {
        document.querySelectorAll('.visibility-btn').forEach(btn => {
            if (btn.dataset.visibility === visibility) {
                btn.classList.add('bg-white', 'dark:bg-background-dark', 'shadow-sm');
                btn.classList.remove('text-gray-500', 'dark:text-gray-400', 'hover:bg-white/50', 'dark:hover:bg-background-dark/50');
            } else {
                btn.classList.remove('bg-white', 'dark:bg-background-dark', 'shadow-sm');
                btn.classList.add('text-gray-500', 'dark:text-gray-400', 'hover:bg-white/50', 'dark:hover:bg-background-dark/50');
            }
        });
        
        if (this.currentEntry) {
            this.currentEntry.visibility = visibility;
        }
    }

    // Favorites
    async toggleFavorite(entryId) {
        const entry = this.entries.find(e => e.id === entryId);
        if (!entry || !this.currentUser) return;
        const newFav = !entry.favorite;
        const { error } = await window.sb
            .from('entries')
            .update({ favorite: newFav })
            .eq('id', entryId)
            .eq('user_id', this.currentUser.id);
        if (error) {
            console.error('Erro ao favoritar/desfavoritar:', error);
            return;
        }
        entry.favorite = newFav;
        await this.loadEntries();
    }

    loadFavorites() {
        const favorites = this.entries.filter(e => e.favorite);
        this.renderEntries(favorites, 'favoritesContainer');
    }

    // Search and Filter
    searchEntries(query) {
        if (!query.trim()) {
            this.loadEntries();
            return;
        }
        
        const filtered = this.entries.filter(entry => {
            const searchText = query.toLowerCase();
            return (
                entry.title.toLowerCase().includes(searchText) ||
                entry.content.toLowerCase().includes(searchText) ||
                entry.tags.some(tag => tag.toLowerCase().includes(searchText))
            );
        });
        
        this.renderEntries(filtered);
    }

    filterByTag(tag) {
        const filtered = this.entries.filter(entry => entry.tags.includes(tag));
        this.renderEntries(filtered);
    }

    sortEntries(sortBy) {
        const sorted = [...this.entries].sort((a, b) => {
            switch (sortBy) {
                case 'date-desc':
                    return new Date(b.createdAt) - new Date(a.createdAt);
                case 'date-asc':
                    return new Date(a.createdAt) - new Date(b.createdAt);
                case 'title':
                    return a.title.localeCompare(b.title);
                case 'favorites':
                    return b.favorite - a.favorite;
                default:
                    return 0;
            }
        });
        
        this.renderEntries(sorted);
    }

    // UI Updates
    updateWordCount() {
        const content = document.getElementById('entryContent').value;
        const words = content.trim().split(/\s+/).filter(word => word.length > 0).length;
        document.getElementById('wordCount').textContent = `${words} palavras`;
    }

    showSaveStatus(status) {
        const saveStatus = document.getElementById('saveStatus');
        saveStatus.textContent = status;
        saveStatus.classList.add('saving');
        
        setTimeout(() => {
            saveStatus.classList.remove('saving');
            saveStatus.textContent = 'Salvo';
        }, 2000);
    }

    // Toast notification
    showToast(message) {
        const toast = document.getElementById('toast');
        const msgEl = document.getElementById('toastMessage');
        if (!toast || !msgEl) return;
        msgEl.textContent = message;
        // Garantir que o toast esteja visível
        toast.classList.remove('hidden');
        // Mostrar com leve animação
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
        toast.classList.remove('opacity-0');
        toast.classList.remove('translate-y-4');
        // Ocultar novamente após um curto período
        setTimeout(() => {
            toast.classList.add('opacity-0');
            toast.classList.add('translate-y-4');
            toast.style.opacity = '';
            toast.style.transform = '';
            // Após a transição, esconder o elemento
            setTimeout(() => {
                toast.classList.add('hidden');
                toast.classList.remove('opacity-0');
                toast.classList.remove('translate-y-4');
            }, 300);
        }, 2500);
    }

    // Confirmation modal
    showConfirm(message) {
        const modal = document.getElementById('confirmModal');
        const msgEl = document.getElementById('confirmMessage');
        const okBtn = document.getElementById('confirmOkBtn');
        const cancelBtn = document.getElementById('confirmCancelBtn');
        if (!modal || !msgEl || !okBtn || !cancelBtn) return Promise.resolve(false);
        msgEl.textContent = message;
        modal.classList.remove('hidden');
        return new Promise((resolve) => {
            const cleanup = () => {
                modal.classList.add('hidden');
                okBtn.removeEventListener('click', onOk);
                cancelBtn.removeEventListener('click', onCancel);
            };
            const onOk = () => { cleanup(); resolve(true); };
            const onCancel = () => { cleanup(); resolve(false); };
            okBtn.addEventListener('click', onOk);
            cancelBtn.addEventListener('click', onCancel);
        });
    }

    // Prompt using confirm modal with input field
    showPrompt(message, { type = 'password', minLength = 0 } = {}) {
        const modal = document.getElementById('confirmModal');
        const msgEl = document.getElementById('confirmMessage');
        const okBtn = document.getElementById('confirmOkBtn');
        const cancelBtn = document.getElementById('confirmCancelBtn');
        if (!modal || !msgEl || !okBtn || !cancelBtn) return Promise.resolve(null);
        const input = document.createElement('input');
        input.type = type;
        input.className = 'mt-3 w-full rounded-md border border-border-light bg-surface-light p-2 text-sm outline-none focus:ring-2 focus:ring-primary-light dark:border-border-dark dark:bg-surface-dark dark:focus:ring-primary-dark';
        input.placeholder = message;
        msgEl.textContent = message;
        msgEl.appendChild(input);
        modal.classList.remove('hidden');
        setTimeout(() => input.focus(), 0);
        return new Promise((resolve) => {
            const cleanup = () => {
                modal.classList.add('hidden');
                try { msgEl.removeChild(input); } catch {}
                okBtn.removeEventListener('click', onOk);
                cancelBtn.removeEventListener('click', onCancel);
            };
            const onOk = () => {
                const val = input.value || '';
                if (minLength && val.length < minLength) {
                    this.showToast(`A senha deve ter pelo menos ${minLength} caracteres.`);
                    return;
                }
                cleanup();
                resolve(val);
            };
            const onCancel = () => { cleanup(); resolve(null); };
            okBtn.addEventListener('click', onOk);
            cancelBtn.addEventListener('click', onCancel);
        });
    }

    // Auto-save
    setupAutoSave() {
        const autoSaveEnabled = localStorage.getItem('autoSave') !== 'false';
        document.getElementById('autoSaveToggle').checked = autoSaveEnabled;
        
        if (autoSaveEnabled) {
            this.startAutoSave();
        }
    }

    toggleAutoSave(enabled) {
        localStorage.setItem('autoSave', enabled);
        
        if (enabled) {
            this.startAutoSave();
        } else {
            this.stopAutoSave();
        }
    }

    startAutoSave() {
        this.autoSaveInterval = setInterval(() => {
            if (this.currentView === 'editor' && this.currentEntry) {
                this.saveEntry();
            }
        }, 5000); // Auto-save every 5 seconds
    }

    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }

    // Real-time save setup
    setupRealTimeSave() {
        // Salvar quando o título mudar
        document.getElementById('entryTitle')?.addEventListener('input', () => {
            if (this.currentEntry) {
                this.saveEntry();
            }
        });
        
        // Salvar quando o conteúdo mudar
        document.getElementById('entryContent')?.addEventListener('input', () => {
            if (this.currentEntry) {
                this.saveEntry();
            }
        });
        
        // Salvar quando a visibilidade mudar
        document.querySelectorAll('.visibility-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.currentEntry) {
                    this.saveEntry();
                }
            });
        });
    }

    // Data Management
    async loadEntries() {
        if (!this.currentUser) return;
        const uid = this.currentUser.id;

        // Buscar entradas do usuário
        const { data: rows, error } = await window.sb
            .from('entries')
            .select('*')
            .eq('user_id', uid)
            .order('created_at', { ascending: false });
        if (error) {
            console.error('Erro ao carregar entradas:', error);
            this.entries = [];
            this.renderEntries();
            return;
        }

        const ids = rows.map(r => r.id);
        // Buscar tags associadas
        const { data: etags } = await window.sb
            .from('entry_tags')
            .select('entry_id, tags(name)')
            .in('entry_id', ids);
        const tagsMap = {};
        (etags || []).forEach(t => {
            const name = t?.tags?.name;
            if (!name) return;
            if (!tagsMap[t.entry_id]) tagsMap[t.entry_id] = [];
            tagsMap[t.entry_id].push(name);
        });

        // Buscar imagens associadas
        const { data: imgs } = await window.sb
            .from('entry_images')
            .select('entry_id, url')
            .in('entry_id', ids);
        const imgMap = {};
        (imgs || []).forEach(i => {
            if (!imgMap[i.entry_id]) imgMap[i.entry_id] = [];
            imgMap[i.entry_id].push(i.url);
        });

        // Mapear para modelo do app
        this.entries = rows.map(r => ({
            id: r.id,
            title: r.title || 'Sem título',
            content: r.content || '',
            tags: tagsMap[r.id] || [],
            coverImage: r.cover_image_url || '',
            coverPosition: this.getCoverPosCache(r.id) || { x: r.cover_pos_x ?? 50, y: r.cover_pos_y ?? 50 },
            images: imgMap[r.id] || [],
            visibility: r.visibility || 'private',
            favorite: !!r.favorite,
            createdAt: r.created_at,
            updatedAt: r.updated_at
        }));
        // Migrar imagens base64 para Storage (se houver)
        for (const entry of this.entries) {
            await this.migrateEntryImagesToStorage(entry);
        }
        this.renderEntries();
    }

    // Utilitário: converter data URL para Blob
    dataUrlToBlob(dataUrl) {
        const parts = dataUrl.split(',');
        const meta = parts[0];
        const base64 = parts[1];
        const mimeMatch = /data:(.*);base64/.exec(meta);
        const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
        const binary = atob(base64);
        const len = binary.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
        return new Blob([bytes], { type: mime });
    }

    // Migrar imagens base64 existentes para Storage
    async migrateEntryImagesToStorage(entry) {
        if (!this.currentUser) return;
        const uid = this.currentUser.id;
        const changedImages = [];
        let changed = false;

        // Migrar imagens da grade
        for (const url of entry.images || []) {
            if (typeof url === 'string' && url.startsWith('data:')) {
                const blob = this.dataUrlToBlob(url);
                const path = `${uid}/${entry.id}/migr-${Date.now()}-${Math.random().toString(36).slice(2)}.png`;
                const publicUrl = await window.sbUploadPublic(window.SB_BUCKETS.ENTRY_IMAGES_BUCKET, path, blob, { contentType: blob.type });
                if (publicUrl) {
                    changedImages.push(publicUrl);
                    changed = true;
                } else {
                    changedImages.push(url);
                }
            } else {
                changedImages.push(url);
            }
        }

        // Migrar capa
        let newCoverUrl = entry.coverImage;
        if (entry.coverImage && entry.coverImage.startsWith('data:')) {
            const blob = this.dataUrlToBlob(entry.coverImage);
            const path = `${uid}/${entry.id}/cover-migr-${Date.now()}.png`;
            const publicUrl = await window.sbUploadPublic(window.SB_BUCKETS.ENTRY_IMAGES_BUCKET, path, blob, { contentType: blob.type });
            if (publicUrl) {
                newCoverUrl = publicUrl;
                changed = true;
            }
        }

        if (changed) {
            await this.syncEntryImages(entry.id, changedImages);
            await window.sb
              .from('entries')
              .update({ cover_image_url: newCoverUrl })
              .eq('id', entry.id)
              .eq('user_id', uid);
            entry.images = changedImages;
            entry.coverImage = newCoverUrl;
        }
    }

    // Sincronizar tags da entrada com o banco
    async syncEntryTags(entryId, tagNames) {
        const uid = this.currentUser.id;
        const uniqueNames = Array.from(new Set((tagNames || []).map(n => n.trim()).filter(Boolean)));
        if (uniqueNames.length === 0) {
            // Remover todas as relações
            await window.sb.from('entry_tags').delete().eq('entry_id', entryId);
            return;
        }

        // Obter tags existentes
        const { data: existingTags } = await window.sb
            .from('tags')
            .select('id, name')
            .eq('user_id', uid);
        const byLower = {};
        (existingTags || []).forEach(t => { byLower[t.name.toLowerCase()] = t; });

        // Criar ausentes
        const toCreate = uniqueNames.filter(n => !byLower[n.toLowerCase()]);
        let created = [];
        if (toCreate.length) {
            const { data: createdRows } = await window.sb
              .from('tags')
              .insert(toCreate.map(name => ({ user_id: uid, name })))
              .select();
            created = createdRows || [];
            created.forEach(t => { byLower[t.name.toLowerCase()] = t; });
        }

        // Obter relações existentes
        const { data: existingRels } = await window.sb
            .from('entry_tags')
            .select('entry_id, tag_id')
            .eq('entry_id', entryId);
        const currentTagIds = new Set((existingRels || []).map(r => r.tag_id));

        // Calcular desejado
        const desiredTagIds = uniqueNames.map(n => byLower[n.toLowerCase()]?.id).filter(Boolean);
        const toInsert = desiredTagIds.filter(id => !currentTagIds.has(id));
        const toDelete = (existingRels || []).filter(r => !desiredTagIds.includes(r.tag_id));

        if (toInsert.length) {
            await window.sb
              .from('entry_tags')
              .insert(toInsert.map(tag_id => ({ entry_id: entryId, tag_id })));
        }
        if (toDelete.length) {
            const delIds = toDelete.map(r => r.tag_id);
            await window.sb
              .from('entry_tags')
              .delete()
              .eq('entry_id', entryId)
              .in('tag_id', delIds);
        }
    }

    // Sincronizar imagens da entrada (armazenamento base64 temporário)
    async syncEntryImages(entryId, images) {
        // Estratégia simples: limpar e reinserir (com deduplicação)
        await window.sb.from('entry_images').delete().eq('entry_id', entryId);
        const uniqueImages = Array.from(new Set(images || []));
        const rows = uniqueImages.map(url => ({ entry_id: entryId, url, user_id: this.currentUser.id }));
        if (rows.length) {
            await window.sb.from('entry_images').insert(rows);
        }
    }

    renderEntries(entries = null, containerId = 'entriesContainer') {
        const entriesToRender = entries || this.entries;
        const container = document.getElementById(containerId);
        
        if (!container) return;
        
        if (entriesToRender.length === 0) {
            container.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border-light bg-background-light py-12 text-center dark:border-border-dark dark:bg-background-dark">
                    <span class="material-symbols-outlined mb-4 text-5xl text-gray-400">upcoming</span>
                    <h3 class="text-lg font-bold text-text-light dark:text-text-dark">Sua primeira página espera por você</h3>
                    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Clique em '+ Nova Página' para começar a escrever.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = entriesToRender.map(entry => this.createEntryCard(entry)).join('');
        
        // Add event listeners to cards
        container.querySelectorAll('.entry-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.favorite-btn')) {
                    this.showEditor(card.dataset.entryId);
                }
            });
        });
        
        // Add event listeners to favorite buttons
        container.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFavorite(btn.dataset.entryId);
            });
        });

        // Add event listeners to delete buttons
        container.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteEntryById(btn.dataset.entryId);
            });
        });
    }

    createEntryCard(entry) {
        const date = new Date(entry.createdAt);
        const formattedDate = date.toLocaleDateString('pt-BR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        
        const excerpt = entry.content.substring(0, 150) + (entry.content.length > 150 ? '...' : '');
        const wordCount = entry.content.trim().split(/\s+/).filter(word => word.length > 0).length;
        
        return `
            <article class="entry-card flex cursor-pointer flex-col overflow-hidden rounded-xl border border-border-light bg-surface-light shadow-sm transition-all hover:shadow-lg dark:border-border-dark dark:bg-surface-dark" data-entry-id="${entry.id}">
                ${entry.coverImage ? `<img src="${entry.coverImage}" alt="Capa" class="h-32 w-full object-cover" style="object-position: ${entry.coverPosition?.x || 50}% ${entry.coverPosition?.y || 50}%">` : ''}
                <div class="flex flex-1 flex-col p-5">
                    <div class="mb-3 flex items-start justify-between">
                        <p class="text-xs text-gray-500 dark:text-gray-400">${formattedDate}</p>
                        <div class="flex items-center gap-1">
                            <button class="delete-btn text-gray-400 hover:text-red-600" title="Excluir página" data-entry-id="${entry.id}">
                                <span class="material-symbols-outlined text-lg">delete</span>
                            </button>
                            <button class="favorite-btn ${entry.favorite ? 'favorited' : ''}" data-entry-id="${entry.id}">
                                <span class="material-symbols-outlined text-lg ${entry.favorite ? 'fill-1' : ''}">star</span>
                            </button>
                        </div>
                    </div>
                <h3 class="mb-2 text-lg font-bold leading-tight">${entry.title || 'Sem título'}</h3>
                <p class="font-body text-sm leading-relaxed text-gray-600 dark:text-gray-300">${excerpt}</p>
                <div class="mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>${wordCount} palavras</span>
                    ${entry.visibility === 'public' ? '<span class="text-green-500">• Publicado</span>' : '<span class="text-yellow-500">• Rascunho</span>'}
                </div>
                </div>
                ${entry.tags?.length > 0 ? `
                    <div class="border-t border-border-light p-4 dark:border-border-dark">
                        <div class="flex flex-wrap gap-2">
                            ${entry.tags.map(tag => `
                                <div class="flex h-6 shrink-0 items-center justify-center gap-x-2 rounded-full bg-primary/20 px-2.5 text-xs font-medium text-primary">
                                    <p>${tag}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </article>
        `;
    }

    async deleteEntryById(entryId) {
        const entry = this.entries.find(e => e.id === entryId);
        if (!entry || !this.currentUser) return;
        const proceed = await this.showConfirm('Tem certeza que deseja excluir esta entrada?');
        if (!proceed) return;

        try {
            await window.sb.from('entry_images').delete().eq('entry_id', entryId);
            await window.sb.from('entry_tags').delete().eq('entry_id', entryId);
            const { error } = await window.sb
                .from('entries')
                .delete()
                .eq('id', entryId)
                .eq('user_id', this.currentUser.id);
            if (error) {
                console.error('Erro ao excluir entrada:', error);
                return;
            }
            this.entries = this.entries.filter(e => e.id !== entryId);
            // Recarregar a lista correta conforme a view atual
            if (this.currentView === 'favorites') {
                this.loadFavorites();
            } else {
                await this.loadEntries();
            }
            this.showToast('Entrada excluída');
        } catch (e) {
            console.error('Falha ao excluir entrada:', e);
        }
    }

    // Profile Management
    loadProfile() {
        if (!this.currentUser) return;
        
        document.getElementById('profileName').value = this.currentUser.name;
        document.getElementById('profileEmail').value = this.currentUser.email;
        const bioEl = document.getElementById('profileBio');
        if (bioEl) bioEl.value = this.currentUser.bio || '';

        const photoPreview = document.getElementById('profilePhotoPreview');
        const photoPlaceholder = document.getElementById('profilePhotoPlaceholder');
        if (photoPreview && photoPlaceholder) {
            if (this.currentUser.profilePhoto) {
                photoPreview.src = this.currentUser.profilePhoto;
                photoPreview.classList.remove('hidden');
                photoPlaceholder.classList.add('hidden');
            } else {
                photoPreview.src = '';
                photoPreview.classList.add('hidden');
                photoPlaceholder.classList.remove('hidden');
            }
        }
    }

    saveProfile() {
        const newName = document.getElementById('profileName').value.trim();
        const newBio = document.getElementById('profileBio')?.value || '';
        if (!newName) { this.showToast('Informe um nome para o perfil'); return; }
        
        this.currentUser.name = newName;
        this.currentUser.bio = newBio;
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

        // Persistir também no Supabase
        (async () => {
            try {
                const uid = this.currentUser.id;
                // Detectar colunas existentes para montar payload de forma segura
                let keyCol = 'user_id';
                let cols = [];
                try {
                    const { data: profSample } = await window.sb
                      .from('profiles')
                      .select('*')
                      .limit(1)
                      .maybeSingle();
                    cols = profSample ? Object.keys(profSample) : [];
                } catch (e) {
                    console.warn('Não foi possível detectar colunas de profiles:', e);
                }

                // Escolher coluna-chave (default para id quando desconhecido)
                if (cols.length === 0) {
                    keyCol = 'id';
                } else if (!cols.includes('user_id') && cols.includes('id')) {
                    keyCol = 'id';
                }

                // Construir payload apenas com colunas existentes
                const payload = {};
                if (cols.length === 0 || cols.includes('name')) payload.name = newName;
                if (cols.length === 0 || cols.includes('bio')) payload.bio = newBio;

                // Tentar update
                let { error } = await window.sb
                  .from('profiles')
                  .update(payload)
                  .eq(keyCol, uid);

                // Fallback: tentar com outra coluna-chave se aplicável
                if (error && keyCol === 'user_id' && (cols.length === 0 || cols.includes('id'))) {
                    console.warn('Update por user_id falhou, tentando por id...');
                    const resp2 = await window.sb
                      .from('profiles')
                      .update(payload)
                      .eq('id', uid);
                    error = resp2.error;
                }

                // Último recurso: upsert
                if (error) {
                    console.warn('Update falhou, tentando upsert...');
                    const uidCol = (cols.length === 0) ? 'id' : (cols.includes('user_id') ? 'user_id' : (cols.includes('id') ? 'id' : 'id'));
                    const upsertRow = { [uidCol]: uid, ...payload };
                    // Evitar onConflict quando schema é desconhecido para não referenciar coluna inexistente
                    const { error: upErr } = await window.sb
                      .from('profiles')
                      .upsert(upsertRow);
                    if (upErr) {
                        console.error('Erro ao salvar perfil (update/upsert):', upErr);
                        this.showToast(`Falha ao salvar perfil: ${upErr.message || 'erro desconhecido'}`);
                        return;
                    }
                }
                this.showToast('Perfil atualizado com sucesso!');
            } catch (e) {
                console.error('Exceção ao salvar perfil:', e);
                this.showToast(`Erro inesperado ao salvar perfil: ${e.message || e}`);
            }
        })();
    }

    onProfilePhotoSelected(file) {
        if (!this.currentUser) return;
        const uid = this.currentUser.id;
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
        const path = `${uid}/avatar-${Date.now()}.${ext}`;
        (async () => {
            // Verificar bucket antes de enviar
            const ok = await this.ensureBucketAccessible(window.SB_BUCKETS.PROFILE_AVATARS_BUCKET);
            if (!ok) { this.showToast(`Bucket ausente: ${window.SB_BUCKETS.PROFILE_AVATARS_BUCKET}`); return; }
            const url = await window.sbUploadPublic(window.SB_BUCKETS.PROFILE_AVATARS_BUCKET, path, file, { contentType: file.type });
            if (!url) { this.showToast('Falha ao enviar foto de perfil'); return; }
            this.currentUser.profilePhoto = url;
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            try {
                // Detectar coluna-chave para update do avatar
                let keyCol = 'id';
                try {
                    const { data: profSample } = await window.sb.from('profiles').select('*').limit(1).maybeSingle();
                    const cols = profSample ? Object.keys(profSample) : [];
                    if (cols.includes('user_id')) keyCol = 'user_id';
                    else keyCol = 'id';
                } catch {}
                await window.sb.from('profiles').update({ avatar_url: url }).eq(keyCol, uid);
            } catch (e) {
                console.warn('Falha ao atualizar avatar_url no perfil:', e);
            }
            const photoPreview = document.getElementById('profilePhotoPreview');
            const photoPlaceholder = document.getElementById('profilePhotoPlaceholder');
            if (photoPreview && photoPlaceholder) {
                photoPreview.src = url;
                photoPreview.classList.remove('hidden');
                photoPlaceholder.classList.add('hidden');
            }
            this.showToast('Foto de perfil atualizada');
        })();
    }

    // Cover image handler
    onCoverImageSelected(file) {
        if (!this.currentUser || !this.currentEntry) return;
        const uid = this.currentUser.id;
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
        const path = `${uid}/${this.currentEntry.id}/cover-${Date.now()}.${ext}`;
        (async () => {
            const ok = await this.ensureBucketAccessible(window.SB_BUCKETS.ENTRY_IMAGES_BUCKET);
            if (!ok) { this.showToast(`Bucket ausente: ${window.SB_BUCKETS.ENTRY_IMAGES_BUCKET}`); return; }
            const url = await window.sbUploadPublic(window.SB_BUCKETS.ENTRY_IMAGES_BUCKET, path, file, { contentType: file.type });
            if (!url) { this.showToast('Falha ao enviar capa'); return; }
            this.currentEntry.coverImage = url;
            this.currentEntry.coverPosition = { x: 50, y: 50 };
            const coverPreview = document.getElementById('coverImagePreview');
            const coverPlaceholder = document.getElementById('coverImagePlaceholder');
            if (coverPreview && coverPlaceholder) {
                coverPreview.src = url;
                coverPreview.classList.remove('hidden');
                coverPlaceholder.classList.add('hidden');
                coverPreview.style.objectPosition = '50% 50%';
            }
            this.attachCoverDragListeners();
            await this.saveEntry();
            this.showToast('Capa atualizada');
        })();
    }

    // Images selection handler
    onImagesSelected(files) {
        if (!this.currentUser || !this.currentEntry) return;
        const uid = this.currentUser.id;
        (async () => {
            const ok = await this.ensureBucketAccessible(window.SB_BUCKETS.ENTRY_IMAGES_BUCKET);
            if (!ok) { this.showToast(`Bucket ausente: ${window.SB_BUCKETS.ENTRY_IMAGES_BUCKET}`); return; }
            const uploadedUrls = [];
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
                const path = `${uid}/${this.currentEntry.id}/${Date.now()}-${i}.${ext}`;
                const url = await window.sbUploadPublic(window.SB_BUCKETS.ENTRY_IMAGES_BUCKET, path, file, { contentType: file.type });
                if (url) uploadedUrls.push(url);
            }
            if (!Array.isArray(this.currentEntry.images)) this.currentEntry.images = [];
            // Deduplicar URLs antes de renderizar/salvar
            const uniqueSet = new Set(this.currentEntry.images);
            uploadedUrls.forEach(u => uniqueSet.add(u));
            this.currentEntry.images = Array.from(uniqueSet);
            this.renderImagesGrid(this.currentEntry.images);
            await this.saveEntry();
            if (uploadedUrls.length === 0) this.showToast('Nenhuma imagem enviada');
            else this.showToast('Imagens adicionadas');
        })();
    }

    // Verificar buckets e reportar problemas
    async ensureBucketAccessible(bucketName) {
        try {
            const { data, error } = await window.sb.storage.from(bucketName).list('', { limit: 1 });
            if (error) {
                const msg = (error.message || '').toLowerCase();
                if (msg.includes('no such bucket') || msg.includes('does not exist')) {
                    console.warn(`Bucket não existe: ${bucketName}`);
                    return false;
                }
                console.warn('Erro ao listar bucket:', bucketName, error);
                return false;
            }
            return true;
        } catch (e) {
            console.warn('Exceção ao verificar bucket:', bucketName, e);
            return false;
        }
    }

    async verifyStorageBuckets() {
        const missing = [];
        const buckets = [window.SB_BUCKETS.ENTRY_IMAGES_BUCKET, window.SB_BUCKETS.PROFILE_AVATARS_BUCKET];
        for (const b of buckets) {
            const ok = await this.ensureBucketAccessible(b);
            if (!ok) missing.push(b);
        }
        if (missing.length) {
            this.showToast(`Buckets ausentes no Supabase: ${missing.join(', ')}. Crie-os como "Public".`);
            console.warn('Crie estes buckets no Supabase Storage e defina como públicos:', missing);
        }
    }

    renderImagesGrid(images) {
        const grid = document.getElementById('imagesGrid');
        if (!grid) return;
        grid.innerHTML = '';
        const uniqueImages = Array.from(new Set(images || []));
        uniqueImages.forEach((src, idx) => {
            const item = document.createElement('div');
            item.className = 'relative group';
            const img = document.createElement('img');
            img.src = src;
            img.alt = `Imagem ${idx + 1}`;
            img.className = 'w-full h-24 object-cover rounded-lg cursor-pointer';
            img.addEventListener('click', () => this.openLightbox(src));
            item.appendChild(img);

            // Botão de excluir por imagem
            const delBtn = document.createElement('button');
            delBtn.type = 'button';
            delBtn.className = 'absolute top-1 right-1 rounded-full bg-black/50 text-white p-1 opacity-0 group-hover:opacity-100 transition';
            delBtn.innerHTML = '<span class="material-symbols-outlined text-sm">delete</span>';
            delBtn.addEventListener('click', (e) => { e.stopPropagation(); this.removeImage(src); });
            item.appendChild(delBtn);

            grid.appendChild(item);
        });
    }

    // Remover imagem individualmente da entrada e persistir
    removeImage(url) {
        if (!this.currentEntry) return;
        const before = Array.isArray(this.currentEntry.images) ? this.currentEntry.images : [];
        this.currentEntry.images = before.filter(i => i !== url);
        this.renderImagesGrid(this.currentEntry.images);
        (async () => {
            try {
                if (window.sbRemovePublicUrls) {
                    await window.sbRemovePublicUrls([url]);
                }
            } catch (e) {
                console.warn('Falha ao remover arquivo do Storage (continuando):', e);
            }
            await this.saveEntry();
            this.showToast('Imagem removida');
        })();
    }

    openLightbox(src) {
        const overlay = document.getElementById('imageLightbox');
        const img = document.getElementById('lightboxImg');
        if (overlay && img) {
            img.src = src;
            overlay.classList.remove('hidden');
        }
    }

    closeLightbox() {
        const overlay = document.getElementById('imageLightbox');
        const img = document.getElementById('lightboxImg');
        if (overlay && img) {
            img.src = '';
            overlay.classList.add('hidden');
        }
    }

    // Allow dragging the cover image to reposition the focus
    attachCoverDragListeners() {
        const img = document.getElementById('coverImagePreview');
        if (!img) return;
        img.style.cursor = 'move';

        let dragging = false;
        let startX = 0;
        let startY = 0;

        const getPercentDelta = (dx, dy) => {
            const rect = img.getBoundingClientRect();
            return {
                dxPct: (dx / rect.width) * 100,
                dyPct: (dy / rect.height) * 100,
            };
        };

        const clamp = (val) => Math.max(0, Math.min(100, val));

        const onMouseDown = (e) => {
            if (img.classList.contains('hidden')) return;
            dragging = true;
            startX = e.clientX;
            startY = e.clientY;
            e.preventDefault();
        };

        const onMouseMove = (e) => {
            if (!dragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            startX = e.clientX;
            startY = e.clientY;
            const { dxPct, dyPct } = getPercentDelta(dx, dy);
            const pos = this.currentEntry.coverPosition || { x: 50, y: 50 };
            // Moving image visually opposite to drag to reveal target area
            pos.x = clamp(pos.x - dxPct);
            pos.y = clamp(pos.y - dyPct);
            this.currentEntry.coverPosition = pos;
            img.style.objectPosition = `${pos.x}% ${pos.y}%`;
        };

        const onMouseUp = () => {
            if (!dragging) return;
            dragging = false;
            this.saveEntry();
        };

        // Mouse events
        img.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        // Touch events
        img.addEventListener('touchstart', (e) => {
            if (!e.touches || !e.touches.length) return;
            const t = e.touches[0];
            if (img.classList.contains('hidden')) return;
            dragging = true;
            startX = t.clientX;
            startY = t.clientY;
            e.preventDefault();
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            if (!dragging || !e.touches || !e.touches.length) return;
            const t = e.touches[0];
            const dx = t.clientX - startX;
            const dy = t.clientY - startY;
            startX = t.clientX;
            startY = t.clientY;
            const { dxPct, dyPct } = getPercentDelta(dx, dy);
            const pos = this.currentEntry.coverPosition || { x: 50, y: 50 };
            pos.x = clamp(pos.x - dxPct);
            pos.y = clamp(pos.y - dyPct);
            this.currentEntry.coverPosition = pos;
            img.style.objectPosition = `${pos.x}% ${pos.y}%`;
        }, { passive: true });

        document.addEventListener('touchend', onMouseUp);
    }

    changePassword() {
        (async () => {
            const newPassword = await this.showPrompt('Digite sua nova senha:', { type: 'password', minLength: 6 });
            if (!newPassword) return;
            this.currentUser.password = btoa(newPassword);
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            this.showToast('Senha alterada com sucesso!');
        })();
    }

    // Data Export/Import
    exportData() {
        const data = {
            user: this.currentUser,
            entries: this.entries,
            tags: this.tags,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `diario-pessoal-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async clearAllData() {
        const ok = await this.showConfirm('Tem certeza que deseja apagar TODOS os dados? Esta ação não pode ser desfeita.');
        if (!ok) return;
        localStorage.removeItem(`entries_${this.currentUser.id}`);
        this.entries = [];
        await this.loadEntries();
        this.showToast('Todos os dados foram apagados.');
    }

    // Utility Methods
    togglePasswordVisibility(button) {
        const targetId = button.dataset.target;
        const input = document.getElementById(targetId);
        const icon = button.querySelector('span');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.textContent = 'visibility_off';
        } else {
            input.type = 'password';
            icon.textContent = 'visibility';
        }
    }

    // Fallback local cache para posição da capa
    getCoverPosCache(entryId) {
        try {
            const raw = localStorage.getItem('coverPosCache');
            if (!raw) return null;
            const map = JSON.parse(raw);
            return map?.[entryId] || null;
        } catch {
            return null;
        }
    }

    setCoverPosCache(entryId, pos) {
        try {
            const raw = localStorage.getItem('coverPosCache');
            const map = raw ? JSON.parse(raw) : {};
            map[entryId] = { x: Math.round(pos.x), y: Math.round(pos.y) };
            localStorage.setItem('coverPosCache', JSON.stringify(map));
        } catch {}
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, inicializando DiaryApp...');
    window.app = new DiaryApp();
    console.log('DiaryApp inicializado com sucesso');
});