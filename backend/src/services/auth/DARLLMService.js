import axios from 'axios';

function sanitizeList(values, key) {
    return [...new Set((values || []).map((item) => item?.[key]).filter(Boolean))];
}

function buildDailyContext(dateList, activitiesByDate, eventsByDate) {
    return dateList.map((date) => {
        const activities = activitiesByDate[date] || [];
        const events = eventsByDate[date] || [];

        return {
            date,
            day: new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short' }),
            work_items: sanitizeList(activities, 'title').slice(0, 4),
            work_types: sanitizeList(activities, 'activity_type').slice(0, 3),
            meeting_items: sanitizeList(events, 'title').slice(0, 4),
            meeting_types: sanitizeList(events, 'type').slice(0, 3),
            work_count: activities.length,
            meeting_count: events.length,
        };
    });
}

function buildWeeklyContext(dailyContext) {
    const weekly = [];
    for (let i = 0; i < dailyContext.length; i += 7) {
        const block = dailyContext.slice(i, i + 7);
        const weekNumber = Math.floor(i / 7) + 1;
        const dates = block.map((d) => d.date);

        const workItems = [...new Set(block.flatMap((d) => d.work_items || []))].slice(0, 6);
        const workTypes = [...new Set(block.flatMap((d) => d.work_types || []))].slice(0, 4);
        const meetingItems = [...new Set(block.flatMap((d) => d.meeting_items || []))].slice(0, 5);
        const meetingTypes = [...new Set(block.flatMap((d) => d.meeting_types || []))].slice(0, 4);

        weekly.push({
            week: weekNumber,
            range: `${dates[0]} to ${dates[dates.length - 1]}`,
            active_days: block.filter((d) => d.work_count > 0 || d.meeting_count > 0).length,
            work_items: workItems,
            work_types: workTypes,
            meeting_items: meetingItems,
            meeting_types: meetingTypes,
            work_count: block.reduce((sum, d) => sum + d.work_count, 0),
            meeting_count: block.reduce((sum, d) => sum + d.meeting_count, 0),
        });
    }
    return weekly;
}

function buildDayWorkTextFromSource(dayActivities) {
    if (!Array.isArray(dayActivities) || dayActivities.length === 0) return '';
    const titles = [...new Set(dayActivities.map((a) => a?.title).filter(Boolean))].slice(0, 4);
    if (titles.length > 0) return titles.join(', ');
    const types = [...new Set(dayActivities.map((a) => a?.activity_type).filter(Boolean))].slice(0, 3);
    if (types.length > 0) return types.join(', ');
    return 'Work updated in DAR';
}

function buildDayMeetingTextFromSource(dayEvents) {
    if (!Array.isArray(dayEvents) || dayEvents.length === 0) return '';
    const titles = [...new Set(dayEvents.map((e) => e?.title).filter(Boolean))].slice(0, 4);
    if (titles.length > 0) return titles.join(', ');
    const types = [...new Set(dayEvents.map((e) => e?.type).filter(Boolean))].slice(0, 3);
    if (types.length > 0) return types.join(', ');
    return 'Meetings/events updated';
}

function buildDeterministicMonthlyWorkSummary(dateList, activitiesByDate, eventsByDate) {
    const weekRanges = buildWeekRanges(dateList);
    const weekBlocks = weekRanges.map(({ weekNumber, dates }) => {
        const lines = [`Week ${weekNumber}`];
        dates.forEach((date, index) => {
            const dayWork = buildDayWorkTextFromSource(activitiesByDate[date] || []);
            const dayMeetings = buildDayMeetingTextFromSource(eventsByDate[date] || []);

            const workLine = dayWork || 'No work updates.';

            lines.push(`${index + 1}. ${workLine}`);
            if (dayMeetings) {
                lines.push(`   Meetings: ${dayMeetings}`);
            }
        });

        // Pad short final week to preserve consistent 1..7 structure.
        for (let i = dates.length + 1; i <= 7; i += 1) {
            lines.push(`${i}. No work updates.`);
        }

        return lines.join('\n');
    });

    return weekBlocks.join('\n\n');
}

function buildContextSummary(dailyContext) {
    const activeDays = dailyContext.filter((row) => row.work_count > 0 || row.meeting_count > 0).length;
    const totalWork = dailyContext.reduce((sum, row) => sum + row.work_count, 0);
    const totalMeetings = dailyContext.reduce((sum, row) => sum + row.meeting_count, 0);
    return { active_days: activeDays, total_work_entries: totalWork, total_meeting_entries: totalMeetings };
}

