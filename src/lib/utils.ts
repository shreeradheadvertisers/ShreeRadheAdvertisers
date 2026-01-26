import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * NEW: Formats a Cloudinary URL to request optimized, pre-generated versions.
 * @param url The original secure_url from the database
 * @param type 'thumbnail' (for grids) or 'full' (for details/lightbox)
 */
export function getOptimizedImage(url: string | undefined, type: 'thumbnail' | 'full' = 'thumbnail') {
  if (!url) return "";
  if (!url.includes('cloudinary.com')) return url;

  // thumbnail: requests the 800x600 pre-generated eager version
  if (type === 'thumbnail') {
    return url.replace('/upload/', '/upload/f_auto,q_auto,w_800,c_fill,g_auto/');
  }

  // full: requests a high-quality 1600px version
  return url.replace('/upload/', '/upload/f_auto,q_auto,w_1600/');
}

/**
 * Formats a number in Indian rupee style (lakhs, crores)
 * Example: 1234567 -> "12,34,567"
 */
export function formatIndianRupee(amount: number): string {
  if (amount === 0) return "0";
  
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  const [integerPart, decimalPart] = absAmount.toString().split(".");
  
  let result = "";
  const len = integerPart.length;
  
  if (len <= 3) {
    result = integerPart;
  } else {
    result = integerPart.slice(-3);
    let remaining = integerPart.slice(0, -3);
    
    while (remaining.length > 2) {
      result = remaining.slice(-2) + "," + result;
      remaining = remaining.slice(0, -2);
    }
    
    if (remaining.length > 0) {
      result = remaining + "," + result;
    }
  }
  
  if (decimalPart) {
    result += "." + decimalPart.slice(0, 2); // Limit to 2 decimal places
  }
  
  return (isNegative ? "-" : "") + result;
}

/**
 * Formats amount with ₹ symbol in Indian style
 */
export function formatRupee(amount: number): string {
  return `₹${formatIndianRupee(amount)}`;
}

/**
 * Generates the custom Booking ID (SRA/AY/XXXX)
 * @param booking The booking object
 * @param index The index in the list (for sequence)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const generateBookingId = (booking: any, index: number) => {
  if (!booking) return "N/A";
  const dateSource = booking.startDate || booking.createdAt;
  let ay = "0000";
  if (dateSource) {
      const d = new Date(dateSource);
      if (!isNaN(d.getTime())) {
          const year = d.getFullYear();
          const month = d.getMonth();
          let startYear, endYear;
          if (month < 3) {
             startYear = year - 1;
             endYear = year;
          } else {
             startYear = year;
             endYear = year + 1;
          }
          ay = `${String(startYear).slice(-2)}${String(endYear).slice(-2)}`;
      }
  }
  // If we don't have a reliable index, we fallback to last 4 chars of ID or random
  const sequence = index >= 0 ? 1000 + index + 1 : (booking._id ? booking._id.slice(-4) : "0000");
  return `SRA/${ay}/${sequence}`;
};