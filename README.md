Project to get temperature room temperature from RaspberryPi, using Node.js and Python.

Files
=====
+log_temperature.py -- To be run as a cronjob. Gets local temperature information and hits the ForecastIO API for outdoor temperature information.
+RaspberryPiThermometer -- Node.js project, set up with Express. Delivers the data to the user.
