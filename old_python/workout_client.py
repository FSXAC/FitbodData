import argparse
import csv
import collections
import copy
import datetime
import json
import os
import sys

arg_parser = argparse.ArgumentParser(description="Visualize FitBod workout histories v0.0")
arg_parser.add_argument('workout_file', help='The workout data export CSV file.')
arg_parser.add_argument('--verbose', help='Increase output verbosity', action='store_true')
args = arg_parser.parse_args()

# states
STATE_MAIN_MENU = 0
STATE_SUMMARY = 1
STATE_LAST = 2
STATE_EXERCISE = 3
STATE_EXERCISE_DETAIL = 4

USING_LB = True

DATETIME_FORMAT = r'%Y-%m-%d'

DETAIL_CONDENSED = True

def ask():
	user_input = input('> ')
	return user_input.lower()

def convertKgToLb(kg, rounding=False):
	lb = kg * 2.20462262

	# if rounding, use .5 as base
	base = 5
	if rounding:
		lb = base * round(lb / base, 1)
	return lb

# 1 rep max formula
def calc1RM(rep, weight):
	if rep < 1:
		return 0
	return round(weight * (1 + rep / 30.0), 1)

class WorkoutMenu:
	def __init__(self, workout_file):

		# All workouts
		self.workouts = {}
		self.exercises = []

		self.workout_file_path = workout_file
		self.populate(self.workout_file_path)
		self.current_state = STATE_MAIN_MENU

	def run(self):
		"""
		@return False if we want to quit the progrm
		"""

		if self.current_state == STATE_MAIN_MENU:
			if not self.doMainMenu():
				return False

		elif self.current_state == STATE_SUMMARY:
			self.doSummary()
		
		elif self.current_state == STATE_LAST:
			self.doLast()

		elif self.current_state == STATE_EXERCISE:
			self.doExerciseList()
		
		elif self.current_state == STATE_EXERCISE_DETAIL:
			self.doExerciseDetail()

		return True

	def menu(self, menu_content):
		for i in range(len(menu_content)):
			print('[{}]\t{}'.format(i, menu_content[i]))
		if self.current_state == STATE_MAIN_MENU:
			print('[X]\tExit')
		else:
			print('[X]\tGo back')

		return ask()

	def doMainMenu(self):
		print('\n')
		print('=' * 20)
		print("This is the main menu.")
		print("File loaded: {}".format(self.workout_file_path))
		print('=' * 20)
		print('\n')

		main_menu = [
			'Summary',
			'Last workout',
			'Exercise history',
			'Dump JSON'
		]
		user_input = self.menu(main_menu)

		if user_input == 'x':
			return False
		elif user_input == '0':
			self.current_state = STATE_SUMMARY
		elif user_input == '1':
			self.current_state = STATE_LAST
		elif user_input == '2':
			self.current_state = STATE_EXERCISE
		elif user_input == '3':
			self.dumpJSON()

		return True

	def doSummary(self):

		# TODO: print summary
		self.getSummary()


		user_input = self.menu([])
		if user_input == 'x':
			self.current_state = STATE_MAIN_MENU

	def doLast(self):
		# TODO: print last workout
		self.getLastWorkout()

		user_input = self.menu([])
		if user_input == 'x':
			self.current_state = STATE_MAIN_MENU

	def doExerciseList(self):
		menu_list = self.countExercises()

		user_input = self.menu(menu_list)
		if user_input == 'x':
			self.current_state = STATE_MAIN_MENU
		elif user_input != '':
			user_input_int = int(user_input)
			if user_input_int >= 0 or user_input < len(self.exercises):
				self.current_state = STATE_EXERCISE_DETAIL
				self.current_index = user_input_int

	def doExerciseDetail(self):
		
		exercise_key = self.exercises[self.current_index]
		print(exercise_key, 'selected.')

		self.getExerciseDetail(exercise_key)


		user_input = self.menu([])
		if user_input == 'x':
			self.current_state = STATE_EXERCISE


	def populate(self, workout_file):
		"""
		Takes a csv file and populate the content
		"""
		
		with open(workout_file, 'r', encoding='utf-8') as workout_csv:
			reader = csv.reader(workout_csv, delimiter=',')
			header = []

			for row in reader:
				if not header:
					header = row
					continue
				self.processRow(row)

		# Sort the exercises list
		self.exercises.sort()
		
	def processRow(self, row):
		date = row[0]
		exercise = row[1]
		reps = int(row[3])
		weight_kg = float(row[4])
		is_warmup = row[5]

		if date not in self.workouts:
			self.workouts[date] = {}
		
		if exercise not in self.workouts[date]:
			self.workouts[date][exercise] = { 'sets': [] }

		set_obj = { 'reps': reps }

		if USING_LB:
			set_obj['weight'] = weight_kg
		
		if is_warmup != '':
			set_obj['warmup'] = True

		self.workouts[date][exercise]['sets'].append(set_obj)

		# Add to the all exercise worked on list
		if exercise not in self.exercises:
			self.exercises.append(exercise)

	def dumpJSON(self):
		filename = 'workouts.json'
		with open(filename, 'w', encoding='utf-8') as outJSON:
			json.dump(self.workouts, outJSON, indent=2, sort_keys=True)

		print('JSON file dumped to {}.'.format(filename))
		ask()

	def getSummary(self):
		summary = {}

		# Get number of workouts
		summary['nums'] = len(self.workouts)

		# Get days
		summary['total_days'] = self.getTotalDays()

		summary['total_exercises'] = len(self.exercises)

		print(summary)

	def getTotalDays(self):
		# Find max and min days
		if not self.workouts:
			return 0
		
		arbi_key = list(self.workouts.keys())[0]
		latest = datetime.datetime.strptime(arbi_key, DATETIME_FORMAT)
		earliest = latest

		for date in self.workouts:
			date_obj = datetime.datetime.strptime(date, DATETIME_FORMAT)

			if date_obj > latest:
				latest = date_obj
			elif date_obj < earliest:
				earliest = date_obj
		
		time_delta = latest - earliest
		return time_delta.days

	def getLastWorkout(self):
		if not self.workouts:
			return 0

		# TODO: make code less redundant
		# Get latest day
		key = list(self.workouts.keys())[0]
		latest_day = datetime.datetime.strptime(key, DATETIME_FORMAT)

		for date in self.workouts:
			date_obj = datetime.datetime.strptime(date, DATETIME_FORMAT)

			if date_obj > latest_day:
				latest_day = date_obj
				key = date

		# Get days since last workout
		now = datetime.datetime.now()
		days_since = (now - latest_day).days
		print('{} days since last work out'.format(days_since))

		# Get the exercises in the last workout
		print('In the last workout, you worked on:')
		for exercise in self.workouts[key]:
			print('\t{}'.format(exercise))

	def countExercises(self):
		count_map = {}
		count_list = list(self.exercises)
		for date in self.workouts:
			for ex in self.workouts[date]:
				if ex not in count_map:
					count_map[ex] = 0
				
				count_map[ex] += 1

		for i in range(len(count_list)):
			count_list[i] = count_list[i] + ' ({})'.format(count_map[count_list[i]])

		return count_list

	def getExerciseDetail(self, key):
		# build a mini object
		ex_obj = {}
		for date in self.workouts:
			if key in self.workouts[date]:
				ex_obj[date] = copy.deepcopy(self.workouts[date][key]['sets'])

		ordered_ex_obj = collections.OrderedDict(sorted(ex_obj.items()))

		# Print header
		if DETAIL_CONDENSED:
			self.printDetailsCondensed(ordered_ex_obj)
		else:
			self.printDetails(ordered_ex_obj)
	
	def printDetails(self, ordered_ex_obj):
		column_width = [12, 10, 10, 10, 10, 10, 10]
		header = ['Date', 'Rep', 'Weight', '1RM', 'Volume', 'R. Weight', 'R. Rep']
		header_str = ''
		for i in range(len(header)):
			h = header[i]
			w = column_width[i]
			header_str += h.ljust(w)
		print(header_str)
		print('-' * sum(column_width))

		record_rep = 0
		record_weight = 0
		for date, sets in ordered_ex_obj.items():
			first_row = True

			# calculate some stuff
			max_one_rm = 0
			volume = 0
			for s in sets:
				s['weight'] = convertKgToLb(s['weight'], rounding=True)
				rep = s['reps']
				weight = s['weight']

				# 1rm
				one_rm = calc1RM(rep, weight)
				if one_rm > max_one_rm:
					max_one_rm = one_rm

				# volume
				volume += rep * weight

				# rep
				if rep > record_rep:
					record_rep = rep
				
				# weight
				if weight > record_weight:
					record_weight = weight

			# display them
			for s in sets:
				row_str = ''
				if first_row:
					row_str += date.ljust(column_width[0])
					row_str += str(s['reps']).ljust(column_width[1])
					row_str += str(s['weight']).ljust(column_width[2])
					row_str += str(max_one_rm).ljust(column_width[3])
					row_str += str(volume).ljust(column_width[4])
					row_str += str(record_weight).ljust(column_width[5])
					row_str += str(record_rep).ljust(column_width[6])
					first_row = False
				else:
					row_str += ' '.ljust(column_width[0])
					row_str += str(s['reps']).ljust(column_width[1])
					row_str += str(s['weight']).ljust(column_width[2])
					
				print(row_str)

	def printDetailsCondensed(self, ordered_ex_obj):
		column_width = [12, 10, 10, 10, 10]
		header = ['Date', '1RM', 'Volume', 'R. Weight', 'R. Rep']
		header_str = ''
		for i in range(len(header)):
			h = header[i]
			w = column_width[i]
			header_str += h.ljust(w)
		print(header_str)
		print('-' * sum(column_width))

		record_rep = 0
		record_weight = 0
		for date, sets in ordered_ex_obj.items():

			# calculate some stuff
			max_one_rm = 0
			volume = 0
			for s in sets:
				s['weight'] = convertKgToLb(s['weight'], rounding=True)
				rep = s['reps']
				weight = s['weight']

				# 1rm
				one_rm = calc1RM(rep, weight)
				if one_rm > max_one_rm:
					max_one_rm = one_rm

				# volume
				volume += rep * weight

				# rep
				if rep > record_rep:
					record_rep = rep
				
				# weight
				if weight > record_weight:
					record_weight = weight

			# display them
			row_str = ''
			row_str += date.ljust(column_width[0])
			row_str += str(max_one_rm).ljust(column_width[1])
			row_str += str(volume).ljust(column_width[2])
			row_str += str(record_weight).ljust(column_width[3])
			row_str += str(record_rep).ljust(column_width[4])
			first_row = False
				
			print(row_str)

workout = WorkoutMenu(args.workout_file)
while True:
	if not workout.run():
		break