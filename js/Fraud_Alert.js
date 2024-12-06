let personData = [];  
let groupedData = {}; // Declare 'groupedData' as well to avoid implicit global variables

// Load CSV data
window.onload = function() {
    fetch('../static/Merged_card_user.csv') // Path to CSV file
        .then(response => response.text())
        .then(csvData => {
            Papa.parse(csvData, {
                complete: function(results) {
                    personData = results.data; // Assign parsed data
                    groupByUser(personData);  // Group by User
                    console.log('Grouped Data:', groupedData);  // Check grouped data

                    // Initialize the search functionality
                    document.getElementById('search').addEventListener('input', filterNames);
                },
                header: true,
                skipEmptyLines: true,
                delimiter: ",",
            });
        })
        .catch(error => {
            console.error('Error loading CSV:', error);
            
        }); 
};

    function parseCSV(csvData) {
        const rows = csvData.split('\n');
        const headers = rows[0].split(',');
    
        rows.slice(1).forEach(row => {
            const cols = row.split(',');
    
            const user = cols[0]; // Unique identifier (e.g., User ID)
            const personInfo = {
                name: cols[1],                 // Name
                currentAge: cols[2],           // Current Age
                retirementAge: cols[3],        // Retirement Age
                birthYear: cols[4],            // Birth Year
                birthMonth: cols[5],           // Birth Month
                gender: cols[6],               // Gender
                address: cols[7],              // Address
                city: cols[8],                 // City
                state: cols[9],                // State
                zipcode: cols[10],             // Zipcode
                latitude: cols[11],            // Latitude
                longitude: cols[12],           // Longitude
                perCapitaIncome: cols[13],     // Per Capita Income
                yearlyIncome: cols[14],        // Yearly Income
                totalDebt: cols[15],           // Total Debt
                ficoScore: cols[16],           // FICO Score
                numCreditCards: cols[17],      // Number of Credit Cards
            };
    
            // Initialize if the user doesn't exist yet
            if (!personData[user]) {
                personData[user] = {
                    info: personInfo,
                    details: [] // Credit card details will be added here
                };
            }
    
            // Add the credit card details
            const cardDetails = {
                cardType: cols[18],
                cardNumber: cols[19],
                expires: cols[20],
                cvv: cols[21],
                hasChip: cols[22],
                creditLimit: cols[23],
                acctOpenDate: cols[24],
                yearPinLastChanged: cols[25],
                cardOnDarkWeb: cols[26]
            };
    
            personData[user].details.push(cardDetails);
        });
    }
// Group the data by User
function groupByUser(data) {
    groupedData = {};

    data.forEach(person => {
        const userId = person.User; // Group by unique User ID

        if (!groupedData[userId]) {
            groupedData[userId] = {
                name: person.Person, // Use the `Person` column for the name
                info: {},            // Add an `info` field for user details
                details: []          // Store all card details for that user
            };
        }

        // Populate the `info` field
        groupedData[userId].info = {
            name: person.Person, // Ensure the name is also in the `info` object
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
            acctOpenDate: person['Acct Open Date'],
            yearPinLastChanged: person['Year PIN last Changed'],
            cardOnDarkWeb: person['Card on Dark Web']
        });
    });

    console.log('Grouped Data:', groupedData); // Log the final grouped structure
}


// Search function to filter unique names as user types
function filterNames() {
    const searchTerm = document.getElementById('search').value.toLowerCase();
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
    
    console.log(personData);

    
    const detailsContainer = document.getElementById('card-details');
    detailsContainer.innerHTML = ''; // Clear previous data

    // Person's general info
    const personInfo = userData.info;
    
    const personInfoDiv = document.createElement('div');
    personInfoDiv.classList.add('person-info');
    
    personInfoDiv.innerHTML = `
    <div><strong><span class="underlined">Name : </span></strong><span class="underlined">${personInfo.name}</span></div>
    <div><strong><span class="underlined">Address : </span></strong><span class="underlined">${personInfo.address}</span></div>
    <div><strong><span class="underlined">City : </span></strong><span class="underlined">${personInfo.city}</span></div>
    <div><strong><span class="underlined">State : </span></strong><span class="underlined">${personInfo.state}</span></div>
    <div><strong><span class="underlined">Zipcode : </span></strong><span class="underlined">${personInfo.zipcode}</span></div>
    <div><strong><span class="underlined">Birth Month : </span></strong><span class="underlined">${personInfo.birthMonth}</span></div>
    <div><strong><span class="underlined">Birth Year : </span></strong><span class="underlined">${personInfo.birthYear}</span></div>
    <div><strong><span class="underlined">Current Age : </span></strong><span class="underlined">${personInfo.currentAge}</span></div>
    <div><strong><span class="underlined">Retirement Age : </span></strong><span class="underlined">${personInfo.retirementAge}</span></div>
    <div><strong><span class="underlined">Gender : </span></strong><span class="underlined">${personInfo.gender}</span></div>
    <div><strong><span class="underlined">Total Debt : </span></strong><span class="underlined">${personInfo.totalDebt}</span></div>
    <div><strong><span class="underlined">FICO Score : </span></strong><span class="underlined">${personInfo.ficoScore}</span></div>
    <div><strong><span class="underlined">Num Credit Cards : </span></strong><span class="underlined">${personInfo.numCreditCards}</span></div>
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
        cardDetails.style.display = 'none';
        
        cardDetails.innerHTML = `
            <div><strong>Card Number:</strong> ${card.cardNumber.slice(1)}</div>
            <div><strong>Expires:</strong> ${card.expires}</div>
            <div><strong>CVV:</strong> ${card.cvv}</div>
            <div><strong>Has Chip:</strong> ${card.hasChip}</div>
            <div><strong>Credit Limit:</strong> ${card.creditLimit}</div>
            <div><strong>Account Open Date:</strong> ${card.acctOpenDate}</div>
            <div><strong>Year PIN Last Changed:</strong> ${card.yearPinLastChanged}</div>
            <div><strong>Card on Dark Web:</strong> ${card.cardOnDarkWeb}</div>
        `;

        cardHeader.addEventListener('click', function () {
            cardDetails.style.display = cardDetails.style.display === 'none' ? 'block' : 'none';
        });

        cardDiv.appendChild(cardHeader);
        cardDiv.appendChild(cardDetails);
        detailsContainer.appendChild(cardDiv);

        const blankSpace = document.createElement('div');
        blankSpace.classList.add('card-space');
        detailsContainer.appendChild(blankSpace);
    });
}


