import { attendanceDB } from '../../config/database.js';
import AppError from '../../utils/AppError.js';
import { PayrollCalculationService } from './PayrollCalculationService.js';

export class PayrollFinalizationService {
    /**
     * Finalize payroll for a month. Runs calculations, inserts snapshots and freezes entries.
     * 
     * @param {number} orgId 
     * @param {number} year 
     * @param {number} month 
     * @param {number} finalizedBy 
     * @returns {Promise<Object>} The finalized payroll run
     */
    static async finalizePayroll(orgId, year, month, finalizedBy) {
        return await attendanceDB.transaction(async (trx) => {
            // Check if run already exists
            let existingRun = await trx('payroll_runs')
                .where({ org_id: orgId, year, month })
                .first();

            if (existingRun) {
                if (existingRun.status === 'Finalized' || existingRun.status === 'Paid') {
                    throw new AppError(`Payroll for ${year}-${String(month).padStart(2, '0')} has already been finalized/paid.`, 400);
                }
                
                // If it was Live, we clear old entries first
                await trx('payroll_entries')
                    .where('run_id', existingRun.run_id)
                    .del();
            }

            // Calculate payroll for all employees in real-time
            const calculatedRecords = await PayrollCalculationService.calculateProjectedPayroll(orgId, year, month);

            if (calculatedRecords.length === 0) {
                throw new AppError('No employees with active salary configurations were found to finalize.', 400);
            }

            let runId;
            if (existingRun) {
                runId = existingRun.run_id;
                await trx('payroll_runs')
                    .where('run_id', runId)
                    .update({
                        status: 'Finalized',
                        finalized_by: finalizedBy,
                        finalized_at: trx.fn.now(),
                        updated_at: trx.fn.now()
                    });
            } else {
                const [newRunId] = await trx('payroll_runs').insert({
                    org_id: orgId,
                    year,
                    month,
                    status: 'Finalized',
                    finalized_by: finalizedBy,
                    finalized_at: trx.fn.now()
                });
                runId = newRunId;
            }

            // Insert entries
            for (const record of calculatedRecords) {
                await trx('payroll_entries').insert({
                    run_id: runId,
                    employee_id: record.employee_id,
                    gross_salary: record.gross_salary,
                    present_days: record.present_days,
                    half_days: record.half_days,
                    absent_days: record.absent_days,
                    paid_leave_days: record.paid_leave_days,
                    holiday_days: record.holiday_days,
                    weekly_off_days: record.weekly_off_days,
                    overtime_hours: record.overtime_hours,
                    overtime_amount: record.overtime_amount,
                    lop_days: record.lop_days,
                    lop_deduction: record.lop_deduction,
                    net_salary: record.net_salary,
                    salary_snapshot_json: JSON.stringify(record.salary_snapshot),
                    attendance_snapshot_json: JSON.stringify(record.attendance_snapshot),
                    calculation_snapshot_json: JSON.stringify(record.calculation_snapshot)
                });
            }

            const finalizedRun = await trx('payroll_runs')
                .where('run_id', runId)
                .first();

            return finalizedRun;
        });
    }

    /**
     * Mark a finalized payroll run as Paid.
     * 
     * @param {number} runId 
     * @param {number} paidBy 
     * @returns {Promise<Object>} The updated payroll run
     */
    static async markAsPaid(runId, paidBy) {
        return await attendanceDB.transaction(async (trx) => {
            const run = await trx('payroll_runs')
                .where('run_id', runId)
                .first();

            if (!run) {
                throw new AppError('Payroll run not found.', 404);
            }

            if (run.status === 'Paid') {
                throw new AppError('Payroll has already been marked as paid.', 400);
            }

            if (run.status !== 'Finalized') {
                throw new AppError('Only finalized payroll runs can be marked as paid.', 400);
            }

            await trx('payroll_runs')
                .where('run_id', runId)
                .update({
                    status: 'Paid',
                    paid_by: paidBy,
                    paid_at: trx.fn.now(),
                    updated_at: trx.fn.now()
                });

            return await trx('payroll_runs')
                .where('run_id', runId)
                .first();
        });
    }

    /**
     * Get historical runs for an organization.
     * 
     * @param {number} orgId 
     * @returns {Promise<Array>} List of runs
     */
    static async getPayrollRuns(orgId) {
        return await attendanceDB('payroll_runs')
            .where('org_id', orgId)
            .orderBy('year', 'desc')
            .orderBy('month', 'desc');
    }

    /**
     * Get detailed entries inside a finalized/paid payroll run.
     * 
     * @param {number} runId 
     * @returns {Promise<Array>} List of payroll entries with employee details
     */
    static async getRunEntries(runId) {
        return await attendanceDB('payroll_entries as pe')
            .join('users as u', 'pe.employee_id', 'u.user_id')
            .select(
                'pe.*',
                'u.user_name',
                'u.user_code',
                'u.email',
                'u.profile_image_url'
            )
            .where('pe.run_id', runId)
            .orderBy('u.user_name', 'asc');
    }

    /**
     * Get a specific payroll run by details.
     */
    static async getRunByMonth(orgId, year, month) {
        return await attendanceDB('payroll_runs')
            .where({ org_id: orgId, year, month })
            .first();
    }
}
