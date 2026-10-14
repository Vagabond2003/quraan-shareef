const AR = "٠١٢٣٤٥٦٧٨٩";
const BN = "০১২৩৪৫৬৭৮৯";

export const arNum = (n: number) => String(n).replace(/\d/g, (d) => AR[+d]);
export const bnNum = (n: number) => String(n).replace(/\d/g, (d) => BN[+d]);

/** Turns Bengali and Arabic-Indic digits into Latin ones so input like "২:২৫৫" parses. */
export const latinDigits = (s: string) =>
  s.replace(/[০-৯]/g, (d) => String(BN.indexOf(d))).replace(/[٠-٩]/g, (d) => String(AR.indexOf(d)));
