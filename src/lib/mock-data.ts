import type {
  AlertItem,
  AIQuickQuestion,
  BudgetItem,
  ChecklistTask,
  CityMetric,
  DocumentItem,
  InventoryBox,
  MarketplaceService,
  MovingPlanWeek,
  RouteStop,
  TruckOption,
  UserProfile,
  VehicleOption,
} from "./types";

export const MOCK_USER: UserProfile = {
  name: "Raul Garcia",
  email: "raul.garcia@email.com",
  origin: "Austin, TX",
  destination: "Huntington, WV",
  moveDate: "2026-09-15",
  household: "2 adults, 1 child, 1 dog",
  pets: true,
  vehicles: ["2019 Volkswagen Atlas V6 4Motion"],
  rentalPreference: "Trailer rental with own SUV",
  budget: 4000,
  needsHousingHelp: true,
  needsVehicleTransport: false,
};

export const MOVE_STATS = {
  estimatedTotalBudget: 4250,
  taskCompletionPercent: 37,
  currentPhase: "Planning & Preparation",
  totalMiles: 1087,
  estimatedDriveTime: "16h 20m",
};

export const ALERTS: AlertItem[] = [
  {
    id: "1",
    type: "warning",
    title: "Lease deadline approaching",
    message: "Your Austin lease ends in 45 days. Confirm your move-out date with your landlord.",
  },
  {
    id: "2",
    type: "info",
    title: "Trailer recommendation",
    message: "A 6x12 trailer with your VW Atlas may save ~$480 vs. renting a full moving truck.",
  },
  {
    id: "3",
    type: "success",
    title: "School enrollment open",
    message: "Huntington school district enrollment for fall 2026 is now open. 3 documents pending.",
  },
];

export const QUICK_ACTIONS = [
  { id: "1", label: "Update checklist", href: "/checklist" },
  { id: "2", label: "Compare truck options", href: "/trucks" },
  { id: "3", label: "Review budget", href: "/budget" },
  { id: "4", label: "Upload documents", href: "/documents" },
];

export const MOVING_PLAN_WEEKS: MovingPlanWeek[] = [
  {
    week: 1,
    label: "8 weeks out — Foundation",
    status: "completed",
    tasks: [
      "Set moving budget and timeline",
      "Research Huntington neighborhoods",
      "Notify landlord of intent to vacate",
      "Start decluttering non-essentials",
    ],
  },
  {
    week: 2,
    label: "7 weeks out — Housing",
    status: "completed",
    tasks: [
      "Schedule virtual home tours in Huntington",
      "Compare rental vs. purchase options",
      "Research school districts for your child",
      "Request utility transfer information",
    ],
  },
  {
    week: 3,
    label: "6 weeks out — Logistics",
    status: "current",
    tasks: [
      "Reserve trailer rental (U-Haul 6x12 recommended)",
      "Book pet-friendly hotel for drive day",
      "Schedule vet check-up for your dog",
      "Order packing supplies",
    ],
  },
  {
    week: 4,
    label: "5 weeks out — Packing prep",
    status: "upcoming",
    tasks: [
      "Label inventory boxes by room",
      "Pack non-essential items",
      "Confirm moving day helpers",
      "Update address with banks and employers",
    ],
  },
  {
    week: 5,
    label: "4 weeks out — Services",
    status: "upcoming",
    tasks: [
      "Set up internet at new address",
      "Transfer medical records",
      "Arrange school enrollment documents",
      "Confirm trailer pickup location",
    ],
  },
  {
    week: 6,
    label: "3 weeks out — Final prep",
    status: "upcoming",
    tasks: [
      "Pack essentials box (first night kit)",
      "Confirm hotel and route stops",
      "Deep clean current home",
      "Schedule final utility readings",
    ],
  },
  {
    week: 7,
    label: "2 weeks out — Countdown",
    status: "upcoming",
    tasks: [
      "Pack remaining items",
      "Dispose of items not moving",
      "Confirm lease termination",
      "Prepare vehicle for long drive",
    ],
  },
  {
    week: 8,
    label: "Move week",
    status: "upcoming",
    tasks: [
      "Load trailer systematically",
      "Final walkthrough of Austin home",
      "Drive to Huntington (2-day route suggested)",
      "Unload and settle in",
    ],
  },
];

