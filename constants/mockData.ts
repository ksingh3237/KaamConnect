// KaamConnect Mock Data
// Chandigarh, Mohali & Panchkula (Tricity)

export interface TradeCategory {
  id: string;
  title: string;
  hindi: string;
  punjabi: string;
  iconName: string;
  baseFee: string;
  color: string;
  bgColor: string;
  examples: string;
}

export const SERVICE_CATEGORIES: TradeCategory[] = [
  {
    id: 'electrician',
    title: 'Electrician',
    hindi: 'विद्युत कारीगर',
    punjabi: 'ਬਿਜਲੀ ਮਿਸਤਰੀ',
    iconName: 'Zap',
    baseFee: '₹200',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    examples: 'Short Circuit, Fan, MCB Trip, Switchboards'
  },
  {
    id: 'plumber',
    title: 'Plumber',
    hindi: 'प्लंबर / नलसाज',
    punjabi: 'ਪਲੰਬਰ',
    iconName: 'Droplet',
    baseFee: '₹200',
    color: '#0284C7',
    bgColor: '#E0F2FE',
    examples: 'Pipe Leakage, Tap, Geyser, Motor, Tank'
  },
  {
    id: 'ac_repair',
    title: 'AC & Cooling',
    hindi: 'एसी रिपेयर',
    punjabi: 'ਏਸੀ ਰਿਪੇਅਰ',
    iconName: 'Wind',
    baseFee: '₹299',
    color: '#00B074',
    bgColor: '#D1FAE5',
    examples: 'Gas Refill, Service, PCB, Installation'
  },
  {
    id: 'carpenter',
    title: 'Carpenter',
    hindi: 'बढ़ई / लकड़ी काम',
    punjabi: 'ਤਰਖਾਣ',
    iconName: 'Hammer',
    baseFee: '₹250',
    color: '#B45309',
    bgColor: '#FDE68A',
    examples: 'Door locks, Hinges, Modular kitchen, Furniture'
  },
  {
    id: 'painter',
    title: 'Painter & Polish',
    hindi: 'पेंटर व पुट्टी',
    punjabi: 'ਪੇਂਟਰ',
    iconName: 'Paintbrush',
    baseFee: '₹300',
    color: '#8B5CF6',
    bgColor: '#EDE9FE',
    examples: 'Touchup, Waterproofing, Wall texture'
  },
  {
    id: 'cleaner',
    title: 'Deep Cleaning',
    hindi: 'सफाई सेवा',
    punjabi: 'ਸਫ਼ਾਈ ਸੇਵਾ',
    iconName: 'Sparkles',
    baseFee: '₹350',
    color: '#EC4899',
    bgColor: '#FCE7F3',
    examples: 'Kitchen, Bathroom, Sofa, Water tank'
  },
  {
    id: 'appliance',
    title: 'Appliances',
    hindi: 'उपकरण रिपेयर',
    punjabi: 'ਘਰੇਲੂ ਉਪਕਰਣ',
    iconName: 'Tv',
    baseFee: '₹250',
    color: '#6366F1',
    bgColor: '#EEF2FF',
    examples: 'Washing Machine, RO Water, Microwave, Fridge'
  },
  {
    id: 'car_wash',
    title: 'Car & Bike Wash',
    hindi: 'वाहन धुलाई',
    punjabi: 'ਵਾਹਨ ਸਫ਼ਾਈ',
    iconName: 'Truck',
    baseFee: '₹199',
    color: '#0D9488',
    bgColor: '#CCFBF1',
    examples: 'Doorstep Foam Wash, Interior Detailing'
  }
];

export interface WorkerProfile {
  id: string;
  name: string;
  trade: string;
  tradeId: string;
  sector: string;
  distance: string;
  rating: number;
  reviewsCount: number;
  visitingFee: number;
  etaMinutes: number;
  badge: string;
  experience: string;
  phone: string;
  vehicle: string;
  skills: string[];
  avatar: string;
}

