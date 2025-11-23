export interface FakeNotification {
  id: string;
  name: string;
  email: string;
  city: string;
  country: string;
  avatar: string;
  timestamp: number;
}

const mexicanCities = [
  "Ciudad de México",
  "Monterrey",
  "Guadalajara",
  "Cancún",
  "Playa del Carmen",
  "Puebla",
  "Querétaro",
  "Léon",
  "Morelia",
  "Toluca",
  "Mérida",
  "Oaxaca",
  "Veracruz",
  "Tijuana",
  "San Miguel de Allende",
];

const countries = [
  { name: "México", flag: "🇲🇽" },
  { name: "España", flag: "🇪🇸" },
  { name: "Argentina", flag: "🇦🇷" },
  { name: "Colombia", flag: "🇨🇴" },
  { name: "Chile", flag: "🇨🇱" },
  { name: "Perú", flag: "🇵🇪" },
  { name: "Brasil", flag: "🇧🇷" },
  { name: "Ecuador", flag: "🇪🇨" },
  { name: "Bolivia", flag: "🇧🇴" },
  { name: "Guatemala", flag: "🇬🇹" },
  { name: "Costa Rica", flag: "🇨🇷" },
  { name: "Panamá", flag: "🇵🇦" },
];

const firstNames = [
  "María", "Juan", "Carlos", "Ana", "José", "Rosa", "Miguel", "Laura",
  "Luis", "Carmen", "Roberto", "Fernanda", "Diego", "Valentina", "Alfonso",
  "Patricia", "Ricardo", "Gabriela", "Manuel", "Catalina",
  "Gabriel", "Marisol", "Antonio", "Jimena", "Eduardo",
];

const lastNames = [
  "García", "Rodríguez", "Martínez", "López", "Hernández", "González",
  "Pérez", "Sánchez", "Ramírez", "Torres", "Flores", "Morales", "Reyes",
  "Ruiz", "Díaz", "Cruz", "Ortiz", "Vargas", "Castro", "Silva",
];

const companies = [
  "Tech Solutions", "Digital Pro", "Marketing Experts", "Dev Studio",
  "Business Group", "Innovation Labs", "Creative Agency", "Smart Tech",
];

function getRandomCity(country: string): string {
  if (country === "México") {
    return mexicanCities[Math.floor(Math.random() * mexicanCities.length)];
  }
  return "Ciudad Principal";
}

function getRandomCountry(): { name: string; flag: string } {
  return countries[Math.floor(Math.random() * countries.length)];
}

function getRandomName(): string {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${firstName} ${lastName}`;
}

function getRandomEmail(name: string): string {
  const company = companies[Math.floor(Math.random() * companies.length)];
  const domain = company.toLowerCase().replace(/\s+/g, "") + ".com";
  const namePart = name.toLowerCase().replace(/\s+/g, ".");
  return `${namePart}@${domain}`;
}

function getAvatarColor(): string {
  const colors = [
    "from-blue-500 to-blue-600",
    "from-purple-500 to-purple-600",
    "from-pink-500 to-pink-600",
    "from-green-500 to-green-600",
    "from-orange-500 to-orange-600",
    "from-red-500 to-red-600",
    "from-indigo-500 to-indigo-600",
    "from-cyan-500 to-cyan-600",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function generateFakeNotification(): FakeNotification {
  const country = getRandomCountry();
  const name = getRandomName();
  const city = getRandomCity(country.name);
  
  return {
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    email: getRandomEmail(name),
    city,
    country: country.name,
    avatar: getAvatarColor(),
    timestamp: Date.now(),
  };
}

export function generateNotifications(count: number): FakeNotification[] {
  return Array.from({ length: count }, () => generateFakeNotification());
}
