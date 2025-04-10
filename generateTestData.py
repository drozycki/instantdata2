import json
import random

random_integers = [random.randint(0, 300) for _ in range(20000)]
json_array = json.dumps(random_integers, separators=(',', ':'))
print(json_array)