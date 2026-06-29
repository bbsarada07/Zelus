import type { Incident, Bounty } from './types';

export const initialIncidents: Incident[] = [
  {
    id: 'INC-001',
    category: 'Road & Structural Damage',
    location: 'Sector 4 - Intersection Grid 12',
    coordinates: [30, 40],
    severity: 'Moderate',
    status: 'Claimed_In_Progress',
    upvotes: 8,
    description: 'Deep pothole issue near Sector 4 causing traffic flow speed reduction.',
    languageBadge: null,
    claimedBy: 'contractor_alpha',
    etaTargetTime: Date.now() + 2 * 60 * 60 * 1000,
    image: '/road_pothole.png',
    timestamp: '2 Hours Ago',
    mergedCount: 1,
    geolocation: { lat: 40.7145, lng: -74.0082 },
    exifVerified: true,
    hash: '0x3EAA89FD2B019283EEFFCA89D20E89104A12B890A98F7E8D8A89BC8D9C0A89EE'
  },
  {
    id: 'INC-002',
    category: 'Water Outage & Flooding',
    location: '5th Ave & 23rd St',
    coordinates: [55, 45],
    severity: 'Critical',
    status: 'Bounty_Posted',
    upvotes: 22,
    description: 'High-pressure water main leak near 5th Ave resulting in street flooding.',
    languageBadge: null,
    image: '/water_main_burst.png',
    timestamp: '1 Hour Ago',
    mergedCount: 1,
    geolocation: { lat: 40.7198, lng: -74.0035 },
    exifVerified: true,
    hash: '0x99AA8FEEB2019283EEFFCA89D20E89104A12B890A98F7E8D8A89BC8D9C0A89FF'
  },
  {
    id: 'INC-003',
    category: 'Utility & Spark Hazard',
    location: 'Metro Station West Exit',
    coordinates: [68, 75],
    severity: 'Low',
    status: 'Triage',
    upvotes: 3,
    description: 'Damaged streetlight housing exposing secondary wiring near the Metro Station entrance.',
    languageBadge: null,
    image: '/downed_power_line.png',
    timestamp: '10 Mins Ago',
    mergedCount: 1,
    geolocation: { lat: 40.7252, lng: -73.9982 },
    exifVerified: true,
    hash: '0x77CC8FEEB2019283EEFFCA89D20E89104A12B890A98F7E8D8A89BC8D9C0A89FF'
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
