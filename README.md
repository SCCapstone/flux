# Project Name

This webapp is designed to allow more social reading as well as to connect readers with more books that they will enjoy and communities that they are a part of.


## External Requirements
In order to build this project, you first have to install:

Python 3.12
This project uses Django for the backend, which requires Python 3.12. Follow the instructions below to install Python:

macOS/Linux:
sudo apt-get install python3

Windows:
Download and run the installer from Python Official Site.

After installing Python, install pipenv for managing the virtual environment:
pip install pipenv

Node.js and npm
The frontend is built using React, which requires Node.js and npm. Install them with the following commands:

macOS/Linux:
sudo apt-get install nodejs npm

Windows:
Download and install from Node.js Official Site.

PostgreSQL (Optional for Production)
If you plan to use PostgreSQL as your database, you will need to install it. Here's how:

macOS/Linux:
sudo apt-get install postgresql

Windows:
Download and install from PostgreSQL Official Site.

Additional Python Libraries
Once Python and pipenv are set up, clone the repository and run the following command to install the required dependencies:
pipenv install

React Dependencies
For the React frontend, you need to install the required JavaScript libraries. After cloning the repository, navigate to the frontend directory and run:
npm install

This will install React and any dependencies listed in the package.json file.

## Setup

To download the setup just type in the following command from inside of the project directory in the terminal it will run all of the commands to set up the program

pip install -r requirements.txt

## Running

To run the website on a local host type in the following command

python manage.py runserver

Once it is running the local address which is http://127.0.0.1:8000/ is where the page is running from

Click on the link and this will load on a browser

# Deployment

The website will be deployed using Heroku at a later date

# Testing

To run the test, you will need the Selenium IDE which is a browser extension for chrome or firefox. It can be 
acquired here: https://www.selenium.dev/selenium-ide/

Before running this test, you will need to run the debug servers for the React frontend and Django backend. To do this,
enter the backend directory which contains the manage.py file. Inside of this directory, open a command prompt and run the following 3 commands:

python manage.py makemigrations

python manage.py migrate

python manage.py runserver

This will setup the database for the app and then run it.

After running the django server, you will need to run the React frontend by opening the backend/frontend directory.
If this is your first time running the app, you will first need to run:

npm install .

After this is completed, you can start the frontend by running:

npm start

At this point, the flux app should be accessible at the address localhost:3000

To run the test, you will need to open up the selenium IDE by clicking on the extension icon in your browser. At the top of Selenium, there is a folder icon in the top right.
If you click on this, you can select the selenium test file that you want to run that is located in flux repo's test folder. Set the run speed to half by clicking the timer icon near the top
of Selenium. Then you can run the test using the start button.

## Testing Technology

TBD

## Running Tests

TBD

# Authors

Dhruv Patel dhruvbp@email.sc.edu
Basith Penna-Hakkim basith@email.sc.edu
Logan Praylow lpraylow@email.sc.edu
Jakub Sykora jsykora@email.sc.edu
Brendan McNichols mcnichob@email.sc.edu
