import { describe, expect, it, vi } from 'vitest';
import {
    add,
    addDays,
    addHours,
    addMinutes,
    addMonths,
    addYears,
    format,
    getHours,
    getMinutes,
    getMonth,
    getYear,
    set,
    setHours,
    startOfMonth,
    startOfQuarter,
    startOfYear,
    setDate,
} from 'date-fns';

import { resetDateTime } from '@/utils/date-utils';

import {
    clickCalendarDate,
    clickSelectBtn,
    getCalendarCell,
    getCellClasses,
    getMonthName,
    hoverCalendarDate,
    openMenu,
    padZero,
    reOpenMenu,
} from '../utils';
import { FlowStep } from '@/constants';
import type { IMarker, TimeModel, TimeType } from '@/interfaces';
import { type VueWrapper } from '@vue/test-utils';
import { localToTz } from '@/utils/timezone';

describe('It should validate various picker scenarios', () => {
    it('Should dynamically disable times', async () => {
        const modelValue = set(new Date(), { hours: 12, minutes: 0, seconds: 0, milliseconds: 0 });
        const disabledTimes = [
            { hours: 14, minutes: 15 },
            { hours: 14, minutes: 20 },
            { hours: 15, minutes: '*' },
        ];
        const dp = await openMenu({ modelValue, disabledTimes });

        const setHours = async (val: number) => {
            await dp.find(`[data-test-id="open-time-picker-btn"]`).trigger('click');

            await dp.find(`[data-test-id="hours-toggle-overlay-btn-0"]`).trigger('click');
            await dp.find(`[data-test-id="${val}"]`).trigger('click');
        };

        await setHours(14);

        await dp.find(`[data-test-id="minutes-toggle-overlay-btn-0"]`).trigger('click');

        await dp.vm.$nextTick();
        const el = dp.find(`[data-test-id="15"]`);

        expect(el.attributes()['aria-disabled']).toEqual('true');

        for (let i = 0; i < 20; i++) {
            await dp.find(`[data-test-id="minutes-time-inc-btn-0"]`).trigger('click');
        }

        const minutesOverlayBtn = dp.find(`[data-test-id="minutes-toggle-overlay-btn-0"]`);
        expect(minutesOverlayBtn.classes()).toContain('dp--time-invalid');

        await setHours(15);
        const hoursOverlayBtn = dp.find(`[data-test-id="hours-toggle-overlay-btn-0"]`);
        expect(hoursOverlayBtn.text()).toEqual('14');
        dp.unmount();
    });

    it('Should auto apply date in the flow mode (#465)', async () => {
        const dp = await openMenu({ flow: ['month', 'year', 'calendar'], autoApply: true });
        const date = add(new Date(), { months: 1, years: 1 });

        const year = getYear(date);

        const monthName = getMonthName(date);

        await dp.find(`[data-test-id="${monthName}"]`).trigger('click');
        await dp.find(`[data-test-id="${year}"]`).trigger('click');
        await clickCalendarDate(dp, date);
        const emitted = dp.emitted();
        expect(emitted).toHaveProperty('update:model-value', [[set(date, { seconds: 0, milliseconds: 0 })]]);
        dp.unmount();
    });

    it('Should not switch calendars in 1 month range with multi-calendars enabled (#472)', async () => {
        const start = set(new Date(), { month: 5 });
        const dp = await openMenu({ multiCalendars: true, range: true, startDate: start });
        const end = set(start, { month: getMonth(addMonths(start, 1)), date: 15 });

        const firstDateEl = getCalendarCell(dp, start);
        const secondDateEl = getCalendarCell(dp, end);

        await firstDateEl.trigger('click');
        await secondDateEl.trigger('click');

        const innerStartCell = firstDateEl.find('.dp__cell_inner');

        const innerEndCell = secondDateEl.find('.dp__cell_inner');

        expect(innerStartCell.classes()).toContain('dp__range_start');
        expect(innerEndCell.classes()).toContain('dp__range_end');
        dp.unmount();
    });

    it('Should emit regular and zoned date value', async () => {
        const timezone = 'UTC';
        const dp = await openMenu({ timezone: { emitTimezone: timezone } });
        const today = new Date();
        const value = set(today, { seconds: 0, milliseconds: 0 });

        await clickCalendarDate(dp, today);
        await clickSelectBtn(dp);

        const emitted = dp.emitted();

        expect(emitted).toHaveProperty('update:model-value', [[value]]);
        expect(emitted).toHaveProperty('update:model-timezone-value', [[localToTz(value, timezone)]]);
        dp.unmount();
    });

    it('Should set predefined value in the time-picker and emit updated value', async () => {
        const today = new Date();
        const modelValue = { hours: getHours(today), minutes: getMinutes(today), seconds: 0 };
        const dp = await openMenu({ timePicker: true, modelValue });

        const hours = dp.find(`[data-test-id="hours-toggle-overlay-btn-0"]`);
        const minutes = dp.find(`[data-test-id="minutes-toggle-overlay-btn-0"]`);

        expect(hours.text()).toEqual(`${padZero(modelValue.hours)}`);
        expect(minutes.text()).toEqual(`${padZero(modelValue.minutes)}`);

        await dp.find(`[data-test-id="hours-time-inc-btn-0"]`).trigger('click');
        await dp.find(`[data-test-id="minutes-time-inc-btn-0"]`).trigger('click');
        await clickSelectBtn(dp);

        const emitted = dp.emitted();
        expect(emitted).toHaveProperty('update:model-value', [
            [{ hours: getHours(addHours(today, 1)), minutes: getMinutes(addMinutes(today, 1)), seconds: 0 }],
        ]);
        dp.unmount();
    });

    it('Should dynamically update disabled dates when the prop is updated (#528)', async () => {
        const today = startOfMonth(new Date());
        const disabledDates = [addDays(today, 1)];
        const dp = await openMenu({ disabledDates });

        expect(getCellClasses(dp, disabledDates[0])).toContain('dp__cell_disabled');

        const updatedDisabledDates = [...disabledDates, addDays(today, 2)];

        await dp.setProps({ disabledDates: updatedDisabledDates });
        expect(getCellClasses(dp, updatedDisabledDates[1])).toContain('dp__cell_disabled');
        dp.unmount();
    });

    it('Should auto-apply values in year-picker (#529)', async () => {
        const dp = await openMenu({ yearPicker: true, autoApply: true });

        const year = getYear(new Date());

        await dp.find(`[data-test-id="${year}"]`).trigger('click');

        expect(dp.emitted()).toHaveProperty('update:model-value', [[year]]);

        dp.unmount();
    });

    it('Should disable date select on invalid times in range mode with different start/end sets', async () => {
        const disabledTimes = [[{ hours: 12, minutes: '*' }], [{ hours: 15, minutes: 20 }]];
        const modelValue = [set(new Date(), { hours: 11 }), set(new Date(), { hours: 15, minutes: 19 })];
        const dp = await openMenu({ disabledTimes, range: true, modelValue });

        await dp.find(`[data-test-id="open-time-picker-btn"]`).trigger('click');
        await dp.find(`[data-test-id="hours-time-inc-btn-0"]`).trigger('click');

        const selectBtn = dp.find(`[data-test-id="select-button"]`);
        expect(selectBtn.attributes()).toHaveProperty('disabled');

        await dp.find(`[data-test-id="hours-time-inc-btn-0"]`).trigger('click');
        expect(selectBtn.attributes().disabled).toBeFalsy();

        await dp.find(`[data-test-id="minutes-time-inc-btn-1"]`).trigger('click');
        expect(selectBtn.attributes()).toHaveProperty('disabled');

        await dp.find(`[data-test-id="minutes-time-inc-btn-1"]`).trigger('click');
        expect(selectBtn.attributes().disabled).toBeFalsy();
        dp.unmount();
    });

    it('Should properly set start time value on internal model value in time-picker mode (#535)', async () => {
        const startTime = { hours: 0, minutes: 0, seconds: 0 };
        const dp = await openMenu({ timePicker: true, startTime });

        const validate = async (time: TimeModel | TimeModel[], instance: VueWrapper) => {
            await instance.find(`[data-test-id="select-button"]`).trigger('click');
            expect(instance.emitted()).toHaveProperty('update:model-value', [[time]]);
            instance.unmount();
        };

        await validate(startTime, dp);

        const startTimes = [startTime, { ...startTime, hours: 1 }];
        const dpRange = await openMenu({ timePicker: true, range: true, startTime: startTimes });

        await validate(startTimes, dpRange);
        dp.unmount();
    });

    it('Should correctly display months in multi-calendars based on the given range (#540)', async () => {
        const start = set(new Date(), { month: 5 });
        const sameViewRange = [start, addMonths(start, 1)];
        const diffViewRange = [start, addMonths(start, 3)];

        const dp = await openMenu({ modelValue: sameViewRange, multiCalendars: true, range: true });

        const validateMonthAndYearValues = (index: number, date: Date) => {
            const month = dp.find(`[data-test-id="month-toggle-overlay-${index}"]`);
            const year = dp.find(`[data-test-id="year-toggle-overlay-${index}"]`);
            expect(month.text()).toEqual(getMonthName(date));
            expect(+year.text()).toEqual(getYear(date));
        };

        validateMonthAndYearValues(0, sameViewRange[0]);
        validateMonthAndYearValues(1, sameViewRange[1]);

        await reOpenMenu(dp, { modelValue: diffViewRange });

        validateMonthAndYearValues(0, diffViewRange[1]);

        await reOpenMenu(dp, { modelValue: diffViewRange, multiCalendars: { solo: true } });

        validateMonthAndYearValues(0, diffViewRange[0]);
        validateMonthAndYearValues(1, diffViewRange[1]);
        dp.unmount();
    });

    it('Should not break flow on changing months and years when calendar is first step (#553)', async () => {
        const start = addDays(startOfYear(new Date()), 1);
        const flow = [FlowStep.calendar, FlowStep.time];
        const dp = await openMenu({ flow, startDate: start });
        const nextMonth = addMonths(start, 1);

        await clickCalendarDate(dp, start);

        expect(dp.html()).toContain('dp__overlay');

        await reOpenMenu(dp);

        await dp.find(`[data-test-id="month-toggle-overlay-0"]`).trigger('click');
        await dp.find(`[data-test-id="${getMonthName(nextMonth)}"]`).trigger('click');
        const cell = getCalendarCell(dp, nextMonth);
        expect(cell.html()).toBeTruthy();
        dp.unmount();
    });

    it('Should enable or disable auto range selecting with no-disabled-range prop (#555)', async () => {
        const today = set(new Date(), { seconds: 0, milliseconds: 0 });
        const disabledDates = [addDays(today, 1), addDays(today, 2)];
        const dp = await openMenu({ disabledDates, range: { noDisabledRange: true, autoRange: 5 } });

        const selectAutoRange = async () => {
            await clickCalendarDate(dp, today);
            await dp.find(`[data-test-id="select-button"]`).trigger('click');
        };

        await selectAutoRange();

        expect(dp.emitted()).toHaveProperty('invalid-select');

        await reOpenMenu(dp, { range: { noDisabledRange: false, autoRange: 5 } });

        await selectAutoRange();

        expect(dp.emitted()).toHaveProperty('update:model-value', [[[today, addDays(today, 5)]]]);
        dp.unmount();
    });

    it('Should emit invalid-select when auto-apply is enabled and min/max range is validated (#563)', async () => {
        const today = resetDateTime(set(new Date(), { date: 1 }));
        const secondDate = addDays(today, 15);

        const dp = await openMenu({ range: { maxRange: 10 }, autoApply: true });

        const selectRange = async () => {
            await clickCalendarDate(dp, today);
            await getCalendarCell(dp, secondDate).trigger('click');
        };

        await selectRange();

        expect(dp.emitted()).toHaveProperty('invalid-select', [[secondDate]]);
        dp.unmount();
    });

    it('Should emit update-month-year in month-picker mode (#564)', async () => {
        const today = new Date();
        const dp = await openMenu({ monthPicker: true });

        await dp.find(`[data-test-id="${getMonthName(today)}"]`).trigger('click');

        expect(dp.emitted()).toHaveProperty('update-month-year', [
            [{ instance: 0, year: getYear(today), month: getMonth(today) }],
        ]);
        dp.unmount();
    });

    it('Should ignore format function for custom model-type (#582)', async () => {
        const today = resetDateTime(new Date());
        const formatFn = (date: Date | Date[]) => {
            return format(date as Date, 'dd.MM.yyyy');
        };

        const dp = await openMenu({ modelType: 'dd-MM-yyyy', format: formatFn });
        await clickCalendarDate(dp, today);
        await dp.find(`[data-test-id="select-button"]`).trigger('click');

        expect(dp.emitted()).toHaveProperty('update:model-value', [[format(today, 'dd-MM-yyyy')]]);
        dp.unmount();
    });

    it('Should display disabled values for time range validation', async () => {
        const dp = await openMenu({
            timePicker: true,
            range: true,
            startTime: [
                { hours: 15, minutes: 0, seconds: 0 },
                { hours: 15, minutes: 0, seconds: 0 },
            ],
        });

        const verifyArrow = async (type: TimeType, order: number, btn: string) => {
            const arrowBtn = dp.find(`[data-test-id="${type}-time-${btn}-btn-${order}"]`);
            await arrowBtn.trigger('mouseover');
            expect(arrowBtn.classes()).toContain('dp__inc_dec_button_disabled');
        };

        await verifyArrow('hours', 0, 'inc');
        await verifyArrow('minutes', 0, 'inc');
        await verifyArrow('hours', 1, 'dec');
        await verifyArrow('minutes', 1, 'dec');

        dp.unmount();
    });

    it('Should emit date-update event when calendar date is clicked', async () => {
        const now = new Date();
        const dp = await openMenu({});

        await clickCalendarDate(dp, now);

        expect(dp.emitted()).toHaveProperty('date-update', [[set(now, { seconds: 0, milliseconds: 0 })]]);
        dp.unmount();
    });

    it('Should emit invalid-date event on invalid date click', async () => {
        const today = new Date();
        const start = set(today, { month: getMonth(today), date: 1 });
        const range = [resetDateTime(start), addDays(start, 10)];

        const dp = await openMenu({ range: { maxRange: 5 } });

        for (const date of range) {
            await clickCalendarDate(dp, date);
        }

        expect(dp.emitted()).toHaveProperty('invalid-date', [[resetDateTime(range[1])]]);

        await reOpenMenu(dp, { range: false, disabledDates: [today] });

        await clickCalendarDate(dp, today);

        const emitted = (dp.emitted()['invalid-date'].flat() as Date[]).map((d) => d.toString());

        expect(emitted).toContain(resetDateTime(today).toString());
        dp.unmount();
    });

    it('Should highlight dates across all modes #607', async () => {
        const today = new Date();
        const start = startOfMonth(new Date());
        const highlight = {
            dates: [start],
            months: [{ month: getMonth(today), year: getYear(today) }],
            years: [getYear(addYears(start, 1))],
            quarters: [{ quarter: 2, year: getYear(start) }],
        };

        const dp = await openMenu({ highlight });

        const calendarCell = getCalendarCell(dp, start).find('.dp__cell_inner');

        expect(calendarCell.classes()).toContain('dp__cell_highlight');

        await reOpenMenu(dp, { monthPicker: true });

        const monthCell = dp.find(`[data-test-id="${getMonthName(today)}"]`).find('.dp__overlay_cell');

        expect(monthCell.classes()).toContain('dp--highlighted');

        await reOpenMenu(dp, { monthPicker: false, yearPicker: true });

        const yearCell = dp.find(`[data-test-id="${highlight.years[0]}"]`).find('.dp__overlay_cell');

        expect(yearCell.classes()).toContain('dp--highlighted');

        await reOpenMenu(dp, { yearPicker: false, quarterPicker: true });

        const quarterCell = dp.find(
            `[data-test-id="${startOfQuarter(set(new Date(), { month: 5, year: getYear(start) }))}"]`,
        );

        expect(quarterCell.classes()).toContain('dp--highlighted');
        dp.unmount();
    });

    it('Should check min or max time in comparison to the internal model value if any #612', async () => {
        const modelValue = setHours(new Date(), 19);
        const minDate = new Date();
        const maxTime = { hours: 12 };

        const dp = await openMenu({ minDate, maxTime: maxTime as TimeModel, timePickerInline: true, modelValue });

        await dp.find('[data-test-id="hours-toggle-overlay-btn-0"]').trigger('click');
        const cell = dp.find('[data-test-id="15"]');

        expect(cell.html().includes('dp__overlay_cell_disabled')).toBeTruthy();

        await dp.find('[aria-label="Toggle overlay"]').trigger('click');

        await dp.find(`[data-test-id="select-button"]`).trigger('click');

        expect(dp.emitted()['update:model-value']).toBeFalsy();

        await clickCalendarDate(dp, addDays(minDate, 1));
        await dp.find('[data-test-id="hours-toggle-overlay-btn-0"]').trigger('click');
        await dp.find('[data-test-id="11"]').trigger('click');
        await dp.find(`[data-test-id="select-button"]`).trigger('click');

        expect(dp.emitted()['update:model-value']).toBeTruthy();
        dp.unmount();
    });

    it('Should select preset date on month picker', async () => {
        const yearStart = startOfYear(new Date());
        const presetDates = [{ label: 'January', value: yearStart }];
        const dp = await openMenu({ monthPicker: true, presetDates });

        await dp.find('.dp--preset-range').trigger('click');
        await dp.find(`[data-test-id="select-button"]`).trigger('click');

        expect(dp.emitted()['update:model-value']).toEqual([
            [{ month: getMonth(yearStart), year: getYear(yearStart) }],
        ]);
        dp.unmount();
    });

    it('Should trigger customPosition function on the marker #933', async () => {
        const customPosition = vi.fn();
        const start = resetDateTime(startOfMonth(new Date()));
        const valid = start;
        const invalid = addDays(start, 1);
        const notCustom = addDays(start, 2);

        const markers: IMarker[] = [
            { date: valid, type: 'dot', tooltip: [{ text: 'my tooltip' }], customPosition },
            { date: invalid, type: 'dot', customPosition },
            { date: notCustom, type: 'dot', tooltip: [{ text: 'my tooltip' }] },
        ];

        const dp = await openMenu({ markers });

        await hoverCalendarDate(dp, valid);
        expect(customPosition.mock.calls.length).toEqual(1);
        await hoverCalendarDate(dp, invalid);
        expect(customPosition.mock.calls.length).toEqual(1);
        await hoverCalendarDate(dp, notCustom);
        expect(customPosition.mock.calls.length).toEqual(1);
        dp.unmount();
    });

    it('Should not close menu on auto-apply and partial flow #936', async () => {
        const flow = [FlowStep.calendar, FlowStep.time];
        const today = new Date();
        const dp = await openMenu({ flow, partialFlow: true, autoApply: true });
        await clickCalendarDate(dp, today);
        const overlay = dp.find('[aria-label="Time picker"]');
        expect(dp.emitted()).toHaveProperty('update:model-value');
        expect(overlay.exists()).toBeTruthy();
        dp.unmount();
    });

    it('Should keep proper years when selecting auto-range on multi-calendars #909', async () => {
        const start = startOfMonth(new Date());
        const nextYear = getYear(addMonths(start, 1));
        const dp = await openMenu({ range: { autoRange: 5 }, multiCalendars: true });
        await clickCalendarDate(dp, start);
        const nextYearText = dp.find('[data-test-id="year-toggle-overlay-1"]').text();
        expect(nextYear).toEqual(+nextYearText);
        dp.unmount();
    });

    it('Should toggle menu on text-input click if set #905', async () => {
        const dp = await openMenu({ textInput: { openMenu: 'toggle' } });
        await dp.find('[data-test-id="dp-input"]').trigger('click');
        const menu = dp.find('[role="dialog"]');
        expect(menu.exists()).toBeFalsy();
        await reOpenMenu(dp, { textInput: { openMenu: 'open' } });
        await dp.find('[data-test-id="dp-input"]').trigger('click');
        const menuShown = dp.find('[role="dialog"]');
        expect(menuShown.exists()).toBeTruthy();
        dp.unmount();
    });

    it('Should trigger @text-input event when typing date #909', async () => {
        const dp = await openMenu({ textInput: { openMenu: 'toggle' } });
        await dp.find('[data-test-id="dp-input"]').setValue('1');
        expect(dp.emitted()).toHaveProperty('text-input');
        expect(dp.emitted()['text-input']).toHaveLength(1);
        await dp.find('[data-test-id="dp-input"]').setValue('02');
        expect(dp.emitted()).toHaveProperty('text-input');
        expect(dp.emitted()['text-input']).toHaveLength(2);
        dp.unmount();
    });

    it('Should disable invalid dates when min and max range options are provided', async () => {
        const disabledClass = 'dp__cell_disabled';
        const dp = await openMenu({ range: { minRange: 3, maxRange: 10 } });
        const start = setDate(new Date(), 15);
        await clickCalendarDate(dp, start);
        const disabledBeforeMin = addDays(start, 2);
        const disabledAfterMax = addDays(start, 11);
        const inRange = addDays(start, 7);

        expect(getCellClasses(dp, disabledBeforeMin)).toContain(disabledClass);
        expect(getCellClasses(dp, disabledAfterMax)).toContain(disabledClass);
        const empty = getCellClasses(dp, inRange).find((className) => className === disabledClass);
        expect(empty).toBeFalsy();
        dp.unmount();
    });
});
