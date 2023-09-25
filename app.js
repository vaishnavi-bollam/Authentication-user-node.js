const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");
app.use(express.json());
let db = null;

const dbPath = path.join(__dirname, "userData.db");

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("server is running at port 30000");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};

initializeDbAndServer();

//create user

app.post("/register", async (request, response) => {
  const { username } = request.body;
  const checkUserExistsQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const getUser = await db.get(checkUserExistsQuery);
  //response.send("user details fetched");
  if (getUser === undefined) {
    const { name, password, gender, location } = request.body;
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(request.body.password, 10);
      const createUserQuery = `INSERT INTO user(username,name,password,
            gender,location) VALUES (
               '${username}',
               '${name}',
               '${hashedPassword}',
                '${gender}',
               '${location}'
            );`;
      const createUser = await db.run(createUserQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//login user

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const loginUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const loginUser = await db.get(loginUserQuery);
  if (loginUser !== undefined) {
    const isPasswordMatched = await bcrypt.compare(
      password,
      loginUser.password
    );
    if (isPasswordMatched) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  } else {
    response.status(400);
    response.send("Invalid user");
  }
});

// password change

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const loginUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const loginUser = await db.get(loginUserQuery);

  if (loginUser !== undefined) {
    const isPasswordMatched = await bcrypt.compare(
      oldPassword,
      loginUser.password
    );
    if (isPasswordMatched) {
      if (newPassword.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const newHashedPassword = await bcrypt.hash(
          request.body.newPassword,
          10
        );
        const updatePasswordQuery = `UPDATE user SET password = '${newHashedPassword}'
            WHERE 
            username = '${username}'
            ;`;
        const updatePassword = await db.run(updatePasswordQuery);
        response.status(200);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
