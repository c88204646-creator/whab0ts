import { Card } from "@/components/ui/card";
import { MessageCircle, Users, BarChart3, Calendar, Ticket, Facebook } from "lucide-react";
import { Link } from "wouter";

export default function DashboardPage() {
  const modules = [
    {
      title: "WhatsApp",
      description: "Gestiona conversaciones y conexiones",
      icon: MessageCircle,
      color: "bg-green-500/10",
      iconColor: "text-green-600 dark:text-green-400",
      href: "/connections",
      testId: "card-whatsapp",
    },
    {
      title: "CRM",
      description: "Administra clientes y leads",
      icon: Users,
      color: "bg-blue-500/10",
      iconColor: "text-blue-600 dark:text-blue-400",
      href: "/crm/clients",
      testId: "card-crm",
    },
    {
      title: "Encuestas",
      description: "Crea y analiza encuestas",
      icon: BarChart3,
      color: "bg-purple-500/10",
      iconColor: "text-purple-600 dark:text-purple-400",
      href: "/surveys",
      testId: "card-surveys",
    },
    {
      title: "Calendario",
      description: "Organiza tus eventos",
      icon: Calendar,
      color: "bg-red-500/10",
      iconColor: "text-red-600 dark:text-red-400",
      href: "/calendar",
      testId: "card-calendar",
    },
    {
      title: "Rifas",
      description: "Crea y gestiona rifas",
      icon: Ticket,
      color: "bg-amber-500/10",
      iconColor: "text-amber-600 dark:text-amber-400",
      href: "/raffles",
      testId: "card-raffles",
    },
    {
      title: "Facebook",
      description: "Integra tus cuentas de Facebook",
      icon: Facebook,
      color: "bg-blue-600/10",
      iconColor: "text-blue-700 dark:text-blue-300",
      href: "/facebook",
      testId: "card-facebook",
    },
  ];

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Bienvenido a tu panel de control. Accede a los diferentes módulos desde aquí.
          </p>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Link key={module.title} href={module.href}>
                <Card
                  className="p-6 cursor-pointer hover-elevate transition-all h-full"
                  data-testid={module.testId}
                >
                  <div className="space-y-4">
                    <div className={`w-12 h-12 rounded-lg ${module.color} flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${module.iconColor}`} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-foreground">
                        {module.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {module.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
