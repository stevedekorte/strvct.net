# Home Assistant

IoT device control via Home Assistant's WebSocket API.

## Overview

The Home Assistant integration maps an entire Home Assistant instance — areas, devices, entities, and states — into the Strvct node graph. The result is a navigable, inspectable tree of your smart home that uses the same UI patterns as the rest of the framework. No custom views are involved; the generated interface lets you browse areas, drill into devices, see entity states, and inspect raw JSON from HA — all from slot annotations.

Multiple Home Assistant instances are supported. Each connection is configured with a host, port, and long-lived access token, all editable through the generated inspector.

## Connection

Communication uses the Home Assistant WebSocket API. Because browsers disallow plain `ws://` connections from HTTPS pages, a small WSS-to-WS proxy relays traffic between the browser and HA's local WebSocket endpoint.

### Authentication Flow

1. Browser opens a secure WebSocket connection to the proxy
2. HA sends `auth_required`
3. Client responds with the stored long-lived access token
4. HA replies `auth_ok` or `auth_invalid`
5. On success, a full data refresh begins

All subsequent requests use a sequential integer ID with a promise-based response pattern — each outgoing message gets a unique ID, and incoming results are matched to their pending promise by that ID.

## Data Model

After authentication, the integration fetches four registries in parallel:

| Group | HA WebSocket Command | Node Class |
|---|---|---|
| Areas | `config/area_registry/list` | `SvHomeAssistantArea` |
| SvDevices | `config/device_registry/list` | `SvHomeAssistantDevice` |
| Entities | `config/entity_registry/list` | `SvHomeAssistantEntity` |
| States | `get_states` | `SvHomeAssistantState` |

Each registry response is an array of JSON objects. For each entry, a corresponding Strvct node is created and registered in an ID map for O(1) lookup.

### Object Wiring

After all four registries are loaded, a wiring pass connects objects into a hierarchy based on their foreign keys:

- **SvDevices** attach to **Areas** via `area_id`
- **Entities** attach to **SvDevices** via `device_id`
- **States** attach to **Entities** via `entity_id`

The result is a tree rooted at a `SvHomeAssistantFolder` node (titled "regions") that mirrors the physical layout of the home:

```
Home Assistant
└── regions
    ├── Living Room (area)
    │   └── HomePod (device)
    │       └── volume (entity)
    │           └── standby (state)
    ├── Kitchen (area)
    │   └── ...
    └── ...
```

### Display Names

Each object computes a short display name by stripping its parent's name as a prefix. For example, a device named "Living Room Speaker" under the "Living Room" area displays as "Speaker". This keeps the tree compact without losing context.

## Class Hierarchy

```
SvHomeAssistants              — Collection of HA connections
 └── SvHomeAssistant          — One connection instance
      ├── rootFolder        — Navigable UI tree (regions)
      ├── SvHomeAssistantAreas     ─┐
      ├── SvHomeAssistantDevices    │ Data groups (hidden,
      ├── SvHomeAssistantEntities   │ used for ID lookup)
      └── SvHomeAssistantStates    ─┘

SvHomeAssistantGroup          — Base for the four registry groups
 ├── SvHomeAssistantAreas
 ├── SvHomeAssistantDevices
 ├── SvHomeAssistantEntities
 └── SvHomeAssistantStates

SvHomeAssistantObject         — Base for individual HA items
 ├── SvHomeAssistantArea
 ├── SvHomeAssistantDevice
 ├── SvHomeAssistantEntity
 └── SvHomeAssistantState
```

The four data group nodes (`areasNode`, `devicesNode`, `entitiesNode`, `statesNode`) are hidden from the UI — they exist for ID-based lookup during the wiring pass. The visible navigation tree is the `rootFolder`, which is populated with area nodes after all data is loaded and wired.
