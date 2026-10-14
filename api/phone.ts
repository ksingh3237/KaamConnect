/** "98765 43210", "9876543210" or "+919876543210" all become "+919876543210" (the server also accepts these). */
export const toE164 = (input: string): string => {
  const digits = input.replace(/\D/g, '');
  return digits.length === 10 ? `+91${digits}` : `+${digits}`;
};
