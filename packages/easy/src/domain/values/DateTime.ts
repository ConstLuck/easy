import { choose, isA, isDate, isDefined, isNumber, isString, JsonValue, Optional, Value } from '../../types';
import { DateTime as LuxonDateTime, DateTimeUnit as LuxonDateTimeUnit, Settings } from 'luxon';

Settings.defaultZone = 'utc';

export type DateTimeUnit = LuxonDateTimeUnit;
export type DiffOptions = {
  rounding: 'floor' | 'ceil' | 'round';
};

export class DateTime extends Value<Optional<string>> {
  constructor(value?: string | number | Date, format?: string) {
    super(
      choose(value)
        .type(isString, v => (format ? LuxonDateTime.fromFormat(v, format, { setZone: true }) : LuxonDateTime.fromISO(v, { setZone: true })).toISO())
        .type(isNumber, v => LuxonDateTime.fromMillis(v).toISO())
        .type(isDate, v => LuxonDateTime.fromJSDate(v).toISO())
        .else(undefined as unknown as string)
    );
  }

  static get now(): DateTime {
    return new DateTime(LuxonDateTime.utc().toISO());
  }

  get isValid(): boolean {
    return isDefined(this.value) && this.utc.isValid;
  }

  /**
   * @deprecated Deprecated in favor for DateTime.from as that also accepts locales and another DateTime
   */
  get fromNow(): string {
    return this.from();
  }

  from(date?: DateTime): string;
  from(locale?: string): string;
  from(date?: DateTime, locale?: string): string;
  from(param?: string | DateTime, other?: string): string {
    const date: Optional<DateTime> = isA<DateTime>(param) ? param : undefined;
    const locale: string = isString(param) ? param : undefined ?? other ?? 'en';
    return isDefined(date) ? (this.utc.setLocale(locale).toRelative({ base: date.utc }) as string) : (this.utc.setLocale(locale).toRelative() as string);
  }

  protected get utc(): LuxonDateTime {
    return this.luxon.setZone('utc');
  }

  protected get luxon(): LuxonDateTime {
    return LuxonDateTime.fromISO(this.value as string, { setZone: true });
  }

  isAfter(dt: DateTime): boolean {
    return this.utc > dt.utc;
  }

  isBefore(dt: DateTime): boolean {
    return this.utc < dt.utc;
  }

  equals(dt: DateTime): boolean {
    return this.utc.hasSame(dt.utc, 'millisecond');
  }

  add = (n: number, unit: DateTimeUnit = 'day'): DateTime => new DateTime(this.luxon.plus({ [unit]: n }).toISO());

  subtract = (n: number, unit: DateTimeUnit = 'day'): DateTime => new DateTime(this.luxon.minus({ [unit]: n }).toISO());

  diff = (other: DateTime, unit: DateTimeUnit = 'day', opts?: DiffOptions): number => Math[opts?.rounding ?? 'floor'](this.utc.diff(other.utc).as(unit));

  startOf = (unit: DateTimeUnit = 'day'): DateTime => new DateTime(this.luxon.startOf(unit).toISO());

  endOf = (unit: DateTimeUnit = 'day'): DateTime => new DateTime(this.luxon.endOf(unit).toISO());

  withZone = (zone: string): DateTime => new DateTime(this.utc.setZone(zone).toISO());

  toString(): string {
    return this.value ?? '';
  }

  toJSON(): JsonValue {
    return this.utc.toISO() as unknown as JsonValue;
  }

  toFormat = (format: string): string => this.luxon.toFormat(format);

  toLocale = (locale = 'nl-NL', format = 'D'): string => this.luxon.setLocale(locale).toFormat(format);

  toFull = (locale?: string): string => this.toLocale(locale, 'DDD');

  toDate(): Optional<Date> {
    return this.isValid ? this.utc.toJSDate() : undefined;
  }
}

export const isDateTime = (dt?: unknown): dt is DateTime => isDefined(dt) && dt instanceof DateTime;
