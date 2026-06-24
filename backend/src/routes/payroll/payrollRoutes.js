import express from 'express';
import { authenticateJWT, authorize } from '../../middleware/auth.js';
import * as payrollController from '../../controllers/payroll/payrollController.js';

const router = express.Router();

// Apply JWT authentication to all payroll endpoints
router.use(authenticateJWT);

// Salary APIs
router.get('/employees/:id/salary', payrollController.getEmployeeSalary);
router.post('/employees/:id/salary', authorize('admin', 'hr'), payrollController.updateEmployeeSalary);
router.get('/employees/:id/salary/history', authorize('admin', 'hr'), payrollController.getEmployeeSalaryHistory);

// Payroll Dashboard & Calculation APIs (restricted to admin & hr)
router.get('/dashboard', authorize('admin', 'hr'), payrollController.getPayrollDashboard);
router.get('/dashboard/:employeeId', authorize('admin', 'hr'), payrollController.getEmployeeProjectedDetails);
router.post('/finalize', authorize('admin', 'hr'), payrollController.finalizePayrollRun);
router.get('/runs', authorize('admin', 'hr'), payrollController.getPayrollRuns);
router.get('/runs/:runId', authorize('admin', 'hr'), payrollController.getPayrollRunDetails);
router.post('/runs/:runId/mark-paid', authorize('admin', 'hr'), payrollController.markPayrollRunAsPaid);

// Payslip PDF Stream API (accessible by employees for their own, or admin/hr)
router.get('/entries/:entryId/payslip', payrollController.getPayslip);

export default router;
