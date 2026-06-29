import type { Incident, Bounty } from './types';

export const initialIncidents: Incident[] = [
  {
    id: "INC-2026-001",
    category: "Water Outage & Flooding",
    location: "5th Ave & 12th St",
    coordinates: [17.4501, 78.5252],
    severity: "Critical",
    status: "Bounty_Posted",
    upvotes: 32,
    description: "Water main burst filling intersection with 4 inches of standing water.",
    materials: ["3-inch PVC High-Pressure Clamps", "Industrial De-watering Pump rental", "Crushed Gravel Bedding (2 Tons)"],
    costBreakdown: { materials: 450, labor: 350, total: 800 },
    languageBadge: null,
    timestamp: "10 mins ago",
    image: "/water_main_burst.png",
    geolocation: { lat: 17.4501, lng: 78.5252 },
    exifVerified: true,
    hash: "0x3EAA89FD2B019283EEFFCA89D20E89104A12B890A98F7E8D8A89BC8D9C0A89EE"
  },
  {
    id: "INC-2026-002",
    category: "Road & Structural Damage",
    location: "Sector 4 Junction Node",
    coordinates: [17.4520, 78.5280],
    severity: "Moderate",
    status: "Triage",
    upvotes: 8,
    description: "Tarmac structural fracture causing pedestrian routing vectors blockage.",
    materials: ["Asphalt Patch Compound (5 Bags)", "Traffic Safety Cones (4 units)", "Compaction Rammer Rental"],
    costBreakdown: { materials: 150, labor: 200, total: 350 },
    languageBadge: null,
    timestamp: "1 hour ago",
    image: "/road_pothole.png",
    geolocation: { lat: 17.4520, lng: 78.5280 },
    exifVerified: true,
    hash: "0x99AA8FEEB2019283EEFFCA89D20E89104A12B890A98F7E8D8A89BC8D9C0A89FF"
  },
  {
    id: "INC-2026-003",
    category: "Utility & Spark Hazard",
    location: "Zone-1 Main Transformers",
    coordinates: [17.4480, 78.5210],
    severity: "Critical",
    status: "Bounty_Posted",
    upvotes: 45,
    description: "High severity grid node failure causing local sparks and blackout threats.",
    materials: ["High-Voltage Insulation Tape", "Ceramic Insulator Bushings (2 units)", "Grid Diagnostics Meter Rental"],
    costBreakdown: { materials: 600, labor: 400, total: 1000 },
    languageBadge: null,
    timestamp: "20 mins ago",
    image: "/downed_power_line.png",
    geolocation: { lat: 17.4480, lng: 78.5210 },
    exifVerified: true,
    hash: "0x77CC8FEEB2019283EEFFCA89D20E89104A12B890A98F7E8D8A89BC8D9C0A89FF"
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