function getFormatRules(reportType, totalDays) {
    if (reportType === 'monthly' || (reportType === 'custom' && totalDays > 7)) {
        return [
            'Use monthly format with week blocks exactly like this:',
            'Week 1',
            '1. <day-1 work summary>',
            '   Meetings: <day-1 meetings/events summary>',
            '2. <day-2 work summary>',
            '   Meetings: <day-2 meetings/events summary>',
            '...',
            '7. <day-7 work summary>',
            '   Meetings: <day-7 meetings/events summary>',
            'Week 2 ...',
            'Rules for each numbered day line:',
            '- Print meetings/events on the next line only when that day has meetings/events.',
            '- Use this pattern: "n. <work>" and, when applicable, add "   Meetings: <meetings/events>" on next line.',
            '- If no work, write: "n. No work updates."',
            '- If no meetings/events on that day, do not add a Meetings line.',
            '- No separate trailing section like "Meetings/Events:" outside week blocks.',
            '- Keep strict chronological order by day within each week.',
            '- Use plain text only; no JSON, markdown, or code fences.',
        ].join('\n');
    }

    return [
        'Use day-by-day format exactly like this:',
        '1. Mon',
        '   Work: ...',
        '   Meetings: ...',
        '2. Tue',
        '   Work: ...',
        '   Meetings: ...',
        'Meetings must always be on a separate new line from Work.',
    ].join('\n');
}

async function buildPrompt({ employeeName, reportType, dateList, activitiesByDate, eventsByDate }) {
    const dailyContext = buildDailyContext(dateList, activitiesByDate, eventsByDate);
    const contextSummary = buildContextSummary(dailyContext);
    const formatRules = getFormatRules(reportType, dateList.length);
    const isWeekStyle = reportType === 'monthly' || (reportType === 'custom' && dateList.length > 7);
    const contextData = isWeekStyle ? buildWeeklyContext(dailyContext) : dailyContext;
    const contextLabel = isWeekStyle ? 'Week-wise JSON data:' : 'Day-wise JSON data:';

    return {
        system: [
            'You generate concise employee DAR summaries.',
            'Return strict JSON only. No markdown, no explanation.',
            'Use only the provided context. Do not invent facts.',
            'JSON schema: {"report_summary": string, "work_summary": string}',
            'Meetings/events must be embedded within each corresponding day/week block only.',
            'Never add a separate standalone section like "Meetings/Events:" at the end.',
        ].join(' '),
        user: [
            `Employee: ${employeeName}`,
            `Report type: ${reportType}`,
            `Date range: ${dateList[0]} to ${dateList[dateList.length - 1]}`,
            '',
            'Formatting rules:',
            formatRules,
            '',
            'Summary stats:',
            JSON.stringify(contextSummary),
            '',
            contextLabel,
            JSON.stringify(contextData),
            '',
            'Write a short report_summary (1 sentence) and a work_summary that strictly follows the required format.',
            'If there is no work or meeting data for a day/week, mention that explicitly.',
        ].join('\n'),
    };
}

function validateLLMResponse(parsed) {
    if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid LLM response payload.');
    }

    const reportSummary = typeof parsed.report_summary === 'string' ? parsed.report_summary.trim() : '';
    const workSummary = typeof parsed.work_summary === 'string' ? parsed.work_summary.trim() : '';

    if (!reportSummary || !workSummary) {
        throw new Error('Missing required report_summary/work_summary from LLM response.');
    }

    return {
        report_summary: reportSummary,
        work_summary: workSummary,
    };
}

function extractJSONObject(rawContent) {
    if (!rawContent || typeof rawContent !== 'string') return null;

    const isPayload = (obj) => (
        obj
        && typeof obj === 'object'
        && typeof obj.report_summary === 'string'
        && typeof obj.work_summary === 'string'
    );

    const parseCandidates = (text) => {
        const matches = text.match(/\{[\s\S]*?\}/g) || [];
        const parsed = [];
        for (const candidate of matches) {
            try {
                const obj = JSON.parse(candidate);
                parsed.push(obj);
            } catch (_) {
                // Ignore malformed candidate chunks.
            }
        }
        return parsed;
    };

    const trimmed = rawContent.trim();
    try {
        const whole = JSON.parse(trimmed);
        if (isPayload(whole)) return whole;
    } catch (_) {
        // Continue to fenced/substring extraction below.
    }

    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenced?.[1]) {
        try {
            const fencedObj = JSON.parse(fenced[1].trim());
            if (isPayload(fencedObj)) return fencedObj;
        } catch (_) {
            // Continue to bracket extraction.
        }
    }

    const parsedCandidates = parseCandidates(trimmed);
    const payloadCandidate = parsedCandidates.find(isPayload);
    if (payloadCandidate) return payloadCandidate;

    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
        const candidate = trimmed.slice(start, end + 1);
        try {
            const bracketObj = JSON.parse(candidate);
            if (isPayload(bracketObj)) return bracketObj;
            return null;
        } catch (_) {
            return null;
        }
    }

    return null;
}

