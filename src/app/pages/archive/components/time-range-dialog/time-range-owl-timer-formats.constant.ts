import { OWL_TIME_FORMATS } from '../../../../common/constants/owl-datetime.constants';

export const TIME_RANGE_OWL_TIMER_FORMATS = {
  ...OWL_TIME_FORMATS,
  timePickerInput: {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  } as Intl.DateTimeFormatOptions,
};
