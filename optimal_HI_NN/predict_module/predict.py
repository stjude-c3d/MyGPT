import sys
import numpy as np
from tensorflow.keras.models import load_model
import os
import absl.logging

# Suppress the absl warnings
absl.logging.set_verbosity(absl.logging.ERROR)
# Suppress TensorFlow logs
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

def main():
    if len(sys.argv) != 3:
        print("Usage: python predict.py <QRS> <ACRS>")
        sys.exit(1)

    try:
        # Parse command-line arguments
        value1 = float(sys.argv[1])
        value2 = float(sys.argv[2])
    except ValueError:
        print("Both arguments (QRS and ACRS) must be numbers.")
        sys.exit(1)

    # Load the pre-trained model
    best_model = load_model('./predict_module/best_model.h5')

    # Prepare the input data
    input_data = np.array([[value1, value2]])

    # Make prediction
    prediction = best_model.predict(input_data, verbose=0)
    hallucination_index = prediction[0][0]

    print("Hallucination Index:", hallucination_index)

    # Interpret the prediction
    if (best_model.predict(input_data, verbose=0) > 0.5).astype("int32"):
        print("Prediction: Incorrect answer")
    else:
        print("Prediction: Correct answer")

if __name__ == "__main__":
    main()
