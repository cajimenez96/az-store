// Regex: only letters (including accented and ñ), spaces, and apostrophes
export const NAME_ALLOWED =
  /^[a-zA-ZáéíóúÁÉÍÓÚàèìòùÀÈÌÒÙâêîôûÂÊÎÔÛäëïöüÄËÏÖÜãõÃÕñÑçÇ' ]*$/;

// --- Password requirements ---
// test(password, confirmPassword?) → boolean
export const passwordRequirements: {
  id: string;
  label: string;
  test: (password: string, confirmPassword?: string) => boolean;
}[] = [
  {
    id: 'length',
    label: 'Al menos 8 caracteres',
    test: (v) => v.length >= 8,
  },
  {
    id: 'uppercase',
    label: 'Al menos una mayúscula',
    test: (v) => /[A-Z]/.test(v),
  },
  {
    id: 'number',
    label: 'Al menos un número',
    test: (v) => /[0-9]/.test(v),
  },
  {
    id: 'match',
    label: 'Las contraseñas coinciden',
    test: (v, confirm) => v.length > 0 && v === confirm,
  },
];
