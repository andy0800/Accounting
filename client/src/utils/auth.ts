export type UserRole = 'admin' | 'secretary' | 'home_service_user';

const TOKEN_KEY = 'auth_token';
const ROLE_KEY = 'auth_role';
const USERNAME_KEY = 'auth_username';

export const auth = {
	login: (token: string, role: UserRole, username: string) => {
		localStorage.setItem(TOKEN_KEY, token);
		localStorage.setItem(ROLE_KEY, role);
		localStorage.setItem(USERNAME_KEY, username);
	},
	logout: () => {
		localStorage.removeItem(TOKEN_KEY);
		localStorage.removeItem(ROLE_KEY);
		localStorage.removeItem(USERNAME_KEY);
	},
	getToken: (): string | null => localStorage.getItem(TOKEN_KEY),
	getRole: (): UserRole | null => (localStorage.getItem(ROLE_KEY) as UserRole) || null,
	getUsername: (): string | null => localStorage.getItem(USERNAME_KEY),
	isLoggedIn: (): boolean => !!localStorage.getItem(TOKEN_KEY),
};
