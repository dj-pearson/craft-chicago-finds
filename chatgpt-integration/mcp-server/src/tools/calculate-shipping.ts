/**
 * Shipping calculation tool for ChatGPT integration
 * Calculates shipping costs before checkout
 */

export const calculateShippingTool = {
  name: "calculate_shipping",
  description: "Calculate shipping costs for items based on destination address. Use this before checkout to inform users of shipping costs.",
  input_schema: {
    type: "object",
    properties: {
      items: {
        type: "array",
        description: "Array of items with quantities",
        items: {
          type: "object",
          properties: {
            listing_id: { type: "string" },
            quantity: { type: "number" }
          },
          required: ["listing_id", "quantity"]
        }
      },
      destination: {
        type: "object",
        description: "Shipping destination",
        properties: {
          city: { type: "string" },
          state: { type: "string", description: "2-letter state code" },
          zip: { type: "string" },
          country: { type: "string", default: "US" }
        },
        required: ["state"]
      }
    },
    required: ["items", "destination"]
  },
  
  async execute(args: any) {
    const itemCount = args.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
    
    // Simple shipping calculation
    const baseRate = 5.99;
    const perItemRate = 2.00;
    const shipping = baseRate + (Math.max(0, itemCount - 1) * perItemRate);
    
    // Estimate delivery time based on state
    const isLocal = args.destination.state === 'IL'; // Assuming platform is IL-based
    const estimatedDays = isLocal ? '2-3' : '5-7';
    
    return {
      shipping_cost: `$${shipping.toFixed(2)}`,
      estimated_delivery: `${estimatedDays} business days`,
      breakdown: {
        base_rate: `$${baseRate.toFixed(2)}`,
        additional_items: `$${((itemCount - 1) * perItemRate).toFixed(2)}`,
        total_items: itemCount
      },
      free_shipping_threshold: "$75.00",
      note: itemCount > 1 ? `Additional items add $${perItemRate.toFixed(2)} each` : "Free shipping on orders over $75"
    };
  }
};
