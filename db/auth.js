const bcrypt = require('bcrypt');
const jwt = require('jwt-simple');
const client = require('./client');

const findUserFromToken = async token => {
  //console.log('findUserFromToken func', token);
  const id = jwt.decode(token, process.env.JWT).id;
  const user = (await client.query('SELECT * FROM users WHERE id = $1', [id]))
    .rows[0];
  delete user.password;
  return user;
};

const hash = password => {
  return new Promise((resolve, reject) => {
    bcrypt.hash(password, 10, (err, hashed) => {
      if (err) {
        return reject(err);
      }
      return resolve(hashed);
    });
  });
};

const compare = ({ plain, hashed }) => {
  //console.log('compare func');
  return new Promise((resolve, reject) => {
    bcrypt.compare(plain, hashed, (err, verified) => {
      if (err) {
        return reject(err);
      }
      if (verified) {
        return resolve();
      }
      reject(Error('BAD credentials'));
    });
  });
};

const authenticate = async ({ username, password }) => {
  //console.log('authenticate func');
  const user = (
    await client.query('SELECT * FROM users WHERE username=$1', [username])
  ).rows[0];
  await compare({ plain: password, hashed: user.password });

  return jwt.encode({ id: user.id }, process.env.JWT);
};

module.exports = {
  findUserFromToken,
  authenticate,
  compare,
  hash,
};
