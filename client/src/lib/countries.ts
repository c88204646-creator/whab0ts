export const countries = [
  { code: "+1", name: "Estados Unidos", flag: "🇺🇸", country: "US" },
  { code: "+34", name: "España", flag: "🇪🇸", country: "ES" },
  { code: "+55", name: "Brasil", flag: "🇧🇷", country: "BR" },
  { code: "+52", name: "México", flag: "🇲🇽", country: "MX" },
  { code: "+54", name: "Argentina", flag: "🇦🇷", country: "AR" },
  { code: "+56", name: "Chile", flag: "🇨🇱", country: "CL" },
  { code: "+57", name: "Colombia", flag: "🇨🇴", country: "CO" },
  { code: "+51", name: "Perú", flag: "🇵🇪", country: "PE" },
  { code: "+58", name: "Venezuela", flag: "🇻🇪", country: "VE" },
  { code: "+502", name: "Guatemala", flag: "🇬🇹", country: "GT" },
  { code: "+503", name: "El Salvador", flag: "🇸🇻", country: "SV" },
  { code: "+504", name: "Honduras", flag: "🇭🇳", country: "HN" },
  { code: "+505", name: "Nicaragua", flag: "🇳🇮", country: "NI" },
  { code: "+506", name: "Costa Rica", flag: "🇨🇷", country: "CR" },
  { code: "+507", name: "Panamá", flag: "🇵🇦", country: "PA" },
  { code: "+591", name: "Bolivia", flag: "🇧🇴", country: "BO" },
  { code: "+598", name: "Uruguay", flag: "🇺🇾", country: "UY" },
  { code: "+595", name: "Paraguay", flag: "🇵🇾", country: "PY" },
  { code: "+44", name: "Reino Unido", flag: "🇬🇧", country: "GB" },
  { code: "+33", name: "Francia", flag: "🇫🇷", country: "FR" },
  { code: "+49", name: "Alemania", flag: "🇩🇪", country: "DE" },
  { code: "+39", name: "Italia", flag: "🇮🇹", country: "IT" },
  { code: "+31", name: "Holanda", flag: "🇳🇱", country: "NL" },
  { code: "+32", name: "Bélgica", flag: "🇧🇪", country: "BE" },
  { code: "+41", name: "Suiza", flag: "🇨🇭", country: "CH" },
  { code: "+43", name: "Austria", flag: "🇦🇹", country: "AT" },
  { code: "+46", name: "Suecia", flag: "🇸🇪", country: "SE" },
  { code: "+47", name: "Noruega", flag: "🇳🇴", country: "NO" },
  { code: "+45", name: "Dinamarca", flag: "🇩🇰", country: "DK" },
  { code: "+48", name: "Polonia", flag: "🇵🇱", country: "PL" },
];

export const validatePhoneNumber = (countryCode: string, phoneNumber: string): { valid: boolean; message: string } => {
  // Remove spaces and special characters
  const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, "");

  if (!cleanNumber) {
    return { valid: false, message: "Ingresa un número de teléfono" };
  }

  // Basic length validation (most countries have 9-11 digits)
  if (cleanNumber.length < 8 || cleanNumber.length > 15) {
    return { valid: false, message: "El número de teléfono parece ser incorrecto" };
  }

  // Check if it only contains digits
  if (!/^\d+$/.test(cleanNumber)) {
    return { valid: false, message: "El número solo debe contener dígitos" };
  }

  // If we got here, basic validation passed
  return { valid: true, message: "Número válido" };
};

export const formatPhoneNumber = (countryCode: string, phoneNumber: string): string => {
  const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, "");
  return `${countryCode}${cleanNumber}`;
};
