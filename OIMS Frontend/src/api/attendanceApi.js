import api from "./axiosClient";

export const attendanceApi = {
  getMyAttendance: (year, month) => api.get(`/attendance/my-details?year=${year}&month=${month}`),
  getEmployeeAttendance: (id, year, month) => api.get(`/attendance/employee/${id}?year=${year}&month=${month}`),
  uploadCSV: (formData) => api.post('/attendance/upload-csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};
