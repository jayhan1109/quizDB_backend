"use strict";
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const mysql = require("mysql");

app.use((req, res, next) => {
  res.append("Access-Control-Allow-Origin", ["*"]);
  res.append("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
  res.append("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.use(cors());
app.use(bodyParser.json());

// port connection
const PORT = process.env.PORT || 9999;

// // Create DB connection
const con = mysql.createConnection({
  host: "us-cdbr-east-03.cleardb.com",
  user: "bf7891d6a24399",
  password: "273eeb8c",
  database: "heroku_06908cb0216412f",
});

// Connect DB
con.connect((err) => {
  if (err) throw err;
  console.log("Connected to DB!");
});

app.get("/", (req, res) => {
  res.json("hello");
});

app.get("/questions", (req, res) => {
  let sql = "Select q.id, q.title, q.answer, o.text from quiz q join options o on q.id = o.quizid";
  con.query(sql, (err, result) => {
    if (err) throw err;
    console.log(result);

    let data = [];
    let seen = [];

    for (let r of result) {
      if (!seen.includes(r.title)) {
        data.push({"id": r.id, "title": r.title, "answer": r.answer, "options": [r.text]});
        seen.push(r.title);
      } else {
        data[data.length - 1].options.push(r.text);
      }
    }

    console.log(data);
    return res.json(data);
  });
});

app.post("/questions", (req, res) => {
  console.log(req.body);
  const data = req.body;

  try {

    let sql = "delete from options";
    con.query(sql, (err, result) => {
      sql = "delete from quiz";
      con.query(sql, (err, result) => {
        for (let quiz of data) {
          sql = `INSERT INTO quiz (title, answer) values ('${
            quiz.title
          }',${quiz.answer})`;
          con.query(sql, (err, result) => {
            if (err) throw err;
            let id = result.insertId;
            console.log(id);

            let options = quiz.options;
            for (let option of options) {
              // Get id from mysql and save options
              sql = `INSERT INTO options (quizid, text) values (${
                id
              },'${option}')`;
              con.query(sql, (err, result) => {
                if (err) throw err;
              });
            }
          });
        }
      });
    });

  } catch (err) {
    res.status(404).send("Mysql Error");
  }
  return res.json("Data stored in mysql");
});

app.put("/questions", (req, res) => {
  console.log(req.body);

  let sql = `UPDATE quiz SET title='${req.body.title}', answer=${req.body.answer} where id = ${req.body.id}`;
  con.query(sql, (err, result) => {
    if (err) throw err;

    sql = `delete from options where quizid = ${req.body.id}`;
    con.query(sql, (err, result) => {
      if (err) throw err;

      for (let option of req.body.options) {
        sql = `INSERT INTO options (quizid, text) values (${
          req.body.id
        },'${option}')`;
        con.query(sql, (err, result) => {
          if (err) throw err;
        });
      }
    });
  });

  res.json("Edit Completed");
});

app.listen(PORT, () => {
  console.log(`Server is on ${PORT}`);
});
