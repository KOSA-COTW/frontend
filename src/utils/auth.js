export const authUtils = {
  getToken: () => localStorage.getItem('accessToken'),

  setToken: (token) => localStorage.setItem('accessToken', token),

  removeToken: () => localStorage.removeItem('accessToken'),

  isAuthenticated: () => !!localStorage.getItem('accessToken')
}
