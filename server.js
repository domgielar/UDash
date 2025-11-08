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

// Helper to generate a mock price, since it's not on the website
const mockPrice = () => {
    // Generate a price between 7.99 and 12.99
    return parseFloat((Math.random() * (12.99 - 7.99) + 7.99).toFixed(2));
};

// The scraping endpoint
app.get('/grabngo-menu', async (req, res) => {
    const { date } = req.query;
    if (!date) {
        return res.status(400).json({ error: 'A date query parameter is required.' });
    }
    const url = 'https://umassdining.com/locations-menus/grab-n-go';
    console.log(`Scraping started for date: ${date} from ${url}`);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const html = await response.text();
        const $ = cheerio.load(html);

        // Check if the menu is closed (UMass Dining shows a specific message)
        if ($('.view-empty').length > 0) {
            console.log('No menu available. Grab & Go is likely closed.');
            return res.json({
                date,
                message: 'Grab & Go is currently closed. No menu available.',
                locations: [],
            });
        }
        
        const locations = [];
        
        $('h2.node__title').each((i, el) => {
            const titleText = $(el).text().trim();
            if (titleText.startsWith('Grab & Go at')) {
                const locationName = titleText.replace('Grab & Go at', '').trim();
                
                const locationMenu = {
                    name: locationName,
                    items: [],
                };
                
                // Find the container for menu items associated with this h2
                const menuContainer = $(el).next('.view-food-grab-and-go').find('.view-content');

                menuContainer.find('.views-row').each((j, itemEl) => {
                    const name = $(itemEl).find('h3').text().trim();
                    const description = $(itemEl).find('.field--name-field-description-menu .field__item').text().trim() || 'No description available.';

                    if(name) {
                        locationMenu.items.push({
                            name,
                            description,
                            category: inferCategory(name),
                            price: mockPrice(),
                            image: `https://picsum.photos/seed/${name.replace(/\s+/g, '-')}/400`
                        });
                    }
                });

                if (locationMenu.items.length > 0) {
                    locations.push(locationMenu);
                }
            }
        });
        
        if (locations.length === 0) {
             console.log('No menu items found after parsing. Assuming closed.');
             return res.json({
                date,
                message: 'Grab & Go is currently closed. No menu available.',
                locations: [],
            });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const targetDate = new Date(`${date}T00:00:00`);
        const isFutureMenu = targetDate > today;

        console.log('Scraping success!');
        res.json({
            date,
            isFutureMenu,
            locations,
        });

    } catch (error) {
        console.error('Scraping failed:', error);
        res.status(500).json({ error: 'Failed to fetch or parse menu.' });
    }
});

app.listen(PORT, () => {
    console.log(`UDash scraper API listening on port ${PORT}`);
});

// For serverless deployment (e.g., Vercel)
export default app;