export const PLAN_PRIORITY_TASKS = [
  { id: "1", title: "Reserve 6x12 U-Haul trailer", priority: "high" as const, due: "2026-07-15" },
  { id: "2", title: "Book pet-friendly hotel — Nashville area", priority: "high" as const, due: "2026-07-20" },
  { id: "3", title: "Submit school enrollment forms", priority: "medium" as const, due: "2026-08-01" },
  { id: "4", title: "Transfer renter's insurance", priority: "medium" as const, due: "2026-08-15" },
  { id: "5", title: "Schedule dog vet records transfer", priority: "low" as const, due: "2026-08-20" },
];

export const AI_PLAN_NOTES = [
  "Based on your 1,087-mile route, a 2-day drive with an overnight stop in Nashville is recommended for comfort with a child and pet.",
  "Your VW Atlas can tow up to 5,000 lbs — a 6x12 trailer (~2,200 lbs loaded) is well within capacity.",
  "Huntington's cost of living is ~18% lower than Austin — consider allocating savings toward home setup.",
  "Peak moving season pricing applies in September — book trailer 6+ weeks ahead for best rates.",
];

export const BUDGET_ITEMS: BudgetItem[] = [
  { id: "1", category: "Truck rental", estimated: 0, actual: 0, cheapestOption: "Use own SUV + trailer", notes: "Skipping truck rental" },
  { id: "2", category: "Trailer rental", estimated: 420, actual: 0, cheapestOption: "U-Haul 6x12 — $89/day × 4 days" },
  { id: "3", category: "Movers", estimated: 350, actual: 0, cheapestOption: "2 friends + pizza — $0" },
  { id: "4", category: "Gas", estimated: 285, actual: 0, cheapestOption: "Atlas towing — ~$285 fuel" },
  { id: "5", category: "Hotels", estimated: 189, actual: 0, cheapestOption: "La Quinta Nashville — pet friendly" },
  { id: "6", category: "Food", estimated: 320, actual: 145, cheapestOption: "Pack snacks + 1 restaurant meal/day" },
  { id: "7", category: "Storage", estimated: 0, actual: 0, cheapestOption: "No storage needed" },
  { id: "8", category: "Deposits", estimated: 1800, actual: 0, cheapestOption: "Huntington apt — $1,200 + $600 utilities" },
  { id: "9", category: "Emergency fund", estimated: 500, actual: 0, cheapestOption: "10% of total budget" },
  { id: "10", category: "Packing supplies", estimated: 185, actual: 92, cheapestOption: "Amazon bulk boxes + tape" },
  { id: "11", category: "Pet fees", estimated: 150, actual: 0, cheapestOption: "Hotel pet fee — $25/night" },
  { id: "12", category: "Insurance", estimated: 260, actual: 0, cheapestOption: "U-Haul trailer insurance — $18/day" },
];

export const ROUTE_STOPS: RouteStop[] = [
  { id: "1", name: "Shell — Temple, TX", type: "gas", location: "Temple, TX", notes: "First fuel stop, 65 miles" },
  { id: "2", name: "Rest area — Waco", type: "rest", location: "Waco, TX", notes: "Stretch break, pet walk" },
  { id: "3", name: "QuikTrip — Dallas area", type: "gas", location: "Dallas, TX", notes: "Mid-route fuel" },
  { id: "4", name: "La Quinta — Nashville", type: "hotel", location: "Nashville, TN", notes: "Pet-friendly, free parking for trailer" },
  { id: "5", name: "Pet-friendly park — Nashville", type: "pet_hotel", location: "Nashville, TN", notes: "Dog exercise before hotel" },
  { id: "6", name: "Shell — Louisville", type: "gas", location: "Louisville, KY", notes: "Day 2 morning fuel" },
  { id: "7", name: "Cracker Barrel — Lexington", type: "rest", location: "Lexington, KY", notes: "Family lunch stop" },
  { id: "8", name: "Final fuel — Charleston, WV", type: "gas", location: "Charleston, WV", notes: "Last stop before Huntington" },
];

