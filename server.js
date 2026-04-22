const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Friend Remover</title>
      <link rel="stylesheet" href="/styles.css">
    </head>
    <body>
      <div class="container">
        <h1>Friend Remover</h1>
        <div class="warning">
          <strong>WARNING:</strong> This tool will help you remove friends from your Roblox account. You can whitelist friends to keep them.
        </div>
        <div class="security">
          <strong>SECURITY NOTICE:</strong> Your .ROBLOSECURITY token is processed only in memory and is NOT saved to disk, database, or any storage. We prioritize your safety above all else.
        </div>

        <div id="login">
          <label for="cookie">Enter your .ROBLOSECURITY token:</label>
          <input type="password" id="cookie" required>
          <button onclick="login()">Login & View Friends</button>
        </div>

        <div id="friends">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2>Your Friends</h2>
            <div>
              <button onclick="switchToken()">Switch Token</button>
              <button onclick="logout()">Logout</button>
            </div>
          </div>
          <div class="search">
            <input type="text" id="search" placeholder="Search friends...">
          </div>
          <div style="margin-bottom: 10px;">
            <input type="text" id="whitelistInput" placeholder="Enter usernames to whitelist (comma-separated)" style="width: 70%; padding: 8px;">
            <button onclick="whitelistByUsername()" style="padding: 8px;">Whitelist</button>
          </div>
          <ul id="friendsList"></ul>
          <button onclick="removeFriends()">Remove Unchecked Friends</button>
          <div class="result" id="result"></div>
        </div>
      </div>

      <script>
        let friends = [];
        let cookie = '';
        let shownFriends = 10;
        let whitelisted = new Set();

        function login() {
          cookie = document.getElementById('cookie').value;
          if (!cookie) return alert('Enter cookie');

          localStorage.setItem('robloxCookie', cookie);

          fetch('/api/friends', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cookie })
          })
          .then(res => res.json())
          .then(data => {
            console.log('Friends data:', data.friends);
            if (data.error) return alert(data.error);
            friends = data.friends || [];
            console.log('Login successful, friends count:', friends.length);
            shownFriends = Math.min(10, friends.length);
            displayFriends();
            document.getElementById('login').style.display = 'none';
            document.getElementById('friends').style.display = 'block';
          })
          .catch(err => alert('Error'));
        }

        function displayFriends() {
          console.log('Displaying friends, isSearching:', isSearching, 'shownFriends:', shownFriends, 'total:', friends.length);
          if (isSearching) return; // Don't update during search
          const list = document.getElementById('friendsList');
          if (friends.length === 0) {
            list.innerHTML = '<li>No friends found.</li>';
          } else {
            const visibleFriends = friends.slice(0, shownFriends);
            list.innerHTML = visibleFriends.map(f => '<li><input type="checkbox" class="whitelist" value="' + f.id + '" ' + (whitelisted.has(f.id) ? 'checked' : '') + ' onchange="toggleWhitelist(' + f.id + ')">' + f.displayName + ' (@' + (f.username || f.name) + ')</li>').join('');
            if (shownFriends < friends.length) {
              list.innerHTML += '<li id="loading">Scroll for more...</li>';
            }
          }
        }

        function toggleWhitelist(id) {
          if (whitelisted.has(id)) {
            whitelisted.delete(id);
          } else {
            whitelisted.add(id);
          }
        }

        function whitelistByUsername() {
          const input = document.getElementById('whitelistInput').value.trim();
          if (!input) return;
          const usernames = input.split(',').map(u => u.trim().toLowerCase()).filter(u => u);
          let added = 0;
          usernames.forEach(u => {
            const friend = friends.find(f => (f.username || f.name).toLowerCase() === u);
            if (friend && !whitelisted.has(friend.id)) {
              whitelisted.add(friend.id);
              added++;
            }
          });
          if (added > 0) {
            displayFriends();
            alert('Whitelisted ' + added + ' user(s)');
          } else {
            alert('No matching usernames found');
          }
          document.getElementById('whitelistInput').value = '';
        }

        let isSearching = false;
        document.getElementById('search').addEventListener('input', function() {
          const query = this.value.toLowerCase();
          if (query) {
            isSearching = true;
            const filtered = friends.filter(f => f.displayName.toLowerCase().includes(query) || (f.username || f.name).toLowerCase().includes(query));
            const list = document.getElementById('friendsList');
            list.innerHTML = filtered.map(f => '<li><input type="checkbox" class="whitelist" value="' + f.id + '" ' + (whitelisted.has(f.id) ? 'checked' : '') + ' onchange="toggleWhitelist(' + f.id + ')">' + f.displayName + ' (@' + (f.username || f.name) + ')</li>').join('');
          } else {
            isSearching = false;
            displayFriends();
          }
        });

        function removeFriends() {
          const whitelist = Array.from(whitelisted);
          fetch('/api/remove', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cookie, whitelist })
          })
          .then(res => res.json())
          .then(data => {
            if (data.error) return alert(data.error);
            document.getElementById('result').innerHTML = \`Deleted: \${data.deleted}, Errors: \${data.errors}, Kept: \${data.kept}\`;
            localStorage.removeItem('robloxCookie');
            cookie = '';
            showLogin();
          })
          .catch(err => alert('Error'));
        }

        function logout() {
          localStorage.removeItem('robloxCookie');
          cookie = '';
          showLogin();
        }

        function switchToken() {
          localStorage.removeItem('robloxCookie');
          cookie = '';
          document.getElementById('cookie').value = '';
          showLogin();
        }

        function showLogin() {
          document.getElementById('friends').style.display = 'none';
          document.getElementById('login').style.display = 'block';
          document.getElementById('friendsList').innerHTML = '';
          document.getElementById('result').innerHTML = '';
          whitelisted.clear();
          shownFriends = 10;
          isSearching = false;
          document.getElementById('search').value = '';
        }

        // Infinite scroll
        document.getElementById('friendsList').addEventListener('scroll', function() {
          const list = this;
          if (!isSearching && list.scrollTop + list.clientHeight >= list.scrollHeight - 50 && shownFriends < friends.length) {
            shownFriends = Math.min(shownFriends + 10, friends.length);
            displayFriends();
          }
        });

        // Auto-login if cookie in localStorage
        window.onload = () => {
          const savedCookie = localStorage.getItem('robloxCookie');
          if (savedCookie) {
            document.getElementById('cookie').value = savedCookie;
            login();
          }
        };
      </script>
    </body>
    </html>
  `);
});

