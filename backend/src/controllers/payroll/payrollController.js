import { attendanceDB } from '../../config/database.js';
import catchAsync from '../../utils/catchAsync.js';
import AppError from '../../utils/AppError.js';
import { SalaryHistoryService } from '../../services/payroll/SalaryHistoryService.js';
import { PayrollCalculationService } from '../../services/payroll/PayrollCalculationService.js';
import { PayrollFinalizationService } from '../../services/payroll/PayrollFinalizationService.js';
import { PayslipService } from '../../services/payroll/PayslipService.js';

/**
 * Controller to handle payroll operations.
 */
export const getEmployeeSalary = catchAsync(async (req, res, next) => {
    const employeeId = Number(req.params.id);
    const activeSalary = await SalaryHistoryService.getActiveSalary(employeeId, new Date());
    
    res.status(200).json({
        status: 'success',
        data: activeSalary
    });
});

export const getEmployeeSalaryHistory = catchAsync(async (req, res, next) => {
    const employeeId = Number(req.params.id);
    const history = await SalaryHistoryService.getSalaryHistory(employeeId);
    
    res.status(200).json({
        status: 'success',
        data: history
    });
});

export const updateEmployeeSalary = catchAsync(async (req, res, next) => {
    const employeeId = Number(req.params.id);
    const { grossMonthlySalary, overtimeEnabled, overtimeRate, effectiveFrom } = req.body;
    const orgId = req.user.org_id;
    const createdBy = req.user.id;

    if (!grossMonthlySalary || Number(grossMonthlySalary) <= 0) {
        return next(new AppError('Gross monthly salary must be a positive number.', 400));
    }
    if (!effectiveFrom) {
        return next(new AppError('Effective From date is required.', 400));
    }

    // Auto-create setting for the org if not exists
    const existingSettings = await attendanceDB('payroll_settings').where('org_id', orgId).first();
    if (!existingSettings) {
        await attendanceDB('payroll_settings').insert({
            org_id: orgId,
            overtime_enabled: 1,
            overtime_requires_approval: 0
        });
    }

    const newSalary = await SalaryHistoryService.createSalaryRevision({
        orgId,
        employeeId,
        grossMonthlySalary: Number(grossMonthlySalary),
        overtimeEnabled: overtimeEnabled ? 1 : 0,
        overtimeRate: Number(overtimeRate || 0.00),
        effectiveFrom,
        createdBy
    });

    res.status(200).json({
        status: 'success',
        message: 'Salary revision saved successfully.',
        data: newSalary
    });
});

export const getPayrollDashboard = catchAsync(async (req, res, next) => {
    const orgId = req.user.org_id;
    const { month } = req.query; // YYYY-MM
    
    let year, monthNum;
    if (month) {
        const parts = month.split('-');
        year = Number(parts[0]);
        monthNum = Number(parts[1]);
    } else {
        const now = new Date();
        year = now.getFullYear();
        monthNum = now.getMonth() + 1;
    }

    if (isNaN(year) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        return next(new AppError('Invalid month or year parameter.', 400));
    }

    // Seed payroll settings if they don't exist
    const settings = await attendanceDB('payroll_settings').where('org_id', orgId).first();
    if (!settings) {
        await attendanceDB('payroll_settings').insert({
            org_id: orgId,
            overtime_enabled: 1,
            overtime_requires_approval: 0
        });
    }

    // Check if payroll run is finalized/paid
    const run = await PayrollFinalizationService.getRunByMonth(orgId, year, monthNum);

    if (run && run.status !== 'Live') {
        const entries = await PayrollFinalizationService.getRunEntries(run.run_id);
        return res.status(200).json({
            status: 'success',
            isFinalized: true,
            run,
            data: entries
        });
    }

    // Else calculate projected realtime payroll
    const projections = await PayrollCalculationService.calculateProjectedPayroll(orgId, year, monthNum);
    res.status(200).json({
        status: 'success',
        isFinalized: false,
        run: run || { org_id: orgId, year, month: monthNum, status: 'Live' },
        data: projections
    });
});

