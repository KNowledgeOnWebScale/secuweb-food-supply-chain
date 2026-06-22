import assert from "node:assert/strict";

import { resourceUrl } from "../../config/runtime.js";
import { queryTransportEventsForShipment } from "../../query/provenance-query.js";
import type { ScenarioCheck } from "../scenario-types.js";

export const checks: ScenarioCheck[] = [
  {
    id: "O-1",
    scenario: "O",
    description: "The Retailer selects shipment-specific event fields from one Transporter Pod",
    run: async (context) => {
      const retailerFetch = await context.getActorFetch("retailer");
      const transporterSources = [
        resourceUrl("transporter", "transport-events/vc/pickup-shipment1.jsonld"),
        resourceUrl("transporter", "transport-events/vc/delivery-shipment1.jsonld"),
        resourceUrl("transporter", "transport-events/vc/pickup-shipment3.jsonld"),
        resourceUrl("transporter", "transport-events/vc/delivery-shipment3.jsonld"),
      ];
      const rows = await queryTransportEventsForShipment(
        "did:secuweb:packager:shipment3",
        transporterSources,
        retailerFetch
      );
      assert.deepEqual(
        rows.map((row) => row.event),
        [
          "did:secuweb:transporter:pickup-shipment3",
          "did:secuweb:transporter:delivery-shipment3",
        ]
      );
      assert.ok(
        rows.every((row) => row.eventStatus && row.startTime && row.temperatureC),
        "The selected event subset omitted status, time, or temperature"
      );
      const allowedFields = new Set(["event", "eventStatus", "startTime", "endTime", "temperatureC"]);
      assert.ok(
        rows.every((row) => Object.keys(row).every((key) => allowedFields.has(key))),
        "The query exposed a property outside the allowed projection"
      );
      return `Selected five fields for ${rows.length} matching events from ${transporterSources.length} resources in one Pod`;
    },
  },
];
