// Fraud_Alert.js

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

    displaySearchResults(filteredUsers);
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
        cardDiv.setAttribute('id', `card-${index}`);

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

        // Toggle card details visibility and load transactions
        cardHeader.addEventListener('click', function () {
    // If charts are already visible, hide them
    const chartsContainer = document.getElementById('charts-container');
    if (chartsContainer.style.display === 'flex') {
        resetLayout();
        cardDetails.style.display = 'none';
    } else {
        cardDetails.style.display = 'block';
        // Show charts
        chartsContainer.style.display = 'flex';
        document.querySelector('.left-container').style.flex = '2';  // 20%
        document.querySelector('.charts-container').style.flex = '3'; // 30%
        document.querySelector('.right-container').style.flex = '5';  // 50%
        
        // Render charts after making the container visible
        renderCharts(card.transactions);
    }
});

        cardDiv.appendChild(cardHeader);
        cardDiv.appendChild(cardDetails);
        detailsContainer.appendChild(cardDiv);
    });
}

// Render charts for a given card's transactions
// Keep references to existing charts
let transactionChartInstance = null;
let locationChartInstance = null;

// Render charts for a given card's transactions
function renderCharts(transactions) {
    if (!transactions || transactions.length === 0) {
        console.warn('No transactions to render charts.');
        return;
    }

    // Clear existing charts
    if (transactionChartInstance) {
        transactionChartInstance.destroy();
    }
    if (locationChartInstance) {
        locationChartInstance.destroy();
    }

    // Transaction amounts over time
    const transactionChartCanvas = document.getElementById('transactionsChart');
    transactionChartInstance = new Chart(transactionChartCanvas, {
        type: 'line',
        data: {
            labels: transactions.map(t => `${t.date} ${t.time}`),
            datasets: [{
                label: 'Transaction Amount ($)',
                data: transactions.map(t => parseFloat(t.amount.replace('$', '').trim())),
                borderColor: 'rgba(75, 192, 192, 1)',
                fill: false,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true, // Allow flexibility in container dimensions
            scales: {
                x: { title: { display: true, text: 'Date and Time' } },
                y: { title: { display: true, text: 'Amount ($)' }, beginAtZero: true }
            }
        }
    });

    // Transaction locations (scatter plot)
    const locationChartCanvas = document.getElementById('locationChart');
    locationChartInstance = new Chart(locationChartCanvas, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Transaction Locations',
                data: transactions.map(t => ({ x: t.latitude, y: t.longitude })),
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                x: { title: { display: true, text: 'Latitude' } },
                y: { title: { display: true, text: 'Longitude' } }
            }
            
        }


    });        
    document.getElementById('charts-container').style.display = 'flex';

    // Adjust flex values for desired layout
    document.querySelector('.left-container').style.flex = '2';  // 20%
    document.querySelector('.charts-container').style.flex = '3'; // 30%
    document.querySelector('.right-container').style.flex = '5';  // 50%

    // If needed, call chart.resize() after container is visible
    if (transactionChartInstance) transactionChartInstance.resize();
    if (locationChartInstance) locationChartInstance.resize();
}
function resetLayout() {
    // Hide the charts container
    document.getElementById('charts-container').style.display = 'none';

    // Reset flex values to original layout
    document.querySelector('.left-container').style.flex = '2';  // 20%
    document.querySelector('.right-container').style.flex = '8'; // 80%

    // If you have chart instances, destroy them to prevent memory leaks
    if (transactionChartInstance) {
        transactionChartInstance.destroy();
        transactionChartInstance = null;
    }
    if (locationChartInstance) {
        locationChartInstance.destroy();
        locationChartInstance = null;
    }
}

// Call resetLayout whenever the user starts a new search
document.getElementById('search').addEventListener('input', () => {
    resetLayout();
});

