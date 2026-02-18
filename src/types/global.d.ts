declare module 'seedrandom' {
  function seedrandom(seed?: string): () => number;
  export default seedrandom;
}

declare module '@babylonjs/havok' {
  const HavokPhysics: () => Promise<unknown>;
  export default HavokPhysics;
}
