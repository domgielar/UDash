
import express from 'express';
import cors from 'cors';
import * as cheerio from "cheerio";

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration for production
const allowedOrigins = [
  'http://localhost:3000', // Local development
  'http://localhost:3001', // Local development
  'http://localhost:3002', // Local development
  'http://localhost:3003', // Local development
  'http://localhost:3004', // Local development
  'http://localhost:3005', // Local development
  'http://localhost:3006', // Local development
  'http://localhost:3007', // Local development
  'http://localhost:3008', // Local development
  'http://localhost:3009', // Local development
  // Add your Render frontend URL here (replace with your actual frontend URL)
  'https://your-udash-frontend.onrender.com',
];

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// Helper function to infer category from item name
const inferCategory = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('wrap')) return 'Wrap';
    if (lowerName.includes('salad')) return 'Salad';
    if (lowerName.includes('bowl')) return 'Bowl';
    if (lowerName.includes('sandwich') || lowerName.includes('grinder')) return 'Sandwich';
    if (lowerName.includes('sushi')) return 'Sushi';
    if (lowerName.includes('parfait')) return 'Snack';
    return 'Misc';
};

// Helper to get realistic price based on item category (UMass grab-n-go pricing)
// Small items (snacks, drinks, sides): $0.99–$1.99
// Medium (soups, pastries, desserts): $2.49–$3.49
// Full entrées / bowls / meals: $3.99–$4.49
const getPriceByCategory = (category) => {
    if (!category) return 1.00;
    
    const categoryStr = category.toLowerCase();
    
    // Full meals ($3.99-$4.49)
    const fullMealKeywords = ['entree', 'grill', 'pasta', 'international', 'bowl', 'wrap', 'sandwich', 'sushi', 'fajita', 'chicken', 'beef', 'pork', 'fish', 'seafood'];
    if (fullMealKeywords.some(keyword => categoryStr.includes(keyword))) {
        return 1.00;
    }
    
    // Medium items ($2.49-$3.49)
    const mediumKeywords = ['salad', 'soup', 'snack', 'pastry', 'dessert', 'muffin', 'cookie', 'brownie', 'cake'];
    if (mediumKeywords.some(keyword => categoryStr.includes(keyword))) {
        return 0.50;
    }
    
    // Small items ($0.99-$1.99)
    const smallKeywords = ['beverage', 'drink', 'juice', 'coffee', 'tea', 'milk', 'water', 'starch', 'vegetable', 'side', 'sauce', 'condiment', 'fruit'];
    if (smallKeywords.some(keyword => categoryStr.includes(keyword))) {
        return 0.25;
    }
    
    // Default: Medium price
    return 0.50;
};

// Calculate complexity weight for delivery fee (used in calculate-delivery-fee endpoint)
const getComplexityWeight = (price) => {
    if (price < 2) return 0.00;      // Small items: no weight
    if (price < 4) return 0.10;      // Medium items: +$0.10
    return 0.25;                      // Full meals: +$0.25
};

