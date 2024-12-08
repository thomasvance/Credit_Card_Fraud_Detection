let model;

// Load the model
export async function loadModel() {
    try {
        model = await tf.loadLayersModel('../static/model/model.json');
        console.log('Deep learning model loaded successfully.');
    } catch (error) {
        console.error('Error loading model:', error);
    }
}


// Predict fraud for a transaction
// Predict fraud for a transaction
export async function predictFraud(transaction) {
    if (!model) {
        console.warn('Model not loaded. Defaulting to isFraud = 0.');
        return 0;
    }

    // Preprocess transaction data
    const isFraud = await predictFraud({
        amount: amount,
        latitude: card.Latitude,
        longitude: card.Longitude,
        useChip: Math.random() < 0.7 ? 1 : 0,
        errors: Math.random() < 0.95 ? 'None' : 'Insufficient Funds',
        date: today,
        time: validateTimeFormat(time) // Ensure time validation here
    });
    

    console.log('Processed transaction data:', processedTransaction);

    try {
        // Ensure the input tensor matches the model's expected shape: [batch_size, timesteps, features]
        const inputTensor = tf.tensor3d([processedTransaction], [1, 1, 6]);
        console.log('Input tensor for prediction:', inputTensor.arraySync());

        // Perform prediction
        const prediction = model.predict(inputTensor);
        const predictionArray = (await prediction.array())[0];
        console.log('Prediction result:', predictionArray);

        // Return whether the transaction is fraudulent
        return predictionArray[0] > 0.5 ? 1 : 0;
    } catch (error) {
        console.error('Error during prediction:', error);
        return 0; // Default to non-fraudulent in case of an error
    }
}


function validateTimeFormat(time) {
    const [hours, minutes] = time.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours >= 24 || minutes < 0 || minutes >= 60) {
        console.warn(`Invalid time format: ${time}. Defaulting to 12:00.`);
        return '12:00';
    }
    return time;
}



// export async function loadModel() {
//     try {
//         model = await tf.loadLayersModel('../path/to/model.json');
//         console.log('Deep learning model loaded successfully.');
//     } catch (error) {
//         console.error('Error loading model:', error);
//     }
// }