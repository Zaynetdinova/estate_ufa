export interface ParsedProperty {
  name:        string;
  slug:        string;
  district:    string;
  address?:    string;
  priceFrom:   number;
  priceTo?:    number;
  priceM2?:    number;
  floors?:     number;
  areaMin?:    number;
  areaMax?:    number;
  deadlineQ?:  number;
  deadlineYear?: number;
  status:      'building' | 'ready';
  description?: string;
  developerName?: string;
  imageUrls:   string[];
  sourceUrl:   string;
}

export interface ParseResult {
  parsed:  number;
  created: number;
  updated: number;
  errors:  string[];
  durationMs: number;
}