export const TRUCK_OPTIONS: TruckOption[] = [
  {
    id: "1",
    company: "U-Haul",
    estimatedPrice: 420,
    vehicleSize: "6x12 Open Trailer",
    mileagePolicy: "Unlimited miles included",
    pros: ["Widest location network", "Unlimited miles", "Fits your Atlas tow capacity"],
    cons: ["Older equipment at some locations", "Insurance add-on recommended"],
    bestFor: "DIY movers with capable SUV",
    type: "trailer",
  },
  {
    id: "2",
    company: "Penske",
    estimatedPrice: 890,
    vehicleSize: "12 ft Truck",
    mileagePolicy: "$0.99/mile after 200 miles",
    pros: ["Newer trucks", "Reliable maintenance", "Easy loading ramp"],
    cons: ["Higher base cost", "Mileage charges add up"],
    bestFor: "Full truck rental without own vehicle",
    type: "truck",
  },
  {
    id: "3",
    company: "Budget",
    estimatedPrice: 780,
    vehicleSize: "16 ft Truck",
    mileagePolicy: "$0.79/mile after 150 miles",
    pros: ["Competitive pricing", "Larger capacity", "AAA discounts available"],
    cons: ["Limited trailer options", "Availability varies by location"],
    bestFor: "Medium-sized households",
    type: "truck",
  },
  {
    id: "4",
    company: "Enterprise Truck Rental",
    estimatedPrice: 950,
    vehicleSize: "12 ft Box Truck",
    mileagePolicy: "$0.50/mile after 100 miles",
    pros: ["Premium fleet", "Excellent customer service", "Flexible pickup"],
    cons: ["Highest price tier", "Fewer locations"],
    bestFor: "Business-grade reliability needs",
    type: "truck",
  },
  {
    id: "5",
    company: "U-Haul",
    estimatedPrice: 520,
    vehicleSize: "15 ft Truck",
    mileagePolicy: "Unlimited miles",
    pros: ["Good for full household move", "Unlimited miles", "Many pickup locations"],
    cons: ["Higher than trailer option", "Fuel costs for large truck"],
    bestFor: "Moves without a tow vehicle",
    type: "truck",
  },
  {
    id: "6",
    company: "Penske",
    estimatedPrice: 340,
    vehicleSize: "5x8 Cargo Trailer",
    mileagePolicy: "Included with rental",
    pros: ["Smaller, easier to tow", "Lower cost", "Good for partial moves"],
    cons: ["May be too small for full household", "Limited height clearance"],
    bestFor: "Minimal furniture moves",
    type: "trailer",
  },
];

export const TRAILER_RECOMMENDATION =
  "For your move, renting a 6x12 trailer and using your own SUV may save approximately $480 compared to a 15 ft truck rental.";

export const VEHICLE_OPTIONS: VehicleOption[] = [
  {
    id: "1",
    title: "Drive your own car",
    description: "Tow a 6x12 trailer with your 2019 VW Atlas. Best balance of cost and control.",
    estimatedCost: 705,
    fuelEstimate: 285,
    wearAndTear: 120,
    recommended: true,
  },
  {
    id: "2",
    title: "Rent a trailer only",
    description: "U-Haul 6x12 open trailer. Atlas tow capacity: 5,000 lbs — well within limits.",
    estimatedCost: 420,
    fuelEstimate: 285,
  },
  {
    id: "3",
    title: "Ship your vehicle",
    description: "Auto transport from Austin to Huntington. Drive separately or fly.",
    estimatedCost: 1100,
    fuelEstimate: 0,
    wearAndTear: 0,
  },
  {
    id: "4",
    title: "Use a tow dolly",
    description: "Tow a second vehicle behind your Atlas. Not recommended for Atlas + trailer combo.",
    estimatedCost: 180,
    fuelEstimate: 50,
    wearAndTear: 80,
  },
];

export const CITY_METRICS: CityMetric[] = [
  { label: "Cost of living index", originValue: "119", destinationValue: "82", trend: "better" },
  { label: "Average rent (2BR)", originValue: "$1,850/mo", destinationValue: "$980/mo", trend: "better" },
  { label: "Median home price", originValue: "$485,000", destinationValue: "$165,000", trend: "better" },
  { label: "Crime index", originValue: "Moderate", destinationValue: "Low–Moderate", trend: "better" },
  { label: "Internet availability", originValue: "Fiber widely available", destinationValue: "Cable & fiber (limited)", trend: "worse" },
  { label: "Average high temp", originValue: "96°F (summer)", destinationValue: "84°F (summer)", trend: "neutral" },
  { label: "State income tax", originValue: "None (TX)", destinationValue: "3–6.5% (WV)", trend: "worse" },
  { label: "Job market growth", originValue: "+3.2% YoY", destinationValue: "+1.1% YoY", trend: "worse" },
  { label: "School rating (avg)", originValue: "B+", destinationValue: "B", trend: "neutral" },
  { label: "Hospitals per 100k", originValue: "2.8", destinationValue: "3.1", trend: "better" },
  { label: "Quality of life score", originValue: "7.4 / 10", destinationValue: "6.8 / 10", trend: "worse" },
];

