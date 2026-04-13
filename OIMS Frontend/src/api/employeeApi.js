import api from "./axiosClient";

// ─── Employee API Service ──────────────────────────────────────────────────────

export const getAllEmployees = (params = {}) => {
  return api.get("/employees", { params });
};

export const getEmployeeById = (id) => {
  return api.get(`/employees/${id}`);
};

export const createEmployee = (formData) => {
  return api.post("/employees", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const updateEmployee = (id, formData) => {
  return api.put(`/employees/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const deleteEmployee = (id) => {
  return api.delete(`/employees/${id}`);
};

export const getEmployeeStats = () => {
  return api.get("/employees/stats");
};

export const getMyProfile = () => {
  return api.get("/employees/me");
};

// ─── Enum API ──────────────────────────────────────────────────────────────────

export const getEnums = () => {
  return api.get("/enums");
};

// ─── Authentication/Security ───────────────────────────────────────────────────

export const updatePassword = (data) => {
  return api.patch("/auth/update-password", data);
};

export const forgotPassword = (email) => {
  return api.post("/auth/forgot-password", { email });
};

export const resetPassword = (token, data) => {
  return api.post(`/auth/reset-password/${token}`, data);
};

export const adminResetPassword = (id) => {
  return api.post(`/auth/admin-reset-password/${id}`);
};
