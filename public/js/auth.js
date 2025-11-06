// Authentication Module
class AuthManager {
    constructor(app) {
        this.app = app;
        this.setupAuthListeners();
    }

    setupAuthListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }

        // Switch between login/register
        document.getElementById('showRegister')?.addEventListener('click', () => this.app.showRegister());
        document.getElementById('showLogin')?.addEventListener('click', () => this.app.showLogin());
    }

    async handleLogin() {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!this.validateEmail(email)) {
            this.showError('loginError', 'Por favor, insira um email válido.');
            return;
        }

        if (password.length < 6) {
            this.showError('loginError', 'A senha deve ter pelo menos 6 caracteres.');
            return;
        }
        try {
            const { data, error } = await window.sb.auth.signInWithPassword({ email, password });
            if (error) {
                this.showError('loginError', 'E-mail ou senha inválidos.');
                return;
            }

            const uid = data?.user?.id;
            if (!uid) {
                this.showError('loginError', 'Falha ao obter usuário.');
                return;
            }

            // Garantir perfil existente e carregar dados
            const profile = await window.sbEnsureProfile((data.user.email || '').split('@')[0]);

            this.app.currentUser = {
                id: uid,
                email: data.user.email,
                name: profile?.name || '',
                bio: profile?.bio || '',
                profilePhoto: profile?.avatar_url || ''
            };
            localStorage.setItem('currentUser', JSON.stringify(this.app.currentUser));

            this.clearForm('loginForm');
            this.app.showMainApp();
            this.showSuccess('Login realizado com sucesso!');
        } catch (e) {
            console.error(e);
            this.showError('loginError', 'Erro ao autenticar.');
        }
    }

    async handleRegister() {
        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;

        if (!name || name.length < 3) {
            this.showError('registerError', 'O nome deve ter pelo menos 3 caracteres.');
            return;
        }

        if (!this.validateEmail(email)) {
            this.showError('registerError', 'Por favor, insira um email válido.');
            return;
        }

        if (password.length < 6) {
            this.showError('registerError', 'A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        if (password !== confirmPassword) {
            this.showError('registerError', 'As senhas não coincidem.');
            return;
        }

        try {
            const { data, error } = await window.sb.auth.signUp({ email, password });
            if (error) {
                this.showError('registerError', 'Erro ao criar conta.');
                return;
            }

            const uid = data?.user?.id;
            if (uid) {
                await window.sb
                  .from('profiles')
                  .insert({ user_id: uid, name })
                  .select()
                  .maybeSingle();
            }

            // Tentar login automático (se confirmação de email não for exigida)
            const { data: loginData, error: loginErr } = await window.sb.auth.signInWithPassword({ email, password });
            if (!loginErr && loginData?.user?.id) {
                const profile = await window.sbEnsureProfile(name || (email.split('@')[0]));
                this.app.currentUser = {
                    id: loginData.user.id,
                    email: email,
                    name: profile?.name || name || '',
                    bio: profile?.bio || '',
                    profilePhoto: profile?.avatar_url || ''
                };
                localStorage.setItem('currentUser', JSON.stringify(this.app.currentUser));
                this.clearForm('registerForm');
                this.app.showMainApp();
                this.showSuccess('Conta criada e login realizado!');
                return;
            }

            // Caso contrário, orientar usuário a verificar email
            this.clearForm('registerForm');
            this.app.showLogin();
            this.showSuccess('Conta criada! Verifique seu e-mail para confirmar.');
        } catch (e) {
            console.error(e);
            this.showError('registerError', 'Erro inesperado ao registrar.');
        }
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Removidos métodos locais de usuários (migração para Supabase Auth)

    clearForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
            this.clearErrors();
        }
    }

    showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                errorElement.classList.add('hidden');
            }, 5000);
        }
    }

    clearErrors() {
        const errorElements = document.querySelectorAll('[id$="Error"]');
        errorElements.forEach(element => {
            element.classList.add('hidden');
            element.textContent = '';
        });
    }

    showSuccess(message) {
        // Create and show success notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 z-50 flex items-center gap-3 rounded-lg bg-green-500 px-4 py-3 text-white shadow-lg';
        notification.innerHTML = `
            <span class="material-symbols-outlined">check_circle</span>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize authentication when app loads
document.addEventListener('DOMContentLoaded', () => {
    // Aguardar um pouco para garantir que tudo está carregado
    setTimeout(() => {
        if (window.app) {
            window.auth = new AuthManager(window.app);
            console.log('AuthManager inicializado');
            console.log('showRegister encontrado:', document.getElementById('showRegister') !== null);
            console.log('showLogin encontrado:', document.getElementById('showLogin') !== null);
            
            // Verificar se os elementos existem
            const showRegisterBtn = document.getElementById('showRegister');
            const showLoginBtn = document.getElementById('showLogin');
            
            if (showRegisterBtn) {
                console.log('Botão showRegister encontrado');
            } else {
                console.log('Botão showRegister NÃO encontrado');
            }
            
            if (showLoginBtn) {
                console.log('Botão showLogin encontrado');
            } else {
                console.log('Botão showLogin NÃO encontrado');
            }
        } else {
            console.log('window.app não encontrado');
        }
    }, 100);
});