import pandas as pd
import random

# Function to randomly select 10 rows from a CSV and output to a new CSV
def select_random_rows(input_csv, output_csv, num_rows=10):
    # Read the input CSV file into a DataFrame
    df = pd.read_csv(input_csv)
    
    # Check if the CSV has fewer rows than the number requested
    if len(df) < num_rows:
        print(f"The CSV file has only {len(df)} rows, fewer than the requested {num_rows} rows.")
        return
    
    # Randomly select 'num_rows' rows from the DataFrame
    random_rows = df.sample(n=num_rows)
    
    # Write the selected rows to the output CSV file
    random_rows.to_csv(output_csv, index=False)
    print(f"Randomly selected {num_rows} rows have been written to {output_csv}")

# Example usage
input_csv = 'questions-groundtruths.csv'  # Path to your input CSV file
output_csv = 'question-groundtruth-library.csv'  # Path to your output CSV file

select_random_rows(input_csv, output_csv, 15)
