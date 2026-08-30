type CarnivalPlacement = {
  id: string;
  label: string;
  src: string;
  x: number;
  y: number;
  width: number;
  angle?: number;
  grounded?: boolean;
};

const ART_PATH = '/art/map/carnival';

const placements: CarnivalPlacement[] = [
  {
    id: 'pani-puri',
    label: 'Pani puri',
    src: `${ART_PATH}/pani-puri.webp`,
    x: 31.5,
    y: 33,
    width: 4.2,
  },
  {
    id: 'cmu-fence',
    label: 'Carnegie Mellon fence',
    src: `${ART_PATH}/cmu-fence.webp`,
    x: 36.5,
    y: 35,
    width: 6.3,
  },
  {
    id: 'picnic-west',
    label: 'Picnic blanket with carrom and Jenga',
    src: `${ART_PATH}/picnic-carrom-jenga.webp`,
    x: 41.7,
    y: 26.5,
    width: 7.2,
  },
  {
    id: 'mehendi',
    label: 'Mehendi artists',
    src: `${ART_PATH}/henna.webp`,
    x: 48.5,
    y: 25.5,
    width: 4.2,
  },
  {
    id: 'picnic-east',
    label: 'Picnic blanket with carrom and Jenga',
    src: `${ART_PATH}/picnic-carrom-jenga.webp`,
    x: 56.8,
    y: 26.5,
    width: 7.2,
  },
  {
    id: 'jigsaw',
    label: 'Jigsaw puzzle',
    src: `${ART_PATH}/jigsaw.webp`,
    x: 61.5,
    y: 33,
    width: 3.6,
  },
  {
    id: 'bazaar',
    label: 'Bazaar',
    src: `${ART_PATH}/bazaar.webp`,
    x: 68.5,
    y: 34.5,
    width: 7.3,
  },
  {
    id: 'umbrella-arch',
    label: 'Rajasthani umbrella arch',
    src: `${ART_PATH}/umbrella-arch.webp`,
    x: 68.8,
    y: 47,
    width: 6.5,
  },
  {
    id: 'sunglasses',
    label: 'Colorful sunglasses',
    src: `${ART_PATH}/sunglasses.webp`,
    x: 69.5,
    y: 57.5,
    width: 4.1,
  },
  {
    id: 'block-print',
    label: 'Block-print tote bags',
    src: `${ART_PATH}/block-print-tote.webp`,
    x: 69.2,
    y: 68,
    width: 4.8,
  },
  {
    id: 'candy',
    label: 'Colorful candies',
    src: `${ART_PATH}/candy-bag.webp`,
    x: 42,
    y: 73.5,
    width: 3.5,
  },
  {
    id: 'paan',
    label: 'Paan cart',
    src: `${ART_PATH}/paan-cart.webp`,
    x: 45.2,
    y: 73,
    width: 3.8,
  },
  {
    id: 'dabeli',
    label: 'Dabeli',
    src: `${ART_PATH}/dabeli.webp`,
    x: 49.2,
    y: 73.5,
    width: 3.4,
  },
  {
    id: 'samosa',
    label: 'Samosa',
    src: `${ART_PATH}/samosa.webp`,
    x: 52.5,
    y: 73.5,
    width: 3.4,
  },
  {
    id: 'chaat-papdi',
    label: 'Chaat papdi',
    src: `${ART_PATH}/chaat-papdi.webp`,
    x: 55.8,
    y: 73.5,
    width: 3.5,
  },
  {
    id: 'bicycle',
    label: 'Decorated bicycle',
    src: `${ART_PATH}/bicycle.webp`,
    x: 59.2,
    y: 73.5,
    width: 4.4,
  },
  {
    id: 'yarn',
    label: 'Yarn art',
    src: `${ART_PATH}/yarn-art.webp`,
    x: 62.5,
    y: 73,
    width: 3.2,
  },
  {
    id: 'airstream',
    label: 'Airstream drinks',
    src: `${ART_PATH}/airstream-drinks.webp`,
    x: 34,
    y: 80.5,
    width: 10.5,
    grounded: true,
  },
];

const cocktail_tables: CarnivalPlacement[] = [
  { x: 44, y: 43 },
  { x: 48, y: 43 },
  { x: 52, y: 43 },
  { x: 56, y: 43 },
  { x: 44, y: 62 },
  { x: 48, y: 62 },
  { x: 52, y: 62 },
  { x: 56, y: 62 },
].map(({ x, y }, index) => ({
  id: `cocktail-${index}`,
  label: 'Standing cocktail table',
  src: `${ART_PATH}/cocktail-table.webp`,
  x,
  y,
  width: 2.1,
}));

const banquet_tables: CarnivalPlacement[] = [
  { x: 27.2, y: 43 },
  { x: 29.8, y: 49 },
  { x: 27.4, y: 56 },
  { x: 29.7, y: 62 },
  { x: 27.7, y: 69 },
].map(({ x, y }, index) => ({
  id: `banquet-${index}`,
  label: '10-person table',
  src: `${ART_PATH}/banquet-table.webp`,
  x,
  y,
  width: 3.4,
}));

const chair_rows: CarnivalPlacement[] = [
  { x: 35.4, y: 56, angle: -34 },
  { x: 36.1, y: 59, angle: -28 },
  { x: 36.8, y: 62, angle: -20 },
  { x: 37.5, y: 65, angle: -12 },
  { x: 38.2, y: 68, angle: -4 },
  { x: 38.9, y: 71, angle: 4 },
].map(({ x, y, angle }, index) => ({
  id: `chair-row-${index}`,
  label: 'Rows of chairs',
  src: `${ART_PATH}/chair.webp`,
  x,
  y,
  angle,
  width: 1.5,
}));

const all_placements = [
  ...placements,
  ...cocktail_tables,
  ...banquet_tables,
  ...chair_rows,
];

export function CarnivalMap() {
  return (
    <section className="carnival-map" aria-labelledby="carnival-map-title">
      <div className="carnival-map-heading">
        <p className="carnival-map-kicker">Explore the grounds</p>
        <h2 id="carnival-map-title">Carnival Map</h2>
      </div>
      <div className="carnival-map-frame">
        <img
          className="carnival-map-base"
          src="/art/map/carnival-lawn-base.webp"
          alt="Watercolor overhead map of the Carnival lawn beside the red-roofed barn and formal gardens."
          width={1689}
          height={931}
        />
        {all_placements.map((placement) => (
          <img
            key={placement.id}
            className={`carnival-map-item${placement.grounded ? ' is-grounded' : ''}`}
            src={placement.src}
            alt=""
            aria-hidden="true"
            style={{
              left: `${placement.x}%`,
              top: `${placement.y}%`,
              width: `${placement.width}%`,
              transform: `translate(-50%, -50%) rotate(${placement.angle ?? 0}deg)`,
            }}
          />
        ))}
        <ul className="sr-only">
          {placements.map((placement) => (
            <li key={placement.id}>{placement.label}</li>
          ))}
          <li>Standing cocktail tables</li>
          <li>10-person tables</li>
          <li>Rows of chairs</li>
        </ul>
      </div>
    </section>
  );
}
