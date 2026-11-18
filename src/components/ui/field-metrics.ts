/**
 * Shared vertical metrics for every form field (text inputs, comboboxes, date
 * pickers), so the spacing between fields is the same regardless of the
 * field type. Spacing between fields comes only from the form's `gap`.
 */

/** Space reserved above the field box for the floating label */
export const FIELD_TOP_RESERVE = 18

/** Top of the floated label: centered on the box's top border */
export const FIELD_LABEL_FLOAT_TOP = FIELD_TOP_RESERVE - 8

/** Classes for the helper/error line under a field (no reserved height) */
export const FIELD_MESSAGE_CLASS = 'justify-center pt-1'