function normalizeNonJSONContent(rawContent) {
    const text = String(rawContent || '').trim();
    if (!text) {
        return {
            report_summary: 'Monthly summary generated from available DAR records for the selected period.',
            work_summary: 'Worked on recorded DAR activities and updates during the selected period.',
        };
    }

    // If model returned multiple concatenated JSON objects, recover the first valid payload.
    const embeddedJson = text.match(/\{[\s\S]*?\}/g) || [];
    for (const item of embeddedJson) {
        try {
            const parsed = JSON.parse(item);
            if (parsed && typeof parsed.report_summary === 'string' && typeof parsed.work_summary === 'string') {
                return validateLLMResponse(parsed);
            }
        } catch (_) {
            // Ignore malformed fragments.
        }
    }

    // Remove leaked JSON payload blobs from free-form text before surfacing summary.
    const cleanedText = text
        .replace(/\{[\s\S]*?"report_summary"[\s\S]*?"work_summary"[\s\S]*?\}/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();

    const lines = cleanedText.split('\n').map((l) => l.trim()).filter(Boolean);
    const firstLine = lines[0] || cleanedText;
    const firstSentence = firstLine.split(/(?<=[.!?])\s/)[0]?.trim() || firstLine;
    const fallbackOneLine = 'Worked on recorded DAR activities and updates during the selected period.';
    const normalizedReport = firstSentence.length > 12
        ? firstSentence
        : 'Monthly summary generated from available DAR records for the selected period.';
    const normalizedWork = cleanedText || fallbackOneLine;

    return {
        report_summary: normalizedReport,
        work_summary: normalizedWork,
    };
}

function buildWeekRanges(dateList) {
    const ranges = [];
    for (let i = 0; i < dateList.length; i += 7) {
        ranges.push({ weekNumber: Math.floor(i / 7) + 1, dates: dateList.slice(i, i + 7) });
    }
    return ranges;
}

function buildMeetingsTextForWeek(weekDates, eventsByDate) {
    const weekEvents = weekDates.flatMap((d) => eventsByDate[d] || []);
    if (weekEvents.length === 0) return 'No meetings/events.';

    const titles = [...new Set(weekEvents.map((e) => e?.title).filter(Boolean))].slice(0, 4);
    if (titles.length > 0) return titles.join(', ');

    const types = [...new Set(weekEvents.map((e) => e?.type).filter(Boolean))].slice(0, 3);
    if (types.length > 0) return types.join(', ');

    return 'Meetings/events updated.';
}

function enforceWeeklyMeetingSections(workSummary, dateList, eventsByDate) {
    if (!workSummary || !dateList?.length) return workSummary;

    const weekRanges = buildWeekRanges(dateList);
    const text = String(workSummary);

    // If no week headers exist, append a deterministic week skeleton with day-style lines.
    if (!/(^|\n)\s*Week\s+\d+/i.test(text)) {
        const appendix = weekRanges.map(({ weekNumber, dates }) => (
            [
                `Week ${weekNumber}`,
                '1. Work updates captured in DAR.',
                '2. Key activities were recorded.',
                '3. Focus areas tracked for the week.',
                '4. Work updates continued.',
                '5. Work updates continued.',
                '6. Work updates continued.',
                '7. Work updates continued.',
                ...(buildMeetingsTextForWeek(dates, eventsByDate) !== 'No meetings/events.'
                    ? [`   Meetings: ${buildMeetingsTextForWeek(dates, eventsByDate)}`]
                    : []),
            ].join('\n')
        )).join('\n\n');
        return `${text.trim()}\n\n${appendix}`.trim();
    }

    const blocks = text.split(/\n\s*\n/);
    const updated = blocks.map((block) => {
        const weekMatch = block.match(/(^|\n)\s*Week\s+(\d+)/i);
        if (!weekMatch) return block;

        const weekNumber = Number(weekMatch[2]);
        const weekRange = weekRanges.find((w) => w.weekNumber === weekNumber);
        const meetingsText = buildMeetingsTextForWeek(weekRange?.dates || [], eventsByDate);

        const hasInlineMeetings = /(^|\n)\s*Meetings\s*:/i.test(block);
        if (hasInlineMeetings) {
            return block;
        }

        if (meetingsText === 'No meetings/events.') {
            return block;
        }

        const numbered = [...block.matchAll(/(^|\n)\s*(\d+)\./g)];
        const maxPoint = numbered.length > 0
            ? Math.max(...numbered.map((m) => Number(m[2]) || 0))
            : 0;
        const nextPoint = Math.min(7, Math.max(1, maxPoint + 1));
        return `${block}\n${nextPoint}. Work updates continued.\n   Meetings: ${meetingsText}`;
    });

    return updated.join('\n\n');
}

function sanitizeReportSummaryText(reportSummary) {
    let text = String(reportSummary || '').trim();
    if (!text) return 'Monthly summary generated from available DAR records for the selected period.';

    text = text
        .replace(/\\r\\n/g, ' ')
        .replace(/\\n/g, ' ')
        .replace(/\\"/g, '"')
        .replace(/\s+/g, ' ')
        .trim();

    if (/['"]report_summary['"]\s*:|['"]work_summary['"]\s*:/i.test(text)) {
        const extracted = text.match(/report_summary['"]?\s*:\s*['"]([\s\S]*?)['"]\s*,\s*['"]work_summary/i);
        if (extracted?.[1]) {
            text = extracted[1].trim();
        } else {
            text = text.replace(/^\{[\s\S]*?\}\s*/g, '').trim();
        }
    }

    const firstSentence = text.split(/(?<=[.!?])\s+/)[0]?.trim() || text;
    return firstSentence || 'Monthly summary generated from available DAR records for the selected period.';
}

function sanitizeWorkSummaryText(workSummary) {
    let text = String(workSummary || '').trim();
    if (!text) return text;

    // Decode escaped newlines/quotes that sometimes arrive inside JSON strings.
    text = text
        .replace(/\\r\\n/g, '\n')
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'");

    const hasLeakedPayload = /['"]report_summary['"]\s*:|['"]work_summary['"]\s*:/i.test(text);
    if (hasLeakedPayload) {
        const weekStart = text.search(/\bWeek\s+1\b/i);
        const dayStart = text.search(/(^|\n)\s*1\.\s*(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b/i);
        const numberedStart = text.search(/(^|\n)\s*1\.\s+/m);
        const start = weekStart >= 0 ? weekStart : (dayStart >= 0 ? dayStart : numberedStart);

        if (start >= 0) {
            text = text.slice(start).trim();
        }

        // Remove any remaining leaked key/value lines.
        text = text
            .split('\n')
            .filter((line) => !/report_summary|work_summary/i.test(line))
            .join('\n')
            .trim();
    }

    return text.replace(/\n{3,}/g, '\n\n').trim();
}

async function requestGroqJSON({ model, prompt }) {
    const body = {
        model,
        temperature: 0.1,
        max_completion_tokens: 420,
        messages: [
            { role: 'system', content: prompt.system },
            { role: 'user', content: prompt.user },
        ],
    };

    const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        body,
        {
            headers: {
                Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            timeout: 25000,
        }
    );

    const content = response?.data?.choices?.[0]?.message?.content;
    if (!content) {
        throw new Error('Empty response from Groq model.');
    }

    const parsed = extractJSONObject(content);
    if (!parsed) return validateLLMResponse(normalizeNonJSONContent(content));

    return validateLLMResponse(parsed);
}

export function isGroqEnabled() {
    return Boolean(process.env.GROQ_API_KEY);
}

export async function generateNarrativeWithGroq({
    employeeName,
    reportType,
    dateList,
    activitiesByDate,
    eventsByDate,
}) {
    if (!isGroqEnabled()) {
        throw new Error('GROQ_API_KEY is not configured.');
    }
    if (!dateList || dateList.length === 0) {
        throw new Error('Date range is empty for LLM report generation.');
    }
    const model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
    const prompt = await buildPrompt({ employeeName, reportType, dateList, activitiesByDate, eventsByDate });

    try {
        const normalized = await requestGroqJSON({ model, prompt });
        const isWeekStyle = reportType === 'monthly' || (reportType === 'custom' && dateList.length > 7);
        const finalReportSummary = sanitizeReportSummaryText(normalized.report_summary);
        let finalWorkSummary = sanitizeWorkSummaryText(normalized.work_summary);
        if (isWeekStyle) {
            finalWorkSummary = buildDeterministicMonthlyWorkSummary(dateList, activitiesByDate, eventsByDate);
            finalWorkSummary = enforceWeeklyMeetingSections(finalWorkSummary, dateList, eventsByDate);
            finalWorkSummary = sanitizeWorkSummaryText(finalWorkSummary);
        }

        return {
            ...normalized,
            report_summary: finalReportSummary,
            work_summary: finalWorkSummary,
            generation_mode: 'llm',
        };
    } catch (error) {
        console.error('[DAR LLM] Groq generation failed:', error?.response?.data || error.message);
        if (error?.response?.status === 429) {
            throw new Error('Groq rate limit reached. Please wait 60 seconds and retry, or reduce employees/date range.');
        }
        throw new Error(error?.response?.data?.error?.message || error.message || 'Groq generation failed.');
    }
}
