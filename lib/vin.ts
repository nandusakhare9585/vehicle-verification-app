// Basic VIN validation. A VIN is 17 chars, excludes I/O/Q.
export function isValidVin(vin: string): boolean {
  return /^[A-HJ-NPR-Z0-9]{17}$/i.test(vin.trim());
}

// A few real, valid sample VINs to try in the demo.
export const SAMPLE_VINS: { vin: string; label: string }[] = [
  { vin: "1HGCM82633A004352", label: "2003 Honda Accord" },
  { vin: "JTDKB20U893052096", label: "2009 Toyota Prius" },
  { vin: "5UXWX7C5*BA", label: "(invalid — for testing)" },
  { vin: "1FTFW1ET5DFC10312", label: "2013 Ford F-150" },
  { vin: "WBA3A5C50CF256920", label: "2012 BMW 328i" },
];
