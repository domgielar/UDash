
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

// The scraping endpoint with retry logic
app.get('/grabngo-menu', async (req, res) => {
    const { date: initialDate } = req.query;
    if (!initialDate || !/^\d{4}-\d{2}-\d{2}$/.test(initialDate)) {
        return res.status(400).json({ error: 'A valid date query parameter (YYYY-MM-DD) is required.' });
    }

    try {
        let currentDate = new Date(initialDate + 'T12:00:00Z'); // Use noon UTC to avoid timezone shifts

        // If the requested date falls on a weekend, jump to the next Monday automatically
        const day = currentDate.getUTCDay();
        if (day === 6) { // Saturday
            currentDate.setUTCDate(currentDate.getUTCDate() + 2);
        } else if (day === 0) { // Sunday
            currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        }

        const maxRetries = 5; // Look up to 5 weekdays ahead
        let weekdaysChecked = 0;
        let foundMenuData = null;

        console.log(`Scraping requested for date: ${initialDate}`);

        while (weekdaysChecked < maxRetries) {
            const dayOfWeek = currentDate.getUTCDay(); // 0 = Sunday, 6 = Saturday
            const currentDateString = currentDate.toISOString().split('T')[0];

            // Skip weekends
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                console.log(`Skipping weekend: ${currentDateString}`);
                currentDate.setUTCDate(currentDate.getUTCDate() + 1);
                continue;
            }
            
            weekdaysChecked++;

            // Format date for the URL: MM/DD/YYYY
            // Always scrape the current Grab & Go menu page
            const url = `https://umassdining.com/locations-menus/grab-n-go`;

            console.log(`Fetching Grab & Go menu from: ${url}`);

            console.log(`Attempt #${weekdaysChecked}: Checking for menu on ${currentDateString} at ${url}`);
            
            const response = await fetch(url);
            if (!response.ok) {
                console.warn(`HTTP error for ${currentDateString}! Status: ${response.status}`);
                currentDate.setUTCDate(currentDate.getUTCDate() + 1);
                continue; // Try next day
            }
            const html = await response.text();
            const $ = cheerio.load(html);

            // Check if the menu is empty/closed
            if ($('.view-empty').length > 0 || html.includes("no menu items were found")) {
                console.log(`No menu content found for ${currentDateString}.`);
                currentDate.setUTCDate(currentDate.getUTCDate() + 1);
                continue; // Move to the next day
            }

            const locations = [];
            $('h2').each((i, el) => {
                const titleText = $(el).text().trim();
                if (titleText.startsWith('Grab & Go at')) {
                    const locationName = titleText.replace('Grab & Go at', '').trim();
                    const locationMenu = { name: locationName, items: [] };
                    
                    const menuContainer = $(el).next('.view-food-grab-and-go').find('.view-content');
                    menuContainer.find('.views-row').each((j, itemEl) => {
                        const name = $(itemEl).find('h3').text().trim();
                        const description = $(itemEl).find('.field--name-field-description-menu .field__item').text().trim() || 'No description available.';
                        if (name) {
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

            if (locations.length > 0) {
                console.log(`Scraping success! Found menu for date: ${currentDateString}`);
                foundMenuData = {
                    date: currentDateString,
                    locations,
                };
                break; // Exit the loop
            } else {
                console.log(`Parsed page but found no menu items for ${currentDateString}.`);
                currentDate.setUTCDate(currentDate.getUTCDate() + 1);
            }
        }
        
        if (foundMenuData) {
            // isFutureMenu is true if the menu we found is for a different date than originally requested.
            const isFutureMenu = foundMenuData.date !== initialDate;
            res.json({
                ...foundMenuData,
                isFutureMenu,
            });
        } else {
            console.log(`Could not find a menu within 5 weekdays of ${initialDate}.`);
            res.status(404).json({
                date: initialDate,
                isFutureMenu: true,
                locations: [],
                message: "No upcoming Grab & Go menus are available.",
            });
        }

    } catch (error) {
        console.error('Scraping failed catastrophically:', error);
        res.status(500).json({ error: 'Failed to fetch or parse menu.' });
    }
});

app.listen(PORT, () => {
    console.log(`UDash scraper API listening on port ${PORT}`);
});

// For serverless deployment
export default app;
