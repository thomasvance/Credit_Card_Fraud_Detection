// csv_loader.js

let personData = [];
let transactionsData = [];
let groupedData = [];

function checkDataReady() {
    if (Array.isArray(personData) && personData.length > 0 &&
        Array.isArray(transactionsData) && transactionsData.length > 0) {
        document.dispatchEvent(new Event('dataLoaded'));
        console.log('Both datasets are ready.');
    } else {
        console.log('Waiting for datasets to load...');
    }
}

// In Data_read.js
document.addEventListener('DOMContentLoaded', () => {
    loadPersonData();
    loadTransactionData();
});

function loadPersonData() {
    fetch('../static/Merged_card_user.csv')
    .then(response => response.text())
    .then(csvData => {
        Papa.parse(csvData, {
            complete: function (results) {
                // console.log('Person Data Loaded:', results.data); // Debugging
                personData = results.data.map(user => ({
                    ...user,
                    'Card Number': user['Card Number']?.slice(1),
                    'CVV': user['CVV']?.slice(1)
                }));
                checkDataReady();
            },
            header: true,
            skipEmptyLines: true,
            error: function (error) {
                console.error('Error during CSV parsing for person data:', error);
            }
        });
    })
    .catch(error => {
        console.error('Error fetching person CSV data:', error);
    });
}
function loadTransactionData() {
    fetch('../static/mock_transactions.csv')
    .then(response => response.text())
    .then(csvData => {
        Papa.parse(csvData, {
            complete: function (results) {
                // console.log('Transactions Data Loaded:', results.data); // Debugging
                transactionsData = results.data.map(transaction => ({
                    ...transaction,
                    'Card Number': transaction['Card Number']?.slice(1),
                    'CVV': transaction['CVV']?.slice(1)
                }));
                checkDataReady();
            },
            header: true,
            skipEmptyLines: true,
            error: function (error) {
                console.error('Error during CSV parsing for transaction data:', error);
            }
        });
    })
   
    .catch(error => {
        console.error('Error fetching transaction CSV data:', error);
    });
    
}



// Load both CSVs once when the page loads
window.onload = function() {
    fetch('../static/Merged_card_user.csv') // Path to CSV file
        .then(response => response.text())
        .then(csvData => {
            Papa.parse(csvData, {
                complete: function(results) {
                    personData = results.data; // Assign parsed data
                    normalizePersonData(personData); // Normalize names for consistent searching
                    groupByUser(personData);  // Group by User
                    // console.log('Grouped Data:', groupedData);  // Check grouped data

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


function normalizePersonData(data) {
    data.forEach(user => {
        if (user.info && user.info['Person']) {
            user.info['Person'] = user.info['Person'].trim().toLowerCase();
        }
    });
}

// Call this function after personData is fully loaded

// Load both CSVs once when the page loads



// fetch('../static/Merged_card_user.csv')
//     .then(response => response.text())
//     .then(csvData => {
//         console.log('Raw Person CSV Data:', csvData);
//         Papa.parse(csvData, {
//             complete: function (results) {
//                 console.log('Parsed Person Data:', results.data);
//             },
//             header: true,
//             skipEmptyLines: true
//         });
//     })
//     .catch(error => console.error('Error fetching or parsing person data:', error));
// function checkDataReady() {
//     if (Array.isArray(personData) && personData.length > 0 && Array.isArray(transactionsData) && transactionsData.length > 0) {
//         document.dispatchEvent(new Event('dataLoaded'));
//         console.log('Both datasets loaded successfully.');
//     } else {
//         console.log('Waiting for datasets to load...');
//     }
// }
    