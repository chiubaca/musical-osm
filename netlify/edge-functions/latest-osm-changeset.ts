import type { Context, Config } from "@netlify/edge-functions";
import Pako from 'pako';
import * as htmlparser2 from "htmlparser2";

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

  return sequenceNumber;
};

const extractDate = (text: string) => {

  const extractedDateText = text.match(/last_run: ([\d-]+ [\d:]+)/)

  if (!extractedDateText) return null

  return Date.parse(extractedDateText[1].replace(' ', 'T'))
};

/**
 * Create the OSM sequence path
 * e.g "004/365/130"
 */
const createChangesetPath = (sequence) => {
  const seq = `000000000${sequence}`
    .substr(-9)
    .replace(/(\d{3})/g, "$1/")
    .replace(/\/$/, "");

  return seq;
};

const parseChangesets = (xml: string) => {

  const data: any[] = []

  const parser = new htmlparser2.Parser({
    onopentag(name, attributes) {
      if (name === 'changeset') {
        const changeset = { ...attributes }
        // TODO: figure out how to also include children tags inside changeset 
        data.push(changeset)
      }
    },
  })

  parser.write(xml);

  return data
}

export default async (_req: Request, _context: Context) => {
  const MIRROR = "https://planet.openstreetmap.org";

  const osmStateResp = await fetch(`${MIRROR}/replication/changesets/state.yaml`);

  if (!osmStateResp.ok) {
    // TODO: Error handling
    console.warn('Couldnt get the latest OSM state');
    return;
  }

  const text = await osmStateResp.text();


  const sequenceNumber = extractSequenceNumber(text);

  const stateDate = extractDate(text);


  const osmChangesetPath = createChangesetPath(sequenceNumber);

  const changesetResp = await fetch(
    `${MIRROR}/replication/changesets/${osmChangesetPath}.osm.gz`,
  );

  if (!changesetResp.ok) {
    // TODO: Error handling
    console.warn('Couldnt get the latest OSM changeset');
    return;
  }


  const xml: string = Pako.inflate(await changesetResp.arrayBuffer(), { to: 'string' });
  const changesets = parseChangesets(xml)

  const respBody = { sequenceNumber, stateDate, changesets }

  return new Response(JSON.stringify(respBody));
};

export const config: Config = { path: "/latest-osm-changeset" };
