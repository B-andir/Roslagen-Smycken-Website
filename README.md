# RoslagenSmyckenWebsite
Testing Environment Website - The website of a small jewelry company

This project was created to serve as a testing environment for implementing different features using Node.js and Express, ejs and scss. 

The primary feature that has currently been made functional is a registration, login and authentication system, which should be secure through use of JWT (Json Web Token) and cookies, as well as bcrypt for hashing passwords.

The Database used for this project is a MongoDB atlas database, so to..

--- GET THE PROJECT WORKING FOR YOU ---

You have to...

  Make a .env file in the root directory and add the folowing lines to it:
  
    JWT_SECRET="<Your desired JWT Secret, can be any kind of ID/Code>"
    DBUSERS_CONN_URL="<The URL to the desired MongoDB Database>"
    
