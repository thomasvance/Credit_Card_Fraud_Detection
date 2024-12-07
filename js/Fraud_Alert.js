document.addEventListener('dataLoaded', () => {
    console.log('Data loaded successfully. Initializing Fraud Alert...');
    groupByUser(personData); // Group the users
    associateTransactions(); // Associate transactions with users
    console.log('Grouped Data:', groupedData);
});


// Group the data by User
function groupByUser(data) {
    groupedData = {};

    data.forEach(person => {
        const userId = person.User; // Group by unique User ID

        if (!groupedData[userId]) {
            groupedData[userId] = {
                name: capitalizeName(person.Person), // Use the `Person` column for the name with proper capitalization
                info: {},            // Add an `info` field for user details
                details: []          // Store all card details for that user
            };
        }

        // Populate the `info` field
        groupedData[userId].info = {
            name: capitalizeName(person.Person), // Ensure the name is also in the `info` object with proper capitalization
            currentAge: person['Current Age'],
            retirementAge: person['Retirement Age'],
            birthYear: person['Birth Year'],
            birthMonth: person['Birth Month'],
            gender: person['Gender'],
            address: person['Address'],
            city: person['City'],
            state: person['State'],
            zipcode: person['Zipcode'],
            latitude: person['Latitude'],
            longitude: person['Longitude'],
            perCapitaIncome: person['Per Capita Income - Zipcode'],
            yearlyIncome: person['Yearly Income - Person'],
            totalDebt: person['Total Debt'],
            ficoScore: person['FICO Score'],
            numCreditCards: person['Num Credit Cards']
        };

        // Add the card details to the user’s entry
        groupedData[userId].details.push({
            cardType: person['Card Type'],
            cardNumber: person['Card Number'],
            expires: person['Expires'],
            cvv: person['CVV'],
            hasChip: person['Has Chip'],
            creditLimit: person['Credit Limit'],
            accountBalance: person['Account Balance'], 
            acctOpenDate: person['Acct Open Date'],
            yearPinLastChanged: person['Year PIN last Changed'],
            cardOnDarkWeb: person['Card on Dark Web'],
            transactions: [] // Add an empty array to store transactions later
        });
    });

     // Log the final grouped structure
}

function buildCardLookupMap() {
    const cardLookup = {};

    for (const userId in groupedData) {
        const user = groupedData[userId];
        user.details.forEach(card => {
            const cardKey = `${card.cardNumber}-${card.cvv}`; // Unique key for each card
            cardLookup[cardKey] = card;
        });
    }

    return cardLookup;
}

function associateTransactions() {
    if (!transactionsData || transactionsData.length === 0) {
        console.error('No transactions data available to process.');
        return;
    }

    const cardLookup = buildCardLookupMap(); // Build a lookup map for quick matching

    transactionsData.forEach(transaction => {
        const cardNumber = transaction['Card Number']; // Remove backtick
        const cvv = transaction['CVV']; // Remove backtick
        if (!cardNumber || !cvv) {
            console.warn('Skipping transaction with invalid Card Number or CVV:', transaction);
            return;
        }

        const cardKey = `${cardNumber}-${cvv}`; // Match against lookup key
        const matchingCard = cardLookup[cardKey];

        if (matchingCard) {
            // Ensure transactions array exists
            if (!matchingCard.transactions) {
                matchingCard.transactions = [];
            }

            // Append transaction
            matchingCard.transactions.push({
                cardNum: transaction['Card Number'], 
                date: transaction['Date'],
                time: transaction['Time'],
                amount: transaction['Amount'], // Convert to number
                errors: transaction['Errors?'],
                useChip: transaction['Use Chip'],
                isFraud: transaction['Is Fraud?'],
                city: transaction['City'],
                state: transaction['State'],
                latitude: parseFloat(transaction['Latitude']),
                longitude: parseFloat(transaction['Longitude'])
                
            });
            // console.log(cardNum)
        } else {
            console.warn('No matching card found for transaction:', transaction);
        }
    });

    // console.log('Grouped Data with Transactions:', groupedData); // Debugging
}
 

