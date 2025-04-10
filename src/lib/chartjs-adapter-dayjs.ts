import { _adapters } from 'chart.js';
import dayjs from 'dayjs';
import type { QUnitType } from 'dayjs';
import type { TimeUnit } from 'chart.js';
import CustomParseFormat from 'dayjs/plugin/customParseFormat.js';
import AdvancedFormat from 'dayjs/plugin/advancedFormat.js';
import QuarterOfYear from 'dayjs/plugin/quarterOfYear.js';
import LocalizedFormat from 'dayjs/plugin/localizedFormat.js';
import isoWeek from 'dayjs/plugin/isoWeek.js';
import utc from 'dayjs/plugin/utc.js';

dayjs.extend(AdvancedFormat);
dayjs.extend(QuarterOfYear);
dayjs.extend(LocalizedFormat);
dayjs.extend(CustomParseFormat);
dayjs.extend(isoWeek);
dayjs.extend(utc);

const FORMATS = {
  datetime: 'MMM D, YYYY, h:mm:ss a',
  millisecond: 'h:mm:ss.SSS a',
  second: 'h:mm:ss a',
  minute: 'h:mm a',
  hour: 'hA',
  day: 'MMM D',
  week: 'll',
  month: 'MMM YYYY',
  quarter: '[Q]Q - YYYY',
  year: 'YYYY',
};

_adapters._date.override({
  //_id: 'dayjs', //DEBUG,
  formats: () => FORMATS,
  parse: function (value: any, format?: TimeUnit) {console.log('parse');
    const valueType = typeof value;

    if (value === null || valueType === 'undefined') {
      return null;
    }

    if (valueType === 'string' && typeof format === 'string') {
      return dayjs.utc(value, format).isValid() ? dayjs.utc(value, format).valueOf() : null;
    } else if (!(value instanceof dayjs)) {
      return dayjs.utc(value).isValid() ? dayjs.utc(value).valueOf() : null;
    }
    return null;
  },
  format: function (time: any, format: TimeUnit): string {
    return dayjs.utc(time).format(format);
  },
  add: function (time: any, amount: number, unit: QUnitType & TimeUnit) {console.log('add');
    return dayjs.utc(time).add(amount, unit).valueOf();
  },
  diff: function (max: any, min: any, unit: TimeUnit) {console.log('diff');
    return dayjs.utc(max).diff(dayjs.utc(min), unit);
  },
  startOf: function (time: any, unit: (TimeUnit & QUnitType) | 'isoWeek', weekday?: number) {console.log('startOf');
    if (unit === 'isoWeek') {
      // Ensure that weekday has a valid format
      //const formattedWeekday

      const validatedWeekday: number =
        typeof weekday === 'number' && weekday > 0 && weekday < 7 ? weekday : 1;

      return dayjs.utc(time).isoWeekday(validatedWeekday).startOf('day').valueOf();
    }

    return dayjs.utc(time).startOf(unit).valueOf();
  },
  endOf: function (time: any, unit: TimeUnit & QUnitType) {console.log('endOf');
    return dayjs.utc(time).endOf(unit).valueOf();
  },
});
