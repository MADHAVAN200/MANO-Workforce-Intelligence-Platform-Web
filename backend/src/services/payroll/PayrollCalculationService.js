import { attendanceDB } from '../../config/database.js';
import { getDayType, getShiftRules } from '../attendance/shiftManagementService.js';
import { SalaryHistoryService } from './SalaryHistoryService.js';

export class PayrollCalculationService {
    /**
     * Calculate realtime salary projection for all eligible employees in an organization for a given month and year.
     * 
     * @param {number} orgId 
     * @param {number} year 
     * @param {number} month 
     * @returns {Promise<Array<Object>>} List of calculated employee payroll records
     */
    static async calculateProjectedPayroll(orgId, year, month) {
        const activeSalaryDate = `${year}-${String(month).padStart(2, '0')}-01`;
        
        // Fetch employees who have a salary configuration for this month
        const employees = await attendanceDB('users as u')
            .join('payroll_salary_history as s', 'u.user_id', 's.employee_id')
            .leftJoin('shifts as sh', 'u.shift_id', 'sh.shift_id')
            .where('u.org_id', orgId)
            .where('u.is_deleted', 0)
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
            );

        const results = [];
        for (const emp of employees) {
            const calculation = await this.calculateEmployeePayroll(emp, year, month, orgId);
            results.push({
                employee_id: emp.user_id,
                user_name: emp.user_name,
                email: emp.email,
                ...calculation
            });
        }
        return results;
    }

    /**
     * Calculate projected payroll for a single employee.
     * 
     * @param {Object} emp - Employee db object with policy_rules and active salary
     * @param {number} year 
     * @param {number} month 
     * @param {number} orgId 
     * @returns {Promise<Object>} Calculated payroll record
     */
    static async calculateEmployeePayroll(emp, year, month, orgId) {
        const totalDays = new Date(year, month, 0).getDate();
        const startDateStr = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDateStr = `${year}-${String(month).padStart(2, '0')}-${String(totalDays).padStart(2, '0')}`;

        // Get organization settings
        const settings = await attendanceDB('payroll_settings')
            .where('org_id', orgId)
            .first();
        const orgOtEnabled = settings ? settings.overtime_enabled === 1 : false;

        // Fetch attendance logs
        const attendanceRecords = await attendanceDB('daily_attendance')
            .where('user_id', emp.user_id)
            .whereBetween('date', [startDateStr, endDateStr]);

        const attendanceMap = new Map();
        for (const rec of attendanceRecords) {
            const dateStr = rec.date instanceof Date 
                ? rec.date.toISOString().split('T')[0] 
                : String(rec.date).split('T')[0];
            attendanceMap.set(dateStr, rec);
        }

        // Fetch approved leaves
        const leaves = await attendanceDB('leave_requests')
            .where('user_id', emp.user_id)
            .where('status', 'Approved')
            .where('start_date', '<=', endDateStr)
            .where('end_date', '>=', startDateStr);

        // Fetch holidays
        const holidays = await attendanceDB('holidays')
            .where('org_id', orgId)
            .whereBetween('holiday_date', [startDateStr, endDateStr]);

        const holidayDates = new Set(holidays.map(h => {
            const d = h.holiday_date instanceof Date 
                ? h.holiday_date.toISOString().split('T')[0] 
                : String(h.holiday_date).split('T')[0];
            return d;
        }));

        let present_days = 0;
        let half_days = 0;
        let absent_days = 0;
        let paid_leave_days = 0;
        let holiday_days = 0;
        let weekly_off_days = 0;
        let overtime_hours = 0;
        let lop_days = 0;

        const shiftRules = getShiftRules({ policy_rules: emp.policy_rules });
        const weekOffPolicy = shiftRules.week_off_policy;

        const todayStr = new Date().toISOString().split('T')[0];

        // Loop through each calendar day of the month
        for (let day = 1; day <= totalDays; day++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isFuture = dateStr > todayStr;

            const record = attendanceMap.get(dateStr);
            const isHoliday = holidayDates.has(dateStr);
            
            // Check for leave covering this date
            const matchingLeave = leaves.find(l => {
                const start = l.start_date instanceof Date ? l.start_date.toISOString().split('T')[0] : String(l.start_date).split('T')[0];
                const end = l.end_date instanceof Date ? l.end_date.toISOString().split('T')[0] : String(l.end_date).split('T')[0];
                return dateStr >= start && dateStr <= end;
            });

            // Determine if week off
            const dayType = getDayType(dateStr, weekOffPolicy);
            const isWeekOff = dayType === 'week_off';

            if (record) {
                const status = String(record.status).toUpperCase();
                
                if (status === 'PRESENT' || status === 'LATE' || status === 'OVERTIME') {
                    present_days += 1;
                    if (record.overtime_hours && Number(record.overtime_hours) > 0) {
                        overtime_hours += Number(record.overtime_hours);
                    }
                } else if (status === 'HALF_DAY' || status === 'HALF DAY') {
                    half_days += 1;
                    lop_days += 0.5;
                } else if (status === 'ABSENT' || status === 'MISSED_PUNCH') {
                    absent_days += 1;
                    lop_days += 1;
                } else if (status === 'LEAVE' || status === 'ON_LEAVE') {
                    if (matchingLeave) {
                        const payType = matchingLeave.pay_type || 'Paid';
                        const percentage = matchingLeave.pay_percentage !== undefined ? matchingLeave.pay_percentage : 100;
                        if (payType === 'Paid') {
                            paid_leave_days += 1;
                        } else if (payType === 'Unpaid') {
                            lop_days += 1;
                        } else { // Partial
                            paid_leave_days += (percentage / 100);
                            lop_days += ((100 - percentage) / 100);
                        }
                    } else {
                        paid_leave_days += 1;
                    }
                } else if (status === 'HOLIDAY') {
                    holiday_days += 1;
                } else if (status === 'WEEK_OFF' || status === 'WEEKEND') {
                    weekly_off_days += 1;
                } else {
                    present_days += 1; // Default fallback
                }
            } else {
                // No record exists
                if (isHoliday) {
                    holiday_days += 1;
                } else if (isWeekOff) {
                    weekly_off_days += 1;
                } else if (matchingLeave) {
                    const payType = matchingLeave.pay_type || 'Paid';
                    const percentage = matchingLeave.pay_percentage !== undefined ? matchingLeave.pay_percentage : 100;
                    if (payType === 'Paid') {
                        paid_leave_days += 1;
                    } else if (payType === 'Unpaid') {
                        lop_days += 1;
                    } else { // Partial
                        paid_leave_days += (percentage / 100);
                        lop_days += ((100 - percentage) / 100);
                    }
                } else if (isFuture) {
                    // Projected working day
                    present_days += 1;
                } else {
                    // Past working day with no punches: Absent
                    absent_days += 1;
                    lop_days += 1;
                }
            }
        }

        // Apply calculations
        const gross_salary = Number(emp.gross_monthly_salary);
        const daily_rate = Number((gross_salary / totalDays).toFixed(4));
        const lop_deduction = Number((lop_days * daily_rate).toFixed(2));

        // Overtime rate
        let overtime_amount = 0.00;
        const isOtApplicable = orgOtEnabled && emp.employee_ot_enabled === 1;
        if (isOtApplicable && overtime_hours > 0) {
            const ot_rate = Number(emp.overtime_rate || 0);
            overtime_amount = Number((overtime_hours * ot_rate).toFixed(2));
        }

        const net_salary = Number((gross_salary - lop_deduction + overtime_amount).toFixed(2));

        return {
            gross_salary,
            present_days: parseFloat(present_days.toFixed(2)),
            half_days: parseFloat(half_days.toFixed(2)),
            absent_days: parseFloat(absent_days.toFixed(2)),
            paid_leave_days: parseFloat(paid_leave_days.toFixed(2)),
            holiday_days: parseFloat(holiday_days.toFixed(2)),
            weekly_off_days: parseFloat(weekly_off_days.toFixed(2)),
            overtime_hours: parseFloat(overtime_hours.toFixed(2)),
            overtime_amount,
            lop_days: parseFloat(lop_days.toFixed(2)),
            lop_deduction,
            net_salary,
            salary_snapshot: {
                salary_history_id: emp.salary_history_id,
                gross_monthly_salary: gross_salary,
                overtime_enabled: emp.employee_ot_enabled,
                overtime_rate: emp.overtime_rate
            },
            attendance_snapshot: {
                present_days,
                half_days,
                absent_days,
                paid_leave_days,
                holiday_days,
                weekly_off_days,
                overtime_hours,
                lop_days
            },
            calculation_snapshot: {
                calendar_days: totalDays,
                daily_rate,
                lop_deduction,
                overtime_amount,
                net_salary,
                lop_method: 'calendar_days',
                overtime_enabled: isOtApplicable
            }
        };
    }
}
