
import express from 'express';
import cors from 'cors';
import * as cheerio from "cheerio";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
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

// Helper to generate a mock price
const mockPrice = () => {
    return parseFloat((Math.random() * (12.99 - 7.99) + 7.99).toFixed(2));
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
                                    price: mockPrice(),
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
                    { name: 'Grilled Chicken Breast', category: 'Grill Station', price: mockPrice(), image: 'https://picsum.photos/seed/chicken/400' },
                    { name: 'Vegetable Stir Fry', category: 'International', price: mockPrice(), image: 'https://picsum.photos/seed/stirfry/400' },
                    { name: 'Baked Ziti', category: 'Pasta Bar', price: mockPrice(), image: 'https://picsum.photos/seed/ziti/400' },
                    { name: 'Roasted Sweet Potato', category: 'Starches', price: mockPrice(), image: 'https://picsum.photos/seed/potato/400' },
                    { name: 'Caesar Salad', category: 'Salad Bar', price: mockPrice(), image: 'https://picsum.photos/seed/salad/400' },
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
        const ITEM_ADDON = 0.25;
        const COMPLEX_ITEM_ADDON = 0.50;
        const DISTANCE_ADDON = 0.50; // Per 0.25 miles

        // Count items and complexity
        let totalItems = 0;
        let complexItemCount = 0;

        items.forEach(item => {
            totalItems += item.quantity || 1;
            
            // Determine complexity based on category
            const complexCategories = ['Entrees', 'Pasta Bar', 'Grill Station', 'International', 'Bowl', 'Wrap'];
            if (complexCategories.some(cat => item.category?.includes(cat))) {
                complexItemCount += (item.quantity || 1);
            }
        });

        // Calculate base fee
        let deliveryFee = BASE_FEE;

        // Add for items beyond 3
        if (totalItems > 3) {
            deliveryFee += (totalItems - 3) * ITEM_ADDON;
        }

        // Add for complex items
        deliveryFee += complexItemCount * COMPLEX_ITEM_ADDON;

        // Add for distance
        const distanceAddons = Math.ceil((distance || 0.5) / 0.25);
        deliveryFee += distanceAddons * DISTANCE_ADDON;

        // Round to 2 decimal places
        deliveryFee = Math.round(deliveryFee * 100) / 100;

        res.json({
            baseFee: BASE_FEE,
            itemCount: totalItems,
            complexItems: complexItemCount,
            distance: distance || 0.5,
            deliveryFee: deliveryFee,
            breakdown: {
                baseFee: BASE_FEE,
                itemAddOn: Math.max(0, (totalItems - 3) * ITEM_ADDON),
                complexityAddOn: complexItemCount * COMPLEX_ITEM_ADDON,
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
