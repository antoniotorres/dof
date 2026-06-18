/**
 * Curated concept documents used as a graceful fallback for the home and
 * listing views when S3 is not configured (e.g. local dev without
 * credentials) or no notes have been cached yet. Mirrors the sample data in
 * the DOF.dc.html design so the redesign always renders fully.
 */
export interface DocCard {
  /** Note id — the S3 object key without `.json` (links to /notas/[id]). */
  id: string;
  tipo: string;
  titulo: string;
  dependencia?: string;
  /** Short, human display date, e.g. "16 jun 2026". */
  fecha: string;
  /** ISO 8601 publication date, used for sorting and full-date formatting. */
  publishedAt: string;
  folio?: string;
  edicion?: string;
  /** True when this is concept/fallback data rather than a real note. */
  isSample?: boolean;
}

/** Shape-compatible with lib/getNote `Note` (kept local to avoid importing the
 *  server-only data layer into this shared module). */
export interface SampleNote {
  metadata: { title: string; published_at: string };
  content: string;
}

/** Representative legal body shown for concept documents (mirrors DOF.dc.html).
 *  Its `<h2>` headings drive the "En esta publicación" table of contents. */
const SAMPLE_BODY = `<p>Al margen un sello con el Escudo Nacional, que dice: Estados Unidos Mexicanos.— Poder Ejecutivo Federal.— Secretaría de Estado correspondiente. Con fundamento en las disposiciones legales aplicables, se expide el presente instrumento para los efectos conducentes.</p>
<p>Que de conformidad con lo dispuesto en el artículo correspondiente de la Constitución Política de los Estados Unidos Mexicanos, corresponde al Estado garantizar la publicidad y certeza jurídica de los actos administrativos a través de su publicación en el órgano oficial de difusión.</p>
<h2>Considerando</h2>
<p>Que resulta necesario actualizar el marco normativo vigente para armonizarlo con los principios de transparencia, eficiencia administrativa y rendición de cuentas, en beneficio de la población y del adecuado funcionamiento de las instituciones del Estado.</p>
<p>Que las modificaciones contenidas en el presente instrumento fueron objeto de revisión por las instancias competentes, observándose en todo momento el procedimiento establecido para tal efecto, por lo que he tenido a bien expedir el siguiente:</p>
<h2>Disposiciones</h2>
<p><strong>ARTÍCULO PRIMERO.—</strong> Se reforman, adicionan y derogan diversas disposiciones a efecto de precisar los criterios de aplicación, los sujetos obligados y los plazos correspondientes, conforme a lo señalado en los anexos que forman parte integrante del presente.</p>
<p><strong>ARTÍCULO SEGUNDO.—</strong> Las autoridades competentes adoptarán las medidas administrativas necesarias para dar cumplimiento a lo establecido, dentro del ámbito de sus respectivas atribuciones y sin que ello implique erogaciones adicionales a las previstas.</p>
<h2>Transitorios</h2>
<p><strong>PRIMERO.—</strong> El presente instrumento entrará en vigor al día siguiente de su publicación en el Diario Oficial de la Federación.</p>
<p><strong>SEGUNDO.—</strong> Se derogan todas aquellas disposiciones que se opongan a lo dispuesto en el presente, en lo que corresponda.</p>`;

/**
 * Concept document body for a sample id, used as a graceful fallback so the
 * sample links on the home / listing pages remain navigable when S3 and the
 * upstream DOF source are both unavailable. Returns null for unknown ids.
 */
export function getSampleNote(id: string): SampleNote | null {
  const doc = SAMPLE_DOCS.find((entry) => entry.id === id);
  if (!doc) return null;
  return {
    metadata: { title: doc.titulo, published_at: doc.publishedAt },
    content: SAMPLE_BODY,
  };
}

export const SAMPLE_DOCS: DocCard[] = [
  {
    id: "DOF-2026-0616-001",
    tipo: "DECRETO",
    dependencia: "Secretaría de Hacienda y Crédito Público",
    titulo:
      "Decreto por el que se reforman diversas disposiciones de la Ley de Ingresos sobre Hidrocarburos",
    fecha: "16 jun 2026",
    publishedAt: "2026-06-16",
    folio: "DOF-2026-0616-001",
    edicion: "Matutina",
    isSample: true,
  },
  {
    id: "DOF-2026-0616-014",
    tipo: "ACUERDO",
    dependencia: "Secretaría de Salud",
    titulo:
      "Acuerdo por el que se actualiza el cuadro básico de insumos del sector salud",
    fecha: "16 jun 2026",
    publishedAt: "2026-06-16",
    folio: "DOF-2026-0616-014",
    edicion: "Matutina",
    isSample: true,
  },
  {
    id: "DOF-2026-0615-008",
    tipo: "NOM",
    dependencia: "Secretaría de Economía",
    titulo:
      "Norma Oficial Mexicana de etiquetado de productos electrónicos de consumo",
    fecha: "15 jun 2026",
    publishedAt: "2026-06-15",
    folio: "DOF-2026-0615-008",
    edicion: "Vespertina",
    isSample: true,
  },
  {
    id: "DOF-2026-0615-003",
    tipo: "RESOLUCIÓN",
    dependencia: "Comisión Reguladora de Energía",
    titulo:
      "Resolución sobre las tarifas de suministro básico de energía eléctrica",
    fecha: "15 jun 2026",
    publishedAt: "2026-06-15",
    folio: "DOF-2026-0615-003",
    edicion: "Matutina",
    isSample: true,
  },
  {
    id: "DOF-2026-0613-021",
    tipo: "CONVOCATORIA",
    dependencia: "Secretaría de Educación Pública",
    titulo:
      "Convocatoria al programa nacional de becas para la educación superior",
    fecha: "13 jun 2026",
    publishedAt: "2026-06-13",
    folio: "DOF-2026-0613-021",
    edicion: "Matutina",
    isSample: true,
  },
  {
    id: "DOF-2026-0612-005",
    tipo: "AVISO",
    dependencia: "Instituto Nacional Electoral",
    titulo:
      "Aviso sobre el calendario de actividades del proceso de participación ciudadana",
    fecha: "12 jun 2026",
    publishedAt: "2026-06-12",
    folio: "DOF-2026-0612-005",
    edicion: "Vespertina",
    isSample: true,
  },
];
