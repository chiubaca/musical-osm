import type { Context, Config } from "@netlify/edge-functions";


/**
* Converts:
* ```---
 last_run: 2024-01-25 18:57:42.015653000 +00:00
 sequence: 5853276
 ```
 To: `5853277`
*/
const extractSequenceNumber = (text: string) => {

  const extractedString = text.match(/sequence: (\d+)/)

  if (!extractedString) {
    return null
  }

  // why do we increment by 1?
  const sequenceNumber = parseInt(extractedString[1]) + 1;
  console.log("🚀 ~ _sequence:", sequenceNumber);
  return sequenceNumber;
};

const createChangesetPath = (sequence) => {
  const seq = `000000000${sequence}`
    .substr(-9)
    .replace(/(\d{3})/g, "$1/")
    .replace(/\/$/, "");

  console.log("🚀 ~ convertSequenceNumberToOsmPath ~ seq:", seq);
  return seq;
};

export default async (_req: Request, _context: Context) => {
  const MIRROR = "https://planet.openstreetmap.org";

  const response = await fetch(`${MIRROR}/replication/changesets/state.yaml`);

  if (!response.ok) {
    // TODO: Error handling
    return;
  }

  const text = await response.text();

  const sequenceNumber = extractSequenceNumber(text);

  const osmPath = createChangesetPath(sequenceNumber);

  return new Response(osmPath);
};

export const config: Config = { path: "/latest-osm-changeset" };
