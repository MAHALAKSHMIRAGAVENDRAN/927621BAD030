const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 9876;
const WINDOW_SIZE = 10;
const TIMEOUT = 500;

let numberWindow = [];
let accessToken = '';

function fetchNumbers(type) {
  const urlMap = {
    p: 'http://20.244.56.144/test/primes',
    f: 'http://20.244.56.144/test/fibo',
    e: 'http://20.244.56.144/test/even',
    r: 'http://20.244.56.144/test/random',
  };

  try {
    const response = await axios.get(urlMap[type], {
      headers: { Authorization: `Bearer ${accessToken}` },
      timeout: TIMEOUT,
    });
    return response.data.numbers;
  } catch (error) {
    console.error(`Error fetching ${type} numbers:`, error.message);
    return [];
  }
}

function calculateAverage(numbers) {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, num) => acc + num, 0);
  return (sum / numbers.length).toFixed(2);
}

function authenticate(req, res, next) {
  const { authorization } = req.headers;
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authorization.split(' ')[1];
  if (token !== accessToken) {
    return res.status(401).json({ error: 'Invalid access token' });
  }
  next();
}

app.get('/numbers/:numberid', authenticate, async (req, res) => {
  const type = req.params.numberid[0];

  if (!['p', 'f', 'e', 'r'].includes(type)) {
    return res.status(400).json({ error: 'Invalid number type' });
  }

  const windowPrevState = [...numberWindow];
  const fetchedNumbers = await fetchNumbers(type);

  // Add unique numbers to the window
  fetchedNumbers.forEach(num => {
    if (!numberWindow.includes(num)) {
      if (numberWindow.length >= WINDOW_SIZE) {
        numberWindow.shift(); // Remove the oldest number
      }
      numberWindow.push(num); // Add the new number
    }
  });

  const avg = calculateAverage(numberWindow);

  res.json({
    windowPrevState,
    windowCurrState: numberWindow,
    numbers: fetchedNumbers,
    avg,
  });
});

function setAccessToken(token) {
  accessToken = token;
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${8080}`);
  console.log('Access token set.');
});
