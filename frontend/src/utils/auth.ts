export const getToken = () => localStorage.getItem('nh_recruiter_token');

export const getRecruiter = () => {
  const data = localStorage.getItem('nh_recruiter');
  return data ? JSON.parse(data) : null;
};

export const setAuth = (token: string, recruiter: Record<string, unknown>) => {
  localStorage.setItem('nh_recruiter_token', token);
  localStorage.setItem('nh_recruiter', JSON.stringify(recruiter));
};

export const clearAuth = () => {
  localStorage.removeItem('nh_recruiter_token');
  localStorage.removeItem('nh_recruiter');
};

export const isLoggedIn = () => !!getToken();

export const getAuthHeaders = () => ({
  'X-Auth-Token': getToken() || '',
});
