import { Container } from "@/components/common/Container";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aviso legal",
  description:
    "Aviso legal de moto125.cc: datos del titular, condiciones de uso, propiedad intelectual y responsabilidades.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/aviso-legal" },
};

export default function LegalNoticePage() {
  const updated = "27 de septiembre de 2025";

  return (
    <Container>
      <header className="mb-8">
        <h1 className="text-3xl font-heading font-semibold">Aviso legal</h1>
        <p className="mt-2 text-sm text-gray-600">Última actualización: {updated}</p>
      </header>

      <section className="prose prose-neutral max-w-none">
        <h2>1. Titular del sitio web</h2>
        <p>
          <strong>Titular:</strong> María Elena Corada Pino (moto125.cc)
          <br />
          <strong>Responsable del tratamiento de datos personales:</strong> Antonio José de la Cuadra Blanco
          <br />
          <strong>Domicilio:</strong> C/ Corazón de María 32, 28002 Madrid, España
          <br />
          <strong>Correo de contacto:</strong>{" "}
          <a href="mailto:info@moto125.cc">info@moto125.cc</a>
        </p>

        <h2>2. Condiciones de uso</h2>
        <p>
          El acceso y uso de este sitio implican la aceptación de estas condiciones y de la
          normativa aplicable. Si no estás de acuerdo, por favor, no utilices el sitio.
          Nos reservamos el derecho a modificar contenidos y condiciones en cualquier momento.
        </p>

        <h2>3. Propiedad intelectual e industrial</h2>
        <p>
          Salvo indicación expresa, los contenidos (textos, imágenes, logotipos y diseño) son
          titularidad de sus respectivos propietarios y están protegidos por la normativa de
          propiedad intelectual e industrial. No se permite su reproducción, distribución o
          transformación sin autorización.
        </p>

        <h2>4. Enlaces</h2>
        <p>
          Este sitio puede incluir enlaces a páginas de terceros. No somos responsables de sus
          contenidos o políticas. El uso de esos enlaces es bajo tu responsabilidad.
        </p>

        <h2>5. Responsabilidad</h2>
        <p>
          Trabajamos para que la información sea exacta y actualizada, sin que ello suponga garantía.
          No nos hacemos responsables de errores, indisponibilidad temporal del servicio o daños
          derivados del uso del sitio.
        </p>

        <h2>6. Protección de datos</h2>
        <p>
          El tratamiento de datos personales se rige por nuestra{" "}
          <a href="/politica-de-privacidad" className="underline">Política de privacidad</a>.
        </p>

        <h2>7. Legislación aplicable</h2>
        <p>
          Este sitio se rige por la normativa española y, en su caso, europea. Cualquier conflicto
          se someterá a los juzgados y tribunales de Madrid, salvo que la normativa disponga otra cosa.
        </p>

        <h2>8. Contacto</h2>
        <p>
          Para comunicaciones relacionadas con este aviso:{" "}
          <a href="mailto:info@moto125.cc">info@moto125.cc</a>.
        </p>
      </section>
    </Container>
  );
}