export const VERIFIED_WORKERS: WorkerProfile[] = [
  {
    id: 'w1',
    name: 'Rajesh Kumar',
    trade: 'Master Electrician',
    tradeId: 'electrician',
    sector: 'Sector 22-B, Chandigarh',
    distance: '0.9 km away',
    rating: 4.9,
    reviewsCount: 420,
    visitingFee: 200,
    etaMinutes: 12,
    badge: 'Aadhaar & Police Verified',
    experience: '9 Yrs in Tricity',
    phone: '+91 98721 04321',
    vehicle: 'Hero Splendor (CH 01 BG 4590)',
    skills: ['Short Circuit', 'MCB Trip', 'Inverter Wiring', 'Geyser', 'Ceiling Fan'],
    avatar: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'w2',
    name: 'Gurpreet Singh',
    trade: 'Expert Plumber & Sanitation',
    tradeId: 'plumber',
    sector: 'Phase 7, Mohali',
    distance: '1.4 km away',
    rating: 4.8,
    reviewsCount: 312,
    visitingFee: 250,
    etaMinutes: 18,
    badge: 'Govt Certified Pro',
    experience: '12 Yrs in Tricity',
    phone: '+91 98144 88321',
    vehicle: 'Bajaj Pulsar (PB 65 AB 7812)',
    skills: ['Water Leakage', 'Motor Pump', 'Flush Tank', 'Taps', 'RO Fitting'],
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'w3',
    name: 'Amit Sharma',
    trade: 'HVAC & Split AC Specialist',
    tradeId: 'ac_repair',
    sector: 'Sector 35-C, Chandigarh',
    distance: '1.8 km away',
    rating: 4.9,
    reviewsCount: 285,
    visitingFee: 299,
    etaMinutes: 20,
    badge: 'Urban Company Alum Pro',
    experience: '7 Yrs Experience',
    phone: '+91 99882 12345',
    vehicle: 'Honda Activa (CH 01 DA 3321)',
    skills: ['Jet Pump Service', 'Gas Top-up R32/R410', 'PCB Diagnostic'],
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
  }
];

export interface CustomerLead {
  id: string;
  title: string;
  category: string;
  customer: string;
  sector: string;
  distance: string;
  urgency: string;
  budget: string;
  postedAgo: string;
  hasAudio: boolean;
  notes: string;
  bidsCount: number;
}

export const WORKER_ACTIVE_LEADS: CustomerLead[] = [
  {
    id: 'lead-101',
    title: 'Urgent: Kitchen Sink Pipe Burst & Continuous Flow',
    category: 'Plumbing',
    customer: 'Mrs. Sunita Sharma',
    sector: 'Sector 22-B, Chandigarh',
    distance: '0.8 km away',
    urgency: 'Immediate (Within 30 mins)',
    budget: '₹250 - ₹350 Visiting',
    postedAgo: '4 mins ago',
    hasAudio: true,
    notes: 'Under-sink PVC pipe cracked, need emergency replacement before water fills the wooden cabinet.',
    bidsCount: 2
  },
  {
    id: 'lead-102',
    title: 'Main AC MCB Trip & Burnt Smell from Switchboard',
    category: 'Electrician',
    customer: 'Harpreet Dhillon',
    sector: 'Phase 3B2, Mohali',
    distance: '1.2 km away',
    urgency: 'Within 1 Hour',
    budget: '₹200 - ₹300 Visiting',
    postedAgo: '11 mins ago',
    hasAudio: false,
    notes: 'Split AC stopped working and power board in master bedroom is hot to touch.',
    bidsCount: 4
  }
];

export const TRICITY_SECTORS = [
  { city: 'Chandigarh', items: ['Sector 17', 'Sector 22', 'Sector 35', 'Sector 43', 'Sector 15'] },
  { city: 'Mohali', items: ['Phase 7', 'Phase 3B2', 'Phase 5', 'Sector 70'] },
  { city: 'Panchkula', items: ['Sector 11', 'Sector 20', 'Sector 5', 'MDC Sector 4'] }
];
