export default async () => {
  const MIRROR = "https://planet.openstreetmap.org";

  const response = await fetch(`${MIRROR}/replication/changesets/state.yaml`);

  if (!response.ok) {
    // TODO: Error handling
    return;
  }

  const text = await response.text();
  console.log("🚀 ~ text:", text);

  return new Response(text);
};

export const config = { path: "/test" };
