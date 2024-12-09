// Fraud_Alert.js
// Fraud_Alert.js
let expandedCards = [];
let cardLookup = {};
document.addEventListener('dataLoaded', () => {
    console.log('Data loaded and ready:', groupedData);

    // Initialize the search functionality
    document.getElementById('search').addEventListener('input', filterNames);
});

// Filter users based on search input
function filterNames() {
    const searchTerm = document.getElementById('search').value.toLowerCase().trim();
    const filteredUsers = Object.values(groupedData).filter(user =>
        user.name.toLowerCase().startsWith(searchTerm)
    );

    displaySearchResults(filteredUsers); // Update the search results dropdown

    if (filteredUsers.length === 1) {
        // Automatically select the first result if there's only one match
        showUserDetails(filteredUsers[0]);
    }
}


// Display filtered search results
function displaySearchResults(filteredUsers) {
    const resultsContainer = document.getElementById('search-results');
    resultsContainer.innerHTML = ''; // Clear previous results

    if (filteredUsers.length === 0) {
        resultsContainer.innerHTML = '<div>No results found</div>';
        return;
    }

    filteredUsers.forEach(user => {
        const resultDiv = document.createElement('div');
        resultDiv.classList.add('result-item');

        const nameDiv = document.createElement('div');
        nameDiv.classList.add('result-name');
        nameDiv.textContent = user.name;

        // Add click event to display user details
        nameDiv.addEventListener('click', () => {
            document.getElementById('search').value = user.name; // Auto-fill search box
            showUserDetails(user);
            clearSearchResults();
        });

        resultDiv.appendChild(nameDiv);
        resultsContainer.appendChild(resultDiv);
    });
}

// Clear search results dropdown
function clearSearchResults() {
    const resultsContainer = document.getElementById('search-results');
    resultsContainer.innerHTML = ''; // Clear search results after selection
}

// Show user details and their cards
function showUserDetails(userData) {
    const detailsContainer = document.getElementById('card-details');
    detailsContainer.innerHTML = ''; // Clear previous details

    // Display general user info
    const userInfo = userData.info;
    const userInfoDiv = document.createElement('div');
    userInfoDiv.classList.add('user-info');
    userInfoDiv.innerHTML = `
        <table>
            <tr><td><strong>Name:</strong></td><td>${userInfo.name}</td></tr>
            <tr><td><strong>Address:</strong></td><td>${userInfo.address}</td></tr>
            <tr><td><strong>City:</strong></td><td>${userInfo.city}</td></tr>
            <tr><td><strong>State:</strong></td><td>${userInfo.state}</td></tr>
            <tr><td><strong>Zipcode:</strong></td><td>${userInfo.zipcode}</td></tr>
            <tr><td><strong>Birth Month:</strong></td><td>${userInfo.birthMonth}</td></tr>
            <tr><td><strong>Birth Year:</strong></td><td>${userInfo.birthYear}</td></tr>
            <tr><td><strong>Current Age:</strong></td><td>${userInfo.currentAge}</td></tr>
            <tr><td><strong>Retirement Age:</strong></td><td>${userInfo.retirementAge}</td></tr>
            <tr><td><strong>Gender:</strong></td><td>${userInfo.gender}</td></tr>
            <tr><td><strong>Total Debt:</strong></td><td>${userInfo.totalDebt}</td></tr>
            <tr><td><strong>FICO Score:</strong></td><td>${userInfo.ficoScore}</td></tr>
            <tr><td><strong>Num Credit Cards:</strong></td><td>${userInfo.numCreditCards}</td></tr>
        </table>
    `;

    detailsContainer.appendChild(userInfoDiv);

    // Display user card details
    userData.details.forEach((card, index) => {
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card-info');

        const cardHeader = document.createElement('div');
        cardHeader.classList.add('card-box');
        cardHeader.innerHTML = `<strong>Last 4 Digits: ${card.cardNumber.slice(-4)}</strong><br>
            <strong>Card Type:</strong> ${card.cardType}`;

        const cardDetails = document.createElement('div');
        cardDetails.classList.add('card-details');
        cardDetails.style.display = 'none';
        
        const balanceOrLimit = card.cardType === 'Credit' 
            ? `<strong>Credit Limit:</strong> ${card.creditLimit}` 
            : `<strong>Account Balance:</strong> ${card.accountBalance}`;

        cardDetails.innerHTML = `
            <div><strong>Card Number:</strong> ${card.cardNumber}</div>
            <div><strong>Expires:</strong> ${card.expires}</div>
            <div><strong>CVV:</strong> ${card.cvv}</div>
            <div><strong>Has Chip:</strong> ${card.hasChip}</div>
            <div>${balanceOrLimit}</div>
            <div><strong>Account Open Date:</strong> ${card.acctOpenDate}</div>
            <div><strong>Year PIN Last Changed:</strong> ${card.yearPinLastChanged}</div>
            <div><strong>Card on Dark Web:</strong> ${card.cardOnDarkWeb}</div>
        `;

        const cardId = userData.info.name.replace(/\s+/g, '_').toLowerCase() + '_' + index;
        cardLookup[cardId] = card;
        // Toggle card details visibility and load transactions
        cardHeader.addEventListener('click', function () {
            if (cardDetails.style.display === 'none') {
                // Expanding
                cardDetails.style.display = 'block';
                expandedCards.push(cardId);
                showChartsForLastExpandedCard();
            } else {
                // Collapsing
                cardDetails.style.display = 'none';
                expandedCards = expandedCards.filter(id => id !== cardId);
                showChartsForLastExpandedCard();
            }
        });

        cardDiv.appendChild(cardHeader);
        cardDiv.appendChild(cardDetails);
        detailsContainer.appendChild(cardDiv);
    });
}
function findCardById(id) {
    return cardLookup[id];
}