// Function to filter unique names as user types
function filterNames() {
    const searchTerm = document.getElementById('search').value.toLowerCase().trim();
    const filteredUsers = Object.values(groupedData).filter(user =>
        user.name.toLowerCase().startsWith(searchTerm)  // Match names starting with the search term
    );

    displaySearchResults(filteredUsers);
}

// Display the filtered results with clickable names
function displaySearchResults(filteredUsers) {
    const resultsContainer = document.getElementById('search-results');
    resultsContainer.innerHTML = '';  // Clear previous results

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
        
        // Add click event to show card details
        nameDiv.addEventListener('click', () => {
            document.getElementById('search').value = user.name; // Auto-fill the search box
            showCardDetails(user);  // Show details below
            clearSearchResults(); // Clear search results
        });
        
        resultDiv.appendChild(nameDiv);
        resultsContainer.appendChild(resultDiv);
    });
}

// Clear the search results dropdown
function clearSearchResults() {
    const resultsContainer = document.getElementById('search-results');
    resultsContainer.innerHTML = '';  // Clear search results after selection
}

// Show the full details when a name is clicked
function showCardDetails(userData) {
    const detailsContainer = document.getElementById('card-details');
    detailsContainer.innerHTML = ''; // Clear previous data

    // Person's general info
    const personInfo = userData.info;
    
    const personInfoDiv = document.createElement('div');
    personInfoDiv.classList.add('person-info');
    
    personInfoDiv.innerHTML = `
    <table>
        <tr>
            <td><strong>Name:</strong></td>
            <td>${capitalizeName(personInfo.name)}</td>
        </tr>
        <tr>
            <td><strong>Address:</strong></td>
            <td>${personInfo.address}</td>
        </tr>
        <tr>
            <td><strong>City:</strong></td>
            <td>${personInfo.city}</td>
        </tr>
        <tr>
            <td><strong>State:</strong></td>
            <td>${personInfo.state}</td>
        </tr>
        <tr>
            <td><strong>Zipcode:</strong></td>
            <td>${personInfo.zipcode}</td>
        </tr>
        <tr>
            <td><strong>Birth Month:</strong></td>
            <td>${personInfo.birthMonth}</td>
        </tr>
        <tr>
            <td><strong>Birth Year:</strong></td>
            <td>${personInfo.birthYear}</td>
        </tr>
        <tr>
            <td><strong>Current Age:</strong></td>
            <td>${personInfo.currentAge}</td>
        </tr>
        <tr>
            <td><strong>Retirement Age:</strong></td>
            <td>${personInfo.retirementAge}</td>
        </tr>
        <tr>
            <td><strong>Gender:</strong></td>
            <td>${personInfo.gender}</td>
        </tr>
        <tr>
            <td><strong>Total Debt:</strong></td>
            <td>${personInfo.totalDebt}</td>
        </tr>
        <tr>
            <td><strong>FICO Score:</strong></td>
            <td>${personInfo.ficoScore}</td>
        </tr>
        <tr>
            <td><strong>Num Credit Cards:</strong></td>
            <td>${personInfo.numCreditCards}</td>
        </tr>
    </table>
    `;

    detailsContainer.appendChild(personInfoDiv);

    // Add a space before displaying the cards
    const cardSpace = document.createElement('div');
    cardSpace.classList.add('card-space');
    detailsContainer.appendChild(cardSpace);

    // Add credit card details
    userData.details.forEach((card, index) => {
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card-info');
        cardDiv.setAttribute('id', 'card-' + index);

        const cardHeader = document.createElement('div');
        cardHeader.classList.add('card-box');
        cardHeader.innerHTML = `<strong>Last 4 Digits: ${card.cardNumber.slice(-4)}</strong><br>
        <strong>Card Type:</strong> ${card.cardType}`;

        const cardDetails = document.createElement('div');
        cardDetails.classList.add('card-details');
        cardDetails.style.display = 'none';  // Start with hidden card details

        const balanceOrLimit = card.cardType === 'Credit' 
            ? `<strong>Credit Limit:</strong> ${card.creditLimit}` 
            : `<strong>Account Balance:</strong> ${card.accountBalance}`;
        
        cardDetails.innerHTML = `
            <div><strong>Card Number:</strong> ${card.cardNumber.slice(1)}</div>
            <div><strong>Expires:</strong></div>
            <div><strong>CVV:</strong> ${card.cvv.slice(1)}</div>
            <div><strong>Has Chip:</strong> ${card.hasChip}</div>
            <div>${balanceOrLimit}</div>
            <div><strong>Account Open Date:</strong> ${card.acctOpenDate}</div>
            <div><strong>Year PIN Last Changed:</strong> ${card.yearPinLastChanged}</div>
            <div><strong>Card on Dark Web:</strong> ${card.cardOnDarkWeb}</div>
        `;

        // Toggle visibility
        cardHeader.addEventListener('click', function () {
            cardDetails.style.display = cardDetails.style.display === 'none' ? 'block' : 'none';
            
            if (cardDetails.style.display === 'block') {
                console.log('Card clicked:', card.cardNumber.slice(1));
                
                onCardClick(card); // Pass the clicked card
        
                // Render the transactions chart
                createTransactionCharts(transaction, 'transactionsChart');
        
                // Optionally render another chart (e.g., location-based) in 'locationChart'
                // Example: Plotting latitude and longitude
                createLocationChart(transaction, 'locationChart');
            }
            // const card = card.carNumber.slice(1);
        });
        
        cardDiv.appendChild(cardHeader);
        cardDiv.appendChild(cardDetails);
        detailsContainer.appendChild(cardDiv);
        
    });
}
function onCardClick(card) {
    const transactions = card.transactions || [];
    if (transactions.length === 0) {
        console.warn(`No transactions found for card: ${card.cardNumber}`);
        return;
    }

    console.log(`Transactions for card ${card.cardNumber}:`, transactions);

    // Generate charts for this card
    createTransactionCharts(transactions, 'transactionsChart');
    createLocationChart(transactions, 'locationChart');
}
// Helper function to capitalize the first letter of each word in a name
function capitalizeName(name) {
    return name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}