export const CHECKLIST_TASKS: ChecklistTask[] = [
  { id: "1", title: "Submit lease application — Huntington apt", category: "Housing", status: "in_progress", dueDate: "2026-07-10", priority: "high" },
  { id: "2", title: "Schedule final walkthrough — Austin lease", category: "Housing", status: "pending", dueDate: "2026-09-10", priority: "high" },
  { id: "3", title: "Set up electricity at new address", category: "Utilities", status: "pending", dueDate: "2026-08-25", priority: "medium" },
  { id: "4", title: "Transfer water/sewer account", category: "Utilities", status: "pending", dueDate: "2026-08-25", priority: "medium" },
  { id: "5", title: "Update USPS forwarding address", category: "Address change", status: "completed", dueDate: "2026-06-15", priority: "high" },
  { id: "6", title: "Update driver's license (WV)", category: "Address change", status: "pending", dueDate: "2026-10-15", priority: "medium" },
  { id: "7", title: "Register vehicle in West Virginia", category: "Vehicle", status: "pending", dueDate: "2026-10-01", priority: "high" },
  { id: "8", title: "Update auto insurance policy", category: "Vehicle", status: "in_progress", dueDate: "2026-09-01", priority: "high" },
  { id: "9", title: "Enroll child in Huntington schools", category: "School", status: "in_progress", dueDate: "2026-08-01", priority: "high" },
  { id: "10", title: "Request immunization records transfer", category: "School", status: "pending", dueDate: "2026-07-25", priority: "medium" },
  { id: "11", title: "Transfer pediatrician records", category: "Medical", status: "pending", dueDate: "2026-08-15", priority: "medium" },
  { id: "12", title: "Find new family doctor in Huntington", category: "Medical", status: "pending", dueDate: "2026-09-01", priority: "medium" },
  { id: "13", title: "Update dog's vet and vaccination records", category: "Pets", status: "in_progress", dueDate: "2026-08-01", priority: "high" },
  { id: "14", title: "Research pet-friendly parks in Huntington", category: "Pets", status: "completed", dueDate: "2026-07-01", priority: "low" },
  { id: "15", title: "Gather birth certificates and passports", category: "Documents", status: "completed", dueDate: "2026-06-20", priority: "high" },
  { id: "16", title: "Organize tax documents for WV filing", category: "Documents", status: "pending", dueDate: "2026-12-31", priority: "low" },
  { id: "17", title: "Pack kitchen — non-daily items", category: "Packing", status: "pending", dueDate: "2026-08-20", priority: "medium" },
  { id: "18", title: "Label all boxes with inventory numbers", category: "Packing", status: "in_progress", dueDate: "2026-08-10", priority: "medium" },
  { id: "19", title: "Book pet-friendly hotel — Nashville", category: "Travel", status: "pending", dueDate: "2026-07-20", priority: "high" },
  { id: "20", title: "Plan 2-day driving route with stops", category: "Travel", status: "completed", dueDate: "2026-07-01", priority: "medium" },
];

export const INVENTORY_BOXES: InventoryBox[] = [
  { id: "1", boxNumber: 1, room: "Kitchen", contents: "Plates, mugs, coffee maker", hasPhoto: true },
  { id: "2", boxNumber: 2, room: "Kitchen", contents: "Pots, pans, utensils", hasPhoto: true },
  { id: "3", boxNumber: 3, room: "Living Room", contents: "Books, photo albums, decor", hasPhoto: false },
  { id: "4", boxNumber: 4, room: "Living Room", contents: "Throw pillows, blankets", hasPhoto: false },
  { id: "5", boxNumber: 5, room: "Master Bedroom", contents: "Bedsheets, comforter, pillows", hasPhoto: true },
  { id: "6", boxNumber: 6, room: "Master Bedroom", contents: "Clothing — summer items", hasPhoto: false },
  { id: "7", boxNumber: 7, room: "Child's Room", contents: "Toys, games, stuffed animals", hasPhoto: true },
  { id: "8", boxNumber: 8, room: "Child's Room", contents: "School supplies, books", hasPhoto: false },
  { id: "9", boxNumber: 9, room: "Bathroom", contents: "Toiletries, towels, medicine", hasPhoto: false },
  { id: "10", boxNumber: 10, room: "Garage", contents: "Tools, extension cords", hasPhoto: true },
  { id: "11", boxNumber: 11, room: "Garage", contents: "Camping gear, sports equipment", hasPhoto: false },
  { id: "12", boxNumber: 12, room: "Kitchen", contents: "Plates, mugs, coffee maker", hasPhoto: true },
];

