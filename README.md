Project to get temperature room temperature from RaspberryPi, using Node.js and Python.

Files
=====

* log_temperature.py

	Usage: python log_temperature.py /path/to/config /path/to/output

	To be run as a cronjob. Gets local temperature information and hits the ForecastIO API for outdoor temperature information.

* RaspberryPiThermometer 

    Usage: node RaspberryPiThermometer/bin/www --config /path/to/config

	Node.js project, set up with Express. Delivers the data to the user.
	
	Endpoints
	
	* /graph/all
	* /graph/today
	* /graph/year/month/day?span=[int]