// The scraping endpoint - now handles real menu pages
app.get('/grabngo-menu', async (req, res) => {
    let { date: initialDate } = req.query;
    if (!initialDate || !/^\d{4}-\d{2}-\d{2}$/.test(initialDate)) {
        return res.status(400).json({ error: 'A valid date query parameter (YYYY-MM-DD) is required.' });
    }

    try {
        console.log(`Scraping requested for date: ${initialDate}`);
        
        // Parse the date and check if it's a weekend
        let currentDate = new Date(initialDate + 'T12:00:00Z');
        const dayOfWeek = currentDate.getUTCDay(); // 0 = Sunday, 6 = Saturday
        
        // If weekend, skip to next Monday
        if (dayOfWeek === 6) { // Saturday
            currentDate.setUTCDate(currentDate.getUTCDate() + 2);
            console.log(`Original date was Saturday, moving to Monday`);
        } else if (dayOfWeek === 0) { // Sunday
            currentDate.setUTCDate(currentDate.getUTCDate() + 1);
            console.log(`Original date was Sunday, moving to Monday`);
        }
        
        const requestedDate = currentDate.toISOString().split('T')[0];
        console.log(`Scraping for date: ${requestedDate}`);
        
        // Define ALL dining locations to scrape (all dining commons and grab-n-go)
        const diningHalls = [
            { name: 'Berkshire DC', slug: 'berkshire' },
            { name: 'Worcester DC', slug: 'worcester' },
            { name: 'Franklin DC', slug: 'franklin' },
            { name: 'Hampshire DC', slug: 'hampshire' },
            { name: 'Berkshire Grab \'N Go', slug: 'berkshire-grab-n-go-menu', isGrabNGo: true },
            { name: 'Worcester Grab \'N Go', slug: 'worcester-grab-n-go', isGrabNGo: true },
            { name: 'Franklin Grab \'N Go', slug: 'franklin-grab-n-go', isGrabNGo: true },
            { name: 'Hampshire Grab \'N Go', slug: 'hampshire-grab-n-go', isGrabNGo: true },
        ];

        const allLocations = [];

        for (const hall of diningHalls) {
            // Build appropriate URL based on location type
            const menuUrl = hall.isGrabNGo 
                ? `https://umassdining.com/menu/${hall.slug}`
                : `https://umassdining.com/locations-menus/${hall.slug}/menu`;
            console.log(`Fetching: ${menuUrl}`);
            
            try {
                const response = await fetch(menuUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (compatible; UMass-Dining-Scraper/1.0)'
                    }
                });
                
                if (!response.ok) {
                    console.warn(`HTTP ${response.status} for ${menuUrl}`);
                    continue;
                }

                const html = await response.text();
                const $ = cheerio.load(html);

                let currentCategory = 'Entrees';
                let currentMealPeriod = 'Lunch'; // Track if it's Lunch or Dinner
                
                // Parse lunch and dinner sections separately
                const lunchSection = $('#lunch_menu');
                const dinnerSection = $('#dinner_menu');
                
                // Helper function to extract items from a section
                const extractItemsFromSection = (section, mealPeriod) => {
                    const sectionItems = [];
                    let sectionCategory = 'Entrees';
                    
                    section.find('h2.menu_category_name, li.lightbox-nutrition').each((i, el) => {
                        if ($(el).is('h2')) {
                            sectionCategory = $(el).text().trim() || 'Entrees';
                        } else if ($(el).is('li')) {
                            const link = $(el).find('a');
                            const dishName = link.attr('data-dish-name');
                            const calories = link.attr('data-calories');
                            
                            if (dishName && dishName.trim()) {
                                sectionItems.push({
                                    name: dishName.trim(),
                                    description: '',
                                    category: sectionCategory,
                                    mealPeriod: mealPeriod,
                                    price: getPriceByCategory(sectionCategory),
                                    calories: calories || 'N/A',
                                    image: `https://picsum.photos/seed/${dishName.replace(/\s+/g, '-')}/400`
                                });
                            }
                        }
                    });
                    return sectionItems;
                };
                
                // Extract lunch items
                const lunchItems = extractItemsFromSection(lunchSection.length > 0 ? lunchSection : $('body'), 'Lunch');
                // Extract dinner items
                const dinnerItems = extractItemsFromSection(dinnerSection.length > 0 ? dinnerSection : $('body'), 'Dinner');
                
                const items = [...lunchItems, ...dinnerItems];

                if (items.length > 0) {
                    allLocations.push({
                        name: hall.name,
                        items: items
                    });
                    console.log(`Found ${items.length} items for ${hall.name}`);
                } else {
                    console.log(`No items found for ${hall.name} - this may indicate a scraping issue`);
                }
            } catch (error) {
                console.error(`Error scraping ${hall.name}: ${error.message}`);
                continue;
            }
        }

        if (allLocations.length > 0) {
            res.json({
                date: requestedDate,
                locations: allLocations,
                isFutureMenu: requestedDate !== initialDate, // True if we had to skip to a different date
                source: 'scraped'
            });
        } else {
            console.log('Scraping failed or no items found. Using mock data as fallback.');
            
            // Fallback to mock data
            const mockLocations = diningHalls.map(hall => ({
                name: hall.name,
                items: [
                    { name: 'Grilled Chicken Breast', category: 'Grill Station', price: 8.99, image: 'https://picsum.photos/seed/chicken/400' },
                    { name: 'Vegetable Stir Fry', category: 'International', price: 9.49, image: 'https://picsum.photos/seed/stirfry/400' },
                    { name: 'Baked Ziti', category: 'Pasta Bar', price: 8.49, image: 'https://picsum.photos/seed/ziti/400' },
                    { name: 'Roasted Sweet Potato', category: 'Starches', price: 3.99, image: 'https://picsum.photos/seed/potato/400' },
                    { name: 'Caesar Salad', category: 'Salad Bar', price: 6.99, image: 'https://picsum.photos/seed/salad/400' },
                ]
            }));

            res.status(206).json({
                date: requestedDate,
                isFutureMenu: requestedDate !== initialDate,
                locations: mockLocations,
                message: "Could not load today's menu. This is the next available menu. Some items may not be available.",
                source: 'mock'
            });
        }

    } catch (error) {
        console.error('Scraping failed:', error.message);
        res.status(500).json({ error: 'Failed to fetch or parse menu.' });
    }
});

