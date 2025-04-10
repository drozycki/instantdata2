import json

numbers = list(range(20000))
json_string = json.dumps(numbers, separators=(',', ':'))
print(json_string)
