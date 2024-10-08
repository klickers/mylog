import { differenceInCalendarDays, format, isSameDay } from "date-fns"

export default function dateFormat(date: number) {
	if (isSameDay(new Date(), date))
		return format(date, "bbb") == "am" || format(date, "bbb") == "pm"
			? format(date, "hh:mmbbb")
			: format(date, "bbb")
	else if (differenceInCalendarDays(new Date(), date) < 7)
		return format(date, "EEEE")
	else return format(date, "MMM dd")
}
