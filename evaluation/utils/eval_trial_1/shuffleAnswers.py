import csv
import random

# shuffle csv file rows and save it to a new file
def shuffleAnswers(inputFile):
	new_rows = []
	with open(inputFile, 'r') as f:
		reader = csv.reader(f)
		rows = [row for row in reader]

	# for each row, shuttle the cells in the row
	for row in rows:
		random.shuffle(row)
		# add the row twice
		for i in range(2):
			new_rows.append(row)

	# rename new file
	newFile = inputFile.replace('.csv', '_shuffled.csv')

	with open(newFile, 'w') as f:
		writer = csv.writer(f)
		writer.writerows(new_rows)

shuffleAnswers('../answers/test.csv')