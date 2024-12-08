import { loadModel, predictFraud } from './model.js';

const maxTransactions = 100;
let transactionList = []; // To store transactions
let map; // Leaflet map instance
let markers = []; // To store map markers
const markerLayer = L.layerGroup(); // Use a layer group for better performance
let dfMerged = []; // Transaction dataset
let nearbyCitiesDict = {}; // Precomputed nearby cities



// Initialize Leaflet map
function initializeMap() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
        console.error('Error: Map container not found!');
        return;
    }

    map = L.map('map', {
        zoomSnap: 0, // Allows fractional zoom levels
    }).setView([39.0997, -94.5786], 5); // Default view for Kansas City, MO

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    markerLayer.addTo(map); // Add the layer group to the map
    console.log('Map initialized successfully.');
}

// Helper to pick a random item from an array
function sample(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// Helper to validate time format
// In model.js



// Add marker to map
function addMarker(lat, lon, isFraud, transaction) {
    if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
        console.warn('Invalid latitude or longitude:', lat, lon);
        return;
    }

    const markerColor = isFraud === 1 ? 'red' : 'green';
    const marker = L.circleMarker([lat, lon], {
        radius: 8,
        fillColor: markerColor,
        color: markerColor,
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8,
    }).addTo(markerLayer);

    const popupContent = `
        <div style="font-size: 14px; padding: 10px; max-width: 300px;">
            <h3>Transaction Details</h3>
            <p><strong>Card Number:</strong> ${transaction.cardNumber ? transaction.cardNumber.slice(-4).padStart(transaction.cardNumber.length, '*') : 'N/A'}</p>
            <p><strong>Amount:</strong> ${transaction.amount}</p>
            <p><strong>Date:</strong> ${transaction.date}</p>
            <p><strong>Time:</strong> ${transaction.time}</p>
            <p><strong>City:</strong> ${transaction.city}</p>
            <p><strong>State:</strong> ${transaction.state}</p>
            <p><strong>Fraudulent:</strong> ${isFraud ? 'Yes' : 'No'}</p>
        </div>
    `;

    marker.bindPopup(popupContent, { maxWidth: 400 });

    let isActive = false;

    // Marker click event
    marker.on('click', () => {
        if (isActive) {
            resetView();
            isActive = false;
        } else {
            map.setView([lat, lon], 15);
            isActive = true;
        }
    });

    // Popup close event
    marker.on('popupclose', () => {
        if (isActive) {
            resetView();
            isActive = false;
        }
    });

    // Add mouseover event to expand the marker
    marker.on('mouseover', function () {
        this.setStyle({ radius: 20, fillOpacity: 1 });
    });

    // Add mouseout event to reset the marker size
    marker.on('mouseout', function () {
        this.setStyle({ radius: 8, fillOpacity: 0.8 });
    });

    markers.push(marker);
}

function resetView() {
    try {
        if (map) {
            map.setView([39.0997, -94.5786], 5);
        }

        const searchInput = document.getElementById('search');
        if (searchInput) searchInput.value = '';

        const detailsContainer = document.getElementById('card-details');
        if (detailsContainer) detailsContainer.innerHTML = '';

        resetCharts();
        expandedCards = [];
    } catch (error) {
        console.error('Error resetting view:', error);
    }
}

function resetCharts() {
    const chartsContainer = document.getElementById('charts-container');
    if (chartsContainer) {
        chartsContainer.style.display = 'none';
    }

    if (transactionChartInstance) {
        transactionChartInstance.destroy();
        transactionChartInstance = null;
    }
    if (locationChartInstance) {
        locationChartInstance.destroy();
        locationChartInstance = null;
    }
}

function precompute(dfMerged) {
    const nearbyCitiesDict = {};

    dfMerged.forEach(city => {
        const { Latitude: lat1, Longitude: lon1 } = city;

        const nearbyCities = dfMerged.filter(otherCity => {
            const { Latitude: lat2, Longitude: lon2 } = otherCity;
            const distance = calculateDistance(lat1, lon1, lat2, lon2);
            return distance <= 100; // Define the radius in kilometers
        });

        nearbyCitiesDict[`${lat1},${lon1}`] = nearbyCities;
    });

    return nearbyCitiesDict;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    const toRad = (value) => (value * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in kilometers
}

async function generateTransactions(card, num, nearbyCitiesDict, dfMerged) {
    const transactions = [];
    for (let i = 0; i < num; i++) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const timeFrame = Math.random() < 0.8 ? 'day' : 'night';
            let time = timeFrame === 'day'
                ? `${Math.floor(Math.random() * 14 + 6).toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`
                : `${Math.floor(Math.random() * 6 + 20).toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`;

            // time = validateTimeFormat(time); // Validate generated time

            const amount = Math.random() < 0.8
                ? `$${(Math.random() * 99 + 1).toFixed(2)}`
                : Math.random() < 0.99
                ? `$${(Math.random() * 399 + 101).toFixed(2)}`
                : `$${(Math.random() * 1499 + 501).toFixed(2)}`;

            const isFraud = await predictFraud({
                amount: amount,
                latitude: card.Latitude,
                longitude: card.Longitude,
                useChip: Math.random() < 0.7 ? 1 : 0,
                errors: Math.random() < 0.95 ? 'None' : 'Insufficient Funds',
                date: today,
                time
            });

            transactions.push({
                date: today,
                time,
                amount: amount,
                city: card.City,
                state: card.State,
                latitude: card.Latitude,
                longitude: card.Longitude,
                'Is Fraud?': isFraud,
                cardNumber: card['Card Number'] // Include card number if present
            });
        } catch (error) {
            console.error('Error generating transaction:', error);
        }
    }
    return transactions;
}

async function generateDynamicTransactions() {
    setInterval(async () => {
        const newTransactions = [];
        for (let i = 0; i < 10; i++) {
            const card = sample(dfMerged); // Randomly pick a card from the dataset
            const transactions = await generateTransactions(card, 1, nearbyCitiesDict, dfMerged);
            newTransactions.push(...transactions);
        }

        transactionList = transactionList.concat(newTransactions);

        if (transactionList.length > maxTransactions) {
            const countToRemove = transactionList.length - maxTransactions;
            transactionList.splice(0, countToRemove);
            removeOldMarkers(countToRemove);
        }

        newTransactions.forEach(transaction => {
            if (transaction.latitude && transaction.longitude) {
                addMarker(transaction.latitude, transaction.longitude, transaction['Is Fraud?'], transaction);
            }
        });

        console.log('Current Transactions:', transactionList);
    }, 10000); // Run every 10 seconds
}

function removeOldMarkers(count) {
    for (let i = 0; i < count; i++) {
        const marker = markers.shift(); // Remove the first marker
        if (marker) {
            markerLayer.removeLayer(marker); // Remove from map
        }
    }
}

async function initializeApp() {
    try {
        // Load dataset
        const response = await fetch('../static/Merged_card_user.json');
        if (!response.ok) throw new Error('Failed to load transaction dataset.');
        dfMerged = await response.json();

        // Precompute nearby cities
        nearbyCitiesDict = precompute(dfMerged);

        // Load the fraud detection model
        console.log('Loading fraud detection model...');
        await loadModel();

        // Initialize the Leaflet map
        initializeMap();

        // Start generating dynamic transactions
        console.log('Starting dynamic transaction generation...');
        generateDynamicTransactions();
    } catch (error) {
        console.error('Error during initialization:', error);
    }
}


// Start the application
initializeApp();
