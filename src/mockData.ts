import type { Incident, Bounty } from './types';

export const initialIncidents: Incident[] = [
  {
    id: 'INC-2026-001',
    category: 'Water Outage & Flooding',
    location: '5th Avenue & E 12th St',
    coordinates: [35, 45],
    severity: 'Critical',
    status: 'Claimed_In_Progress',
    upvotes: 45,
    image: '/water_main_burst.png',
    timestamp: '10 Mins Ago',
    mergedCount: 1,
    notes: 'Water is gushing up from the center lane. Flooding is spilling onto sidewalks and into nearby retail basements.',
    claimedBy: 'vetted_contractor_1',
    etaTargetTime: Date.now() + 1.8 * 60 * 60 * 1000, // ~1.8 hours from now
    swarmData: {
      aegisConfidence: 'Confidence Threshold: 99.1% Authentic (Telemetry validated)',
      atlasRouting: 'Routing Optimized via Spatial Matrix (Water Main sector)',
      vulcanMaterial: 'Resource Dispatched: Water Pump & Emergency Excavator',
      mercuryPing: 'Outbound to Water Board API (Handshake status 200 OK)',
      chronosEta: 'ETA locked: 2.5 Hours (Severe leak decay delta)'
    },
    webhookLogs: [
      {
        id: 'wh-1',
        timestamp: '10 Mins Ago',
        method: 'POST',
        service: 'Twilio SMS Dispatch',
        status: 200,
        payload: '{"to": "Reporter", "body": "Zelus Incident INC-2026-001 status changed to Bounty_Posted. Volunteer bounty open."}'
      },
      {
        id: 'wh-2',
        timestamp: '9 Mins Ago',
        method: 'PUSH',
        service: 'Municipal GIS Map Service',
        status: 201,
        payload: '{"layer": "Water Infrastructure", "id": "INC-2026-001", "status": "Claimed_In_Progress", "claimedBy": "vetted_contractor_1"}'
      }
    ]
  },
  {
    id: 'INC-2026-002',
    category: 'Road & Structural Damage',
    location: 'West End Drive (Near Metro Station)',
    coordinates: [68, 25],
    severity: 'Critical',
    status: 'Triage',
    upvotes: 12,
    image: '/road_pothole.png',
    timestamp: '25 Mins Ago',
    mergedCount: 3,
    notes: 'Deep road erosion has created a dangerous double pothole. Multiple vehicles have reported severe tire shock.',
    swarmData: {
      aegisConfidence: 'Confidence Threshold: 98.6% Authentic (Visual analysis OK)',
      atlasRouting: 'Routing Optimized via Spatial Matrix (Highroad network)',
      vulcanMaterial: 'Resource Dispatched: Asphalt Patching Rig Type-B',
      mercuryPing: 'Outbound to Public Works API (Handshake status 200 OK)',
      chronosEta: 'ETA locked: 14.2 Hours (Medium structural decay delta)'
    }
  },
  {
    id: 'INC-2026-003',
    category: 'Utility & Spark Hazard',
    location: 'Broadway & W 46th St',
    coordinates: [48, 72],
    severity: 'Moderate',
    status: 'Resolved',
    upvotes: 5,
    image: '/downed_power_line.png',
    timestamp: '2 Hours Ago',
    mergedCount: 1,
    notes: 'Storm damaged utility pole. Live lines dangling over bicycle lane. Grid services resolved and cleared live sparks.',
    swarmData: {
      aegisConfidence: 'Confidence Threshold: 97.4% Authentic (Signal validated)',
      atlasRouting: 'Routing Optimized via Spatial Matrix (Grid Node Sector-9)',
      vulcanMaterial: 'Resource Dispatched: High Voltage Line Crew & Bucket Truck',
      mercuryPing: 'Outbound to Power Grid API (Handshake status 200 OK)',
      chronosEta: 'ETA locked: 0.5 Hours (Resolved)'
    },
    progressPhoto: '/downed_power_line.png',
    verifications: [
      { name: 'Citizen Hero #2948', timestamp: '1 Hour Ago', photo: '' },
      { name: 'Citizen Hero #1042', timestamp: '50 Mins Ago', photo: '' },
      { name: 'Citizen Hero #3049', timestamp: '45 Mins Ago', photo: '' }
    ]
  }
];

export const initialBounties: Bounty[] = [
  {
    id: 'BTY-001',
    title: 'Oak Park Tree Debris Cleanup',
    description: 'Clear heavy oak branches blocking the pedestrian trail in the north section after the storm.',
    sponsor: 'Oak & Hearth Bakery',
    targetBounty: 300,
    currentFunding: 120,
    progress: 40,
    votes: 8,
    isVerified: false
  },
  {
    id: 'BTY-002',
    title: 'Main St. Crosswalk Re-striping',
    description: 'Apply high-visibility reflective repaint on the faded central pedestrian crosswalk grid.',
    sponsor: 'Downtown Merchants Association',
    targetBounty: 500,
    currentFunding: 425,
    progress: 85,
    votes: 14,
    isVerified: false
  },
  {
    id: 'BTY-003',
    title: 'Public Library Bike Rack Installation',
    description: 'Assemble and bolt down the new 6-bike heavy-duty parking rack outside the library entrance.',
    sponsor: 'Spokes & Gears Cycles',
    targetBounty: 250,
    currentFunding: 250,
    progress: 100,
    votes: 28,
    isVerified: true
  }
];
