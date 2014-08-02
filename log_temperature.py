# This script is to be run every x minutes (15,30,60).
# It logs the indoor and outdoor temperature to a MongoDB.

# Obtain indoor temperature
# Query for outdoor temperature
# Save result into database

from pymongo import MongoClient
from email.mime.text import MIMEText

import datetime
import re
import requests
import json
import sys
import smtplib
import errno

if(len(sys.argv) >= 2):
    configFile = sys.argv[1]
else:
    configFile = "config.json"

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

fromAddr = properties['email']['emailFromAddress']
toAddr = properties['email']['emailToAddress']
emailUsername = properties['email']['emailUsername']
emailPassword = properties['email']['emailPassword']
smtpServer = properties['email']['smtpServer']

forecastIOUrl = 'https://api.forecast.io/forecast'

isTemperatureValid = True
firstErrorOutput = True

errorCode = 0

emailMsg = ""

def getIndoorTemperature():
    global isTemperatureValid
    try:
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
    except IOError as e:
        msg = "Error accessing temperature data from \"{0}\".\n\nI/O error({1}): {2}".format(temperatureInput, e.errno, e.strerror)
        errorLog(msg)
        sendEmail(fromAddr, toAddr, msg)
        sys.exit(e.errno)

def getOutdoorTemperature():
    global isTemperatureValid
    r = requests.get(forecastIOUrl + "/" + forecastIOApiKey + "/" + locationLatLong)
    if r.status_code != 200:
        msg = "Error hitting Forecast.io API . . . Status code {0}".format(r.status_code)
        errorLog(msg)
        sendEmail(fromAddr, toAddr, msg)
        isTemperatureValid = False
        sys.exit(errno.ENODATA)
        return -255
    return r.json()['currently']['temperature']

def celsiusToFahrenheit(temp):
    return (temp * 9 / 5.0) + 32

def logToDatabase(insertObj):
    client = MongoClient(mongoUri)
    db = client.raspberrypi_test
    temperatureData = db.temperature_data
    temperatureDataId = temperatureData.insert(insertObj)
    # Handle error connecting to database.

def errorLog(output):
    global firstErrorOutput
    if firstErrorOutput:
        now = datetime.datetime.now()
        output = "-----------------\n" + now.strftime("%A, %d. %B %Y %I:%M%p") + "\n" + output
        firstErrorOutput = False

    with open(outputFile, "a") as logFile:
            logFile.write(output + "\n")

def sendEmail(fromAddr, toAddr, msg):
    msg = MIMEText(msg)
    msg['Subject'] = "Email from Raspberry Pi Temperature Logger"
    msg['From'] = fromAddr
    msg['To'] = toAddr

    # The actual mail send
    server = smtplib.SMTP(smtpServer)
    server.starttls()
    server.login(emailUsername, emailPassword)
    server.sendmail(fromAddr, toAddr, msg.as_string())
    server.quit()

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
    sys.exit(-1)
