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

input = "/Users/travisbybee/Scratch/test.txt"
# input = "/sys/bus/w1/devices/28-0000052fb8e6/w1_slave"
outputFile = "python_temperature.log"

isTemperatureValid = True
firstErrorOutput = True

mongouser = 'rpi'
mongopassword = 'testrpi'

forecastIOUrl = 'https://api.forecast.io/forecast'
forecastIOApiKey = 'ebfdb78dac1e6a2bd146e91bd14db64f'
locationLatLong = '40.020187,-105.274141'

def getIndoorTemperature():
    global isTemperatureValid
    tempFile = open(input)
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
    mongoUri = 'mongodb://%s:%s@ds027729.mongolab.com:27729/raspberrypi_test' % (mongouser, mongopassword)
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
