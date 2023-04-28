const http = require("http");
const finalHandler = require("finalhandler");
const Router = require("router");
const bodyParser = require("body-parser");
const fs = require("fs");
const url = require("url");
const querystring = require("querystring");

// State holding variables
let goals = [];
let user = {};
let categories = [];
let users = [];

const PORT = process.env.PORT || 8080;

// Setup router
const router = Router();
router.use(bodyParser.json());

// This function is a bit simpler...
const server = http.createServer((req, res) => {
  res.writeHead(200);
  router(req, res, finalHandler(req, res));
});

server.listen(PORT, err => {
  if (err) throw err;
  console.log(`server running on port ${PORT}`);
  //populate categories  
  categories = JSON.parse(fs.readFileSync("initial-data/categories.json","utf-8"));

  //populate goals
  goals = JSON.parse(fs.readFileSync("initial-data/goals.json","utf-8"));

  //populate users
  users = JSON.parse(fs.readFileSync("initial-data/users.json","utf-8"));
  // hardcode "logged in" user
  user = users[0];
});

const saveCurrentUser = (currentUser) => {
  // set hardcoded "logged in" user
  users[0] = currentUser;
  fs.writeFileSync("initial-data/users.json", JSON.stringify(users), "utf-8");
}

// Notice how much cleaner these endpoint handlers are...
router.get("/v1/goals", (request, response) => {
  const parsedUrl = url.parse(request.originalUrl);
  const { query, sort } = querystring.parse(parsedUrl.query);
  let goalsToReturn = [];
  if (query !== undefined) {
    goalsToReturn = goals.filter(goal => goal.description.includes(query));

    if (!goalsToReturn) {
      response.writeHead(404, "There aren't any goals to return");
      return response.end();
    }
  } else {
    goalsToReturn = goals;
  }
  if (sort !== undefined) {
    goalsToReturn.sort((a, b) => a[sort] - b[sort]);
  }
  response.writeHead(200, { "Content-Type": "application/json" });
  return response.end(JSON.stringify(goalsToReturn));
});

router.get("/v1/me", (request, response) => {
  if (!user) {
    response.writeHead(404, "That user does not exist");
    return response.end();
  }
  response.writeHead(200, { "Content-Type": "application/json" });
  return response.end(JSON.stringify(user));
});

//USER ACCEPT A SPECIFIC GOAL
router.post("/v1/me/goals/:goalId/accept", (request, response) => {
  const { goalId } = request.params;
  const goal = goals.find(goal => goal.id == goalId);
  if (!goal) {
    response.writeHead(404, "That goal does not exist");
    return response.end();
  }
  response.writeHead(200);
  user.acceptedGoals.push(goal);
  saveCurrentUser(user);
  return response.end();
});

//ACHIEVE A GIVEN GOAL
router.post("/v1/me/goals/:goalId/achieve", (request, response) => {
  const { goalId } = request.params;
  const goal = goals.find(goal => goal.id == goalId);
  if (!goal) {
    response.writeHead(404, "That goal does not exist");
    return response.end();
  }
  response.writeHead(200);
  user.achievedGoals.push(goal);
  saveCurrentUser(user);
  return response.end();
});

//CHALLENGE A GIVEN GOAL
router.post("/v1/me/goals/:goalId/challenge/:userId", (request, response) => {
  const { goalId, userId } = request.params;
  const goal = goals.find(goal => goal.id == goalId);
  const user = users.find(user => user.id == userId);
  if (!goal) {
    response.writeHead(404, "That goal does not exist");
    return response.end();
  }
  response.writeHead(200);
  user.challengedGoals.push(goal);
  saveCurrentUser(user);
  return response.end();
});

//GIFT A GIVEN GOAL
router.post("/v1/me/goals/:goalId/gift/:userId", (request, response) => {
  const { goalId, userId } = request.params;
  const goal = goals.find(goal => goal.id == goalId);
  const user = users.find(user => user.id == userId);
  
  //handle goal and/or user not existing
  if (!goal) {
    response.writeHead(404, "That goal does not exist");
    return response.end();
  }
  if (!user) {
    response.writeHead(404, "That user does not exist");
    return response.end();
  }
  response.writeHead(200);
  user.giftedGoals.push(goal);
  saveCurrentUser(user);
  response.end();
});

//GET ALL CATEGORIES
router.get("/v1/categories", (request, response) => {
  const parsedUrl = url.parse(request.originalUrl);
  const { query, sort } = querystring.parse(parsedUrl.query);
  let categoriesToReturn = [];
  if (query !== undefined) {
    categoriesToReturn = categories.filter(category =>
      category.name.includes(query)
    );

    if (!categoriesToReturn) {
      response.writeHead(404, "There aren't any goals to return");
      return response.end();
    }
  } else {
    categoriesToReturn = categories;
  }
  if (sort !== undefined) {
    categoriesToReturn.sort((a, b) => a[sort] - b[sort]);
  }
  response.writeHead(200, { "Content-Type": "application/json" });
  return response.end(JSON.stringify(categoriesToReturn));
});

//GET ALL GOALS IN CATEGORY
router.get("/v1/categories/:categoryId/goals", (request, response) => {
  const { categoryId } = request.params;
  const category = categories.find(category => category.id == categoryId);
  if (!category) {
    response.writeHead(404, "That category does not exist");
    return response.end();
  }
  response.writeHead(200, { "Content-Type": "application/json" });
  const relatedGoals = goals.filter(
    goals => goals.categoryId === categoryId
  );

  console.log(relatedGoals)
  return response.end(JSON.stringify(relatedGoals));
});

module.exports = server;