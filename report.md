# COSC203 Assignment 2 Report

- Hugo Phibbs
- ID: **7312693**

## GitHub Repository
- https://github.com/HugoPhibbs/COSC203_Assignment2

## Deployment
- I've deployed my project to render, it can be found [here](https://cosc203-assignment2.onrender.com)

## Resolved Issues
- Bit of difficultly with editing and creating birds. I think the way I implemented it is rather hacky, but it works. 
- I initially tried to create my own api that directly interacts with the DB, then having my main routers interact with this API. This proved to be a bit of a challenge, especially concerning the *fetch* method, which doesn't actually work in NodeJS. So instead of trying to solve a problem I knew nothing about, I just resorted to querying the DB directly from my bird router (without an API go-between), and it works. I guess if my app was a bit bigger, then seperating the model and the controller would be a worth while investment.
- Connecting to the DB was a bit nigly, specifically concerning the connection URL -- I had the query parameters in the middle, not at the end(!!)


## Third Party Libraries
- I used [Lodash](https://lodash.com/) for JavaScript object equivalence. This was useful for updating a bird entry in the DB, I wanted to check if this was necessary by checking for changes.
- [Multer](https://www.npmjs.com/package/multer) is used for file processing of bird photos
