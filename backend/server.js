
import express from 'express';
import cors from 'cors';
import * as cheerio from "cheerio";
import axios from 'axios';

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
    'https://udash-yw1z.onrender.com',
    // frontend production domains
    'https://www.udash.tech',
    'https://udash-backend.onrender.com',
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

// Health check endpoint (platforms need this!)
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

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
    // NOTE: ignore any date provided by the client. The upstream menu pages show today's/current menu.
    // We intentionally do not rely on date parameters or attempt to fetch future dates.
    // Preserve an informational requestedDate for responses (use current date).
    const requestedDate = new Date().toISOString().split('T')[0];
    try {
        
        console.log(`Scraping menus (ignoring client date; using current date ${requestedDate})`);
        
        // Dining locations to scrape. Use the canonical /locations-menus/{slug}/menu pages.
        // The site uses slugs like 'berkshire', 'worcester', 'franklin', 'hampshire' and a generic 'grab-n-go'.
        const diningHalls = [
            { name: 'Berkshire DC', slug: 'berkshire' },
            { name: 'Worcester DC', slug: 'worcester' },
            { name: 'Franklin DC', slug: 'franklin' },
            { name: 'Hampshire DC', slug: 'hampshire' },
            { name: 'Grab N Go (Campus)', slug: 'grab-n-go' },
        ];

        const allLocations = [];

    const upstreamErrors = [];
    for (const hall of diningHalls) {
            // Build canonical menu URL for this location
            const menuUrl = `https://umassdining.com/locations-menus/${hall.slug}/menu`;
            console.log(`Fetching: ${menuUrl}`);
            
            try {
                // Use axios with realistic headers and a timeout to avoid being blocked by upstream
                const response = await axios.get(menuUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                        'Referer': 'https://umassdining.com/',
                    },
                    timeout: 15000,
                    responseType: 'text'
                });

                if (response.status < 200 || response.status >= 300) {
                    console.warn(`Upstream HTTP ${response.status} for ${menuUrl}`);
                    upstreamErrors.push({ url: menuUrl, status: response.status });
                    continue;
                }

                const html = response.data;
                const $ = cheerio.load(html);

                // Find the main dining menu container and extract categories + items in order
                const menuContainer = $('#dining_menu');
                const items = [];
                let currentCategory = 'Entrees';

                // Iterate over category headers and item list elements in order
                menuContainer.find('h2.menu_category_name, li.lightbox-nutrition').each((i, el) => {
                    const tag = el.tagName.toLowerCase();
                    if (tag === 'h2') {
                        const catText = $(el).text().trim();
                        if (catText) currentCategory = catText;
                    } else if (tag === 'li') {
                        const link = $(el).find('a');
                        const dishName = link.attr('data-dish-name') || link.text();
                        const calories = link.attr('data-calories') || 'N/A';

                        if (dishName && dishName.trim()) {
                            items.push({
                                name: dishName.trim(),
                                description: '',
                                category: currentCategory || 'Entrees',
                                mealPeriod: 'Lunch/Dinner',
                                price: getPriceByCategory(currentCategory || ''),
                                calories: calories,
                                image: `https://picsum.photos/seed/${encodeURIComponent(dishName.trim().replace(/\s+/g, '-'))}/400`
                            });
                        }
                    }
                });

                if (items.length > 0) {
                    allLocations.push({
                        name: hall.name,
                        items: items
                    });
                    console.log(`Found ${items.length} items for ${hall.name}`);
                } else {
                    console.log(`No items found for ${hall.name} - this may indicate no menu data for that date or a scraping selector mismatch`);
                }
            } catch (error) {
                const msg = error?.message || String(error);
                console.error(`Error scraping ${hall.name}:`, msg);
                if (error?.response?.status) {
                    upstreamErrors.push({ url: menuUrl, status: error.response.status });
                } else {
                    upstreamErrors.push({ url: menuUrl, status: 'network/error', message: msg });
                }
                continue;
            }
        }
        if (allLocations.length > 0) {
            return res.json({
                date: requestedDate,
                locations: allLocations,
                isFutureMenu: false,
                source: 'scraped'
            });
        }

        // If upstream errors occurred and no locations were parsed, return 502 to indicate upstream failure
        if (upstreamErrors.length > 0) {
            console.error('Upstream errors during scraping:', upstreamErrors);
            return res.status(502).json({ error: 'Upstream error fetching menus', details: upstreamErrors });
        }

    // No items found and no upstream errors → return an empty locations array (no menu available)
    console.log('No menu items found for requested date; returning empty result');
    return res.json({ date: requestedDate, locations: [], isFutureMenu: false, message: 'No menu items found' });

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


// Serve static files from the Vite dist folder (frontend build)
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.static(join(__dirname, 'dist')));

// Catch-all route to serve index.html for SPA routing
app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/grabngo-menu') || req.path.startsWith('/healthz')) {
        return next();
    }
    // Serve index.html for all other routes (SPA routing)
    res.sendFile(join(__dirname, 'dist', 'index.html'));
});

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`UDash scraper API listening on port ${PORT}`);
});

// Graceful shutdown on SIGTERM (Railway/Render sends this signal)
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
