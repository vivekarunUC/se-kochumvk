// =============================================================================
// EECE/CS 3093C Software Engineering — Lab 3
// messengerdb.js — code skeleton provided by Phu Phung
// complete implementation by Vivek
// =============================================================================
const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://vivek:Oman%40123%21@messengerdb.j9nd0iq.mongodb.net/?appName=MessengerDB"; //replace this with your connection string
const client = new MongoClient(uri);
const bcrypt = require('bcrypt');
let users;

async function connect (){
  await client.connect();
  users = client.db('messenger').collection('users');
  console.log('Debug>messengerdb.js: connected to MongoDB server!');
}
//'messenger' is the database name, 'users' is the collection name
// change them accordingly if you named them differently
// Use-Case-03: Join Chat — credential check against MongoDB
const find = async (username,password)=>{
  let user = null;
  console.log(`Debug>messengerdb.js: find user '${username}'`); // password log is removed
  // Data layer independently re-validates type — defense in depth,
  // same NoSQL-injection guard as register(): reject non-string input
  if (typeof username !== 'string' || typeof password !== 'string') return null;
  // AC-03.3: look up by username only — password is never queryable directly, it's hashed
  user = await users.findOne({ username: username });
  if (!user) return null;
  // AC-03.3: compare the plaintext attempt against the stored bcrypt hash
  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) return null;
  return user;
}
// Use-Case-05: Register Account — insert a new user if username is not taken
// returns { success: true } or { success: false, message }
const register = async (username, password) => {
console.log(`Debug>messengerdb.js: register username '${username}'`);
// AC-05.4: data layer independently re-validates format — do not trust the server
const usernamePattern = /^\w{3,20}$/;
const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
if (!usernamePattern.test(username) || !passwordPattern.test(password))
return { success: false, message: 'Invalid username or password format.' }; // AC-05.8
// AC-05.5: check if the username already exists before inserting
const existing = await users.findOne({ username: username });
if (existing)
return { success: false, message: 'Username already exists.' }; // AC-05.8
// AC-05.6: hash the password before storing — never store plaintext
const hashedPassword = await bcrypt.hash(password, 10);
await users.insertOne({ username: username, password: hashedPassword });
return { success: true }; // AC-05.7
};
module.exports = { connect, find, register };
