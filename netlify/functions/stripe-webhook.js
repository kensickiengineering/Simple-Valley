// NEW HELPER FUNCTION FOR SHIPPO
async function createShippingLabel(name, address) {
  const SHIPPO_API_KEY = process.env.SHIPPO_API_KEY; // Your new key from Netlify env

  // 1. Define the from, to, and parcel details
  const shipmentDetails = {
    address_from: {
        name: 'SIMPLE VALLEY',
        street1: 'Your Street',
        city: 'Your City',
        state: 'MA',
        zip: 'Your ZIP',
        country: 'US',
    },
    address_to: {
        name: name,
        street1: address.street1,
        street2: address.street2,
        city: address.city,
        state: address.state,
        zip: address.zip,
        country: 'US',
    },
    parcels: [{
        length: "8",
        width: "6",
        height: "1",
        distance_unit: "in",
        weight: "12", // Adjust to your packed weight
        mass_unit: "oz"
    }],
    async: false // Set to false to get rates immediately
  };

  // 2. Create a Shipment object to get available rates
  const shipmentResponse = await axios.post('https://api.goshippo.com/shipments/', shipmentDetails, {
    headers: { 'Authorization': `ShippoToken ${SHIPPO_API_KEY}` }
  });

  // 3. Find the cheapest USPS Ground Advantage rate from the list
  const rates = shipmentResponse.data.rates;
  const cheapestRate = rates.find(rate => rate.provider === 'USPS' && rate.servicelevel.token === 'usps_ground_advantage');

  if (!cheapestRate) {
    throw new Error("Could not find a valid USPS Ground Advantage rate.");
  }
  
  // 4. Create a Transaction to purchase the label using the rate object_id
  const transactionResponse = await axios.post('https://api.goshippo.com/transactions/', {
    rate: cheapestRate.object_id,
    label_file_type: "PDF_4x6",
    async: false
  }, {
    headers: { 'Authorization': `ShippoToken ${SHIPPO_API_KEY}` }
  });

  // 5. Return the tracking number from the successful transaction
  console.log('Label created! URL:', transactionResponse.data.label_url);
  return transactionResponse.data.tracking_number;
}