// Function to create the transaction charts
// Function to create the transaction amount chart
function createTransactionCharts(transactions, canvasId) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) {
        console.error(`Canvas with ID "${canvasId}" not found.`);
        return;
    }

    // Clear any existing chart
    if (Chart.getChart(canvasId)) {
        Chart.getChart(canvasId).destroy();
    }

    // Sort transactions by date and time
    const sortedTransactions = transactions.sort((a, b) => 
        new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time)
    );

    // Create the chart
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedTransactions.map(t => t.date + ' ' + t.time), // Combine date and time
            datasets: [{
                label: 'Transaction Amount ($)',
                data: sortedTransactions.map(t => parseFloat(t.amount)), // Ensure numeric values
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Date and Time'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Amount ($)'
                    },
                    beginAtZero: true
                }
            }
        }
    });
}

// Function to create the location scatter plot
function createLocationChart(transactions, canvasId) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) {
        console.error(`Canvas with ID "${canvasId}" not found.`);
        return;
    }

    // Destroy any existing chart instance
    if (Chart.getChart(canvasId)) {
        Chart.getChart(canvasId).destroy();
    }

    new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Transaction Locations',
                data: transactions.map(transaction => ({
                    x: transaction.latitude,
                    y: transaction.longitude
                })),
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1,
                pointRadius: 5
            }]
        },
        options: {
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Transaction Locations'
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Latitude'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Longitude'
                    }
                }
            }
        }
    });
}


// // Function to handle card clicks
// function onCardClick(card) {
//     const transactions = card.transactions || [];
//     if (!transactions.length) {
//         console.warn('No transactions available for this card.');
//         return;
//     }

//     console.log('Rendering charts for transactions:', transactions);

//     // Generate both charts
//     createTransactionCharts(transactions, 'amountChart');
//     createLocationChart(transactions, 'locationChart');
// }

// Attach chart generation to card click
