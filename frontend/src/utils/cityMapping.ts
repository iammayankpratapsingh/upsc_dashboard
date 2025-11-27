export interface CityInfo {
  name: string;
  code: string;
}

export const examCenters: CityInfo[] = [
  { name: "Agartala", code: "45" },
  { name: "Agra", code: "79" },
  { name: "Ahmedabad", code: "01" },
  { name: "Aizawl", code: "47" },
  { name: "Ajmer", code: "71" },
  { name: "Aligarh", code: "21" },
  { name: "Almora", code: "85" },
  { name: "Ananthapuru", code: "76" },
  { name: "Bareilly", code: "54" },
  { name: "Bengaluru", code: "03" },
  { name: "Bhopal", code: "04" },
  { name: "Bilaspur", code: "77" },
  { name: "Chandigarh", code: "35" },
  { name: "Chennai", code: "12" },
  { name: "Chhatrapati Sambhajinagar", code: "38" },
  { name: "Coimbatore", code: "56" },
  { name: "Cuttack", code: "07" },
  { name: "Dehradun", code: "14" },
  { name: "Delhi", code: "08" },
  { name: "Dharamshala", code: "88" },
  { name: "Dharwad", code: "39" },
  { name: "Dispur", code: "09" },
  { name: "Faridabad", code: "64" },
  { name: "Gangtok", code: "42" },
  { name: "Gautam Budh Nagar", code: "58" },
  { name: "Gaya", code: "80" },
  { name: "Ghaziabad", code: "59" },
  { name: "Gorakhpur", code: "60" },
  { name: "Gurugram", code: "63" },
  { name: "Gwalior", code: "69" },
  { name: "Hanumakonda (Warangal Urban)", code: "82" },
  { name: "Hyderabad", code: "10" },
  { name: "Imphal", code: "44" },
  { name: "Indore", code: "78" },
  { name: "Itanagar", code: "48" },
  { name: "Jabalpur", code: "68" },
  { name: "Jaipur", code: "11" },
  { name: "Jammu", code: "34" },
  { name: "Jodhpur", code: "22" },
  { name: "Jorhat", code: "46" },
  { name: "Kochi", code: "24" },
  { name: "Kohima", code: "43" },
  { name: "Kolkata", code: "06" },
  { name: "Kozhikode", code: "57" },
  { name: "Lucknow", code: "26" },
  { name: "Ludhiana", code: "70" },
  { name: "Madurai", code: "40" },
  { name: "Mandi", code: "89" },
  { name: "Mumbai", code: "05" },
  { name: "Mysuru", code: "73" },
  { name: "Nagpur", code: "13" },
  { name: "Nashik", code: "86" },
  { name: "Navi Mumbai", code: "65" },
  { name: "Panaji (Goa)", code: "36" },
  { name: "Patna", code: "15" },
  { name: "Port Blair", code: "37" },
  { name: "Prayagraj", code: "02" },
  { name: "Puducherry", code: "20" },
  { name: "Pune", code: "66" },
  { name: "Raipur", code: "49" },
  { name: "Rajkot", code: "72" },
  { name: "Ranchi", code: "41" },
  { name: "Sambalpur", code: "53" },
  { name: "Shillong", code: "16" },
  { name: "Shimla", code: "17" },
  { name: "Siliguri", code: "81" },
  { name: "Srinagar", code: "18" },
  { name: "Srinagar (Uttarakhand)", code: "84" },
  { name: "Surat", code: "87" },
  { name: "Thane", code: "67" },
  { name: "Thiruvananthapuram", code: "19" },
  { name: "Tiruchirapalli", code: "75" },
  { name: "Tirupati", code: "50" },
  { name: "Udaipur", code: "52" },
  { name: "Varanasi", code: "61" },
  { name: "Vellore", code: "74" },
  { name: "Vijayawada", code: "62" },
  { name: "Vishakhapatnam", code: "51" }
];

// Create a map from centre code to city info
export const codeToCityMap = new Map<string, CityInfo>();
examCenters.forEach((city) => {
  codeToCityMap.set(city.code, city);
});

// Format city display: "City Name (Code)"
export const formatCityDisplay = (code: string): string => {
  if (!code || code.toLowerCase().startsWith('all')) {
    return code;
  }
  const city = codeToCityMap.get(code);
  return city ? `${city.name} (${city.code})` : code;
};

// Extract centre code from display format "City Name (Code)" or just code
export const extractCentreCode = (displayValue: string): string => {
  if (!displayValue || displayValue.toLowerCase().startsWith('all')) {
    return displayValue;
  }
  // If format is "City Name (Code)", extract the code
  const match = displayValue.match(/\((\d+)\)$/);
  if (match) {
    return match[1];
  }
  // Otherwise, assume it's already a code
  return displayValue;
};

// Get city name from code
export const getCityName = (code: string): string => {
  if (!code || code.toLowerCase().startsWith('all')) {
    return code;
  }
  const city = codeToCityMap.get(code);
  return city ? city.name : code;
};