// ============= DELIVERY FEE CALCULATOR =============
app.post('/calculate-delivery-fee', (req, res) => {
    const { items, distance = 0.5, fromLocation, toLocation } = req.body;

    // Validate input
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Items array is required and cannot be empty.' });
    }

    try {
        const BASE_FEE = 2.50;
        const DISTANCE_ADDON = 0.50; // Per 0.25 miles

        // Count items and calculate complexity weight
        let totalItems = 0;
        let complexityWeightTotal = 0;

        items.forEach(item => {
            totalItems += item.quantity || 1;
            
            // Get price from item or use category default
            const price = item.price || getPriceByCategory(item.category);
            
            // Calculate complexity weight for each item
            const weight = getComplexityWeight(price);
            complexityWeightTotal += (item.quantity || 1) * weight;
        });

        // Calculate base fee
        let deliveryFee = BASE_FEE;

        // Add complexity weight charges
        deliveryFee += complexityWeightTotal;

        // Add for distance
        const distanceAddons = Math.ceil((distance || 0.5) / 0.25);
        deliveryFee += distanceAddons * DISTANCE_ADDON;

        // Round to 2 decimal places
        deliveryFee = Math.round(deliveryFee * 100) / 100;

        res.json({
            baseFee: BASE_FEE,
            itemCount: totalItems,
            complexityWeight: complexityWeightTotal.toFixed(2),
            distance: distance || 0.5,
            deliveryFee: deliveryFee,
            breakdown: {
                baseFee: BASE_FEE,
                complexityAddOn: parseFloat(complexityWeightTotal.toFixed(2)),
                distanceAddOn: distanceAddons * DISTANCE_ADDON
            }
        });
    } catch (error) {
        console.error('Delivery fee calculation error:', error.message);
        res.status(500).json({ error: 'Failed to calculate delivery fee.' });
    }
});

// ============= ORDER PLACEMENT =============
const orders = []; // In-memory order storage (replace with database in production)

app.post('/place-order', (req, res) => {
    const { items, deliveryFee, subtotal, total, deliveryAddress, dinerName, dinerEmail, fromLocation } = req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Items array is required.' });
    }
    if (!dinerName || !dinerEmail || !deliveryAddress) {
        return res.status(400).json({ error: 'Diner name, email, and delivery address are required.' });
    }

    try {
        const orderId = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        
        const order = {
            orderId: orderId,
            timestamp: new Date().toISOString(),
            status: 'confirmed',
            dinerName: dinerName,
            dinerEmail: dinerEmail,
            deliveryAddress: deliveryAddress,
            fromLocation: fromLocation,
            items: items,
            subtotal: subtotal || 0,
            deliveryFee: deliveryFee || 0,
            total: total || 0,
            estimatedDelivery: new Date(Date.now() + 25 * 60000).toISOString() // ~25 minutes
        };

        orders.push(order);

        console.log(`✅ Order placed: ${orderId}`);

        res.status(201).json({
            success: true,
            order: order,
            message: `Order confirmed! Your order will be delivered in ~25 minutes.`
        });
    } catch (error) {
        console.error('Order placement error:', error.message);
        res.status(500).json({ error: 'Failed to place order.' });
    }
});

// ============= GET ORDER STATUS =============
app.get('/order/:orderId', (req, res) => {
    const { orderId } = req.params;

    const order = orders.find(o => o.orderId === orderId);

    if (!order) {
        return res.status(404).json({ error: 'Order not found.' });
    }

    res.json({
        orderId: order.orderId,
        status: order.status,
        estimatedDelivery: order.estimatedDelivery,
        items: order.items,
        total: order.total,
        dinerName: order.dinerName,
        deliveryAddress: order.deliveryAddress
    });
});

app.listen(PORT, () => {
    console.log(`UDash scraper API listening on port ${PORT}`);
});

// For serverless deployment
export default app;
