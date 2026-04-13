export interface PinoutDetail {
  pin_number: number;
  cable_color: string;
  function_desc: string;
  standard_voltage: string;
}

export interface Schematic {
  id: string;
  brand: string; // <-- INI BARU: Untuk Filter Merek
  motorcycle_name: string;
  component_name: string;
  image_urls: string[];
  pinouts: PinoutDetail[];
  technical_notes?: string;
  created_at?: string;
}

export interface TroubleshootingCase {
  id: string;
  case_title: string;
  icon_class: string;
  symptoms: string[];
  diagnosis_steps: string[];
  initial_action: string;
  prevention: string;
  image_urls: string[];
  created_at?: string;
}

export interface ModificationPost {
  id: string;
  title: string;
  content: string;
  image_urls: string[];
  created_at: string;
}