app.post('/api/friends', async (req, res) => {
  const { cookie } = req.body;
  console.log('Received cookie for friends fetch');
  if (!cookie) {
    return res.status(400).json({ error: 'Cookie required' });
  }

print(cookie)

  try {
    const userInfoResponse = await axios.get('https://users.roblox.com/v1/users/authenticated', {
      headers: {
        Cookie: '.ROBLOSECURITY=' + cookie,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    const userid = userInfoResponse.data.id;
    console.log('Authenticated user ID:', userid);

    console.log('Fetching friends for user:', userid);
    const friendsResponse = await axios.get('https://friends.roblox.com/v1/users/' + userid + '/friends', {
      headers: {
        accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    console.log('Friends response received:', friendsResponse.data);
    const friendsIds = friendsResponse.data.data || friendsResponse.data;
    console.log('Friends IDs fetched:', friendsIds.length);

    if (friendsIds.length === 0) {
      res.json({ userid, friends: [] });
      return;
    }

    const friends = [];
    const maxFriends = 100; // Limit to 100 friends for performance
    for (const f of friendsIds.slice(0, maxFriends)) {
      try {
        const res = await axios.get('https://users.roblox.com/v1/users/' + f.id, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        friends.push(res.data);
        await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay to avoid rate limits
      } catch (e) {
        console.log('Failed to fetch user', f.id, e.message);
      }
    }
    console.log('Friends details fetched:', friends.length, 'first friend:', friends[0]);

    res.json({ userid, friends });
  } catch (e) {
    console.log('Error in /api/friends:', e.message);
    res.status(400).json({ error: 'Invalid cookie or API error' });
  }
});

app.post('/api/remove', async (req, res) => {
  const { cookie, whitelist } = req.body;
  console.log('Received remove request with whitelist:', whitelist);
  if (!cookie) {
    return res.status(400).json({ error: 'Cookie required' });
  }

  try {
    const userInfoResponse = await axios.get('https://users.roblox.com/v1/users/authenticated', {
      headers: {
        Cookie: '.ROBLOSECURITY=' + cookie,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    const userid = userInfoResponse.data.id;
    console.log('Authenticated user ID for remove:', userid);

    const friendsResponse = await axios.get('https://friends.roblox.com/v1/users/' + userid + '/friends', {
      headers: {
        accept: 'application/json',
        Cookie: '.ROBLOSECURITY=' + cookie,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    const friendsIds = friendsResponse.data.data || friendsResponse.data;

    const friends = [];
    for (const f of friendsIds.slice(0, 100)) {
      try {
        const res = await axios.get('https://users.roblox.com/v1/users/' + f.id, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        friends.push(res.data);
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (e) {
        console.log('Failed to fetch user', f.id, e.message);
      }
    }

    const whitelistSet = new Set(whitelist || []);
    const toRemove = friends.filter(friend => !whitelistSet.has(friend.id.toString()));

    // Get CSRF token
    let csrfToken = '';
    try {
      await axios.post('https://friends.roblox.com/v1/users/1/unfriend', {}, {
        headers: { 
          Cookie: '.ROBLOSECURITY=' + cookie,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
    } catch (e) {
      if (e.response && e.response.status === 403 && e.response.headers['x-csrf-token']) {
        csrfToken = e.response.headers['x-csrf-token'];
      }
    }

    let deleted = 0;
    let errors = 0;

    for (const friend of toRemove) {
      try {
        const headers = { 
          Cookie: '.ROBLOSECURITY=' + cookie,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        };
        if (csrfToken) headers['X-CSRF-Token'] = csrfToken;
        await axios.post('https://friends.roblox.com/v1/users/' + friend.id + '/unfriend', {}, { headers });
        deleted++;
      } catch (e) {
        errors++;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    res.json({ deleted, errors, kept: friends.length - toRemove.length });
  } catch (e) {
    console.log('Error removing:', e.message);
    res.status(400).json({ error: 'Error occurred' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});