export const DOCUMENTS: DocumentItem[] = [
  { id: "1", name: "Austin Lease Agreement", category: "Lease", status: "verified", uploadedAt: "2026-05-10" },
  { id: "2", name: "Huntington Rental Application", category: "Lease", status: "pending", uploadedAt: "2026-06-20" },
  { id: "3", name: "Driver's License — Raul Garcia", category: "IDs", status: "verified", uploadedAt: "2026-05-01" },
  { id: "4", name: "Passport — Raul Garcia", category: "IDs", status: "verified", uploadedAt: "2026-05-01" },
  { id: "5", name: "Renter's Insurance Policy", category: "Insurance", status: "verified", uploadedAt: "2026-05-15" },
  { id: "6", name: "Auto Insurance — VW Atlas", category: "Insurance", status: "pending", uploadedAt: "2026-06-18" },
  { id: "7", name: "Vehicle Registration — TX", category: "Vehicle registration", status: "verified", uploadedAt: "2026-04-01" },
  { id: "8", name: "Pediatric Records — Child", category: "Medical records", status: "pending" },
  { id: "9", name: "Immunization Records", category: "School documents", status: "pending" },
  { id: "10", name: "School Enrollment Forms", category: "School documents", status: "pending", uploadedAt: "2026-06-22" },
  { id: "11", name: "USCIS / Immigration Documents", category: "USCIS / immigration", status: "missing" },
  { id: "12", name: "Pet Vaccination Records", category: "Medical records", status: "verified", uploadedAt: "2026-06-01" },
];

export const MARKETPLACE_SERVICES: MarketplaceService[] = [
  { id: "1", provider: "Two Men and a Truck", category: "Movers", estimatedPrice: 890, rating: 4.6, description: "Full-service loading and unloading in Austin" },
  { id: "2", provider: "U-Haul Austin South", category: "Truck rentals", estimatedPrice: 420, rating: 4.2, description: "6x12 trailer, unlimited miles" },
  { id: "3", provider: "PODS Storage", category: "Storage", estimatedPrice: 199, rating: 4.4, description: "Portable container, monthly rental" },
  { id: "4", provider: "Xfinity Huntington", category: "Internet providers", estimatedPrice: 65, rating: 4.1, description: "300 Mbps fiber-ready plan" },
  { id: "5", provider: "State Farm", category: "Insurance", estimatedPrice: 145, rating: 4.5, description: "Bundled auto + renter's insurance" },
  { id: "6", provider: "Molly Maid Austin", category: "Cleaning", estimatedPrice: 220, rating: 4.7, description: "Deep clean before move-out" },
  { id: "7", provider: "Handy", category: "Handyman", estimatedPrice: 85, rating: 4.3, description: "Furniture disassembly and mounting" },
  { id: "8", provider: "Rover Pet Boarding", category: "Pet boarding", estimatedPrice: 45, rating: 4.8, description: "Overnight pet care during move" },
  { id: "9", provider: "La Quinta Nashville", category: "Hotels", estimatedPrice: 129, rating: 4.4, description: "Pet-friendly, free trailer parking" },
  { id: "10", provider: "Budget Truck Rental", category: "Truck rentals", estimatedPrice: 780, rating: 4.0, description: "16 ft truck with loading ramp" },
];

export const AI_QUICK_QUESTIONS: AIQuickQuestion[] = [
  {
    id: "1",
    question: "What should I do next?",
    response:
      "Your top priority is reserving a U-Haul 6x12 trailer for your September 15 move — availability is tightening. Next, book a pet-friendly hotel in Nashville for your overnight stop, and submit your child's school enrollment forms by August 1.",
  },
  {
    id: "2",
    question: "How can I save money?",
    response:
      "Use your VW Atlas with a 6x12 trailer instead of renting a full truck — estimated savings of ~$480. Pack your own boxes (you've already spent $92 vs. $185 budget). Book hotels early for best pet-friendly rates. Skip professional movers — enlist 2 friends for loading day.",
  },
  {
    id: "3",
    question: "Should I rent a truck or trailer?",
    response:
      "For your situation — 2 adults, 1 child, 1 dog, with a 2019 VW Atlas — a 6x12 trailer is the best option. Your Atlas can tow 5,000 lbs, and a loaded 6x12 trailer (~2,200 lbs) is well within limits. It's ~$480 cheaper than a 15 ft truck and easier to maneuver on a 2-day drive.",
  },
  {
    id: "4",
    question: "What documents do I need before moving?",
    response:
      "Priority documents: updated renter's insurance for Huntington, vehicle registration transfer to WV (within 30 days), school enrollment forms with immunization records, and pet vaccination records. Your USCIS/immigration documents are flagged as missing — upload these if applicable.",
  },
];
