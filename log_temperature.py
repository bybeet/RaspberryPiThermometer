# This script is to be run every x minutes (15,30,60).
# It logs the indoor and outdoor temperature to a MongoDB.

# Obtain indoor temperature
# Query for outdoor temperature
# Save result into database

from pymongo import MongoClient
import datetime
import re
import requests
import json
import sys

if(len(sys.argv) < 2):
    configFile = "config.json"
else:
    configFile = sys.argv[1]

if(len(sys.argv) == 3):
    outputFile = sys.argv[2]
else:
    outputFile = "python_temperature.log"

json_data = open(configFile)
properties = json.load(json_data)
json_data.close()

temperatureInput = properties['temperatureInput']
mongoUri = properties['mongodbUri']
forecastIOApiKey = properties['forecastIOApiKey']
locationLatLong = properties['locationLatLong']

forecastIOUrl = 'https://api.forecast.io/forecast'

isTemperatureValid = True
firstErrorOutput = True

def getIndoorTemperature():
    global isTemperatureValid
    tempFile = open(temperatureInput)
    text = tempFile.read()
    tempFile.close()
    valid = re.search('YES', text)
    if valid == None:
        errorLog("Invalid checksum. Dumping file contents:\n" + text)
        isTemperatureValid = False
    matches = re.search('\d{5}', text)
    temperature = int(matches.group(0)) / 1000.0
    return temperature

def getOutdoorTemperature():
    global isTemperatureValid
    r = requests.get(forecastIOUrl + "/" + forecastIOApiKey + "/" + locationLatLong)
    if r.status_code != 200:
        errorLog("Error hitting Forecast.io API . . . Status code %i" % r.status_code)
        isTemperatureValid = False
        return -255
    return r.json()['currently']['temperature']

def celsiusToFahrenheit(temp):
    return (temp * 9 / 5.0) + 32

def logToDatabase(insertObj):
    client = MongoClient(mongoUri)
    db = client.raspberrypi_test
    temperatureData = db.temperature_data
    temperatureDataId = temperatureData.insert(insertObj)

def errorLog(output):
    global firstErrorOutput
    if firstErrorOutput:
        output = "-----------------\n" + output
        firstErrorOutput = False

    with open(outputFile, "a") as logFile:
            logFile.write(output + "\n")

now = datetime.datetime.utcnow()
now = now.replace(second=0, microsecond=0)

indoors = "{0:.2f}".format(celsiusToFahrenheit(getIndoorTemperature()))
outdoors = "{0:.2f}".format(getOutdoorTemperature())

insertObj = {
    "timestamp": now.isoformat(),
    "indoorTemperature": indoors,
    "outdoorTemperature": outdoors }
         
result = "{timestamp: " + now.isoformat() + ", indoorTemperature: %s, outdoorTemperature: %s}" % (indoors, outdoors)

if isTemperatureValid:
    logToDatabase(insertObj)
else:
    errorLog("Invalid temperature reading.\n\t" + result)
