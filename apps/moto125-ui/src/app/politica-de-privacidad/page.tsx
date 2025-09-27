import { Container } from "@/components/common/Container";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description:
    "Información sobre el tratamiento de datos personales en moto125.cc: finalidades, bases legales, conservación, derechos RGPD y gestión de cookies.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/politica-de-privacidad" },
};

export default function PrivacyPolicyPage() {
  const updated = "27 de septiembre de 2025";

  return (
    <Container>
      <header className="mb-8">
        <h1 className="text-3xl font-heading font-semibold">Política de privacidad</h1>
        <p className="mt-2 text-sm text-gray-600">Última actualización: {updated}</p>
      </header>

      <section className="prose prose-neutral max-w-none">
        <h2>1. Responsable del tratamiento</h2>
        <p>
          <strong>Responsable:</strong> Antonio José de la Cuadra Blanco
          <br />
          <strong>Titular del sitio web:</strong> María Elena Corada Pino
          <br />
          <strong>Domicilio:</strong> C/ Corazón de María 32, 28002 Madrid, España
          <br />
          <strong>Correo de contacto:</strong>{" "}
          <a href="mailto:info@moto125.cc">info@moto125.cc</a>
        </p>

        <h2>2. Finalidades y bases jurídicas</h2>
        <ul>
          <li>
            <strong>Analítica web (Google Analytics 4):</strong> medir el uso del sitio,
            páginas vistas y rendimiento para mejorar contenidos. <em>Base jurídica:</em>{" "}
            consentimiento (art. 6.1.a RGPD) mediante el banner de cookies.
          </li>
          <li>
            <strong>Comunicaciones con usuarios:</strong> atención a consultas o solicitudes
            que nos envíes. <em>Base jurídica:</em> interés legítimo y/o ejecución de medidas
            precontractuales (art. 6.1.f y 6.1.b RGPD).
          </li>
          <li>
            <strong>Publicidad (opcional):</strong> personalización y medición de campañas si lo
            aceptas en el banner. <em>Base jurídica:</em> consentimiento (art. 6.1.a RGPD).
          </li>
        </ul>

        <h2>3. Categorías de datos</h2>
        <ul>
          <li>
            <strong>Datos de navegación/uso:</strong> identificadores del dispositivo, páginas vistas,
            referencias y eventos de interacción. GA4 no muestra direcciones IP exactas.
          </li>
          <li>
            <strong>Datos de contacto:</strong> si nos escribes, trataremos tu nombre, correo
            y el contenido del mensaje.
          </li>
        </ul>

        <h2>4. Origen de los datos</h2>
        <p>Los datos proceden del propio interesado mediante su navegación o los formularios del sitio.</p>

        <h2>5. Conservación</h2>
        <ul>
          <li>
            <strong>Analítica:</strong> según la configuración de retención de GA4.
          </li>
          <li>
            <strong>Consentimiento de cookies:</strong> conservamos tu elección durante el periodo
            indicado en el banner (p. ej., 2 días si rechazas y hasta 12 meses si aceptas).
          </li>
          <li>
            <strong>Consultas:</strong> durante el tiempo necesario para atender la solicitud y
            cumplir obligaciones legales aplicables.
          </li>
        </ul>

        <h2>6. Destinatarios y transferencias internacionales</h2>
        <p>
          Utilizamos servicios de terceros para analítica y, en su caso, publicidad:
        </p>
        <ul>
          <li>
            <strong>Google Ireland Limited</strong> / <strong>Google LLC</strong> (GA4). Puede implicar
            transferencias internacionales con las garantías legales correspondientes (p. ej., cláusulas
            contractuales tipo). Consulta la documentación de privacidad de Google para más información.
          </li>
        </ul>

        <h2>7. Cookies y tecnologías similares</h2>
        <p>
          En <strong>moto125.cc</strong> usamos un banner de consentimiento y el{" "}
          <em>Google Consent Mode v2</em>. Por defecto no activamos analítica ni publicidad sin tu
          permiso. Puedes cambiar tu elección en cualquier momento desde{" "}
          <em>“Preferencias de cookies”</em> en el pie de página.
        </p>
        <p>
          Para más detalle sobre tipos de cookies y finalidades, consulta la{" "}
          <a href="/politica-de-cookies" className="underline">Política de cookies</a>.
        </p>

        <h2>8. Derechos de las personas</h2>
        <p>
          Puedes ejercer tus derechos de <strong>acceso</strong>, <strong>rectificación</strong>,{" "}
          <strong>supresión</strong>, <strong>oposición</strong>, <strong>limitación</strong> y{" "}
          <strong>portabilidad</strong>, así como retirar tu consentimiento en cualquier momento sin
          afectar a la licitud del tratamiento previo.
        </p>

        <h2>9. Cómo ejercer tus derechos</h2>
        <p>
          Escríbenos a <a href="mailto:info@moto125.cc">info@moto125.cc</a> indicando el derecho que
          deseas ejercer. Responderemos en los plazos del RGPD. Si no estás de acuerdo con la respuesta,
          puedes presentar una reclamación ante la{" "}
          <a
            href="https://www.aepd.es/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Agencia Española de Protección de Datos (AEPD)
          </a>.
        </p>

        <h2>10. Menores de edad</h2>
        <p>
          El sitio no está dirigido a menores. Si detectamos datos personales de un menor, procederemos
          a su eliminación.
        </p>

        <h2>11. Seguridad</h2>
        <p>
          Aplicamos medidas técnicas y organizativas apropiadas para proteger los datos frente a accesos
          no autorizados, pérdida o alteración.
        </p>

        <h2>12. Cambios en esta política</h2>
        <p>
          Esta política puede actualizarse para reflejar cambios legales o funcionales. Publicaremos la
          versión vigente con su fecha de actualización.
        </p>

        <h2>13. Contacto</h2>
        <p>
          Para cualquier cuestión sobre privacidad, escribe a{" "}
          <a href="mailto:info@moto125.cc">info@moto125.cc</a>.
        </p>
      </section>
    </Container>
  );
}
