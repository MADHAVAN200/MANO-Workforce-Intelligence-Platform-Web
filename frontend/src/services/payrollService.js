import api from './api';

const payrollService = {
    // Get active salary for employee
    getEmployeeSalary: async (employeeId) => {
        const response = await api.get(`/payroll/employees/${employeeId}/salary`);
        return response.data;
    },

    // Update/Revision salary for employee
    updateEmployeeSalary: async (employeeId, data) => {
        const response = await api.post(`/payroll/employees/${employeeId}/salary`, data);
        return response.data;
    },

    // Get salary history for employee
    getEmployeeSalaryHistory: async (employeeId) => {
        const response = await api.get(`/payroll/employees/${employeeId}/salary/history`);
        return response.data;
    },

    // Get payroll dashboard (realtime projected or finalized entries)
    getPayrollDashboard: async (month) => {
        const response = await api.get('/payroll/dashboard', { params: { month } });
        return response.data;
    },

    // Get single employee detailed projection / snapshot
    getEmployeeProjectedDetails: async (employeeId, month) => {
        const response = await api.get(`/payroll/dashboard/${employeeId}`, { params: { month } });
        return response.data;
    },

    // Finalize payroll for month (creates a payroll run and freezes values)
    finalizePayroll: async (month) => {
        const response = await api.post('/payroll/finalize', { month });
        return response.data;
    },

    // Get all historical payroll runs
    getPayrollRuns: async () => {
        const response = await api.get('/payroll/runs');
        return response.data;
    },

    // Get run entries details
    getPayrollRunDetails: async (runId) => {
        const response = await api.get(`/payroll/runs/${runId}`);
        return response.data;
    },

    // Record run as paid
    markRunAsPaid: async (runId) => {
        const response = await api.post(`/payroll/runs/${runId}/mark-paid`);
        return response.data;
    },

    // Download payslip utility
    downloadPayslip: async (entryId, employeeName, monthName, year) => {
        const response = await api.get(`/payroll/entries/${entryId}/payslip`, {
            responseType: 'blob'
        });
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `Payslip_${employeeName.replace(/\s+/g, '_')}_${monthName}_${year}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

export default payrollService;
