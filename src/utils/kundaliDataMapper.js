// Data mapper to transform API response to component-expected format
export const mapKundaliData = (apiResponse) => {
  if (!apiResponse?.data?.astrology) return null;
  
  const { astrology } = apiResponse.data;
  
  return {
    birthDetails: astrology.birthDetails,
    astroDetails: astrology.astroDetails,
    planets: astrology.planets || [],
    planetsExtended: astrology.planetsExtended || [],
    birthChart: astrology.birthChart,
    birthExtendedChart: astrology.birthExtendedChart
  };
};