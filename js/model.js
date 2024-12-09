let model;

// Load the model
export async function loadModel() {
    try {
        model = await tf.loadLayersModel('static/model/model.json');
        console.log('Deep learning model loaded successfully.');
    } catch (error) {
        console.error('Error loading model:', error);
    }
}

// Predict fraud for a transaction
export async function predictFraud(transaction) {
    if (!model) {
        console.warn('Model not loaded. Defaulting to isFraud = 0.');
        return 0;
    }

    try {
        // Ensure amount is a number
        const rawAmount = typeof transaction.amount === 'string'
            ? parseFloat(transaction.amount.replace(/[$,]/g, ''))
            : transaction.amount;

        // Convert the hour extracted from time to a number
        const hour = parseInt(validateTimeFormat(transaction.time).split(':')[0], 10);

        const processedTransaction = [
            rawAmount,          // Amount in number format
            transaction.latitude,
            transaction.longitude,
            hour,               // Time as a number
            new Date(transaction.date).getDay(), // Day of the week as a number
            transaction.useChip || 0 // Use chip usage (default to 0 if missing)
        ];

        console.log('Processed transaction data:', processedTransaction);

        // Reshape processedTransaction to a 3D array
        const inputTensor = tf.tensor3d([[processedTransaction]], [1, 1, 6]); // Shape [1, 1, 6]
        console.log('Input tensor for prediction:', inputTensor.arraySync());

        const prediction = model.predict(inputTensor);
        const predictionArray = (await prediction.array())[0];
        console.log('Prediction result:', predictionArray);

        return predictionArray[0] > 0.995 ? 1 : 0;
    } catch (error) {
        console.error('Error during prediction:', error);
        return 0;
    }
}




function validateTimeFormat(time) {
    const [hours, minutes] = time.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours >= 24 || minutes < 0 || minutes >= 60) {
        console.warn(`Invalid time format: ${time}. Defaulting to 12:00.`);
        return '12:00'; // Default to 12:00 if invalid
    }
    return time;
}

async function processTransactionsSequentially(transactions) {
    for (const transaction of transactions) {
        try {
            const isFraud = await predictFraud(transaction);
            transaction['Is Fraud?'] = isFraud;

            // Format for display after prediction
            transaction.amount = `$${transaction.amount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}`;

            addMarker(
                transaction.latitude,
                transaction.longitude,
                isFraud,
                transaction
            );
        } catch (error) {
            console.error('Error processing transaction:', error);
        }
    }
}
