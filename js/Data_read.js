// Data_read.js

let personData = [];
let transactionsData = [];
let groupedData = {};

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
        fetch('../static/Merged_card_user.csv')
            .then(response => response.text())
            .then(csvData => {
                Papa.parse(csvData, {
                    header: true,
                    skipEmptyLines: true,
                    complete: function (results) {
                        personData = results.data.map(person => ({
                            ...person,
                            'Card Number': person['Card Number'].slice(1), // Remove backtick
                            'CVV': person['CVV'].slice(1) // Remove backtick
                        }));
                        resolve();
                    },
                    error: function (error) {
                        reject(error);
                    }
                });
            })
            .catch(error => reject(error));
    });
}

function loadTransactionData() {
    return new Promise((resolve, reject) => {
        fetch('../static/mock_transactions.csv')
            .then(response => response.text())
            .then(csvData => {
                Papa.parse(csvData, {
                    header: true,
                    skipEmptyLines: true,
                    complete: function (results) {
                        transactionsData = results.data.map(transaction => ({
                            ...transaction,
                            'Card Number': transaction['Card Number'].slice(1), // Remove backtick
                            'CVV': transaction['CVV'].slice(1) // Remove backtick
                        }));
                        resolve();
                    },
                    error: function (error) {
                        reject(error);
                    }
                });
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
            amount: transaction['Amount'],
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
            transactions: transactionLookup[`${person['Card Number']}_${person['CVV']}`] || []
        });
    });
}

function capitalizeName(name) {
    return name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}
