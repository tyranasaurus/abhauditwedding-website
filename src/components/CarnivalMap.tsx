type CarnivalPlacement = {
  id: string;
  label: string;
  src: string;
  x: number;
  y: number;
  width: number;
  angle?: number;
};

const ART_PATH = '/art/map/carnival';

const placements: CarnivalPlacement[] = [
  {
    id: 'pani-puri',
    label: 'Pani puri',
    src: `${ART_PATH}/pani-puri.webp`,
    x: 32.5,
    y: 34,
    width: 4.2,
  },
  {
    id: 'cmu-fence',
    label: 'Carnegie Mellon fence',
    src: `${ART_PATH}/cmu-fence.webp`,
    x: 37.5,
    y: 34,
    width: 6.3,
  },
  {
    id: 'picnic-west',
    label: 'Picnic blanket with carrom and Jenga',
    src: `${ART_PATH}/picnic-carrom-jenga.webp`,
    x: 43,
    y: 27,
    width: 7.2,
  },
  {
    id: 'mehendi',
    label: 'Mehendi artists',
    src: `${ART_PATH}/henna.webp`,
    x: 49.5,
    y: 27,
    width: 4.2,
  },
  {
    id: 'picnic-east',
    label: 'Picnic blanket with carrom and Jenga',
    src: `${ART_PATH}/picnic-carrom-jenga.webp`,
    x: 56,
    y: 27,
    width: 7.2,
  },
  {
    id: 'jigsaw',
    label: 'Jigsaw puzzle',
    src: `${ART_PATH}/jigsaw.webp`,
    x: 62,
    y: 34,
    width: 3.6,
  },
  {
    id: 'bazaar',
    label: 'Bazaar',
    src: `${ART_PATH}/bazaar.webp`,
    x: 68.5,
    y: 35,
    width: 7.3,
  },
  {
    id: 'umbrella-arch',
    label: 'Rajasthani umbrella arch',
    src: `${ART_PATH}/umbrella-arch.webp`,
    x: 68.5,
    y: 48,
    width: 6.5,
  },
  {
    id: 'sunglasses',
    label: 'Colorful sunglasses',
    src: `${ART_PATH}/sunglasses.webp`,
    x: 68.5,
    y: 58,
    width: 4.1,
  },
  {
    id: 'block-print',
    label: 'Block-print tote bags',
    src: `${ART_PATH}/block-print-tote.webp`,
    x: 68.5,
    y: 68,
    width: 4.8,
  },
  {
    id: 'candy',
    label: 'Colorful candies',
    src: `${ART_PATH}/candy-bag.webp`,
    x: 43,
    y: 72,
    width: 3.5,
  },
  {
    id: 'paan',
    label: 'Paan cart',
    src: `${ART_PATH}/paan-cart.webp`,
    x: 47,
    y: 72,
    width: 3.8,
  },
  {
    id: 'samosa',
    label: 'Samosa',
    src: `${ART_PATH}/samosa.webp`,
    x: 52,
    y: 72,
    width: 3.8,
  },
  {
    id: 'bicycle',
    label: 'Decorated bicycle',
    src: `${ART_PATH}/bicycle.webp`,
    x: 57,
    y: 72,
    width: 4.4,
  },
  {
    id: 'yarn',
    label: 'Yarn art',
    src: `${ART_PATH}/yarn-art.webp`,
    x: 62,
    y: 72,
    width: 3.2,
  },
  {
    id: 'airstream',
    label: 'Airstream drinks',
    src: `${ART_PATH}/airstream-drinks.webp`,
    x: 34.5,
    y: 72.5,
    width: 9,
  },
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
        {placements.map((placement) => (
          <img
            key={placement.id}
            className="carnival-map-item"
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
        </ul>
      </div>
    </section>
  );
}
