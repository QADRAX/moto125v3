import { Container } from "@/components/common/Container";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de cookies",
  description:
    "Información sobre el uso de cookies en moto125.cc, tipos, finalidades, periodos y cómo cambiar tus preferencias.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/politica-de-cookies" },
};

export default async function CookiePolicyPage() {
  const updated = "27 de septiembre de 2025";

  return (
    <Container>
      <header className="mb-8">
        <h1 className="text-3xl font-heading font-semibold">Política de cookies</h1>
        <p className="mt-2 text-sm text-gray-600">Última actualización: {updated}</p>
      </header>

      <section className="prose prose-neutral max-w-none">
        <h2>1. ¿Qué son las cookies?</h2>
        <p>
          Las cookies son pequeños archivos que se almacenan en tu dispositivo al visitar un sitio web.
          Pueden servir para fines estrictamente técnicos (necesarias), de analítica, personalización
          o publicidad. En <strong>moto125.cc</strong> utilizamos un banner de consentimiento y el{" "}
          <em>Google Consent Mode v2</em> para que no se activen cookies de analítica ni publicidad
          sin tu permiso.
        </p>

        <h2>2. ¿Cómo gestiono mis preferencias?</h2>
        <p>
          Puedes cambiar tu elección en cualquier momento desde el enlace “Preferencias de cookies” en el pie de página.
        </p>

        <h2>3. Tipos de cookies que utilizamos</h2>
        <ul>
          <li>
            <strong>Necesarias:</strong> esenciales para el funcionamiento básico del sitio y la
            seguridad. No se usan para fines publicitarios.
          </li>
          <li>
            <strong>Analítica (Google Analytics 4):</strong> nos ayudan a comprender el uso del sitio
            y mejorar contenidos. Solo se activan si das tu consentimiento.
          </li>
          <li>
            <strong>Publicidad (opcional):</strong> personalización de anuncios y medición de campañas,
            solo si la aceptas expresamente.
          </li>
        </ul>

        <h2>4. Cookies propias y de terceros</h2>
        <p>
          Empleamos cookies propias (p. ej., tu preferencia de consentimiento) y, en su caso,
          cookies de terceros (Google) para analítica/publicidad cuando lo permites.
        </p>

        <h2>5. ¿Cómo puedo desactivar o eliminar cookies desde el navegador?</h2>
        <p>
          Puedes bloquear o eliminar cookies desde la configuración de tu navegador. Consulta la ayuda
          de tu navegador para ver los pasos (Chrome, Firefox, Safari, Edge…).
        </p>

        <h2>6. Transferencias internacionales</h2>
        <p>
          En el caso de Google (GA4), pueden producirse transferencias internacionales con garantías
          adecuadas (p. ej., cláusulas contractuales tipo). Consulta la documentación de privacidad de Google.
        </p>

        <h2>7. Cambios en esta política</h2>
        <p>
          Podemos actualizar esta política para reflejar cambios legales o técnicos. Publicaremos la versión
          vigente con su fecha de actualización.
        </p>

        <h2>8. Contacto</h2>
        <p>
          Para dudas sobre cookies en este sitio:{" "}
          <a href="mailto:info@moto125.cc">info@moto125.cc</a>.
        </p>
      </section>
    </Container>
  );
}