export const getEmployeeProjectedDetails = catchAsync(async (req, res, next) => {
    const orgId = req.user.org_id;
    const employeeId = Number(req.params.employeeId);
    const { month } = req.query; // YYYY-MM
    
    let year, monthNum;
    if (month) {
        const parts = month.split('-');
        year = Number(parts[0]);
        monthNum = Number(parts[1]);
    } else {
        const now = new Date();
        year = now.getFullYear();
        monthNum = now.getMonth() + 1;
    }

    // Check if finalized
    const run = await PayrollFinalizationService.getRunByMonth(orgId, year, monthNum);
    if (run && run.status !== 'Live') {
        const entry = await attendanceDB('payroll_entries')
            .where({ run_id: run.run_id, employee_id: employeeId })
            .first();

        if (!entry) {
            return next(new AppError('No payroll entry found for this employee in the finalized run.', 404));
        }

        return res.status(200).json({
            status: 'success',
            isFinalized: true,
            data: {
                ...entry,
                salary_snapshot: typeof entry.salary_snapshot_json === 'string' ? JSON.parse(entry.salary_snapshot_json) : entry.salary_snapshot_json,
                attendance_snapshot: typeof entry.attendance_snapshot_json === 'string' ? JSON.parse(entry.attendance_snapshot_json) : entry.attendance_snapshot_json,
                calculation_snapshot: typeof entry.calculation_snapshot_json === 'string' ? JSON.parse(entry.calculation_snapshot_json) : entry.calculation_snapshot_json
            }
        });
    }

    // Realtime projection
    const activeSalaryDate = `${year}-${String(monthNum).padStart(2, '0')}-01`;
    const emp = await attendanceDB('users as u')
        .join('payroll_salary_history as s', 'u.user_id', 's.employee_id')
        .leftJoin('shifts as sh', 'u.shift_id', 'sh.shift_id')
        .where('u.user_id', employeeId)
        .where('s.effective_from', '<=', activeSalaryDate)
        .andWhere(function() {
            this.whereNull('s.effective_to')
                .orWhere('s.effective_to', '>=', activeSalaryDate);
        })
        .select(
            'u.user_id',
            'u.user_name',
            'u.email',
            'sh.policy_rules',
            's.salary_history_id',
            's.gross_monthly_salary',
            's.overtime_enabled as employee_ot_enabled',
            's.overtime_rate'
        )
        .first();

    if (!emp) {
        return next(new AppError('Employee has no active salary configuration for this period.', 400));
    }

    const calc = await PayrollCalculationService.calculateEmployeePayroll(emp, year, monthNum, orgId);
    res.status(200).json({
        status: 'success',
        isFinalized: false,
        data: {
            employee_id: emp.user_id,
            user_name: emp.user_name,
            ...calc
        }
    });
});

export const finalizePayrollRun = catchAsync(async (req, res, next) => {
    const orgId = req.user.org_id;
    const { month } = req.body; // YYYY-MM
    const finalizedBy = req.user.id;

    if (!month) {
        return next(new AppError('Month parameter is required (format: YYYY-MM).', 400));
    }

    const parts = month.split('-');
    const year = Number(parts[0]);
    const monthNum = Number(parts[1]);

    const run = await PayrollFinalizationService.finalizePayroll(orgId, year, monthNum, finalizedBy);
    
    res.status(200).json({
        status: 'success',
        message: 'Payroll finalized successfully.',
        data: run
    });
});

export const getPayrollRuns = catchAsync(async (req, res, next) => {
    const orgId = req.user.org_id;
    const runs = await PayrollFinalizationService.getPayrollRuns(orgId);
    
    res.status(200).json({
        status: 'success',
        data: runs
    });
});

export const getPayrollRunDetails = catchAsync(async (req, res, next) => {
    const runId = Number(req.params.runId);
    const entries = await PayrollFinalizationService.getRunEntries(runId);
    
    res.status(200).json({
        status: 'success',
        data: entries
    });
});

export const markPayrollRunAsPaid = catchAsync(async (req, res, next) => {
    const runId = Number(req.params.runId);
    const paidBy = req.user.id;

    const run = await PayrollFinalizationService.markAsPaid(runId, paidBy);

    res.status(200).json({
        status: 'success',
        message: 'Payroll run status updated to Paid.',
        data: run
    });
});

export const getPayslip = catchAsync(async (req, res, next) => {
    const entryId = Number(req.params.entryId);

    // Security check: regular employee should only access their own payslip
    if (req.user.user_type === 'employee') {
        const entry = await attendanceDB('payroll_entries')
            .where('entry_id', entryId)
            .first();
        if (!entry || entry.employee_id !== req.user.id) {
            return next(new AppError('You do not have permission to view this payslip.', 403));
        }
    }

    const pdfBuffer = await PayslipService.generatePayslipPDF(entryId);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=payslip-${entryId}.pdf`);
    res.send(pdfBuffer);
});
