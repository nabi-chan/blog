import { formatRelative } from "date-fns";
import { ko } from "date-fns/locale";

export function relativeTime(time: Date | string | number) {
  return formatRelative(time, new Date(), {
    locale: ko,
  });
}
