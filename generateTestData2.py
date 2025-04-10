import json
import random

def generate_data(num_items):
  data = []
  for i in range(num_items):
    # item = [i, random.randint(0, 300)]
    item = { "x": i, "y": random.randint(0, 300) }
    data.append(item)
  return data

data = generate_data(20000)
json_string = json.dumps(data, separators=(',', ':'))
print(json_string)