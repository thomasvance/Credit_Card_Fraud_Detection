let personData = []; // Store users data
let transactionsData = []; // Store transactions data
let groupedData = {}; // Store combined data

// Lookup table for transactions
let transactionLookup = {};

document.addEventListener('DOMContentLoaded', function () {
    // Load person data, then transaction data, then combine them
    loadPersonData()
        .then(() => {
            console.log('Person data loaded.');
            return loadTransactionData();
        })
        .then(() => {
            console.log('Transaction data loaded.');
            buildTransactionLookup(); // Build lookup table for transactions
            combineData();
            console.log('Data combined into groupedData:', groupedData);

            // Dispatch event to signal data is ready
            document.dispatchEvent(new Event('dataLoaded'));
        })
        .catch(error => {
            console.error('Error loading data:', error);
        });
});

function loadPersonData() {
    return new Promise((resolve, reject) => {
        fetch('../static/Merged_card_user.json')
            .then(response => response.json())
            .then(data => {
                personData = data.map(person => ({
                    ...person,
                    'Card Number': person['Card Number'],
                    'CVV': person['CVV']
                }));
                resolve();
            })
            .catch(error => reject(error));
    });
}

function loadTransactionData() {
    return new Promise((resolve, reject) => {
        fetch('../static/mock_transactions.json')
            .then(response => response.json())
            .then(data => {
                transactionsData = data.map(transaction => ({
                    ...transaction,
                    'Card Number': transaction['Card Number'],
                    'CVV': transaction['CVV']
                }));
                resolve();
            })
            .catch(error => reject(error));
    });
}

function buildTransactionLookup() {
    transactionLookup = {};

    transactionsData.forEach(transaction => {
        const key = `${transaction['Card Number']}_${transaction['CVV']}`;
        if (!transactionLookup[key]) {
            transactionLookup[key] = [];
        }
        transactionLookup[key].push({
            date: transaction['Date'],
            time: transaction['Time'],
            amount: `$${parseFloat(transaction['Amount'])}`, // Ensure amount has $ prefix
            errors: transaction['Errors?'],
            useChip: transaction['Use Chip'],
            isFraud: transaction['Is Fraud?'],
            city: transaction['City'],
            state: transaction['State'],
            latitude: parseFloat(transaction['Latitude']),
            longitude: parseFloat(transaction['Longitude'])
        });
    });
}

function combineData() {
    groupedData = {};

    // Group person data by user
    personData.forEach(person => {
        const userId = person.User;

        if (!groupedData[userId]) {
            groupedData[userId] = {
                name: capitalizeName(person.Person),
                info: {
                    name: capitalizeName(person.Person),
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
                },
                details: []
            };
        }
        const cardTransactions = transactionLookup[`${person['Card Number']}_${person['CVV']}`] || [];
        const transactionSum = cardTransactions.reduce((sum, t) => sum + parseFloat(t.amount.replace('$', '')), 0);

        groupedData[userId].details.push({
            cardType: person['Card Type'],
            cardNumber: String(person['Card Number']),
            expires: person['Expires'],
            cvv: person['CVV'],
            hasChip: person['Has Chip'],
            creditLimit: person['Credit Limit'], // No additional formatting needed
            accountBalance: person['Account Balance'], // No additional formatting needed
            acctOpenDate: person['Acct Open Date'],
            yearPinLastChanged: person['Year PIN last Changed'],
            cardOnDarkWeb: person['Card on Dark Web'],
            transactions: cardTransactions,
            transactionSum
        });
    });

    // Sync with Fraud_Alert.js variables
    expandedCards = [];
    cardLookup = Object.fromEntries(
        Object.values(groupedData).flatMap(user => 
            user.details.map((card, index) => {
                const cardId = `${user.info.name.replace(/\s+/g, '_').toLowerCase()}_${index}`;
                return [cardId, card];
            })
        )
    );
}
function capitalizeName(name) {
    return name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}
