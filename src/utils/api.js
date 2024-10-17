mport axios from 'axios';

export async function getVesselData(vesselName, year) {
  try {
    const response = await axios.get('/.netlify/functions/getVesselData', {
      params: { vesselName, year }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching vessel data:', error);
    throw error;
  }
}