function showChartsForLastExpandedCard() {
    const chartsContainer = document.getElementById('charts-container');

    if (expandedCards.length === 0) {
        chartsContainer.style.display = 'none';
        resetLayout();
        destroyCharts(); // Make sure this is defined
        return;
    }

    const activeCardId = expandedCards[expandedCards.length - 1];
    const activeCard = findCardById(activeCardId);

    chartsContainer.style.display = 'flex';
    document.querySelector('.left-container').style.flex = '2';  
    document.querySelector('.charts-container').style.flex = '3';
    document.querySelector('.right-container').style.flex = '5';

    renderCharts(activeCard.transactions, activeCard);

    if (transactionChartInstance) transactionChartInstance.resize();
    if (locationChartInstance) locationChartInstance.resize();
}

function destroyCharts() {
    if (transactionChartInstance) {
        transactionChartInstance.destroy();
        transactionChartInstance = null;
    }
    if (locationChartInstance) {
        locationChartInstance.destroy();
        locationChartInstance = null;
    }
}

// Render charts for a given card's transactions
// Keep references to existing charts
let transactionChartInstance = null;
let locationChartInstance = null;

// Render charts for a given card's transactions
function renderCharts(transactions, card) {
    if (!transactions || transactions.length === 0) {
        console.warn('No transactions to render charts.');
        return;
    }

    // Sort transactions by Date and then by Time
    transactions.sort((a, b) => {
        // Parse the dates and times
        const dateA = new Date(`${a.date} ${a.time}`);
        const dateB = new Date(`${b.date} ${b.time}`);
        return dateA - dateB;
    });

    // Clear existing charts
    if (transactionChartInstance) transactionChartInstance.destroy();
    if (locationChartInstance) transactionChartInstance.destroy();

    // Transaction amounts over time
    const transactionChartCanvas = document.getElementById('transactionsChart');
    transactionChartInstance = new Chart(transactionChartCanvas, {
        type: 'line',
        data: {
            labels: transactions.map(t => `${t.date} ${t.time}`),
            datasets: [{
                label: 'Transaction Amount ($)',
                data: transactions.map(t => parseFloat(t.amount.replace(/[$,]/g, '').trim())),
                borderColor: 'rgba(75, 192, 192, 1)',
                fill: false,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { title: { display: true, text: 'Date and Time' } },
                y: { title: { display: true, text: 'Amount ($)' }, beginAtZero: true }
            }
        }
    });

    // Pie chart: Transaction Sum vs. Balance or Credit Limit
    const locationChartCanvas = document.getElementById('locationChart');
    const totalTransactions = transactions.reduce(
        (sum, t) => sum + parseFloat(t.amount.replace(/[$,]/g, '').trim()),
        0
    );
    const balanceOrLimit = card.cardType === 'Credit'
        ? parseFloat(card.creditLimit.replace(/[$,]/g, '').trim())
        : parseFloat(card.accountBalance.replace(/[$,]/g, '').trim());

    locationChartInstance = new Chart(locationChartCanvas, {
        type: 'pie',
        data: {
            labels: ['Transaction Sum', 'Remaining Balance'],
            datasets: [{
                data: [totalTransactions, balanceOrLimit],
                backgroundColor: ['#FF6384', '#36A2EB']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (tooltipItem) {
                            return `$${tooltipItem.raw.toFixed(2)}`;
                        }
                    }
                }
            }
        }
    });

    // Ensure charts resize properly
    setTimeout(() => {
        transactionChartInstance.resize();
        locationChartInstance.resize();
    }, 50);

    const chartsContainer = document.querySelector('.charts-container');
    chartsContainer.style.display = 'flex';

    // // Adjust flex layout for visibility
    // document.querySelector('.left-container').style.flex = '2'; // 20%
    // chartsContainer.style.flex = '3'; // 30%
    // document.querySelector('.right-container').style.flex = '15'; // 50%
}



function resetLayout() {
    const chartsContainer = document.getElementById('charts-container');
    chartsContainer.style.display = 'none';

    // Reset flex values to original layout
    document.querySelector('.left-container').style.flex = '2.5';  // 20%
    document.querySelector('.right-container').style.flex = '7'; // 80%

    // Destroy chart instances to prevent memory leaks
    if (transactionChartInstance) {
        transactionChartInstance.destroy();
        transactionChartInstance = null;
    }
    if (locationChartInstance) {
        locationChartInstance.destroy();
        locationChartInstance = null;
    }
}


// Ensure charts resize dynamically on window resize
window.addEventListener('resize', () => {
    if (transactionChartInstance) transactionChartInstance.resize();
    if (locationChartInstance) locationChartInstance.resize();
});

// Observe changes to the charts container
const chartsContainer = document.querySelector('.charts-container');
const resizeObserver = new ResizeObserver(() => {
    if (transactionChartInstance) transactionChartInstance.resize();
    if (locationChartInstance) locationChartInstance.resize();
});
resizeObserver.observe(chartsContainer);

// Trigger resize after zooming
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && chartsContainer.style.display !== 'none') {
        if (transactionChartInstance) transactionChartInstance.resize();
        if (locationChartInstance) locationChartInstance.resize();
    }
});
