/**
 * Centralized Environment Configuration
 * This file acts as the single source of truth for all environment variables,
 * providing defaults and ensuring consistent naming across the DApp.
 */

const env = {
  APP_TITLE: import.meta.env.VITE_APP_TITLE || 'ColdChain Ledger',
  BLOCKCHAIN_GENESIS_MSG: import.meta.env.VITE_BLOCKCHAIN_GENESIS_MSG || 'Pharmaceutical Cold Chain Genesis Block',
  
  // Default Actor IDs
  DEFAULT_PRODUCER_ID: import.meta.env.VITE_DEFAULT_PRODUCER_ID || 'PRODUCER_001',
  DEFAULT_CARRIER_ID: import.meta.env.VITE_DEFAULT_CARRIER_ID || 'CARRIER_LOGISTICS_X',
  DEFAULT_WAREHOUSE_ID: import.meta.env.VITE_DEFAULT_WAREHOUSE_ID || 'WAREHOUSE_HUB_01',
  DEFAULT_DEALER_ID: import.meta.env.VITE_DEFAULT_DEALER_ID || 'DEALER_CHENNAI_MAIN',

  // IoT & Temperature Constraints
  TEMP_MIN: parseFloat(import.meta.env.VITE_TEMP_MIN || '2.0'),
  TEMP_MAX: parseFloat(import.meta.env.VITE_TEMP_MAX || '8.0'),
  ANOMALY_THRESHOLD: parseFloat(import.meta.env.VITE_ANOMALY_THRESHOLD || '10.0'),

  IOT_SENSORS: {
    ALPHA: 'GATEWAY-ALPHA',
    BETA: 'GATEWAY-BETA',
    GAMMA: 'GATEWAY-GAMMA'
  },

  // Shipment Status Constants
  STATUS: {
    GENESIS: 'Manufactured & Ready',
    PICKUP: 'Picked Up',
    IN_TRANSIT: 'In-Transit',
    WAREHOUSE_DELIVERY: 'Delivered to Warehouse',
    WAREHOUSE_STORED: 'Stored at Hub',
    DISPATCHED: 'Dispatched to Dealer',
    DEALER_ACCEPTED: 'Accepted by Dealer',
    DEALER_REJECTED: 'REJECTED BY DEALER',
    CUSTOMS_VERIFIED: 'Customs Cleared & Verified',
    FRAUD_CONFIRMED: 'CONFIRMED FRAUD',
    FRAUD_DISMISSED: 'INVESTIGATED: SECURE'
  },

  // Document Types
  DOC_TYPES: {
    COA: 'Certificate of Analysis',
    INVOICE: 'Invoice',
    PACKING_LIST: 'Packing List',
    CHALLAN: 'Delivery Challan',
    TEMP_LOG: 'Temperature Log',
    HANDLING: 'Handling Instructions',
    BATCH_LOT: 'Batch/Lot Record',
    POD: 'Proof of Delivery'
  },

  // Handling Guides
  HANDLING_GUIDES: {
    'Injection / Vaccine': 'Keep upright. Avoid direct sunlight. Do not freeze.',
    'Tablet': 'Store in a cool, dry place. Keep out of reach of children.',
    'Liquid Oral': 'Shake well before use. Store below 25°C.',
    'Ophthalmic Solution': 'Discard 28 days after opening. Do not touch dropper tip.'
  },

  // Patient Info
  PATIENT_INFO: {
    'Epinephrine Injection': 'Emergency treatment for allergic reactions. Administer in the outer thigh.',
    'Insulin': 'Used to control blood sugar. Check dosage carefully.',
    'COVID-19 Vaccine': 'Store at ultracold temperatures if required. Use immediately after dilution.'
  },

  // Roles
  ROLES: {
    PRODUCER: 'PRODUCER',
    CARRIER: 'CARRIER',
    WAREHOUSE: 'WAREHOUSE',
    CUSTOMS: 'CUSTOMS_BROKER',
    DEALER: 'DEALER',
    CONSUMER: 'END_USER'
  },

  // Default Product Values
  DEFAULT_STORAGE_COND: '2-8°C',

  // Security
  OTP_BYPASS_CODE: import.meta.env.VITE_OTP_BYPASS_CODE || '1234',

  // Storage
  STORAGE_KEY: 'cold_chain_ledger',

  // UI
  IS_DEV: import.meta.env.DEV,
  MODE: import.meta.env.MODE
};

export default env;
