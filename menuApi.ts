// This file simulates fetching the daily Grab & Go menu.
// It's now configured to connect to your real backend scraper.

import type { ScrapedMenu } from './types';

/**
 * Calculates the next available Grab & Go date.
 * Skips Saturday and Sunday, defaulting to the next Monday.
 * @returns {{targetDate: Date, isFutureMenu: boolean}}
 */
const getNextAvailableGrabNGoDate = (): { targetDate: Date, isFutureMenu: boolean } => {
    const today = new Date();
    const day = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    let targetDate = new Date(today);
    let isFutureMenu = false;

    if (day === 6) { // Saturday
        targetDate.setDate(today.getDate() + 2);
        isFutureMenu = true;
    } else if (day === 0) { // Sunday
        targetDate.setDate(today.getDate() + 1);
        isFutureMenu = true;
    }

    return { targetDate, isFutureMenu };
};


/**
 * Fetches the latest Grab & Go menu from your live backend.
 * @returns {Promise<ScrapedMenu>}
 */
export const fetchLatestMenu = async (): Promise<ScrapedMenu> => {
    const { targetDate } = getNextAvailableGrabNGoDate();
    const dateString = targetDate.toISOString().split('T')[0];

    // Use environment variable for the backend URL (production) or fallback to localhost (development)
    const baseUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';
    const API_ENDPOINT = `${baseUrl}/grabngo-menu?date=${dateString}`;
    
    // --- REAL API FETCH ---
    try {
        console.log(`Fetching menu data for ${dateString} from ${API_ENDPOINT}...`);

        const response = await fetch(API_ENDPOINT, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch menu. Status: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("Menu data fetched successfully:", data);
        
        // Ensure data has the expected structure
        if (!data.locations || !Array.isArray(data.locations)) {
            throw new Error("Invalid menu data structure from backend");
        }
        
        return data; // Trust the response from the backend
    } catch (error) {
        console.error("API fetch failed:", error);
        // Log more details for debugging
        console.error("Error type:", error instanceof Error ? error.message : typeof error);
        throw error; // Re-throw to be caught by the UI component for fallback
    }
};



// --- MOCK API FOR DEMONSTRATION ---
// This mock is now disabled. The app will use the live API call above.
/*
// Mock data for when the menu is available.
const MOCK_MENU_DATA: Omit<ScrapedMenu, 'date' | 'isFutureMenu'> = {
    locations: [
        {
            name: "Blue Wall",
            items: [
                { name: "Harvest Chicken Salad Wrap", description: "Grilled chicken, mixed greens, cranberries, and walnuts.", category: "Wrap", price: 8.99, image: "https://picsum.photos/seed/bw1/400" },
                { name: "Spicy California Roll", description: "Fresh sushi with spicy mayo.", category: "Sushi", price: 9.50, image: "https://picsum.photos/seed/bw2/400" },
                { name: "Greek Salad", description: "Romaine, feta, olives, and red wine vinaigrette.", category: "Salad", price: 10.25, image: "https://picsum.photos/seed/bw3/400" },
            ]
        },
        // ... other mock locations
    ]
};

// Mock data for when Grab & Go is closed.
const MOCK_CLOSED_DATA: Omit<ScrapedMenu, 'date' | 'isFutureMenu'> = {
    locations: [],
    message: "Grab & Go is currently closed. No menu available."
};

export const fetchLatestMenu = async (): Promise<ScrapedMenu> => {
    const { targetDate, isFutureMenu } = getNextAvailableGrabNGoDate();
    const dateString = targetDate.toISOString().split('T')[0];
    
    console.log(`Fetching MOCK menu data for ${dateString}...`);
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const random = Math.random();
            if (random < 0.7) { // 70% chance of success
                console.log("Mock API response: SUCCESS (menu available)");
                resolve({
                    ...MOCK_MENU_DATA,
                    date: dateString,
                    isFutureMenu,
                });
            } else if (random < 0.9) { // 20% chance of "closed"
                console.log("Mock API response: SUCCESS (Grab & Go is closed)");
                resolve({
                    ...MOCK_CLOSED_DATA,
                    date: dateString,
                    isFutureMenu,
                });
            } else { // 10% chance of error
                console.error("Mock API response: ERROR");
                reject(new Error("Failed to fetch menu from mock API."));
            }
        }, 1500);
    });
};
*/
